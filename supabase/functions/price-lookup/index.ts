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

// Cache pour le token eBay (évite de redemander à chaque requête)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtient un token d'accès eBay via OAuth2 Client Credentials
 */
async function getEbayAccessToken(): Promise<string> {
  // Vérifier le cache
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

  // Encode credentials for Basic Auth
  const credentials = btoa(`${appId}:${certId}`);

  const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[price-lookup] eBay auth failed:", response.status, errorText);
    throw new Error(`eBay authentication failed: ${response.status}`);
  }

  const tokenData: EbayAuthToken = await response.json();
  
  // Cache le token
  cachedToken = {
    token: tokenData.access_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000),
  };

  console.log("[price-lookup] Got new eBay token, expires in", tokenData.expires_in, "seconds");
  return tokenData.access_token;
}

/**
 * Recherche les prix sur eBay pour un titre de film
 */
async function searchEbayPrices(
  title: string,
  format: string,
  year?: number
): Promise<EbayPrice | null> {
  const token = await getEbayAccessToken();

  // Construire la requête de recherche
  const formatKeywords: Record<string, string> = {
    "4k": "4K UHD Blu-ray",
    "bluray": "Blu-ray",
    "dvd": "DVD",
    "vhs": "VHS",
    "laserdisc": "Laserdisc",
  };

  const formatQuery = formatKeywords[format.toLowerCase()] || format;
  const searchQuery = year 
    ? `${title} ${formatQuery} ${year}` 
    : `${title} ${formatQuery}`;

  console.log(`[price-lookup] Searching eBay for: "${searchQuery}"`);

  // 1. D'abord chercher les ventes terminées (sold items) via Browse API
  const browseUrl = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  browseUrl.searchParams.set("q", searchQuery);
  browseUrl.searchParams.set("category_ids", "617"); // Category: DVDs & Blu-ray Discs
  browseUrl.searchParams.set("filter", "buyingOptions:{FIXED_PRICE|AUCTION},conditionIds:{1000|1500|2000|2500|3000}"); // Various conditions
  browseUrl.searchParams.set("limit", "50");
  browseUrl.searchParams.set("sort", "price");

  const headers = {
    "Authorization": `Bearer ${token}`,
    "X-EBAY-C-MARKETPLACE-ID": "EBAY_FR", // Marché français
    "Content-Type": "application/json",
  };

  try {
    const browseResponse = await fetch(browseUrl.toString(), { headers });
    
    if (!browseResponse.ok) {
      const errorText = await browseResponse.text();
      console.error("[price-lookup] Browse API error:", browseResponse.status, errorText);
      
      // Essayer avec EBAY_US si FR ne fonctionne pas
      headers["X-EBAY-C-MARKETPLACE-ID"] = "EBAY_US";
      const usResponse = await fetch(browseUrl.toString(), { headers });
      
      if (!usResponse.ok) {
        console.error("[price-lookup] US Browse API also failed");
        return null;
      }
      
      return await processEbayResults(await usResponse.json(), "USD");
    }

    return await processEbayResults(await browseResponse.json(), "EUR");
  } catch (error) {
    console.error("[price-lookup] eBay search error:", error);
    return null;
  }
}

/**
 * Traite les résultats eBay et calcule les statistiques de prix
 */
async function processEbayResults(
  data: any,
  currency: string
): Promise<EbayPrice | null> {
  const items = data.itemSummaries || [];
  
  console.log(`[price-lookup] Found ${items.length} items on eBay`);

  if (items.length === 0) {
    return null;
  }

  // Extraire les prix (convertir en centimes)
  const prices: number[] = items
    .filter((item: any) => item.price?.value)
    .map((item: any) => {
      const value = parseFloat(item.price.value);
      // Convertir en centimes EUR (approximation si USD)
      const euroValue = item.price.currency === "USD" ? value * 0.92 : value;
      return Math.round(euroValue * 100);
    })
    .filter((price: number) => price > 0 && price < 100000) // Filtrer les prix aberrants (> 1000€)
    .sort((a: number, b: number) => a - b);

  if (prices.length === 0) {
    return null;
  }

  // Calculer les statistiques
  const min = prices[0];
  const max = prices[prices.length - 1];
  const median = prices[Math.floor(prices.length / 2)];
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  // Dernier vendu (premier item de la liste)
  const lastItem = items[0];
  const lastSoldPrice = lastItem?.price?.value 
    ? Math.round(parseFloat(lastItem.price.value) * 100) 
    : undefined;

  console.log(`[price-lookup] Price stats: min=${min/100}€, median=${median/100}€, max=${max/100}€, samples=${prices.length}`);

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
 * Sauvegarde le prix dans le cache Supabase
 */
async function cachePriceData(
  supabase: any,
  tmdbId: number,
  format: string,
  region: string,
  priceData: EbayPrice
): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Cache 7 jours

  try {
    await supabase.from("price_cache").upsert({
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
      source_url: "https://www.ebay.fr",
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "tmdb_id,format,region",
    });
    console.log("[price-lookup] Price cached successfully");
  } catch (error) {
    console.error("[price-lookup] Cache save error:", error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tmdb_id, title, format, year, region = "FR" } = await req.json();

    if (!tmdb_id || !title || !format) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[price-lookup] Request for: ${title} (${format}) tmdb:${tmdb_id}`);

    // Initialiser Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Vérifier le cache d'abord
    const { data: cachedPrice } = await supabase
      .from("price_cache")
      .select("*")
      .eq("tmdb_id", tmdb_id)
      .eq("format", format.toLowerCase())
      .eq("region", region)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (cachedPrice) {
      console.log("[price-lookup] Returning cached price");
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Rechercher sur eBay
    const ebayPrice = await searchEbayPrices(title, format, year);

    if (!ebayPrice) {
      // Pas de prix trouvé - retourner une estimation basée sur le format
      const estimates: Record<string, { min: number; median: number; max: number }> = {
        "4k": { min: 1500, median: 2500, max: 4500 },
        "bluray": { min: 500, median: 1200, max: 2500 },
        "dvd": { min: 200, median: 500, max: 1000 },
        "vhs": { min: 300, median: 800, max: 2000 },
        "laserdisc": { min: 1000, median: 2500, max: 5000 },
      };
      
      const est = estimates[format.toLowerCase()] || estimates.dvd;
      
      console.log("[price-lookup] No eBay results, returning estimate");
      return new Response(
        JSON.stringify({
          success: true,
          price: {
            min: est.min,
            median: est.median,
            max: est.max,
            avg: est.median,
            sampleSize: 0,
            soldCount: 0,
            currency: "EUR",
          },
          source: "estimate",
          cached: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Sauvegarder dans le cache
    await cachePriceData(supabase, tmdb_id, format, region, ebayPrice);

    // 4. Retourner le prix
    return new Response(
      JSON.stringify({
        success: true,
        price: ebayPrice,
        source: "ebay",
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[price-lookup] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Price lookup failed";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
