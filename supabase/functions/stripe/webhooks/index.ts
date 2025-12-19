/**
 * CineVault - Stripe Webhooks Edge Function
 * 
 * Gère tous les événements Stripe:
 * - Paiements réussis/échoués
 * - Remboursements
 * - Compte Connect mis à jour
 * - Litiges
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.5.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const PLATFORM_FEE_PERCENT = 5;

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`[stripe-webhooks] Received event: ${event.type}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      // ============================================
      // CHECKOUT SESSION COMPLETED
      // ============================================
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (!orderId) {
          console.error("[stripe-webhooks] No order_id in session metadata");
          break;
        }

        console.log(`[stripe-webhooks] Payment completed for order ${orderId}`);

        // Update order status
        const { error: orderError } = await supabase
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: session.payment_intent as string,
            stripe_charge_id: session.payment_intent as string,
          })
          .eq("id", orderId);

        if (orderError) {
          console.error("[stripe-webhooks] Order update error:", orderError);
        }

        // Update order items status
        await supabase
          .from("order_items")
          .update({ status: "confirmed" })
          .eq("order_id", orderId);

        // Mark listings as sold
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("listing_id")
          .eq("order_id", orderId);

        if (orderItems) {
          for (const item of orderItems) {
            await supabase
              .from("listings")
              .update({
                status: "sold",
                sold_at: new Date().toISOString(),
              })
              .eq("id", item.listing_id);
          }
        }

        // Handle multi-seller transfers
        const transferGroups = session.metadata?.transfer_groups;
        if (transferGroups && session.payment_intent) {
          try {
            const groups = JSON.parse(transferGroups);
            
            // For multi-seller orders, create transfers manually
            if (groups.length > 1) {
              for (const group of groups) {
                await stripe.transfers.create({
                  amount: group.amount,
                  currency: "eur",
                  destination: group.stripeAccountId,
                  source_transaction: session.payment_intent as string,
                  metadata: {
                    order_id: orderId,
                    seller_id: group.sellerId,
                  },
                });

                console.log(`[stripe-webhooks] Transfer ${group.amount} to ${group.sellerId}`);
              }
            }
          } catch (e) {
            console.error("[stripe-webhooks] Transfer error:", e);
          }
        }

        // Create transaction record
        await supabase.from("transactions").insert({
          order_id: orderId,
          type: "payment",
          status: "succeeded",
          amount_cents: session.amount_total || 0,
          fee_cents: Math.round((session.amount_total || 0) * PLATFORM_FEE_PERCENT / 100),
          net_cents: Math.round((session.amount_total || 0) * (100 - PLATFORM_FEE_PERCENT) / 100),
          currency: session.currency?.toUpperCase() || "EUR",
          stripe_id: session.payment_intent as string,
          stripe_type: "payment_intent",
          description: `Paiement commande ${session.metadata?.order_number}`,
        });

        // Remove items from buyers' carts
        const { data: order } = await supabase
          .from("orders")
          .select("buyer_id")
          .eq("id", orderId)
          .single();

        if (order && orderItems) {
          await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", order.buyer_id)
            .in("listing_id", orderItems.map(i => i.listing_id));
        }

        // Send notification (TODO: implement notifications)
        console.log(`[stripe-webhooks] Order ${orderId} payment completed`);

        break;
      }

      // ============================================
      // PAYMENT FAILED
      // ============================================
      case "checkout.session.expired":
      case "payment_intent.payment_failed": {
        const object = event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session;
        const orderId = object.metadata?.order_id;

        if (orderId) {
          await supabase
            .from("orders")
            .update({
              status: "cancelled",
              cancelled_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .eq("status", "pending_payment");

          // Reset listings to active
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("listing_id")
            .eq("order_id", orderId);

          if (orderItems) {
            for (const item of orderItems) {
              await supabase
                .from("listings")
                .update({ status: "active" })
                .eq("id", item.listing_id)
                .eq("status", "reserved");
            }
          }

          console.log(`[stripe-webhooks] Payment failed for order ${orderId}`);
        }

        break;
      }

      // ============================================
      // REFUND CREATED
      // ============================================
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Find order by payment intent
        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .single();

        if (order) {
          const refundAmount = charge.amount_refunded;
          const isFullRefund = charge.refunded;

          // Update order status
          await supabase
            .from("orders")
            .update({
              status: isFullRefund ? "refunded" : "paid",
            })
            .eq("id", order.id);

          // Create refund transaction
          await supabase.from("transactions").insert({
            order_id: order.id,
            type: "refund",
            status: "succeeded",
            amount_cents: refundAmount,
            net_cents: refundAmount,
            currency: charge.currency.toUpperCase(),
            stripe_id: charge.id,
            stripe_type: "refund",
            description: `Remboursement ${isFullRefund ? "complet" : "partiel"} - ${order.order_number}`,
          });

          console.log(`[stripe-webhooks] Refund ${refundAmount} for order ${order.id}`);
        }

        break;
      }

      // ============================================
      // CONNECT ACCOUNT UPDATED
      // ============================================
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        // Find seller by Stripe account ID
        const { data: seller, error } = await supabase
          .from("seller_profiles")
          .select("id, user_id")
          .eq("stripe_account_id", account.id)
          .single();

        if (seller) {
          await supabase
            .from("seller_profiles")
            .update({
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
              stripe_onboarding_complete: account.details_submitted,
              is_active: account.charges_enabled && account.payouts_enabled,
              is_verified: account.details_submitted,
              updated_at: new Date().toISOString(),
            })
            .eq("id", seller.id);

          console.log(`[stripe-webhooks] Updated seller ${seller.id} status`);

          // Create notification if onboarding complete
          if (account.details_submitted && account.charges_enabled) {
            await supabase.from("notifications").insert({
              user_id: seller.user_id,
              type: "seller_verified",
              title: "Compte vendeur activé !",
              message: "Votre compte vendeur est maintenant vérifié. Vous pouvez commencer à vendre vos films !",
              metadata: { seller_id: seller.id },
            });
          }
        }

        break;
      }

      // ============================================
      // DISPUTE CREATED
      // ============================================
      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        const charge = await stripe.charges.retrieve(dispute.charge as string);
        const paymentIntentId = charge.payment_intent as string;

        const { data: order } = await supabase
          .from("orders")
          .select("id, buyer_id, order_number")
          .eq("stripe_payment_intent_id", paymentIntentId)
          .single();

        if (order) {
          // Update order status
          await supabase
            .from("orders")
            .update({ status: "disputed" })
            .eq("id", order.id);

          // Get seller from order items
          const { data: orderItem } = await supabase
            .from("order_items")
            .select("seller_id")
            .eq("order_id", order.id)
            .limit(1)
            .single();

          // Create dispute record
          if (orderItem) {
            await supabase.from("disputes").insert({
              order_id: order.id,
              buyer_id: order.buyer_id,
              seller_id: orderItem.seller_id,
              reason: "other",
              description: `Litige Stripe: ${dispute.reason}`,
              disputed_amount_cents: dispute.amount,
              status: "open",
              escalated_at: new Date().toISOString(),
              escalation_reason: "Litige bancaire automatique",
              metadata: {
                stripe_dispute_id: dispute.id,
                stripe_reason: dispute.reason,
              },
            });
          }

          console.log(`[stripe-webhooks] Dispute created for order ${order.id}`);
        }

        break;
      }

      // ============================================
      // PAYOUT PAID (Seller received money)
      // ============================================
      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        
        // This is for Connect accounts
        // Log for tracking
        console.log(`[stripe-webhooks] Payout ${payout.id} paid: ${payout.amount} ${payout.currency}`);
        
        break;
      }

      default:
        console.log(`[stripe-webhooks] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhooks] Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }
});
