/**
 * CineVault - Order Service
 * 
 * Service pour la gestion des commandes
 * - Récupération des commandes (acheteur/vendeur)
 * - Mise à jour des statuts
 * - Tracking
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type OrderStatus = Database["public"]["Enums"]["order_status"];
type OrderItemStatus = Database["public"]["Enums"]["order_item_status"];

// ============================================
// Types
// ============================================

export interface OrderWithItems extends Order {
  items: OrderItemWithDetails[];
}

export interface OrderItemWithDetails extends OrderItem {
  listing: {
    id: string;
    movie_poster_path: string | null;
    edition: string | null;
    condition_notes: string | null;
  };
  seller: {
    id: string;
    display_name: string;
    user_id: string;
  };
}

export interface SellerOrderItem extends OrderItem {
  order: {
    id: string;
    order_number: string;
    buyer_id: string;
    shipping_name: string;
    shipping_address_line1: string;
    shipping_address_line2: string | null;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country: string;
    shipping_phone: string | null;
    relay_point_id: string | null;
    relay_point_name: string | null;
    relay_point_address: string | null;
    buyer_notes: string | null;
    paid_at: string | null;
  };
  buyer: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

// ============================================
// Buyer Orders
// ============================================

/**
 * Récupérer les commandes d'un acheteur
 */
export const getBuyerOrders = async (
  buyerId: string,
  status?: OrderStatus
): Promise<OrderWithItems[]> => {
  try {
    let query = supabase
      .from("orders")
      .select(`
        *,
        items:order_items(
          *,
          listing:listings(
            id,
            movie_poster_path,
            edition,
            condition_notes
          ),
          seller:seller_profiles(
            id,
            display_name,
            user_id
          )
        )
      `)
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[OrderService] Get buyer orders error:", error);
      return [];
    }

    return (data || []) as OrderWithItems[];
  } catch (error) {
    console.error("[OrderService] Get buyer orders exception:", error);
    return [];
  }
};

/**
 * Récupérer une commande par ID
 */
