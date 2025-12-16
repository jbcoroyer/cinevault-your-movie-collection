/**
 * CineVault - Price Valuation Service
 * 
 * Service pour la valorisation temps réel des collections
 * Sprint 2 - Feature différenciante
 */

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type PriceCache = Tables<"price_cache">;

// ============================================
// Types
// ============================================

export interface PriceData {
  min: number;        // Prix en centimes
  median: number;
  max: number;
  avg: number;
  sampleSize: number;
  soldCount: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  currency: string;
  source: string;
  cached: boolean;
  updatedAt?: string;
}

export interface MovieValuation {
  tmdbId: number;
  format: string;
  title: string;
  posterPath?: string;
  purchasePrice?: number;  // Prix d'achat (en centimes)
  marketPrice?: PriceData;
  profitLoss?: number;     // Différence en centimes
  profitLossPercent?: number;
  priceEvolution?: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  date: string;
  priceMedian: number;
  priceMin: number;
  priceMax: number;
}

export interface CollectionValuation {
  totalValueMin: number;
  totalValueMedian: number;
  totalValueMax: number;
  totalPurchasePrice: number;
  profitLoss: number;
  profitLossPercent: number;
  itemsWithPrice: number;
  itemsWithoutPrice: number;
  topValuedItems: MovieValuation[];
  biggestGainers: MovieValuation[];
  biggestLosers: MovieValuation[];
  lastUpdated: string;
}

export interface PriceAlert {
  id: string;
  tmdbId: number;
  format: string;
  alertType: "price_drop" | "price_increase" | "threshold";
  thresholdPercent?: number;
  thresholdPrice?: number;
  isActive: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convertit les centimes en euros formatés
 */
export const formatPrice = (cents: number | null | undefined, currency = "EUR"): string => {
  if (cents === null || cents === undefined) return "—";
  const euros = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(euros);
};

/**
 * Convertit les euros en centimes
 */
export const eurosToCents = (euros: number): number => Math.round(euros * 100);

/**
 * Convertit les centimes en euros
 */
export const centsToEuros = (cents: number): number => cents / 100;

/**
 * Calcule le pourcentage de profit/perte
 */
export const calculateProfitPercent = (purchase: number, market: number): number => {
  if (purchase === 0) return 0;
  return Math.round(((market - purchase) / purchase) * 100);
};

// ============================================
// Price Lookup
// ============================================

/**
 * Recherche le prix d'un film sur le marché
 */
export const lookupPrice = async (
  tmdbId: number,
  title: string,
  format: string,
  year?: number,
  region = "FR"
): Promise<PriceData | null> => {
  try {
    console.log(`[PriceService] Looking up price for: ${title} (${format})`);

    const { data, error } = await supabase.functions.invoke("price-lookup", {
      body: { 
        tmdb_id: tmdbId, 
        title, 
        format, 
        year,
        region,
      },
    });

    if (error) {
      console.error("[PriceService] Edge function error:", error);
      return null;
    }

    if (!data.success || !data.price) {
      console.log("[PriceService] No price found");
      return null;
    }

    return {
      ...data.price,
      source: data.source,
      cached: data.cached,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[PriceService] Lookup error:", error);
    return null;
  }
};

/**
 * Recherche les prix pour plusieurs films en batch
 */
export const lookupPricesBatch = async (
  items: Array<{ tmdbId: number; title: string; format: string; year?: number }>
): Promise<Map<string, PriceData>> => {
  const results = new Map<string, PriceData>();

  // Process in parallel with rate limiting (5 concurrent)
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      const price = await lookupPrice(item.tmdbId, item.title, item.format, item.year);
      const key = `${item.tmdbId}-${item.format}`;
      if (price) {
        results.set(key, price);
      }
    });
    await Promise.all(promises);
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
};

// ============================================
// Price Cache (Supabase)
// ============================================

/**
 * Récupère le prix depuis le cache Supabase
 */
