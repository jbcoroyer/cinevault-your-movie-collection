/**
 * CineVault - Listing Service
 * 
 * Service pour la gestion des annonces marketplace
 * - CRUD annonces
 * - Upload images
 * - Recherche et filtres
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Listing = Database["public"]["Tables"]["listings"]["Row"];
type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
type ListingCondition = Database["public"]["Enums"]["listing_condition"];
type ListingStatus = Database["public"]["Enums"]["listing_status"];

// ============================================
// Types
// ============================================

export interface ListingWithSeller extends Listing {
  seller: {
    id: string;
    display_name: string;
    average_rating: number | null;
    rating_count: number | null;
    total_sales: number | null;
    location_city: string | null;
    location_country: string | null;
  };
  images: {
    id: string;
    storage_path: string;
    is_primary: boolean;
    position: number;
  }[];
}

export interface CreateListingData {
  tmdbId: number;
  movieTitle: string;
  moviePosterPath?: string;
  movieReleaseYear?: number;
  format: string;
  condition: ListingCondition;
  conditionNotes?: string;
  priceCents: number;
  description?: string;
  edition?: string;
  regionCode?: string;
  isSealed?: boolean;
  includesSlipcover?: boolean;
  includesBooklet?: boolean;
  shippingDomesticCents?: number;
  shippingEuCents?: number;
  shippingFromCity?: string;
  shippingFromCountry?: string;
  acceptsMondialRelay?: boolean;
  acceptsColissimo?: boolean;
  acceptsHandDelivery?: boolean;
  images?: File[];
}

export interface ListingFilters {
  query?: string;
  formats?: string[];
  conditions?: ListingCondition[];
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  tmdbId?: number;
  country?: string;
  sortBy?: "price_asc" | "price_desc" | "newest" | "oldest" | "relevance";
  page?: number;
  limit?: number;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Créer une nouvelle annonce
 */
export const createListing = async (
  data: CreateListingData,
  sellerId: string
): Promise<{ success: boolean; listing?: Listing; error?: string }> => {
  try {
    // 1. Create the listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        seller_id: sellerId,
        tmdb_id: data.tmdbId,
        movie_title: data.movieTitle,
        movie_poster_path: data.moviePosterPath,
        movie_release_year: data.movieReleaseYear,
        format: data.format,
        condition: data.condition,
        condition_notes: data.conditionNotes,
        price_cents: data.priceCents,
        description: data.description,
        edition: data.edition,
        region_code: data.regionCode,
        is_sealed: data.isSealed,
        includes_slipcover: data.includesSlipcover,
        includes_booklet: data.includesBooklet,
        shipping_domestic_cents: data.shippingDomesticCents ?? 399,
        shipping_eu_cents: data.shippingEuCents ?? 699,
        shipping_from_city: data.shippingFromCity,
        shipping_from_country: data.shippingFromCountry ?? "FR",
        accepts_mondial_relay: data.acceptsMondialRelay ?? true,
        accepts_colissimo: data.acceptsColissimo ?? true,
        accepts_hand_delivery: data.acceptsHandDelivery ?? false,
        status: "draft",
      })
      .select()
      .single();

    if (listingError || !listing) {
      console.error("[ListingService] Create error:", listingError);
      return { success: false, error: listingError?.message || "Failed to create listing" };
    }

    // 2. Upload images if provided
    if (data.images && data.images.length > 0) {
      for (let i = 0; i < data.images.length; i++) {
        const file = data.images[i];
        const fileName = `${listing.id}/${Date.now()}-${i}.${file.name.split(".").pop()}`;

        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("[ListingService] Image upload error:", uploadError);
          continue;
        }

        // Create image record
        await supabase.from("listing_images").insert({
          listing_id: listing.id,
          storage_path: fileName,
          is_primary: i === 0,
          position: i,
        });
      }
    }

    return { success: true, listing };
  } catch (error) {
    console.error("[ListingService] Create exception:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
};

/**
 * Mettre à jour une annonce
 */
export const updateListing = async (
  listingId: string,
  data: Partial<CreateListingData>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: ListingUpdate = {};

    if (data.priceCents !== undefined) updateData.price_cents = data.priceCents;
    if (data.condition !== undefined) updateData.condition = data.condition;
    if (data.conditionNotes !== undefined) updateData.condition_notes = data.conditionNotes;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shippingDomesticCents !== undefined) updateData.shipping_domestic_cents = data.shippingDomesticCents;
    if (data.shippingEuCents !== undefined) updateData.shipping_eu_cents = data.shippingEuCents;
    if (data.acceptsMondialRelay !== undefined) updateData.accepts_mondial_relay = data.acceptsMondialRelay;
    if (data.acceptsColissimo !== undefined) updateData.accepts_colissimo = data.acceptsColissimo;

    const { error } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", listingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[ListingService] Update error:", error);
    return { success: false, error: "Failed to update listing" };
  }
};

