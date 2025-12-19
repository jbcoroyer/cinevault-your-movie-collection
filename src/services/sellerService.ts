/**
 * CineVault - Seller Service
 * 
 * Service pour la gestion des profils vendeurs
 * - Création/Mise à jour profil
 * - Onboarding Stripe
 * - Statistiques
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SellerProfile = Database["public"]["Tables"]["seller_profiles"]["Row"];
type SellerInsert = Database["public"]["Tables"]["seller_profiles"]["Insert"];
type SellerUpdate = Database["public"]["Tables"]["seller_profiles"]["Update"];

// ============================================
// Types
// ============================================

export interface SellerProfileWithStats extends SellerProfile {
  activeListingsCount: number;
  pendingOrdersCount: number;
}

export interface SellerOnboardingStatus {
  hasAccount: boolean;
  status: "not_started" | "incomplete" | "pending_verification" | "complete";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export interface SellerReview {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number;
  communicationRating?: number;
  shippingSpeedRating?: number;
  itemAccuracyRating?: number;
  packagingRating?: number;
  title?: string;
  comment?: string;
  sellerResponse?: string;
  createdAt: string;
  orderNumber: string;
  movieTitle: string;
}

// ============================================
// Profile Operations
// ============================================

/**
 * Récupérer le profil vendeur de l'utilisateur courant
 */
export const getCurrentSellerProfile = async (
  userId: string
): Promise<SellerProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      console.error("[SellerService] Get profile error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[SellerService] Get profile exception:", error);
    return null;
  }
};

/**
 * Récupérer un profil vendeur par ID
 */
export const getSellerProfile = async (
  sellerId: string
): Promise<SellerProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("id", sellerId)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Créer un profil vendeur
 */
export const createSellerProfile = async (
  userId: string,
  displayName: string,
  description?: string
): Promise<{ success: boolean; profile?: SellerProfile; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("seller_profiles")
      .insert({
        user_id: userId,
        display_name: displayName,
        description,
        is_active: false,
        is_verified: false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, profile: data };
  } catch (error) {
    return { success: false, error: "Failed to create seller profile" };
  }
};

/**
 * Mettre à jour le profil vendeur
 */
export const updateSellerProfile = async (
  sellerId: string,
  data: Partial<{
    displayName: string;
    description: string;
    locationCity: string;
    locationCountry: string;
    acceptsReturns: boolean;
    returnPeriodDays: number;
    defaultShippingPolicy: string;
  }>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: SellerUpdate = {};

    if (data.displayName) updateData.display_name = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.locationCity) updateData.location_city = data.locationCity;
    if (data.locationCountry) updateData.location_country = data.locationCountry;
    if (data.acceptsReturns !== undefined) updateData.accepts_returns = data.acceptsReturns;
    if (data.returnPeriodDays !== undefined) updateData.return_period_days = data.returnPeriodDays;
    if (data.defaultShippingPolicy) updateData.default_shipping_policy = data.defaultShippingPolicy;

    const { error } = await supabase
      .from("seller_profiles")
      .update(updateData)
      .eq("id", sellerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update profile" };
  }
};

// ============================================
// Stripe Onboarding
// ============================================

/**
 * Démarrer l'onboarding Stripe Connect
 */
export const startStripeOnboarding = async (): Promise<{
  success: boolean;
  onboardingUrl?: string;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
      body: {
        action: "create_account",
        returnUrl: `${window.location.origin}/sell?onboarding=complete`,
        refreshUrl: `${window.location.origin}/sell?refresh=true`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { success: true, onboardingUrl: data.onboardingUrl };
  } catch (error) {
    console.error("[SellerService] Stripe onboarding error:", error);
    return { success: false, error: "Failed to start onboarding" };
  }
};

/**
 * Récupérer le statut de l'onboarding Stripe
 */
export const getStripeOnboardingStatus = async (): Promise<SellerOnboardingStatus> => {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
      body: { action: "get_status" },
    });

    if (error || !data.success) {
      return {
        hasAccount: false,
        status: "not_started",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      };
    }

    return {
      hasAccount: data.hasAccount,
      status: data.status,
      chargesEnabled: data.chargesEnabled || false,
      payoutsEnabled: data.payoutsEnabled || false,
      detailsSubmitted: data.detailsSubmitted || false,
      requirements: data.requirements,
    };
  } catch (error) {
    return {
      hasAccount: false,
      status: "not_started",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    };
  }
};

/**
 * Obtenir le lien vers le dashboard Stripe Express
 */
export const getStripeDashboardLink = async (): Promise<{
  success: boolean;
  loginUrl?: string;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
      body: { action: "create_login_link" },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { success: true, loginUrl: data.loginUrl };
  } catch (error) {
    return { success: false, error: "Failed to get dashboard link" };
  }
};

/**
 * Rafraîchir le lien d'onboarding
 */
export const refreshOnboardingLink = async (): Promise<{
  success: boolean;
  onboardingUrl?: string;
  error?: string;
}> => {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-connect-onboarding", {
      body: {
        action: "refresh_link",
        returnUrl: `${window.location.origin}/sell?onboarding=complete`,
        refreshUrl: `${window.location.origin}/sell?refresh=true`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.success) {
      return { success: false, error: data.error };
    }

    return { success: true, onboardingUrl: data.onboardingUrl };
  } catch (error) {
    return { success: false, error: "Failed to refresh link" };
  }
};

