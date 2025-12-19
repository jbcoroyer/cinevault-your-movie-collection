/**
 * CineVault - Stripe Checkout Edge Function
 * 
 * Gère les paiements marketplace avec split payments
 * - Création de session Checkout
 * - Split payment automatique (vendeur + plateforme)
 * - Support multi-vendeurs
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
const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://cinevault.app";

// Commission CineVault: 5%
const PLATFORM_FEE_PERCENT = 5;

interface CartItem {
  listingId: string;
  quantity: number;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface RelayPoint {
  id: string;
  name: string;
  address: string;
}

interface CheckoutRequest {
  action: "create_session" | "get_session";
  items?: CartItem[];
  shippingAddress?: ShippingAddress;
  relayPoint?: RelayPoint;
  shippingMethod?: "mondial_relay" | "colissimo" | "hand_delivery";
  buyerNotes?: string;
  sessionId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const request: CheckoutRequest = await req.json();

    switch (request.action) {
      case "create_session": {
        const { items, shippingAddress, relayPoint, shippingMethod, buyerNotes } = request;

        if (!items || items.length === 0) {
          throw new Error("Cart is empty");
        }

        if (!shippingAddress) {
          throw new Error("Shipping address is required");
        }

        // Fetch all listings with seller info
        const listingIds = items.map(i => i.listingId);
        const { data: listings, error: listingsError } = await supabase
          .from("listings")
          .select(`
            *,
            seller:seller_profiles(
              id,
              user_id,
              display_name,
              stripe_account_id,
              stripe_charges_enabled
            )
          `)
          .in("id", listingIds)
          .eq("status", "active");

        if (listingsError || !listings) {
          throw new Error("Failed to fetch listings");
        }

        // Validate all listings are available
        for (const item of items) {
          const listing = listings.find(l => l.id === item.listingId);
          if (!listing) {
            throw new Error(`Listing ${item.listingId} not found or unavailable`);
          }
          if (!listing.seller?.stripe_account_id || !listing.seller?.stripe_charges_enabled) {
            throw new Error(`Seller for ${listing.movie_title} cannot receive payments`);
          }
        }

        // Group items by seller
        const sellerGroups = new Map<string, typeof listings>();
        for (const listing of listings) {
          const sellerId = listing.seller.id;
          if (!sellerGroups.has(sellerId)) {
            sellerGroups.set(sellerId, []);
          }
          sellerGroups.get(sellerId)!.push(listing);
        }

        // Calculate totals
        let subtotalCents = 0;
        let shippingCents = 0;
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        const transferGroups: { sellerId: string; stripeAccountId: string; amount: number }[] = [];

        for (const [sellerId, sellerListings] of sellerGroups) {
          let sellerSubtotal = 0;
          let sellerShipping = 0;

          for (const listing of sellerListings) {
            // Add product line item
            lineItems.push({
              price_data: {
                currency: "eur",
                product_data: {
                  name: `${listing.movie_title} (${listing.format.toUpperCase()})`,
                  description: `${listing.condition} - ${listing.seller.display_name}`,
                  images: listing.movie_poster_path
                    ? [`https://image.tmdb.org/t/p/w200${listing.movie_poster_path}`]
                    : [],
                  metadata: {
                    listing_id: listing.id,
                    seller_id: sellerId,
                    tmdb_id: listing.tmdb_id.toString(),
                  },
                },
                unit_amount: listing.price_cents,
              },
              quantity: 1,
            });

            sellerSubtotal += listing.price_cents;
            subtotalCents += listing.price_cents;

            // Shipping per seller (first item full, rest reduced)
            const itemShipping = sellerShipping === 0
              ? (shippingAddress.country === "FR" 
                  ? listing.shipping_domestic_cents 
                  : listing.shipping_eu_cents) || 399
              : 100; // 1€ per additional item from same seller

            sellerShipping += itemShipping;
            shippingCents += itemShipping;
          }

          // Calculate seller payout (after platform fee)
          const platformFee = Math.round((sellerSubtotal + sellerShipping) * PLATFORM_FEE_PERCENT / 100);
          const sellerPayout = sellerSubtotal + sellerShipping - platformFee;

          transferGroups.push({
            sellerId,
            stripeAccountId: sellerListings[0].seller.stripe_account_id,
            amount: sellerPayout,
          });
        }

        // Add shipping as line item if > 0
        if (shippingCents > 0) {
          lineItems.push({
            price_data: {
              currency: "eur",
              product_data: {
                name: "Frais de livraison",
                description: shippingMethod === "mondial_relay" 
                  ? `Point Relais: ${relayPoint?.name || "À sélectionner"}`
                  : shippingMethod === "colissimo" 
                    ? "La Poste - Colissimo"
                    : "Remise en main propre",
              },
              unit_amount: shippingCents,
            },
            quantity: 1,
          });
        }

        const totalCents = subtotalCents + shippingCents;
        const platformFeeCents = Math.round(totalCents * PLATFORM_FEE_PERCENT / 100);

        // Generate order number
        const orderNumber = `CV-${new Date().toISOString().slice(2, 7).replace("-", "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

        // Create pending order in database
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: user.id,
            order_number: orderNumber,
            status: "pending_payment",
            subtotal_cents: subtotalCents,
            shipping_cents: shippingCents,
            platform_fee_cents: platformFeeCents,
            total_cents: totalCents,
            currency: "EUR",
            shipping_name: shippingAddress.name,
            shipping_address_line1: shippingAddress.line1,
            shipping_address_line2: shippingAddress.line2,
            shipping_city: shippingAddress.city,
            shipping_postal_code: shippingAddress.postalCode,
            shipping_country: shippingAddress.country,
            shipping_phone: shippingAddress.phone,
            relay_point_id: relayPoint?.id,
            relay_point_name: relayPoint?.name,
            relay_point_address: relayPoint?.address,
            buyer_notes: buyerNotes,
          })
          .select()
          .single();

        if (orderError || !order) {
          console.error("[stripe-checkout] Order creation error:", orderError);
          throw new Error("Failed to create order");
        }

        // Create order items
        const orderItems = listings.map(listing => ({
          order_id: order.id,
          listing_id: listing.id,
          seller_id: listing.seller.id,
          movie_title: listing.movie_title,
          format: listing.format,
          condition: listing.condition,
          price_cents: listing.price_cents,
          shipping_cents: Math.round(shippingCents / listings.length), // Distribute evenly
          seller_payout_cents: Math.round(
            (listing.price_cents * (100 - PLATFORM_FEE_PERCENT)) / 100
          ),
          status: "pending",
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) {
          console.error("[stripe-checkout] Order items error:", itemsError);
          // Rollback order
          await supabase.from("orders").delete().eq("id", order.id);
          throw new Error("Failed to create order items");
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          customer_email: user.email,
          line_items: lineItems,
          payment_intent_data: {
            // Application fee goes to platform
            application_fee_amount: platformFeeCents,
            // Transfer to first seller (for single-seller orders)
            // Multi-seller requires manual transfers via webhooks
            transfer_data: transferGroups.length === 1
              ? { destination: transferGroups[0].stripeAccountId }
              : undefined,
            metadata: {
              order_id: order.id,
              order_number: orderNumber,
              buyer_id: user.id,
              transfer_groups: JSON.stringify(transferGroups),
            },
          },
          metadata: {
            order_id: order.id,
            order_number: orderNumber,
            buyer_id: user.id,
          },
          success_url: `${frontendUrl}/orders/${order.id}?success=true`,
          cancel_url: `${frontendUrl}/cart?cancelled=true`,
          locale: "fr",
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
        });

        // Update order with Stripe session ID
        await supabase
          .from("orders")
          .update({ 
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq("id", order.id);

        console.log(`[stripe-checkout] Created session ${session.id} for order ${orderNumber}`);

        return new Response(
          JSON.stringify({
            success: true,
            sessionId: session.id,
            sessionUrl: session.url,
            orderId: order.id,
            orderNumber,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_session": {
        const { sessionId } = request;
        if (!sessionId) {
          throw new Error("Session ID required");
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return new Response(
          JSON.stringify({
            success: true,
            status: session.status,
            paymentStatus: session.payment_status,
            orderId: session.metadata?.order_id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        throw new Error("Unknown action");
    }
  } catch (error) {
    console.error("[stripe-checkout] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
