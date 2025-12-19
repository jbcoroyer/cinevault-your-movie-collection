/**
 * CineVault - Cart Service
 * 
 * Service pour la gestion du panier
 * - Ajout/Suppression d'articles
 * - Calcul des totaux
 * - Optimisation des frais de port
 * - Synchronisation localStorage/Supabase
 */

import { supabase } from "@/integrations/supabase/client";
import type { ListingWithSeller } from "./listingService";

// ============================================
// Types
// ============================================

export interface CartItem {
  listingId: string;
  listing: ListingWithSeller;
  addedAt: string;
  priceAtAdd: number;
  shippingAtAdd: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotalCents: number;
  shippingCents: number;
  platformFeeCents: number;
  totalCents: number;
  sellerGroups: SellerGroup[];
}

export interface SellerGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotalCents: number;
  shippingCents: number;
}

const CART_KEY = "cinevault_cart";
const PLATFORM_FEE_PERCENT = 5;

// ============================================
// Local Storage Operations
// ============================================

/**
 * Récupérer le panier du localStorage
 */
const getLocalCart = (): string[] => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Sauvegarder le panier dans localStorage
 */
const setLocalCart = (listingIds: string[]): void => {
  localStorage.setItem(CART_KEY, JSON.stringify(listingIds));
};

// ============================================
// Cart Operations
// ============================================

/**
 * Ajouter un article au panier
 */
export const addToCart = async (
  listingId: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if listing exists and is available
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, status, price_cents, shipping_domestic_cents")
      .eq("id", listingId)
      .eq("status", "active")
      .single();

    if (listingError || !listing) {
      return { success: false, error: "Article non disponible" };
    }

    // Add to localStorage
    const localCart = getLocalCart();
    if (!localCart.includes(listingId)) {
      localCart.push(listingId);
      setLocalCart(localCart);
    }

    // If user is logged in, sync to Supabase
    if (userId) {
      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: userId,
          listing_id: listingId,
          price_cents_at_add: listing.price_cents,
          shipping_cents_at_add: listing.shipping_domestic_cents || 399,
        },
        { onConflict: "user_id,listing_id" }
      );

      if (error) {
        console.error("[CartService] Add to cart error:", error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[CartService] Add error:", error);
    return { success: false, error: "Erreur lors de l'ajout au panier" };
  }
};

/**
 * Retirer un article du panier
 */
export const removeFromCart = async (
  listingId: string,
  userId?: string
): Promise<{ success: boolean }> => {
  try {
    // Remove from localStorage
    const localCart = getLocalCart();
    const updated = localCart.filter(id => id !== listingId);
    setLocalCart(updated);

    // If user is logged in, remove from Supabase
    if (userId) {
      await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);
    }

    return { success: true };
  } catch (error) {
    console.error("[CartService] Remove error:", error);
    return { success: false };
  }
};

/**
 * Vider le panier
 */
export const clearCart = async (userId?: string): Promise<void> => {
  setLocalCart([]);

  if (userId) {
    await supabase.from("cart_items").delete().eq("user_id", userId);
  }
};

/**
 * Vérifier si un article est dans le panier
 */
export const isInCart = (listingId: string): boolean => {
  const localCart = getLocalCart();
  return localCart.includes(listingId);
};

/**
 * Récupérer le nombre d'articles dans le panier
 */
export const getCartCount = (): number => {
  return getLocalCart().length;
};

// ============================================
// Cart Data Fetching
// ============================================

/**
 * Récupérer le panier complet avec les données des annonces
 */
export const getCart = async (userId?: string): Promise<CartSummary> => {
  try {
    let listingIds: string[];

    // Get cart items
    if (userId) {
      // Merge localStorage and Supabase
      const localCart = getLocalCart();

      const { data: dbCart } = await supabase
        .from("cart_items")
        .select("listing_id")
        .eq("user_id", userId);

      const dbIds = (dbCart || []).map(item => item.listing_id);
      listingIds = [...new Set([...localCart, ...dbIds])];

      // Sync localStorage to localStorage
      setLocalCart(listingIds);
    } else {
      listingIds = getLocalCart();
    }

    if (listingIds.length === 0) {
      return {
        items: [],
        subtotalCents: 0,
        shippingCents: 0,
        platformFeeCents: 0,
        totalCents: 0,
        sellerGroups: [],
      };
    }

    // Fetch listings with seller info
    const { data: listings, error } = await supabase
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
      .in("id", listingIds)
      .eq("status", "active");

    if (error) {
      console.error("[CartService] Fetch error:", error);
      return {
        items: [],
        subtotalCents: 0,
        shippingCents: 0,
        platformFeeCents: 0,
        totalCents: 0,
        sellerGroups: [],
      };
    }

    // Filter out unavailable listings from cart
    const availableIds = (listings || []).map(l => l.id);
    const cleanedCart = listingIds.filter(id => availableIds.includes(id));
    if (cleanedCart.length !== listingIds.length) {
      setLocalCart(cleanedCart);
    }

    // Build cart items
    const cartItems: CartItem[] = (listings || []).map(listing => ({
      listingId: listing.id,
      listing: listing as ListingWithSeller,
      addedAt: new Date().toISOString(),
      priceAtAdd: listing.price_cents,
      shippingAtAdd: listing.shipping_domestic_cents || 399,
    }));

    // Calculate summary
    return calculateCartSummary(cartItems);
  } catch (error) {
    console.error("[CartService] Get cart error:", error);
    return {
      items: [],
      subtotalCents: 0,
      shippingCents: 0,
      platformFeeCents: 0,
      totalCents: 0,
      sellerGroups: [],
    };
  }
};

// ============================================
// Cart Calculations
// ============================================

/**
 * Calculer le résumé du panier avec optimisation des frais de port
 */