/**
 * Publier une annonce (passer de draft à active)
 */
export const publishListing = async (
  listingId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("listings")
      .update({
        status: "active",
        published_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("status", "draft");

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to publish listing" };
  }
};

/**
 * Annuler/Supprimer une annonce
 */
export const cancelListing = async (
  listingId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("listings")
      .update({ status: "cancelled" })
      .eq("id", listingId)
      .in("status", ["draft", "active"]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to cancel listing" };
  }
};

// ============================================
// Query Operations
// ============================================

/**
 * Récupérer une annonce par ID
 */
export const getListing = async (
  listingId: string
): Promise<ListingWithSeller | null> => {
  try {
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        seller:seller_profiles(
          id,
          display_name,
          average_rating,
          rating_count,
          total_sales,
          location_city,
          location_country
        ),
        images:listing_images(
          id,
          storage_path,
          is_primary,
          position
        )
      `)
      .eq("id", listingId)
      .single();

    if (error || !data) {
      return null;
    }

    // Increment views
    await supabase
      .from("listings")
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq("id", listingId);

    return data as ListingWithSeller;
  } catch (error) {
    console.error("[ListingService] Get listing error:", error);
    return null;
  }
};

/**
 * Rechercher des annonces avec filtres
 */
export const searchListings = async (
  filters: ListingFilters
): Promise<{ listings: ListingWithSeller[]; total: number }> => {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("listings")
      .select(`
        *,
        seller:seller_profiles(
          id,
          display_name,
          average_rating,
          rating_count,
          total_sales,
          location_city,
          location_country
        ),
        images:listing_images(
          id,
          storage_path,
          is_primary,
          position
        )
      `, { count: "exact" })
      .eq("status", "active");

    // Apply filters
    if (filters.query) {
      query = query.ilike("movie_title", `%${filters.query}%`);
    }

    if (filters.formats && filters.formats.length > 0) {
      query = query.in("format", filters.formats);
    }

    if (filters.conditions && filters.conditions.length > 0) {
      query = query.in("condition", filters.conditions);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte("price_cents", filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte("price_cents", filters.maxPrice);
    }

    if (filters.sellerId) {
      query = query.eq("seller_id", filters.sellerId);
    }

    if (filters.tmdbId) {
      query = query.eq("tmdb_id", filters.tmdbId);
    }

    if (filters.country) {
      query = query.eq("shipping_from_country", filters.country);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "price_asc":
        query = query.order("price_cents", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price_cents", { ascending: false });
        break;
      case "newest":
        query = query.order("published_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("published_at", { ascending: true });
        break;
      default:
        query = query.order("published_at", { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[ListingService] Search error:", error);
      return { listings: [], total: 0 };
    }

    return {
      listings: (data || []) as ListingWithSeller[],
      total: count || 0,
    };
  } catch (error) {
    console.error("[ListingService] Search exception:", error);
    return { listings: [], total: 0 };
  }
};

/**
 * Récupérer les annonces d'un vendeur
 */
export const getSellerListings = async (
  sellerId: string,
  status?: ListingStatus
): Promise<ListingWithSeller[]> => {
  try {
    let query = supabase
      .from("listings")
      .select(`
        *,
        seller:seller_profiles(
          id,
          display_name,
          average_rating,
          rating_count,
          total_sales,
          location_city,
          location_country
        ),
        images:listing_images(
          id,
          storage_path,
          is_primary,
          position
        )
      `)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[ListingService] Get seller listings error:", error);
      return [];
    }

    return (data || []) as ListingWithSeller[];
  } catch (error) {
    return [];
  }
};

// ============================================
// Image Operations
// ============================================

/**
 * Upload une image pour une annonce
 */
export const uploadListingImage = async (
  listingId: string,
  file: File,
  position: number = 0
): Promise<{ success: boolean; imagePath?: string; error?: string }> => {
  try {
    const fileName = `${listingId}/${Date.now()}-${position}.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Check if first image to set as primary
    const { count } = await supabase
      .from("listing_images")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId);

    const { error: insertError } = await supabase.from("listing_images").insert({
      listing_id: listingId,
      storage_path: fileName,
      is_primary: (count || 0) === 0,
      position: count || 0,
    });

    if (insertError) {
      // Cleanup uploaded file
      await supabase.storage.from("listing-images").remove([fileName]);
      return { success: false, error: insertError.message };
    }

    return { success: true, imagePath: fileName };
  } catch (error) {
    return { success: false, error: "Failed to upload image" };
  }
};

