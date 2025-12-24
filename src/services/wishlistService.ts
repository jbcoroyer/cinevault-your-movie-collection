/**
 * CineVault - Wishlist Service
 * 
 * Service complet pour la gestion de la wishlist d'achat
 */

import { supabase } from "@/integrations/supabase/client";
import { PhysicalFormat } from "./physicalMovies";

// ============================================
// Types
// ============================================

export interface WishlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_year: number | null;
  desired_formats: PhysicalFormat[];
  max_price: number | null; // en centimes
  priority: 'low' | 'medium' | 'high';
  notes: string | null;
  ebay_tracking_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddWishlistData {
  tmdb_id: number;
  title: string;
  poster_path?: string | null;
  release_year?: number | null;
  desired_formats?: PhysicalFormat[];
  max_price?: number | null;
  priority?: 'low' | 'medium' | 'high';
  notes?: string | null;
  ebay_tracking_enabled?: boolean;
}

export interface EbayAlert {
  id: string;
  user_id: string;
  wishlist_id: string;
  ebay_item_id: string;
  title: string;
  price_cents: number;
  currency: string;
  condition: string | null;
  image_url: string | null;
  item_url: string;
  seller_name: string | null;
  seller_feedback_score: number | null;
  shipping_cost_cents: number | null;
  location: string | null;
  end_time: string | null;
  is_auction: boolean;
  is_seen: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// ============================================
// Wishlist CRUD
// ============================================

export const getWishlist = async (userId: string): Promise<WishlistItem[]> => {
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wishlist:", error);
    return [];
  }

  return (data as WishlistItem[]) || [];
};

export const addToWishlist = async (
  userId: string,
  data: AddWishlistData
): Promise<WishlistItem | null> => {
  const { data: item, error } = await supabase
    .from("wishlist")
    .insert({
      user_id: userId,
      tmdb_id: data.tmdb_id,
      title: data.title,
      poster_path: data.poster_path || null,
      release_year: data.release_year || null,
      desired_formats: data.desired_formats || ['bluray'],
      max_price: data.max_price || null,
      priority: data.priority || 'medium',
      notes: data.notes || null,
      ebay_tracking_enabled: data.ebay_tracking_enabled || false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }

  return item as WishlistItem;
};

export const updateWishlistItem = async (
  id: string,
  updates: Partial<AddWishlistData>
): Promise<WishlistItem | null> => {
  const { data, error } = await supabase
    .from("wishlist")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating wishlist item:", error);
    throw error;
  }

  return data as WishlistItem;
};

export const removeFromWishlist = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error removing from wishlist:", error);
    return false;
  }

  return true;
};

export const isInWishlist = async (userId: string, tmdbId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error checking wishlist:", error);
  }

  return !!data;
};

export const toggleEbayTracking = async (
  id: string,
  enabled: boolean
): Promise<boolean> => {
  const { error } = await supabase
    .from("wishlist")
    .update({ 
      ebay_tracking_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error toggling eBay tracking:", error);
    return false;
  }

  return true;
};

// ============================================
// eBay Alerts
// ============================================

export const getEbayAlerts = async (
  userId: string,
  options?: { unseenOnly?: boolean; limit?: number }
): Promise<EbayAlert[]> => {
  let query = supabase
    .from("ebay_alerts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false });

  if (options?.unseenOnly) {
    query = query.eq("is_seen", false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching eBay alerts:", error);
    return [];
  }

  return (data as EbayAlert[]) || [];
};

export const getEbayAlertsForWishlistItem = async (
  wishlistId: string
): Promise<EbayAlert[]> => {
  const { data, error } = await supabase
    .from("ebay_alerts")
    .select("*")
    .eq("wishlist_id", wishlistId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching eBay alerts for item:", error);
    return [];
  }

  return (data as EbayAlert[]) || [];
};

export const markAlertAsSeen = async (alertId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("ebay_alerts")
    .update({ is_seen: true })
    .eq("id", alertId);

  if (error) {
    console.error("Error marking alert as seen:", error);
    return false;
  }

  return true;
};

export const markAllAlertsAsSeen = async (userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("ebay_alerts")
    .update({ is_seen: true })
    .eq("user_id", userId)
    .eq("is_seen", false);

  if (error) {
    console.error("Error marking all alerts as seen:", error);
    return false;
  }

  return true;
};

export const dismissAlert = async (alertId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("ebay_alerts")
    .update({ is_dismissed: true })
    .eq("id", alertId);

  if (error) {
    console.error("Error dismissing alert:", error);
    return false;
  }

  return true;
};

export const getUnseenAlertsCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from("ebay_alerts")
    .select("*", { count: 'exact', head: true })
    .eq("user_id", userId)
    .eq("is_seen", false)
    .eq("is_dismissed", false);

  if (error) {
    console.error("Error counting unseen alerts:", error);
    return 0;
  }

  return count || 0;
};

// ============================================
// Priority helpers
// ============================================

export const priorityLabels: Record<WishlistItem['priority'], string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

export const priorityColors: Record<WishlistItem['priority'], string> = {
  low: 'bg-slate-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

export const priorityIcons: Record<WishlistItem['priority'], string> = {
  low: '⬇️',
  medium: '➡️',
  high: '🔥',
};
