/**
 * CineVault - Price Lookup Edge Function
 *
 * Edge Function pour la recherche de prix eBay
 *
 * CORRECTIONS:
 * - Nettoyage intelligent du titre
 * - Variantes de recherche multiples
 * - Catégorie eBay Films
 * - Cache des estimations
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EbayPrice {
  min: number;
  median: number;
  max: number;
  avg: number;
  sampleSize: number;
  soldCount: number;
  lastSoldPrice?: number;
  lastSoldDate?: string;
  currency: string;
  source: string;
}

interface EbayAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Cache pour le token eBay
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtient un token d'accès eBay via OAuth2
 */
async function getEbayAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    console.log("[price-lookup] Using cached eBay token");
    return cachedToken.token;
  }

  const appId = Deno.env.get("EBAY_APP_ID");
  const certId = Deno.env.get("EBAY_CERT_ID");

  if (!appId || !certId) {
    throw new Error("eBay credentials not configured");
  }

  console.log("[price-lookup] Requesting new eBay OAuth token...");

  const credentials = btoa(`${appId}:${certId}`);

  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[price-lookup] eBay auth failed:", response.status, errorText);
    throw new Error(`eBay authentication failed: ${response.status}`);
  }

  const tokenData: EbayAuthToken = await response.json();

  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
  };

  console.log("[price-lookup] Got new eBay token, expires in", tokenData.expires_in, "seconds");
  return tokenData.access_token;
}

// ============================================
// NOUVEAU: Nettoyage du titre
// ============================================

/**
 * Nettoie le titre pour la recherche eBay
 */
