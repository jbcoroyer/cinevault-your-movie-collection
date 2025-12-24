/**
 * CineVault - eBay Tracking Edge Function
 * 
 * Fonction Supabase Edge pour rechercher des annonces eBay
 * et créer des alertes pour les films en wishlist
 * 
 * À déployer dans: supabase/functions/ebay-tracker/index.ts
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// eBay API configuration
const EBAY_APP_ID = Deno.env.get('EBAY_APP_ID') || '';
const EBAY_API_URL = 'https://api.ebay.com/buy/browse/v1';

interface WishlistItem {
  id: string;
  user_id: string;
  tmdb_id: number;
  title: string;
  desired_formats: string[];
  max_price: number | null;
  ebay_tracking_enabled: boolean;
}

interface EbayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  condition: string;
  image?: {
    imageUrl: string;
  };
  itemWebUrl: string;
  seller?: {
    username: string;
    feedbackScore: number;
  };
  shippingOptions?: Array<{
    shippingCost: {
      value: string;
    };
  }>;
  itemLocation?: {
    country: string;
  };
  itemEndDate?: string;
  buyingOptions?: string[];
}

// Format keywords for eBay search
const formatKeywords: Record<string, string[]> = {
  dvd: ['dvd'],
  bluray: ['blu-ray', 'bluray', 'blu ray'],
  '4k': ['4k', 'uhd', '4k uhd', 'ultra hd'],
  steelbook: ['steelbook', 'steel book'],
  collector: ['collector', 'coffret', 'edition collector', 'limited edition'],
};

// Get eBay OAuth token
async function getEbayToken(): Promise<string | null> {
  try {
    const credentials = btoa(`${EBAY_APP_ID}:${Deno.env.get('EBAY_CERT_ID')}`);
    
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
    });

    if (!response.ok) {
      console.error('Failed to get eBay token:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting eBay token:', error);
    return null;
  }
}

// Search eBay for a movie
async function searchEbay(
  token: string,
  title: string,
  formats: string[],
  maxPrice?: number | null
): Promise<EbayItem[]> {
  try {
    // Build format query
    const formatQueries = formats.flatMap(f => formatKeywords[f] || [f]);
    const formatQuery = formatQueries.join(' OR ');
    
    // Build search query
    const query = encodeURIComponent(`${title} (${formatQuery})`);
    
    // Build filter
    let filter = 'itemLocationCountry:FR,DE,BE,NL,ES,IT,GB';
    if (maxPrice) {
      filter += `,price:[..${maxPrice / 100}],priceCurrency:EUR`;
    }

    const url = `${EBAY_API_URL}/item_summary/search?q=${query}&filter=${filter}&category_ids=617&limit=10&sort=newlyListed`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_FR',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('eBay search failed:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.itemSummaries || [];
  } catch (error) {
    console.error('Error searching eBay:', error);
    return [];
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, wishlistId } = await req.json();

    switch (action) {
      case 'search_single': {
        // Search for a single wishlist item
        if (!wishlistId) {
          return new Response(
            JSON.stringify({ error: 'wishlistId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get wishlist item
        const { data: item, error } = await supabase
          .from('wishlist')
          .select('*')
          .eq('id', wishlistId)
          .single();

        if (error || !item) {
          return new Response(
            JSON.stringify({ error: 'Wishlist item not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get eBay token
        const token = await getEbayToken();
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Failed to authenticate with eBay' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Search eBay
        const results = await searchEbay(
          token,
          item.title,
          item.desired_formats,
          item.max_price
        );

        // Save new alerts
        const newAlerts = [];
        for (const ebayItem of results) {
          // Check if alert already exists
          const { data: existing } = await supabase
            .from('ebay_alerts')
            .select('id')
            .eq('user_id', item.user_id)
            .eq('ebay_item_id', ebayItem.itemId)
            .single();

          if (!existing) {
            const alert = {
              user_id: item.user_id,
              wishlist_id: item.id,
              ebay_item_id: ebayItem.itemId,
              title: ebayItem.title,
              price_cents: Math.round(parseFloat(ebayItem.price.value) * 100),
              currency: ebayItem.price.currency,
              condition: ebayItem.condition || null,
              image_url: ebayItem.image?.imageUrl || null,
              item_url: ebayItem.itemWebUrl,
              seller_name: ebayItem.seller?.username || null,
              seller_feedback_score: ebayItem.seller?.feedbackScore || null,
              shipping_cost_cents: ebayItem.shippingOptions?.[0]?.shippingCost 
                ? Math.round(parseFloat(ebayItem.shippingOptions[0].shippingCost.value) * 100)
                : null,
              location: ebayItem.itemLocation?.country || null,
              end_time: ebayItem.itemEndDate || null,
              is_auction: ebayItem.buyingOptions?.includes('AUCTION') || false,
            };

            const { data: inserted } = await supabase
              .from('ebay_alerts')
              .insert(alert)
              .select()
              .single();

            if (inserted) {
              newAlerts.push(inserted);
            }
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            resultsFound: results.length,
            newAlerts: newAlerts.length,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search_all': {
        // Search for all tracked wishlist items (for cron job)
        const { data: items, error } = await supabase
          .from('wishlist')
          .select('*')
          .eq('ebay_tracking_enabled', true);

        if (error || !items || items.length === 0) {
          return new Response(
            JSON.stringify({ success: true, message: 'No items to track' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get eBay token
        const token = await getEbayToken();
        if (!token) {
          return new Response(
            JSON.stringify({ error: 'Failed to authenticate with eBay' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let totalNewAlerts = 0;

        for (const item of items) {
          const results = await searchEbay(
            token,
            item.title,
            item.desired_formats,
            item.max_price
          );

          for (const ebayItem of results) {
            const { data: existing } = await supabase
              .from('ebay_alerts')
              .select('id')
              .eq('user_id', item.user_id)
              .eq('ebay_item_id', ebayItem.itemId)
              .single();

            if (!existing) {
              await supabase.from('ebay_alerts').insert({
                user_id: item.user_id,
                wishlist_id: item.id,
                ebay_item_id: ebayItem.itemId,
                title: ebayItem.title,
                price_cents: Math.round(parseFloat(ebayItem.price.value) * 100),
                currency: ebayItem.price.currency,
                condition: ebayItem.condition || null,
                image_url: ebayItem.image?.imageUrl || null,
                item_url: ebayItem.itemWebUrl,
                seller_name: ebayItem.seller?.username || null,
                seller_feedback_score: ebayItem.seller?.feedbackScore || null,
                shipping_cost_cents: ebayItem.shippingOptions?.[0]?.shippingCost
                  ? Math.round(parseFloat(ebayItem.shippingOptions[0].shippingCost.value) * 100)
                  : null,
                location: ebayItem.itemLocation?.country || null,
                end_time: ebayItem.itemEndDate || null,
                is_auction: ebayItem.buyingOptions?.includes('AUCTION') || false,
              });
              totalNewAlerts++;
            }
          }

          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Create notifications for users with new alerts
        if (totalNewAlerts > 0) {
          // Group by user
          const userAlerts = new Map<string, number>();
          for (const item of items) {
            const count = userAlerts.get(item.user_id) || 0;
            userAlerts.set(item.user_id, count + 1);
          }

          for (const [userId, count] of userAlerts) {
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'ebay_alert',
              title: '🔔 Nouvelles annonces eBay',
              message: `${count} nouvelle${count > 1 ? 's' : ''} annonce${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''} pour votre wishlist !`,
              metadata: { type: 'ebay_alert', count },
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            itemsSearched: items.length,
            newAlerts: totalNewAlerts,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[eBay Tracker] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