/**
 * Supprimer une image d'annonce
 */
export const deleteListingImage = async (
  imageId: string,
  storagePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Delete from storage
    await supabase.storage.from("listing-images").remove([storagePath]);

    // Delete from database
    const { error } = await supabase
      .from("listing_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete image" };
  }
};

/**
 * Obtenir l'URL publique d'une image
 */
export const getImageUrl = (storagePath: string): string => {
  const { data } = supabase.storage
    .from("listing-images")
    .getPublicUrl(storagePath);

  return data.publicUrl;
};

// ============================================
// Favorites
// ============================================

/**
 * Ajouter aux favoris
 */
export const addToFavorites = async (
  userId: string,
  listingId: string
): Promise<boolean> => {
  try {
    const { error } = await (supabase.from("listing_favorites") as any).insert({
      user_id: userId,
      listing_id: listingId,
    });

    return !error;
  } catch {
    return false;
  }
};

/**
 * Retirer des favoris
 */
export const removeFromFavorites = async (
  userId: string,
  listingId: string
): Promise<boolean> => {
  try {
    const { error } = await (supabase.from("listing_favorites") as any)
      .delete()
      .eq("user_id", userId)
      .eq("listing_id", listingId);

    return !error;
  } catch {
    return false;
  }
};

/**
 * Vérifier si un listing est en favori
 */
export const isFavorite = async (
  userId: string,
  listingId: string
): Promise<boolean> => {
  const { count } = await (supabase.from("listing_favorites") as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("listing_id", listingId);

  return (count || 0) > 0;
};

/**
 * Récupérer les favoris d'un utilisateur
 */
export const getUserFavorites = async (
  userId: string
): Promise<ListingWithSeller[]> => {
  const { data, error } = await (supabase.from("listing_favorites") as any)
    .select(`
      listing:listings(
        *,
        seller:seller_profiles(
          id,
          display_name,
          average_rating,
          rating_count,
          total_sales,
          location_city,
          location_country
        ),
        images:listing_images(
          id,
          storage_path,
          is_primary,
          position
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(f => f.listing).filter(Boolean) as ListingWithSeller[];
};

export default {
  createListing,
  updateListing,
  publishListing,
  cancelListing,
  getListing,
  searchListings,
  getSellerListings,
  uploadListingImage,
  deleteListingImage,
  getImageUrl,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  getUserFavorites,
};