// ============================================
// Reviews
// ============================================

/**
 * Récupérer les avis d'un vendeur
 */
export const getSellerReviews = async (
  sellerId: string,
  limit: number = 10
): Promise<SellerReview[]> => {
  try {
    const { data, error } = await supabase
      .from("seller_reviews")
      .select(`
        *,
        buyer:profiles!seller_reviews_buyer_id_fkey(
          id,
          username,
          avatar_url
        ),
        order:orders(
          order_number
        ),
        order_item:order_items(
          movie_title
        )
      `)
      .eq("seller_id", sellerId)
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[SellerService] Get reviews error:", error);
      return [];
    }

    return (data || []).map(review => ({
      id: review.id,
      buyerId: review.buyer_id,
      buyerName: review.buyer?.username || "Utilisateur",
      buyerAvatar: review.buyer?.avatar_url,
      rating: review.rating,
      communicationRating: review.communication_rating,
      shippingSpeedRating: review.shipping_speed_rating,
      itemAccuracyRating: review.item_accuracy_rating,
      packagingRating: review.packaging_rating,
      title: review.title,
      comment: review.comment,
      sellerResponse: review.seller_response,
      createdAt: review.created_at,
      orderNumber: review.order?.order_number || "",
      movieTitle: review.order_item?.movie_title || "",
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Répondre à un avis (vendeur)
 */
export const respondToReview = async (
  reviewId: string,
  response: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("seller_reviews")
      .update({
        seller_response: response,
        seller_responded_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to respond to review" };
  }
};

/**
 * Créer un avis (acheteur)
 */
export const createReview = async (
  sellerId: string,
  orderId: string,
  orderItemId: string,
  data: {
    rating: number;
    communicationRating?: number;
    shippingSpeedRating?: number;
    itemAccuracyRating?: number;
    packagingRating?: number;
    title?: string;
    comment?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase.from("seller_reviews").insert({
      seller_id: sellerId,
      buyer_id: user.id,
      order_id: orderId,
      order_item_id: orderItemId,
      rating: data.rating,
      communication_rating: data.communicationRating,
      shipping_speed_rating: data.shippingSpeedRating,
      item_accuracy_rating: data.itemAccuracyRating,
      packaging_rating: data.packagingRating,
      title: data.title,
      comment: data.comment,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create review" };
  }
};

// ============================================
// Statistics
// ============================================

/**
 * Récupérer les statistiques détaillées d'un vendeur
 */
export const getSellerDetailedStats = async (
  sellerId: string
): Promise<{
  totalSales: number;
  totalRevenueCents: number;
  activeListings: number;
  pendingShipments: number;
  averageRating: number;
  ratingCount: number;
  responseRate: number;
  averageShippingDays: number;
  monthlyStats: { month: string; sales: number; revenue: number }[];
}> => {
  try {
    // Get seller profile
    const { data: seller } = await supabase
      .from("seller_profiles")
      .select("total_sales, total_revenue_cents, average_rating, rating_count")
      .eq("id", sellerId)
      .single();

    // Get active listings count
    const { count: activeListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .eq("status", "active");

    // Get pending shipments
    const { count: pendingShipments } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .eq("status", "confirmed");

    // Calculate average shipping days
    const { data: shippedItems } = await supabase
      .from("order_items")
      .select("created_at, shipped_at")
      .eq("seller_id", sellerId)
      .not("shipped_at", "is", null);

    let avgShippingDays = 0;
    if (shippedItems && shippedItems.length > 0) {
      const totalDays = shippedItems.reduce((sum, item) => {
        const created = new Date(item.created_at!);
        const shipped = new Date(item.shipped_at!);
        return sum + (shipped.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0);
      avgShippingDays = Math.round(totalDays / shippedItems.length * 10) / 10;
    }

    return {
      totalSales: seller?.total_sales || 0,
      totalRevenueCents: seller?.total_revenue_cents || 0,
      activeListings: activeListings || 0,
      pendingShipments: pendingShipments || 0,
      averageRating: seller?.average_rating || 0,
      ratingCount: seller?.rating_count || 0,
      responseRate: 95, // TODO: Calculate from messages
      averageShippingDays: avgShippingDays,
      monthlyStats: [], // TODO: Calculate monthly stats
    };
  } catch (error) {
    console.error("[SellerService] Get stats error:", error);
    return {
      totalSales: 0,
      totalRevenueCents: 0,
      activeListings: 0,
      pendingShipments: 0,
      averageRating: 0,
      ratingCount: 0,
      responseRate: 0,
      averageShippingDays: 0,
      monthlyStats: [],
    };
  }
};

export default {
  getCurrentSellerProfile,
  getSellerProfile,
  createSellerProfile,
  updateSellerProfile,
  startStripeOnboarding,
  getStripeOnboardingStatus,
  getStripeDashboardLink,
  refreshOnboardingLink,
  getSellerReviews,
  respondToReview,
  createReview,
  getSellerDetailedStats,
};