export const getCachedPrice = async (
  tmdbId: number,
  format: string,
  region = "FR"
): Promise<PriceData | null> => {
  try {
    const { data, error } = await supabase
      .from("price_cache")
      .select("*")
      .eq("tmdb_id", tmdbId)
      .eq("format", format)
      .eq("region", region)
      .gt("expires_at", new Date().toISOString())
      .single<PriceCache>();

    if (error || !data) return null;

    return {
      min: data.price_min,
      median: data.price_median,
      max: data.price_max,
      avg: data.price_avg,
      sampleSize: data.sample_size,
      soldCount: data.sold_count,
      lastSoldPrice: data.last_sold_price,
      lastSoldDate: data.last_sold_date,
      currency: "EUR",
      source: data.source,
      cached: true,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("[PriceService] Cache read error:", error);
    return null;
  }
};

/**
 * Récupère les prix cachés pour plusieurs films
 */
export const getCachedPricesBatch = async (
  items: Array<{ tmdbId: number; format: string }>,
  ignoreEstimates = true
): Promise<Map<string, PriceData>> => {
  const results = new Map<string, PriceData>();

  if (items.length === 0) return results;

  try {
    // Build query for all items - only get eBay prices (not estimates)
    let query = supabase
      .from("price_cache")
      .select("*")
      .gt("expires_at", new Date().toISOString());
    
    // Filter out estimates to force fresh eBay lookups
    if (ignoreEstimates) {
      query = query.eq("source", "ebay").gt("sample_size", 0);
    }
    
    const { data, error } = await query.returns<PriceCache[]>();

    if (error || !data) return results;

    // Filter and map results
    const itemSet = new Set(items.map(i => `${i.tmdbId}-${i.format}`));
    
    for (const cache of data) {
      const key = `${cache.tmdb_id}-${cache.format}`;
      if (itemSet.has(key) && cache.price_median) {
        results.set(key, {
          min: cache.price_min ?? cache.price_median,
          median: cache.price_median,
          max: cache.price_max ?? cache.price_median,
          avg: cache.price_avg ?? cache.price_median,
          sampleSize: cache.sample_size ?? 0,
          soldCount: cache.sold_count ?? 0,
          lastSoldPrice: cache.last_sold_price ?? undefined,
          lastSoldDate: cache.last_sold_date ?? undefined,
          currency: "EUR",
          source: cache.source ?? "ebay",
          cached: true,
          updatedAt: cache.updated_at ?? undefined,
        });
      }
    }

    return results;
  } catch (error) {
    console.error("[PriceService] Batch cache read error:", error);
    return results;
  }
};

// ============================================
// Price History
// ============================================

/**
 * Récupère l'historique des prix pour un film
 */
export const getPriceHistory = async (
  tmdbId: number,
  format: string,
  days = 30
): Promise<PriceHistoryPoint[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("price_history")
      .select("recorded_at, price_median, price_min, price_max")
      .eq("tmdb_id", tmdbId)
      .eq("format", format)
      .gte("recorded_at", startDate.toISOString().split("T")[0])
      .order("recorded_at", { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      date: row.recorded_at,
      priceMedian: row.price_median,
      priceMin: row.price_min,
      priceMax: row.price_max,
    }));
  } catch (error) {
    console.error("[PriceService] History fetch error:", error);
    return [];
  }
};

// ============================================
// Collection Valuation
// ============================================

/**
 * Calcule la valorisation complète d'une collection
 */