export const getOrder = async (
  orderId: string,
  userId: string
): Promise<OrderWithItems | null> => {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        items:order_items(
          *,
          listing:listings(
            id,
            movie_poster_path,
            edition,
            condition_notes
          ),
          seller:seller_profiles(
            id,
            display_name,
            user_id
          )
        )
      `)
      .eq("id", orderId)
      .eq("buyer_id", userId)
      .single();

    if (error) {
      console.error("[OrderService] Get order error:", error);
      return null;
    }

    return data as OrderWithItems;
  } catch (error) {
    return null;
  }
};

// ============================================
// Seller Orders
// ============================================

/**
 * Récupérer les ventes d'un vendeur
 */
export const getSellerOrders = async (
  sellerId: string,
  status?: OrderItemStatus
): Promise<SellerOrderItem[]> => {
  try {
    let query = supabase
      .from("order_items")
      .select(`
        *,
        order:orders(
          id,
          order_number,
          buyer_id,
          shipping_name,
          shipping_address_line1,
          shipping_address_line2,
          shipping_city,
          shipping_postal_code,
          shipping_country,
          shipping_phone,
          relay_point_id,
          relay_point_name,
          relay_point_address,
          buyer_notes,
          paid_at
        ),
        buyer:orders(buyer:profiles(
          id,
          username,
          avatar_url
        ))
      `)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[OrderService] Get seller orders error:", error);
      return [];
    }

    // Flatten buyer data
    return (data || []).map(item => ({
      ...item,
      buyer: item.buyer?.buyer || null,
    })) as SellerOrderItem[];
  } catch (error) {
    return [];
  }
};

/**
 * Récupérer les statistiques de vente d'un vendeur
 */
export const getSellerStats = async (sellerId: string): Promise<{
  totalSales: number;
  totalRevenue: number;
  pendingShipments: number;
  averageRating: number;
}> => {
  try {
    // Get order items stats
    const { data: items } = await supabase
      .from("order_items")
      .select("status, seller_payout_cents")
      .eq("seller_id", sellerId);

    const totalSales = items?.filter(i => i.status === "delivered").length || 0;
    const totalRevenue = items
      ?.filter(i => i.status === "delivered")
      .reduce((sum, i) => sum + i.seller_payout_cents, 0) || 0;
    const pendingShipments = items?.filter(i => i.status === "confirmed").length || 0;

    // Get rating
    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("average_rating")
      .eq("id", sellerId)
      .single();

    return {
      totalSales,
      totalRevenue,
      pendingShipments,
      averageRating: seller?.average_rating || 0,
    };
  } catch (error) {
    return {
      totalSales: 0,
      totalRevenue: 0,
      pendingShipments: 0,
      averageRating: 0,
    };
  }
};

// ============================================
// Order Item Actions (Seller)
// ============================================

/**
 * Marquer un article comme expédié
 */
export const markAsShipped = async (
  orderItemId: string,
  trackingNumber?: string,
  trackingCarrier?: string,
  trackingUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("order_items")
      .update({
        status: "shipped",
        shipped_at: new Date().toISOString(),
        tracking_number: trackingNumber,
        tracking_carrier: trackingCarrier,
        tracking_url: trackingUrl,
      })
      .eq("id", orderItemId)
      .eq("status", "confirmed");

    if (error) {
      return { success: false, error: error.message };
    }

    // Update parent order if all items shipped
    await updateOrderStatusFromItems(orderItemId);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update shipping status" };
  }
};

/**
 * Marquer un article comme livré
 */
export const markAsDelivered = async (
  orderItemId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("order_items")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderItemId)
      .eq("status", "shipped");

    if (error) {
      return { success: false, error: error.message };
    }

    // Update parent order
    await updateOrderStatusFromItems(orderItemId);

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update delivery status" };
  }
};

/**
 * Helper: Update order status based on items
 */
const updateOrderStatusFromItems = async (orderItemId: string): Promise<void> => {
  try {
    // Get order ID
    const { data: item } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("id", orderItemId)
      .single();

    if (!item) return;

    // Get all items for this order
    const { data: allItems } = await supabase
      .from("order_items")
      .select("status")
      .eq("order_id", item.order_id);

    if (!allItems) return;

    const statuses = allItems.map(i => i.status);

    let newOrderStatus: OrderStatus | null = null;

    if (statuses.every(s => s === "delivered")) {
      newOrderStatus = "delivered";
    } else if (statuses.every(s => s === "shipped" || s === "delivered")) {
      newOrderStatus = "shipped";
    } else if (statuses.some(s => s === "shipped")) {
      newOrderStatus = "processing";
    }

    if (newOrderStatus) {
      const updateData: Record<string, unknown> = { status: newOrderStatus };
      
      if (newOrderStatus === "shipped") {
        updateData.shipped_at = new Date().toISOString();
      } else if (newOrderStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString();
      }

      await supabase
        .from("orders")
        .update(updateData)
        .eq("id", item.order_id);
    }
  } catch (error) {
    console.error("[OrderService] Update order status error:", error);
  }
};

// ============================================
// Order Actions (Buyer)
// ============================================

/**
 * Confirmer la réception (par l'acheteur)
 */
export const confirmDelivery = async (
  orderId: string,
  buyerId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify buyer owns the order
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .eq("buyer_id", buyerId)
      .single();

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Update all items
    await supabase
      .from("order_items")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
      })
      .eq("order_id", orderId)
      .eq("status", "shipped");

    // Update order
    const { error } = await supabase
      .from("orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        delivered_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to confirm delivery" };
  }
};

/**
 * Annuler une commande (si pas encore expédiée)
 */
export const cancelOrder = async (
  orderId: string,
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check order can be cancelled
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, buyer_id")
      .eq("id", orderId)
      .single();

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.buyer_id !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!["pending_payment", "paid", "processing"].includes(order.status || "")) {
      return { success: false, error: "Order cannot be cancelled" };
    }

    // Update order
    const { error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        buyer_notes: reason ? `Annulation: ${reason}` : null,
      })
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Update items
    await supabase
      .from("order_items")
      .update({ status: "cancelled" })
      .eq("order_id", orderId);

    // Reset listings to active
    const { data: items } = await supabase
      .from("order_items")
      .select("listing_id")
      .eq("order_id", orderId);

    if (items) {
      for (const item of items) {
        await supabase
          .from("listings")
          .update({ status: "active" })
          .eq("id", item.listing_id);
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to cancel order" };
  }
};

// ============================================
// Order Status Helpers
// ============================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "En attente de paiement",
  paid: "Payée",
  processing: "En cours de traitement",
  shipped: "Expédiée",
  delivered: "Livrée",
  completed: "Terminée",
  cancelled: "Annulée",
  refunded: "Remboursée",
  disputed: "En litige",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  refunded: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  disputed: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const ITEM_STATUS_LABELS: Record<OrderItemStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  shipped: "Expédié",
  delivered: "Livré",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

export default {
  getBuyerOrders,
  getOrder,
  getSellerOrders,
  getSellerStats,
  markAsShipped,
  markAsDelivered,
  confirmDelivery,
  cancelOrder,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ITEM_STATUS_LABELS,
};
