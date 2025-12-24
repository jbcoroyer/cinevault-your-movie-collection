/**
 * CineVault - Public Collection Service
 * 
 * Service pour le partage public des collections
 */

import { supabase } from "@/integrations/supabase/client";
import { PhysicalMovie } from "./physicalMovies";

// ============================================
// Types
// ============================================

export interface PublicCollectionSettings {
  id: string;
  user_id: string;
  share_code: string;
  is_enabled: boolean;
  show_values: boolean;
  show_purchase_prices: boolean;
  show_conditions: boolean;
  show_notes: boolean;
  custom_title: string | null;
  custom_description: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicCollectionData {
  settings: PublicCollectionSettings;
  profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  movies: PhysicalMovie[];
  stats: {
    totalMovies: number;
    totalValue: number | null;
    formatBreakdown: Record<string, number>;
  };
}

// ============================================
// Settings CRUD
// ============================================

export const getPublicCollectionSettings = async (
  userId: string
): Promise<PublicCollectionSettings | null> => {
  const { data, error } = await supabase
    .from("public_collections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching public collection settings:", error);
  }

  return data as PublicCollectionSettings | null;
};

export const createPublicCollectionSettings = async (
  userId: string,
  settings?: Partial<PublicCollectionSettings>
): Promise<PublicCollectionSettings | null> => {
  const { data, error } = await supabase
    .from("public_collections")
    .insert({
      user_id: userId,
      is_enabled: settings?.is_enabled ?? true,
      show_values: settings?.show_values ?? true,
      show_purchase_prices: settings?.show_purchase_prices ?? false,
      show_conditions: settings?.show_conditions ?? true,
      show_notes: settings?.show_notes ?? false,
      custom_title: settings?.custom_title ?? null,
      custom_description: settings?.custom_description ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating public collection settings:", error);
    throw error;
  }

  return data as PublicCollectionSettings;
};

export const updatePublicCollectionSettings = async (
  userId: string,
  updates: Partial<PublicCollectionSettings>
): Promise<PublicCollectionSettings | null> => {
  const { data, error } = await supabase
    .from("public_collections")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating public collection settings:", error);
    throw error;
  }

  return data as PublicCollectionSettings;
};

export const togglePublicCollection = async (
  userId: string,
  enabled: boolean
): Promise<boolean> => {
  // Check if settings exist
  const existing = await getPublicCollectionSettings(userId);
  
  if (!existing) {
    // Create new settings
    await createPublicCollectionSettings(userId, { is_enabled: enabled });
    return true;
  }

  // Update existing
  const { error } = await supabase
    .from("public_collections")
    .update({ 
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Error toggling public collection:", error);
    return false;
  }

  return true;
};

// ============================================
// Public Access (no auth required)
// ============================================

export const getPublicCollectionByCode = async (
  shareCode: string
): Promise<PublicCollectionData | null> => {
  try {
    // Fetch settings
    const { data: settings, error: settingsError } = await supabase
      .from("public_collections")
      .select("*")
      .eq("share_code", shareCode)
      .eq("is_enabled", true)
      .single();

    if (settingsError || !settings) {
      console.error("Public collection not found:", settingsError);
      return null;
    }

    // Increment view count
    await supabase.rpc('increment_collection_views', { p_share_code: shareCode });

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", settings.user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return null;
    }

    // Fetch movies
    const { data: movies, error: moviesError } = await supabase
      .from("physical_movies")
      .select("*")
      .eq("user_id", settings.user_id)
      .order("created_at", { ascending: false });

    if (moviesError) {
      console.error("Error fetching movies:", moviesError);
      return null;
    }

    // Calculate stats
    const typedMovies = (movies || []) as PhysicalMovie[];
    const formatBreakdown: Record<string, number> = {};
    let totalValue = 0;

    typedMovies.forEach(movie => {
      formatBreakdown[movie.format] = (formatBreakdown[movie.format] || 0) + 1;
      if (settings.show_purchase_prices && movie.price) {
        totalValue += movie.price;
      }
    });

    return {
      settings: settings as PublicCollectionSettings,
      profile: {
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
      movies: typedMovies,
      stats: {
        totalMovies: typedMovies.length,
        totalValue: settings.show_values ? totalValue : null,
        formatBreakdown,
      },
    };
  } catch (error) {
    console.error("Error fetching public collection:", error);
    return null;
  }
};

// ============================================
// Share URL helpers
// ============================================

export const getShareUrl = (shareCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/c/${shareCode}`;
};

export const copyShareLink = async (shareCode: string): Promise<boolean> => {
  try {
    const url = getShareUrl(shareCode);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Error copying share link:", error);
    return false;
  }
};