function cleanTitleForSearch(title: string): string {
  return (
    title
      // Supprimer les éditions spéciales
      .replace(
        /\s*[-–:]\s*(Édition|Edition|Version|Collector|Steelbook|Director'?s?\s*Cut|Extended|Ultimate|Special|Deluxe|Limited|Premium|Digibook|Digipack|Combo|Pack).*/gi,
        "",
      )
      // Supprimer les mentions de format
      .replace(/\s*(4K|UHD|Ultra\s*HD|Blu-?ray|DVD|VHS|3D)\s*/gi, "")
      // Supprimer les parenthèses
      .replace(/\s*\([^)]*\)/g, "")
      // Supprimer les crochets
      .replace(/\s*\[[^\]]*\]/g, "")
      // Supprimer les caractères spéciaux
      .replace(/[&+]/g, " ")
      // Supprimer les guillemets
      .replace(/["""'']/g, "")
      // Supprimer les deux-points avec sous-titre long
      .replace(/:\s*.{20,}$/, "")
      // Normaliser les espaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Génère des variantes de recherche
 */
function generateSearchVariants(title: string, format: string): string[] {
  const cleanTitle = cleanTitleForSearch(title);

  const formatKeywords: Record<string, string[]> = {
    "4k": ["4K UHD", "4K", "Ultra HD"],
    bluray: ["Blu-ray", "Bluray", "BR"],
    dvd: ["DVD"],
    steelbook: ["Steelbook", "Steel Book"],
    collector: ["Collector", "Coffret"],
  };

  const formats = formatKeywords[format.toLowerCase()] || [format];
  const variants: string[] = [];

  // Titre + format principal
  variants.push(`${cleanTitle} ${formats[0]}`);

  // Titre + "film" + format
  variants.push(`${cleanTitle} film ${formats[0]}`);

  // Premiers mots si titre long
  const words = cleanTitle.split(" ");
  if (words.length > 3) {
    variants.push(`${words.slice(0, 3).join(" ")} ${formats[0]}`);
  }

  // Format alternatif
  if (formats.length > 1) {
    variants.push(`${cleanTitle} ${formats[1]}`);
  }

  return variants;
}

/**
 * Recherche les prix sur eBay
 */
async function searchEbayPrices(title: string, format: string, year?: number): Promise<EbayPrice | null> {
  const token = await getEbayAccessToken();

  const searchVariants = generateSearchVariants(title, format);
  console.log(`[price-lookup] Will try ${searchVariants.length} search variants for "${title}"`);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR",
    "Content-Type": "application/json",
  };

  const marketplaces = ["EBAY_FR", "EBAY_DE"];

  for (const marketplace of marketplaces) {
    headers["X-EBAY-C-MARKETPLACE-ID"] = marketplace;

    for (const searchQuery of searchVariants) {
      console.log(`[price-lookup] Trying: "${searchQuery}" on ${marketplace}`);

      const browseUrl = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
      browseUrl.searchParams.set("q", searchQuery);
      browseUrl.searchParams.set("category_ids", "617"); // Catégorie Films
      browseUrl.searchParams.set("limit", "50");
      browseUrl.searchParams.set("sort", "price");

      try {
        const response = await fetch(browseUrl.toString(), { headers });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[price-lookup] ${marketplace} error:`, response.status, errorText.substring(0, 100));
          continue;
        }

        const data = await response.json();
        const items = data.itemSummaries || [];

        console.log(`[price-lookup] ${marketplace} returned ${items.length} items`);

        if (items.length >= 3) {
          const result = await processEbayResults(data, marketplace === "EBAY_US" ? "USD" : "EUR");
          if (result) {
            console.log(`[price-lookup] SUCCESS: Found prices for "${title}" - median: ${result.median / 100}€`);
            return result;
          }
        }
      } catch (error) {
        console.error(`[price-lookup] ${marketplace} fetch error:`, error);
        continue;
      }
    }
  }

  // Dernier essai: recherche large sans catégorie
  console.log("[price-lookup] Trying broader search without category filter...");
  const broadQuery = cleanTitleForSearch(title);

  for (const marketplace of marketplaces) {
    headers["X-EBAY-C-MARKETPLACE-ID"] = marketplace;

    const browseUrl = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    browseUrl.searchParams.set("q", broadQuery);
    browseUrl.searchParams.set("limit", "30");

    try {
      const response = await fetch(browseUrl.toString(), { headers });
      if (response.ok) {
        const data = await response.json();
        const items = data.itemSummaries || [];

        if (items.length >= 5) {
          const result = await processEbayResults(data, marketplace === "EBAY_US" ? "USD" : "EUR");
          if (result) {
            console.log(`[price-lookup] Broad search SUCCESS for "${title}"`);
            return result;
          }
        }
      }
    } catch {
      continue;
    }
  }

  console.log(`[price-lookup] No results found for "${title}"`);
  return null;
}

/**
 * Traite les résultats eBay
 */
async function processEbayResults(data: any, currency: string): Promise<EbayPrice | null> {
  const items = data.itemSummaries || [];

  if (items.length === 0) {
    return null;
  }

  const prices: number[] = items
    .filter((item: any) => item.price?.value)
    .map((item: any) => {
      const value = parseFloat(item.price.value);
      const euroValue = item.price.currency === "USD" ? value * 0.92 : value;
      return Math.round(euroValue * 100);
    })
    .filter((price: number) => price >= 100 && price <= 50000) // 1€ - 500€
    .sort((a: number, b: number) => a - b);

  if (prices.length < 3) {
    console.log(`[price-lookup] Not enough valid prices (${prices.length})`);
    return null;
  }

  const min = prices[0];
  const max = prices[prices.length - 1];
  const median = prices[Math.floor(prices.length / 2)];
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  const lastItem = items[0];
  const lastSoldPrice = lastItem?.price?.value ? Math.round(parseFloat(lastItem.price.value) * 100) : undefined;

  console.log(
    `[price-lookup] Price stats: min=${min / 100}€, median=${median / 100}€, max=${max / 100}€, samples=${prices.length}`,
  );

  return {
    min,
    median,
    max,
    avg,
    sampleSize: prices.length,
    soldCount: items.length,
    lastSoldPrice,
    lastSoldDate: new Date().toISOString().split("T")[0],
    currency: "EUR",
    source: "ebay",
  };
}

/**
 * Sauvegarde le prix dans le cache
 */
async function cachePriceData(
  supabase: any,
  tmdbId: number,
  format: string,
  region: string,
  priceData: EbayPrice,
  isEstimate = false,
): Promise<void> {
  const expiresAt = new Date();

  // Estimations: 24h, Prix réels: 7 jours
  if (isEstimate) {
    expiresAt.setHours(expiresAt.getHours() + 24);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  try {
    await supabase.from("price_cache").upsert(
      {
        tmdb_id: tmdbId,
        format: format.toLowerCase(),
        region,
        price_min: priceData.min,
        price_median: priceData.median,
        price_max: priceData.max,
        price_avg: priceData.avg,
        sample_size: priceData.sampleSize,
        sold_count: priceData.soldCount,
        last_sold_price: priceData.lastSoldPrice,
        last_sold_date: priceData.lastSoldDate,
        source: priceData.source,
        source_url: isEstimate ? null : "https://www.ebay.fr",
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "tmdb_id,format,region",
      },
    );
    console.log(`[price-lookup] ${isEstimate ? "Estimate" : "Price"} cached (expires: ${isEstimate ? "24h" : "7d"})`);
  } catch (error) {
    console.error("[price-lookup] Cache save error:", error);
  }
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tmdb_id, title, format, year, region = "FR" } = await req.json();

    if (!tmdb_id || !title || !format) {
      return new Response(JSON.stringify({ success: false, error: "Missing required parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[price-lookup] Request for: "${title}" (${format}) tmdb:${tmdb_id}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Vérifier le cache (seulement prix eBay réels)
    const { data: cachedPrice } = await supabase
      .from("price_cache")
      .select("*")
      .eq("tmdb_id", tmdb_id)
      .eq("format", format.toLowerCase())
      .eq("region", region)
      .eq("source", "ebay")
      .gt("sample_size", 0)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cachedPrice) {
      console.log("[price-lookup] Returning cached eBay price");
      return new Response(
        JSON.stringify({
          success: true,
          price: {
            min: cachedPrice.price_min,
            median: cachedPrice.price_median,
            max: cachedPrice.price_max,
            avg: cachedPrice.price_avg,
            sampleSize: cachedPrice.sample_size,
            soldCount: cachedPrice.sold_count,
            lastSoldPrice: cachedPrice.last_sold_price,
            lastSoldDate: cachedPrice.last_sold_date,
            currency: "EUR",
          },
          source: cachedPrice.source,
          cached: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("[price-lookup] No valid cache, calling eBay API...");

    // 2. Rechercher sur eBay
    const ebayPrice = await searchEbayPrices(title, format, year);

    if (!ebayPrice) {
      // Pas de prix trouvé - retourner une estimation
      const estimates: Record<string, { min: number; median: number; max: number }> = {
        "4k": { min: 1500, median: 2500, max: 4500 },
        bluray: { min: 500, median: 1200, max: 2500 },
        dvd: { min: 200, median: 500, max: 1000 },
        steelbook: { min: 2000, median: 3500, max: 6000 },
        collector: { min: 2500, median: 4500, max: 10000 },
      };

      const est = estimates[format.toLowerCase()] || estimates.dvd;

      const estimateData: EbayPrice = {
        min: est.min,
        median: est.median,
        max: est.max,
        avg: est.median,
        sampleSize: 0,
        soldCount: 0,
        currency: "EUR",
        source: "estimate",
      };

      // Cache l'estimation
      await cachePriceData(supabase, tmdb_id, format, region, estimateData, true);

      console.log(`[price-lookup] No eBay results for "${title}", returning estimate: ${est.median / 100}€`);

      return new Response(
        JSON.stringify({
          success: true,
          price: estimateData,
          source: "estimate",
          cached: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Sauvegarder dans le cache
    await cachePriceData(supabase, tmdb_id, format, region, ebayPrice, false);

    // 4. Retourner le prix
    return new Response(
      JSON.stringify({
        success: true,
        price: ebayPrice,
        source: "ebay",
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[price-lookup] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Price lookup failed";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