export const calculateCartSummary = (items: CartItem[]): CartSummary => {
  if (items.length === 0) {
    return {
      items: [],
      subtotalCents: 0,
      shippingCents: 0,
      platformFeeCents: 0,
      totalCents: 0,
      sellerGroups: [],
    };
  }

  // Group by seller
  const sellerMap = new Map<string, SellerGroup>();

  for (const item of items) {
    const sellerId = item.listing.seller.id;
    const sellerName = item.listing.seller.display_name;

    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, {
        sellerId,
        sellerName,
        items: [],
        subtotalCents: 0,
        shippingCents: 0,
      });
    }

    sellerMap.get(sellerId)!.items.push(item);
  }

  // Calculate shipping per seller (optimized)
  const sellerGroups: SellerGroup[] = [];
  let totalSubtotal = 0;
  let totalShipping = 0;

  for (const [, group] of sellerMap) {
    let sellerSubtotal = 0;
    let sellerShipping = 0;

    for (let i = 0; i < group.items.length; i++) {
      const item = group.items[i];
      sellerSubtotal += item.listing.price_cents;

      // First item: full shipping, additional items: 1€
      if (i === 0) {
        sellerShipping = item.listing.shipping_domestic_cents || 399;
      } else {
        sellerShipping += 100; // 1€ per additional item
      }
    }

    group.subtotalCents = sellerSubtotal;
    group.shippingCents = sellerShipping;
    sellerGroups.push(group);

    totalSubtotal += sellerSubtotal;
    totalShipping += sellerShipping;
  }

  const total = totalSubtotal + totalShipping;
  const platformFee = Math.round(total * PLATFORM_FEE_PERCENT / 100);

  return {
    items,
    subtotalCents: totalSubtotal,
    shippingCents: totalShipping,
    platformFeeCents: platformFee,
    totalCents: total,
    sellerGroups,
  };
};

/**
 * Optimiser le panier (regrouper les achats par vendeur)
 */
export const getCartOptimization = (cart: CartSummary): {
  potentialSavings: number;
  suggestions: string[];
} => {
  const suggestions: string[] = [];
  let potentialSavings = 0;

  // Check if there are multiple items from same seller
  for (const group of cart.sellerGroups) {
    if (group.items.length > 1) {
      const savedPerItem = 299; // ~3€ saved per additional item
      const savings = (group.items.length - 1) * savedPerItem;
      potentialSavings += savings;
    }
  }

  // Suggest grouping
  if (cart.sellerGroups.length > 1) {
    suggestions.push(
      `Vous achetez auprès de ${cart.sellerGroups.length} vendeurs différents. ` +
      `Les frais de port sont calculés par vendeur.`
    );
  }

  return { potentialSavings, suggestions };
};

// ============================================
// Sync Operations
// ============================================

/**
 * Synchroniser le panier localStorage avec Supabase après connexion
 */
export const syncCartAfterLogin = async (userId: string): Promise<void> => {
  try {
    const localCart = getLocalCart();

    if (localCart.length === 0) {
      return;
    }

    // Get existing cart items from Supabase
    const { data: existingItems } = await supabase
      .from("cart_items")
      .select("listing_id")
      .eq("user_id", userId);

    const existingIds = (existingItems || []).map(item => item.listing_id);

    // Get listings for local cart items
    const { data: listings } = await supabase
      .from("listings")
      .select("id, price_cents, shipping_domestic_cents")
      .in("id", localCart)
      .eq("status", "active");

    if (!listings) return;

    // Add new items to Supabase
    const newItems = listings
      .filter(l => !existingIds.includes(l.id))
      .map(l => ({
        user_id: userId,
        listing_id: l.id,
        price_cents_at_add: l.price_cents,
        shipping_cents_at_add: l.shipping_domestic_cents || 399,
      }));

    if (newItems.length > 0) {
      await supabase.from("cart_items").insert(newItems);
    }

    // Merge and update localStorage
    const mergedIds = [...new Set([...existingIds, ...localCart])];
    setLocalCart(mergedIds);

    console.log(`[CartService] Synced ${newItems.length} items after login`);
  } catch (error) {
    console.error("[CartService] Sync error:", error);
  }
};

// ============================================
// Checkout Preparation
// ============================================

export interface CheckoutData {
  items: { listingId: string; quantity: number }[];
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingMethod: "mondial_relay" | "colissimo" | "hand_delivery";
  relayPoint?: {
    id: string;
    name: string;
    address: string;
  };
  buyerNotes?: string;
}

/**
 * Préparer les données pour le checkout Stripe
 */
export const prepareCheckout = async (
  cart: CartSummary,
  checkoutData: Omit<CheckoutData, "items">
): Promise<CheckoutData> => {
  return {
    items: cart.items.map(item => ({
      listingId: item.listingId,
      quantity: 1,
    })),
    ...checkoutData,
  };
};

/**
 * Créer une session Stripe Checkout
 */
export const createCheckoutSession = async (
  checkoutData: CheckoutData
): Promise<{ sessionUrl?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke("stripe-checkout", {
      body: {
        action: "create_session",
        ...checkoutData,
      },
    });

    if (error) {
      console.error("[CartService] Checkout error:", error);
      return { error: error.message };
    }

    if (!data.success) {
      return { error: data.error || "Erreur lors de la création du paiement" };
    }

    return { sessionUrl: data.sessionUrl };
  } catch (error) {
    console.error("[CartService] Checkout exception:", error);
    return { error: "Erreur inattendue" };
  }
};

export default {
  addToCart,
  removeFromCart,
  clearCart,
  isInCart,
  getCartCount,
  getCart,
  calculateCartSummary,
  getCartOptimization,
  syncCartAfterLogin,
  prepareCheckout,
  createCheckoutSession,
};
