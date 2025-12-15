import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BarcodeProduct {
  ean: string;
  title: string;
  brand?: string;
  category?: string;
  description?: string;
  imageUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ean } = await req.json();

    if (!ean) {
      return new Response(
        JSON.stringify({ success: false, error: "EAN code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("BARCODE_LOOKUP_API_KEY");
    if (!apiKey) {
      console.error("[barcode-lookup] BARCODE_LOOKUP_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[barcode-lookup] Looking up EAN: ${ean}`);

    // Call Barcode Lookup API
    const apiUrl = `https://api.barcodelookup.com/v3/products?barcode=${ean}&formatted=y&key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    console.log(`[barcode-lookup] API response status: ${response.status}`);

    // Handle non-OK responses or empty body
    const responseText = await response.text();
    if (!responseText) {
      console.log(`[barcode-lookup] Empty response for EAN: ${ean}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Produit non trouvé dans la base de données" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[barcode-lookup] Failed to parse response: ${responseText.substring(0, 200)}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Produit non trouvé dans la base de données" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok || !data.products || data.products.length === 0) {
      console.log(`[barcode-lookup] Product not found for EAN: ${ean}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Produit non trouvé dans la base de données" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiProduct = data.products[0];
    console.log(`[barcode-lookup] Found product: ${apiProduct.title || apiProduct.product_name}`);

    // Map API response to our format
    const product: BarcodeProduct = {
      ean: ean,
      title: apiProduct.title || apiProduct.product_name || "",
      brand: apiProduct.brand || apiProduct.manufacturer || "",
      category: apiProduct.category || "",
      description: apiProduct.description || "",
      imageUrl: apiProduct.images?.[0] || "",
    };

    return new Response(
      JSON.stringify({ success: true, product }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[barcode-lookup] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erreur lors de la recherche du code-barres" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