export const calculateCollectionValuation = async (
  userId: string,
  movies: Array<{
    tmdbId: number;
    title: string;
    format: string;
    posterPath?: string;
    purchasePrice?: number;
    releaseYear?: number;
  }>
): Promise<CollectionValuation> => {
  console.log(`[PriceService] Calculating valuation for ${movies.length} items`);

  // 1. Get cached prices first
  const cachedPrices = await getCachedPricesBatch(
    movies.map(m => ({ tmdbId: m.tmdbId, format: m.format }))
  );

  // 2. Find items needing lookup
  const needsLookup = movies.filter(m => !cachedPrices.has(`${m.tmdbId}-${m.format}`));
  
  // 3. Lookup missing prices (limit to avoid too many API calls)
  if (needsLookup.length > 0) {
    const lookupItems = needsLookup.slice(0, 20).map(m => ({
      tmdbId: m.tmdbId,
      title: m.title,
      format: m.format,
      year: m.releaseYear,
    }));
    
    const newPrices = await lookupPricesBatch(lookupItems);
    newPrices.forEach((price, key) => cachedPrices.set(key, price));
  }

  // 4. Calculate valuations
  const valuations: MovieValuation[] = movies.map(m => {
    const key = `${m.tmdbId}-${m.format}`;
    const marketPrice = cachedPrices.get(key);
    const purchaseCents = m.purchasePrice ? eurosToCents(m.purchasePrice) : undefined;

    let profitLoss: number | undefined;
    let profitLossPercent: number | undefined;

    if (purchaseCents && marketPrice) {
      profitLoss = marketPrice.median - purchaseCents;
      profitLossPercent = calculateProfitPercent(purchaseCents, marketPrice.median);
    }

    return {
      tmdbId: m.tmdbId,
      format: m.format,
      title: m.title,
      posterPath: m.posterPath,
      purchasePrice: purchaseCents,
      marketPrice,
      profitLoss,
      profitLossPercent,
    };
  });

  // 5. Calculate totals
  let totalValueMin = 0;
  let totalValueMedian = 0;
  let totalValueMax = 0;
  let totalPurchasePrice = 0;
  let itemsWithPrice = 0;
  let itemsWithoutPrice = 0;

  for (const v of valuations) {
    if (v.marketPrice) {
      totalValueMin += v.marketPrice.min;
      totalValueMedian += v.marketPrice.median;
      totalValueMax += v.marketPrice.max;
      itemsWithPrice++;
    } else {
      itemsWithoutPrice++;
    }
    if (v.purchasePrice) {
      totalPurchasePrice += v.purchasePrice;
    }
  }

  const profitLoss = totalValueMedian - totalPurchasePrice;
  const profitLossPercent = totalPurchasePrice > 0 
    ? calculateProfitPercent(totalPurchasePrice, totalValueMedian)
    : 0;

  // 6. Find top valued items
  const topValuedItems = [...valuations]
    .filter(v => v.marketPrice)
    .sort((a, b) => (b.marketPrice?.median || 0) - (a.marketPrice?.median || 0))
    .slice(0, 10);

  // 7. Find biggest gainers/losers
  const withProfit = valuations.filter(v => v.profitLossPercent !== undefined);
  
  const biggestGainers = [...withProfit]
    .sort((a, b) => (b.profitLossPercent || 0) - (a.profitLossPercent || 0))
    .filter(v => (v.profitLossPercent || 0) > 0)
    .slice(0, 5);

  const biggestLosers = [...withProfit]
    .sort((a, b) => (a.profitLossPercent || 0) - (b.profitLossPercent || 0))
    .filter(v => (v.profitLossPercent || 0) < 0)
    .slice(0, 5);

  // 8. Save to database
  await saveCollectionValuation(userId, {
    totalValueMin,
    totalValueMedian,
    totalValueMax,
    itemsWithPrice,
    itemsWithoutPrice,
    topValuedItems,
    biggestGainers,
  });

  return {
    totalValueMin,
    totalValueMedian,
    totalValueMax,
    totalPurchasePrice,
    profitLoss,
    profitLossPercent,
    itemsWithPrice,
    itemsWithoutPrice,
    topValuedItems,
    biggestGainers,
    biggestLosers,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Sauvegarde la valorisation dans la base
 */
const saveCollectionValuation = async (
  userId: string,
  data: Partial<CollectionValuation>
): Promise<void> => {
  try {
    const upsertData = {
      user_id: userId,
      total_value_min: data.totalValueMin,
      total_value_median: data.totalValueMedian,
      total_value_max: data.totalValueMax,
      items_with_price: data.itemsWithPrice,
      items_without_price: data.itemsWithoutPrice,
      top_valued_items: JSON.parse(JSON.stringify(data.topValuedItems || [])),
      biggest_gainers: JSON.parse(JSON.stringify(data.biggestGainers || [])),
      calculated_at: new Date().toISOString(),
    };
    
    await supabase
      .from("collection_valuations")
      .upsert([upsertData], {
        onConflict: "user_id",
      });
  } catch (error) {
    console.error("[PriceService] Save valuation error:", error);
  }
};

/**
 * Récupère la dernière valorisation sauvegardée
 */
export const getSavedValuation = async (userId: string): Promise<CollectionValuation | null> => {
  try {
    const { data, error } = await supabase
      .from("collection_valuations")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;

    return {
      totalValueMin: data.total_value_min,
      totalValueMedian: data.total_value_median,
      totalValueMax: data.total_value_max,
      totalPurchasePrice: 0, // Not stored
      profitLoss: 0,
      profitLossPercent: 0,
      itemsWithPrice: data.items_with_price,
      itemsWithoutPrice: data.items_without_price,
      topValuedItems: (data.top_valued_items as unknown as MovieValuation[]) || [],
      biggestGainers: (data.biggest_gainers as unknown as MovieValuation[]) || [],
      biggestLosers: [],
      lastUpdated: data.calculated_at,
    };
  } catch (error) {
    console.error("[PriceService] Load valuation error:", error);
    return null;
  }
};

// ============================================
// Price Alerts
// ============================================

/**
 * Crée une alerte de prix
 */
export const createPriceAlert = async (
  userId: string,
  tmdbId: number,
  format: string,
  alertType: PriceAlert["alertType"],
  threshold: number
): Promise<PriceAlert | null> => {
  try {
    const alertData: any = {
      user_id: userId,
      tmdb_id: tmdbId,
      format,
      alert_type: alertType,
      is_active: true,
    };

    if (alertType === "threshold") {
      alertData.threshold_price = threshold;
    } else {
      alertData.threshold_percent = threshold;
    }

    const { data, error } = await supabase
      .from("price_alerts")
      .insert(alertData)
      .select()
      .single();

    if (error) {
      console.error("[PriceService] Create alert error:", error);
      return null;
    }

    return {
      id: data.id,
      tmdbId: data.tmdb_id,
      format: data.format,
      alertType: data.alert_type as PriceAlert["alertType"],
      thresholdPercent: data.threshold_percent,
      thresholdPrice: data.threshold_price,
      isActive: data.is_active,
      triggeredAt: data.triggered_at,
      triggeredPrice: data.triggered_price,
    };
  } catch (error) {
    console.error("[PriceService] Create alert error:", error);
    return null;
  }
};

/**
 * Récupère les alertes de prix d'un utilisateur
 */
export const getUserPriceAlerts = async (userId: string): Promise<PriceAlert[]> => {
  try {
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map(row => ({
      id: row.id,
      tmdbId: row.tmdb_id,
      format: row.format,
      alertType: row.alert_type as PriceAlert["alertType"],
      thresholdPercent: row.threshold_percent,
      thresholdPrice: row.threshold_price,
      isActive: row.is_active,
      triggeredAt: row.triggered_at,
      triggeredPrice: row.triggered_price,
    }));
  } catch (error) {
    console.error("[PriceService] Get alerts error:", error);
    return [];
  }
};

/**
 * Supprime une alerte de prix
 */
export const deletePriceAlert = async (alertId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("price_alerts")
      .delete()
      .eq("id", alertId);

    return !error;
  } catch (error) {
    console.error("[PriceService] Delete alert error:", error);
    return false;
  }
};
