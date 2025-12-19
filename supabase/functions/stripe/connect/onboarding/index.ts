/**
 * CineVault - Stripe Connect Onboarding Edge Function
 * 
 * Gère l'onboarding des vendeurs via Stripe Connect Express
 * - Création de compte Stripe Connect
 * - Génération de liens d'onboarding
 * - Vérification du statut KYC
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface OnboardingRequest {
  action: "create_account" | "create_login_link" | "get_status" | "refresh_link";
  userId?: string;
  returnUrl?: string;
  refreshUrl?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, returnUrl, refreshUrl }: OnboardingRequest = await req.json();

    console.log(`[stripe-connect] Action: ${action} for user: ${user.id}`);

    // Get or create seller profile
    let { data: sellerProfile, error: profileError } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    switch (action) {
      case "create_account": {
        // Check if already has Stripe account
        if (sellerProfile?.stripe_account_id) {
          // Return existing account link for completion
          const accountLink = await stripe.accountLinks.create({
            account: sellerProfile.stripe_account_id,
            refresh_url: refreshUrl || `${Deno.env.get("FRONTEND_URL")}/sell?refresh=true`,
            return_url: returnUrl || `${Deno.env.get("FRONTEND_URL")}/sell?onboarding=complete`,
            type: "account_onboarding",
          });

          return new Response(
            JSON.stringify({
              success: true,
              accountId: sellerProfile.stripe_account_id,
              onboardingUrl: accountLink.url,
              isNew: false,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get user profile for pre-fill
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("username, email")
          .eq("id", user.id)
          .single();

        // Create Stripe Connect Express account
        const account = await stripe.accounts.create({
          type: "express",
          country: "FR", // Default to France
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual",
          metadata: {
            cinevault_user_id: user.id,
            cinevault_username: userProfile?.username || "",
          },
          settings: {
            payouts: {
              schedule: {
                delay_days: 7, // 7 jours de délai pour protection
                interval: "weekly",
              },
            },
          },
        });

        console.log(`[stripe-connect] Created Stripe account: ${account.id}`);

        // Create or update seller profile
        if (!sellerProfile) {
          const { error: insertError } = await supabase
            .from("seller_profiles")
            .insert({
              user_id: user.id,
              display_name: userProfile?.username || `Vendeur_${user.id.slice(0, 8)}`,
              stripe_account_id: account.id,
              stripe_onboarding_complete: false,
              stripe_charges_enabled: false,
              stripe_payouts_enabled: false,
              is_active: false,
            });

          if (insertError) {
            console.error("[stripe-connect] Error creating seller profile:", insertError);
            throw new Error("Failed to create seller profile");
          }
        } else {
          const { error: updateError } = await supabase
            .from("seller_profiles")
            .update({
              stripe_account_id: account.id,
              stripe_onboarding_complete: false,
              updated_at: new Date().toISOString(),
            })
            .eq("id", sellerProfile.id);

          if (updateError) {
            console.error("[stripe-connect] Error updating seller profile:", updateError);
          }
        }

        // Create onboarding link
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: refreshUrl || `${Deno.env.get("FRONTEND_URL")}/sell?refresh=true`,
          return_url: returnUrl || `${Deno.env.get("FRONTEND_URL")}/sell?onboarding=complete`,
          type: "account_onboarding",
        });

        return new Response(
          JSON.stringify({
            success: true,
            accountId: account.id,
            onboardingUrl: accountLink.url,
            isNew: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_login_link": {
        if (!sellerProfile?.stripe_account_id) {
          throw new Error("No Stripe account found");
        }

        // Create login link to Stripe Express Dashboard
        const loginLink = await stripe.accounts.createLoginLink(
          sellerProfile.stripe_account_id
        );

        return new Response(
          JSON.stringify({
            success: true,
            loginUrl: loginLink.url,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_status": {
        if (!sellerProfile?.stripe_account_id) {
          return new Response(
            JSON.stringify({
              success: true,
              hasAccount: false,
              status: "not_started",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Retrieve account from Stripe
        const account = await stripe.accounts.retrieve(sellerProfile.stripe_account_id);

        // Update seller profile with latest status
        const chargesEnabled = account.charges_enabled;
        const payoutsEnabled = account.payouts_enabled;
        const detailsSubmitted = account.details_submitted;

        await supabase
          .from("seller_profiles")
          .update({
            stripe_charges_enabled: chargesEnabled,
            stripe_payouts_enabled: payoutsEnabled,
            stripe_onboarding_complete: detailsSubmitted,
            is_active: chargesEnabled && payoutsEnabled,
            is_verified: detailsSubmitted,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sellerProfile.id);

        // Determine status
        let status = "not_started";
        if (detailsSubmitted && chargesEnabled && payoutsEnabled) {
          status = "complete";
        } else if (detailsSubmitted) {
          status = "pending_verification";
        } else if (account.id) {
          status = "incomplete";
        }

        return new Response(
          JSON.stringify({
            success: true,
            hasAccount: true,
            accountId: account.id,
            status,
            chargesEnabled,
            payoutsEnabled,
            detailsSubmitted,
            requirements: account.requirements,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "refresh_link": {
        if (!sellerProfile?.stripe_account_id) {
          throw new Error("No Stripe account found");
        }

        // Create new onboarding link
        const accountLink = await stripe.accountLinks.create({
          account: sellerProfile.stripe_account_id,
          refresh_url: refreshUrl || `${Deno.env.get("FRONTEND_URL")}/sell?refresh=true`,
          return_url: returnUrl || `${Deno.env.get("FRONTEND_URL")}/sell?onboarding=complete`,
          type: "account_onboarding",
        });

        return new Response(
          JSON.stringify({
            success: true,
            onboardingUrl: accountLink.url,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("[stripe-connect] Error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
