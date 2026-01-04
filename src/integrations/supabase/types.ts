export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          movie_poster_path: string | null
          movie_title: string
          tmdb_id: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          movie_poster_path?: string | null
          movie_title: string
          tmdb_id: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          movie_poster_path?: string | null
          movie_title?: string
          tmdb_id?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          base_rarity: string | null
          category: string
          created_at: string | null
          criteria: Json
          description: string
          icon_name: string
          id: string
          title: string
          xp_reward: number | null
        }
        Insert: {
          base_rarity?: string | null
          category: string
          created_at?: string | null
          criteria: Json
          description: string
          icon_name: string
          id: string
          title: string
          xp_reward?: number | null
        }
        Update: {
          base_rarity?: string | null
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          icon_name?: string
          id?: string
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      badge_showcase: {
        Row: {
          badge_id: string
          created_at: string
          id: string
          slot: number
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          id?: string
          slot: number
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          id?: string
          slot?: number
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string | null
          id: string
          listing_id: string
          price_cents_at_add: number
          shipping_cents_at_add: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          listing_id: string
          price_cents_at_add: number
          shipping_cents_at_add?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          listing_id?: string
          price_cents_at_add?: number
          shipping_cents_at_add?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_valuations: {
        Row: {
          biggest_gainers: Json | null
          calculated_at: string | null
          id: string
          items_with_price: number | null
          items_without_price: number | null
          top_valued_items: Json | null
          total_value_max: number | null
          total_value_median: number | null
          total_value_min: number | null
          user_id: string
        }
        Insert: {
          biggest_gainers?: Json | null
          calculated_at?: string | null
          id?: string
          items_with_price?: number | null
          items_without_price?: number | null
          top_valued_items?: Json | null
          total_value_max?: number | null
          total_value_median?: number | null
          total_value_min?: number | null
          user_id: string
        }
        Update: {
          biggest_gainers?: Json | null
          calculated_at?: string | null
          id?: string
          items_with_price?: number | null
          items_without_price?: number | null
          top_valued_items?: Json | null
          total_value_max?: number | null
          total_value_median?: number | null
          total_value_min?: number | null
          user_id?: string
        }
        Relationships: []
      }
      companies_metadata: {
        Row: {
          description: string | null
          headquarters: string | null
          homepage: string | null
          id: number
          logo_path: string | null
          name: string
          origin_country: string | null
          parent_company_id: number | null
          parent_company_name: string | null
          updated_at: string
        }
        Insert: {
          description?: string | null
          headquarters?: string | null
          homepage?: string | null
          id: number
          logo_path?: string | null
          name: string
          origin_country?: string | null
          parent_company_id?: number | null
          parent_company_name?: string | null
          updated_at?: string
        }
        Update: {
          description?: string | null
          headquarters?: string | null
          homepage?: string | null
          id?: number
          logo_path?: string | null
          name?: string
          origin_country?: string | null
          parent_company_id?: number | null
          parent_company_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_bonuses: {
        Row: {
          bonus_type: string
          claimed_date: string
          created_at: string | null
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          bonus_type?: string
          claimed_date?: string
          created_at?: string | null
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          bonus_type?: string
          claimed_date?: string
          created_at?: string | null
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_bonuses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          created_at: string | null
          description: string | null
          dispute_id: string
          evidence_type: string
          file_url: string
          id: string
          submitted_by: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dispute_id: string
          evidence_type: string
          file_url: string
          id?: string
          submitted_by: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dispute_id?: string
          evidence_type?: string
          file_url?: string
          id?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          dispute_id: string
          id: string
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          dispute_id: string
          id?: string
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          dispute_id?: string
          id?: string
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          buyer_id: string
          created_at: string | null
          description: string
          disputed_amount_cents: number
          escalated_at: string | null
          escalation_deadline: string | null
          escalation_reason: string | null
          id: string
          metadata: Json | null
          order_id: string
          order_item_id: string | null
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_amount_cents: number | null
          resolution_notes: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          seller_responded_at: string | null
          seller_response: string | null
          seller_response_deadline: string | null
          status: Database["public"]["Enums"]["dispute_status"] | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string | null
          description: string
          disputed_amount_cents: number
          escalated_at?: string | null
          escalation_deadline?: string | null
          escalation_reason?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          order_item_id?: string | null
          reason: Database["public"]["Enums"]["dispute_reason"]
          resolution_amount_cents?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id: string
          seller_responded_at?: string | null
          seller_response?: string | null
          seller_response_deadline?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string | null
          description?: string
          disputed_amount_cents?: number
          escalated_at?: string | null
          escalation_deadline?: string | null
          escalation_reason?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          order_item_id?: string | null
          reason?: Database["public"]["Enums"]["dispute_reason"]
          resolution_amount_cents?: number | null
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id?: string
          seller_responded_at?: string | null
          seller_response?: string | null
          seller_response_deadline?: string | null
          status?: Database["public"]["Enums"]["dispute_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ebay_alerts: {
        Row: {
          condition: string | null
          created_at: string | null
          currency: string | null
          ebay_item_id: string
          end_time: string | null
          id: string
          image_url: string | null
          is_auction: boolean | null
          is_dismissed: boolean | null
          is_seen: boolean | null
          item_url: string
          location: string | null
          price_cents: number
          seller_feedback_score: number | null
          seller_name: string | null
          shipping_cost_cents: number | null
          title: string
          user_id: string
          wishlist_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          ebay_item_id: string
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_auction?: boolean | null
          is_dismissed?: boolean | null
          is_seen?: boolean | null
          item_url: string
          location?: string | null
          price_cents: number
          seller_feedback_score?: number | null
          seller_name?: string | null
          shipping_cost_cents?: number | null
          title: string
          user_id: string
          wishlist_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          currency?: string | null
          ebay_item_id?: string
          end_time?: string | null
          id?: string
          image_url?: string | null
          is_auction?: boolean | null
          is_dismissed?: boolean | null
          is_seen?: boolean | null
          item_url?: string
          location?: string | null
          price_cents?: number
          seller_feedback_score?: number | null
          seller_name?: string | null
          shipping_cost_cents?: number | null
          title?: string
          user_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ebay_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ebay_alerts_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlist"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_follows: {
        Row: {
          created_at: string
          entity_id: number
          entity_image_path: string | null
          entity_name: string
          entity_role: string | null
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: number
          entity_image_path?: string | null
          entity_name: string
          entity_role?: string | null
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: number
          entity_image_path?: string | null
          entity_name?: string
          entity_role?: string | null
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_badges: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string
          event_id: string
          icon_name: string
          id: string
          rarity: string
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description: string
          event_id: string
          icon_name: string
          id: string
          rarity?: string
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string
          event_id?: string
          icon_name?: string
          id?: string
          rarity?: string
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_badges_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "seasonal_events"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          added_at: string
          id: string
          list_id: string
          position: number
          poster_path: string | null
          title: string
          tmdb_id: number
        }
        Insert: {
          added_at?: string
          id?: string
          list_id: string
          position?: number
          poster_path?: string | null
          title: string
          tmdb_id: number
        }
        Update: {
          added_at?: string
          id?: string
          list_id?: string
          position?: number
          poster_path?: string | null
          title?: string
          tmdb_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          listing_id: string
          position: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          listing_id: string
          position?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          listing_id?: string
          position?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accepts_colissimo: boolean | null
          accepts_hand_delivery: boolean | null
          accepts_mondial_relay: boolean | null
          condition: Database["public"]["Enums"]["listing_condition"]
          condition_notes: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          edition: string | null
          expires_at: string | null
          favorites_count: number | null
          featured: boolean | null
          format: string
          id: string
          includes_booklet: boolean | null
          includes_slipcover: boolean | null
          is_sealed: boolean | null
          movie_poster_path: string | null
          movie_release_year: number | null
          movie_title: string
          original_price_cents: number | null
          price_cents: number
          published_at: string | null
          region_code: string | null
          seller_id: string
          shipping_domestic_cents: number | null
          shipping_eu_cents: number | null
          shipping_from_city: string | null
          shipping_from_country: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          tmdb_id: number
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          accepts_colissimo?: boolean | null
          accepts_hand_delivery?: boolean | null
          accepts_mondial_relay?: boolean | null
          condition: Database["public"]["Enums"]["listing_condition"]
          condition_notes?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          edition?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          featured?: boolean | null
          format: string
          id?: string
          includes_booklet?: boolean | null
          includes_slipcover?: boolean | null
          is_sealed?: boolean | null
          movie_poster_path?: string | null
          movie_release_year?: number | null
          movie_title: string
          original_price_cents?: number | null
          price_cents: number
          published_at?: string | null
          region_code?: string | null
          seller_id: string
          shipping_domestic_cents?: number | null
          shipping_eu_cents?: number | null
          shipping_from_city?: string | null
          shipping_from_country?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          tmdb_id: number
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          accepts_colissimo?: boolean | null
          accepts_hand_delivery?: boolean | null
          accepts_mondial_relay?: boolean | null
          condition?: Database["public"]["Enums"]["listing_condition"]
          condition_notes?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          edition?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          featured?: boolean | null
          format?: string
          id?: string
          includes_booklet?: boolean | null
          includes_slipcover?: boolean | null
          is_sealed?: boolean | null
          movie_poster_path?: string | null
          movie_release_year?: number | null
          movie_title?: string
          original_price_cents?: number | null
          price_cents?: number
          published_at?: string | null
          region_code?: string | null
          seller_id?: string
          shipping_domestic_cents?: number | null
          shipping_eu_cents?: number | null
          shipping_from_city?: string | null
          shipping_from_country?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          tmdb_id?: number
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      movies_metadata: {
        Row: {
          director_id: number | null
          director_name: string | null
          genres: Json | null
          poster_path: string | null
          release_year: number | null
          title: string
          tmdb_id: number
          updated_at: string | null
        }
        Insert: {
          director_id?: number | null
          director_name?: string | null
          genres?: Json | null
          poster_path?: string | null
          release_year?: number | null
          title: string
          tmdb_id: number
          updated_at?: string | null
        }
        Update: {
          director_id?: number | null
          director_name?: string | null
          genres?: Json | null
          poster_path?: string | null
          release_year?: number | null
          title?: string
          tmdb_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          badges: boolean | null
          challenges: boolean | null
          comments: boolean | null
          created_at: string
          email_notifications: boolean | null
          id: string
          likes: boolean | null
          new_followers: boolean | null
          price_alerts: boolean | null
          push_notifications: boolean | null
          system: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          badges?: boolean | null
          challenges?: boolean | null
          comments?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          likes?: boolean | null
          new_followers?: boolean | null
          price_alerts?: boolean | null
          push_notifications?: boolean | null
          system?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          badges?: boolean | null
          challenges?: boolean | null
          comments?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          likes?: boolean | null
          new_followers?: boolean | null
          price_alerts?: boolean | null
          push_notifications?: boolean | null
          system?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at: string | null
          delivered_at: string | null
          format: string
          id: string
          listing_id: string
          movie_title: string
          order_id: string
          price_cents: number
          seller_id: string
          seller_payout_cents: number
          shipped_at: string | null
          shipping_cents: number
          status: Database["public"]["Enums"]["order_item_status"] | null
          tracking_carrier: string | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
        }
        Insert: {
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at?: string | null
          delivered_at?: string | null
          format: string
          id?: string
          listing_id: string
          movie_title: string
          order_id: string
          price_cents: number
          seller_id: string
          seller_payout_cents: number
          shipped_at?: string | null
          shipping_cents: number
          status?: Database["public"]["Enums"]["order_item_status"] | null
          tracking_carrier?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["listing_condition"]
          created_at?: string | null
          delivered_at?: string | null
          format?: string
          id?: string
          listing_id?: string
          movie_title?: string
          order_id?: string
          price_cents?: number
          seller_id?: string
          seller_payout_cents?: number
          shipped_at?: string | null
          shipping_cents?: number
          status?: Database["public"]["Enums"]["order_item_status"] | null
          tracking_carrier?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          buyer_notes: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          id: string
          order_number: string
          paid_at: string | null
          platform_fee_cents: number
          relay_point_address: string | null
          relay_point_id: string | null
          relay_point_name: string | null
          shipped_at: string | null
          shipping_address_line1: string
          shipping_address_line2: string | null
          shipping_cents: number
          shipping_city: string
          shipping_country: string
          shipping_name: string
          shipping_phone: string | null
          shipping_postal_code: string
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          buyer_notes?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          order_number: string
          paid_at?: string | null
          platform_fee_cents: number
          relay_point_address?: string | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          shipped_at?: string | null
          shipping_address_line1: string
          shipping_address_line2?: string | null
          shipping_cents: number
          shipping_city: string
          shipping_country?: string
          shipping_name: string
          shipping_phone?: string | null
          shipping_postal_code: string
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          total_cents: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_notes?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          id?: string
          order_number?: string
          paid_at?: string | null
          platform_fee_cents?: number
          relay_point_address?: string | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          shipped_at?: string | null
          shipping_address_line1?: string
          shipping_address_line2?: string | null
          shipping_cents?: number
          shipping_city?: string
          shipping_country?: string
          shipping_name?: string
          shipping_phone?: string | null
          shipping_postal_code?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_movies: {
        Row: {
          condition: string | null
          created_at: string | null
          format: string
          id: string
          notes: string | null
          price: number | null
          purchase_date: string | null
          tmdb_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          format: string
          id?: string
          notes?: string | null
          price?: number | null
          purchase_date?: string | null
          tmdb_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          format?: string
          id?: string
          notes?: string | null
          price?: number | null
          purchase_date?: string | null
          tmdb_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          format: string
          id: string
          is_active: boolean | null
          threshold_percent: number | null
          threshold_price: number | null
          tmdb_id: number
          triggered_at: string | null
          triggered_price: number | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          format: string
          id?: string
          is_active?: boolean | null
          threshold_percent?: number | null
          threshold_price?: number | null
          tmdb_id: number
          triggered_at?: string | null
          triggered_price?: number | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          format?: string
          id?: string
          is_active?: boolean | null
          threshold_percent?: number | null
          threshold_price?: number | null
          tmdb_id?: number
          triggered_at?: string | null
          triggered_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      price_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          format: string
          id: string
          last_sold_date: string | null
          last_sold_price: number | null
          price_avg: number | null
          price_max: number | null
          price_median: number | null
          price_min: number | null
          raw_data: Json | null
          region: string | null
          sample_size: number | null
          sold_count: number | null
          source: string | null
          source_url: string | null
          tmdb_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          format: string
          id?: string
          last_sold_date?: string | null
          last_sold_price?: number | null
          price_avg?: number | null
          price_max?: number | null
          price_median?: number | null
          price_min?: number | null
          raw_data?: Json | null
          region?: string | null
          sample_size?: number | null
          sold_count?: number | null
          source?: string | null
          source_url?: string | null
          tmdb_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          format?: string
          id?: string
          last_sold_date?: string | null
          last_sold_price?: number | null
          price_avg?: number | null
          price_max?: number | null
          price_median?: number | null
          price_min?: number | null
          raw_data?: Json | null
          region?: string | null
          sample_size?: number | null
          sold_count?: number | null
          source?: string | null
          source_url?: string | null
          tmdb_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      price_history: {
        Row: {
          format: string
          id: string
          price_max: number | null
          price_median: number
          price_min: number | null
          recorded_at: string
          region: string | null
          sample_size: number | null
          tmdb_id: number
        }
        Insert: {
          format: string
          id?: string
          price_max?: number | null
          price_median: number
          price_min?: number | null
          recorded_at?: string
          region?: string | null
          sample_size?: number | null
          tmdb_id: number
        }
        Update: {
          format?: string
          id?: string
          price_max?: number | null
          price_median?: number
          price_min?: number | null
          recorded_at?: string
          region?: string | null
          sample_size?: number | null
          tmdb_id?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_title: string | null
          equipped_frame: string | null
          equipped_theme: string | null
          id: string
          onboarding_complete: boolean | null
          popcorn_points: number | null
          streaming_services: string[] | null
          total_xp: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_title?: string | null
          equipped_frame?: string | null
          equipped_theme?: string | null
          id: string
          onboarding_complete?: boolean | null
          popcorn_points?: number | null
          streaming_services?: string[] | null
          total_xp?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_title?: string | null
          equipped_frame?: string | null
          equipped_theme?: string | null
          id?: string
          onboarding_complete?: boolean | null
          popcorn_points?: number | null
          streaming_services?: string[] | null
          total_xp?: number | null
          username?: string | null
        }
        Relationships: []
      }
      public_collections: {
        Row: {
          created_at: string | null
          custom_description: string | null
          custom_title: string | null
          id: string
          is_enabled: boolean | null
          last_viewed_at: string | null
          share_code: string
          show_conditions: boolean | null
          show_notes: boolean | null
          show_purchase_prices: boolean | null
          show_values: boolean | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          is_enabled?: boolean | null
          last_viewed_at?: string | null
          share_code: string
          show_conditions?: boolean | null
          show_notes?: boolean | null
          show_purchase_prices?: boolean | null
          show_values?: boolean | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          custom_description?: string | null
          custom_title?: string | null
          id?: string
          is_enabled?: boolean | null
          last_viewed_at?: string | null
          share_code?: string
          show_conditions?: boolean | null
          show_notes?: boolean | null
          show_purchase_prices?: boolean | null
          show_values?: boolean | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "public_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          badge_reward_id: string | null
          category: string
          created_at: string | null
          description: string
          icon_name: string
          id: string
          is_active: boolean | null
          quest_type: string
          rarity: string | null
          target_config: Json
          title: string
          xp_reward: number | null
        }
        Insert: {
          badge_reward_id?: string | null
          category?: string
          created_at?: string | null
          description: string
          icon_name?: string
          id: string
          is_active?: boolean | null
          quest_type: string
          rarity?: string | null
          target_config: Json
          title: string
          xp_reward?: number | null
        }
        Update: {
          badge_reward_id?: string | null
          category?: string
          created_at?: string | null
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          quest_type?: string
          rarity?: string | null
          target_config?: Json
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      release_notifications: {
        Row: {
          created_at: string
          entity_id: number
          entity_name: string
          entity_role: string | null
          entity_type: string
          id: string
          is_read: boolean | null
          movie_poster_path: string | null
          movie_title: string
          release_date: string | null
          tmdb_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: number
          entity_name: string
          entity_role?: string | null
          entity_type: string
          id?: string
          is_read?: boolean | null
          movie_poster_path?: string | null
          movie_title: string
          release_date?: string | null
          tmdb_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: number
          entity_name?: string
          entity_role?: string | null
          entity_type?: string
          id?: string
          is_read?: boolean | null
          movie_poster_path?: string | null
          movie_title?: string
          release_date?: string | null
          tmdb_id?: number
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          contains_spoilers: boolean | null
          content: string
          created_at: string
          id: string
          movie_poster_path: string | null
          movie_release_year: number | null
          movie_title: string
          rating: number | null
          tmdb_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contains_spoilers?: boolean | null
          content: string
          created_at?: string
          id?: string
          movie_poster_path?: string | null
          movie_release_year?: number | null
          movie_title: string
          rating?: number | null
          tmdb_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contains_spoilers?: boolean | null
          content?: string
          created_at?: string
          id?: string
          movie_poster_path?: string | null
          movie_release_year?: number | null
          movie_title?: string
          rating?: number | null
          tmdb_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_definitions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          name: string
          preview_data: Json
          rarity: string
          reward_type: string
          unlock_criteria: Json
        }
        Insert: {
          created_at?: string | null
          description: string
          id: string
          is_active?: boolean | null
          name: string
          preview_data?: Json
          rarity?: string
          reward_type: string
          unlock_criteria: Json
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          name?: string
          preview_data?: Json
          rarity?: string
          reward_type?: string
          unlock_criteria?: Json
        }
        Relationships: []
      }
      seasonal_events: {
        Row: {
          created_at: string | null
          description: string
          end_date: string
          event_type: string
          icon_name: string
          id: string
          is_active: boolean | null
          start_date: string
          theme_color: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          end_date: string
          event_type: string
          icon_name: string
          id: string
          is_active?: boolean | null
          start_date: string
          theme_color?: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          end_date?: string
          event_type?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          theme_color?: string
          title?: string
        }
        Relationships: []
      }
      seller_profiles: {
        Row: {
          accepts_returns: boolean | null
          average_rating: number | null
          created_at: string | null
          default_shipping_policy: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          location_city: string | null
          location_country: string | null
          rating_count: number | null
          return_period_days: number | null
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_onboarding_complete: boolean | null
          stripe_payouts_enabled: boolean | null
          suspended_at: string | null
          suspension_reason: string | null
          total_revenue_cents: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepts_returns?: boolean | null
          average_rating?: number | null
          created_at?: string | null
          default_shipping_policy?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location_city?: string | null
          location_country?: string | null
          rating_count?: number | null
          return_period_days?: number | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          suspended_at?: string | null
          suspension_reason?: string | null
          total_revenue_cents?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepts_returns?: boolean | null
          average_rating?: number | null
          created_at?: string | null
          default_shipping_policy?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          location_city?: string | null
          location_country?: string | null
          rating_count?: number | null
          return_period_days?: number | null
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_onboarding_complete?: boolean | null
          stripe_payouts_enabled?: boolean | null
          suspended_at?: string | null
          suspension_reason?: string | null
          total_revenue_cents?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_reviews: {
        Row: {
          buyer_id: string
          comment: string | null
          communication_rating: number | null
          created_at: string | null
          id: string
          is_verified_purchase: boolean | null
          is_visible: boolean | null
          item_accuracy_rating: number | null
          moderated_at: string | null
          moderation_note: string | null
          order_id: string
          order_item_id: string | null
          packaging_rating: number | null
          rating: number
          report_reason: string | null
          reported_at: string | null
          seller_id: string
          seller_responded_at: string | null
          seller_response: string | null
          shipping_speed_rating: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          item_accuracy_rating?: number | null
          moderated_at?: string | null
          moderation_note?: string | null
          order_id: string
          order_item_id?: string | null
          packaging_rating?: number | null
          rating: number
          report_reason?: string | null
          reported_at?: string | null
          seller_id: string
          seller_responded_at?: string | null
          seller_response?: string | null
          shipping_speed_rating?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          comment?: string | null
          communication_rating?: number | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          item_accuracy_rating?: number | null
          moderated_at?: string | null
          moderation_note?: string | null
          order_id?: string
          order_item_id?: string | null
          packaging_rating?: number | null
          rating?: number
          report_reason?: string | null
          reported_at?: string | null
          seller_id?: string
          seller_responded_at?: string | null
          seller_response?: string | null
          shipping_speed_rating?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_reviews_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_reviews_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string
          carrier_name: string | null
          created_at: string | null
          delivered_at: string | null
          estimated_delivery_date: string | null
          height_cm: number | null
          id: string
          insurance_cents: number | null
          label_created_at: string | null
          label_url: string | null
          length_cm: number | null
          metadata: Json | null
          order_item_id: string
          relay_point_address: string | null
          relay_point_id: string | null
          relay_point_name: string | null
          seller_id: string
          sendcloud_label_id: string | null
          sendcloud_parcel_id: string | null
          service_type: string | null
          shipped_at: string | null
          shipping_cost_cents: number
          status: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          carrier: string
          carrier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          height_cm?: number | null
          id?: string
          insurance_cents?: number | null
          label_created_at?: string | null
          label_url?: string | null
          length_cm?: number | null
          metadata?: Json | null
          order_item_id: string
          relay_point_address?: string | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          seller_id: string
          sendcloud_label_id?: string | null
          sendcloud_parcel_id?: string | null
          service_type?: string | null
          shipped_at?: string | null
          shipping_cost_cents?: number
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          carrier?: string
          carrier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          height_cm?: number | null
          id?: string
          insurance_cents?: number | null
          label_created_at?: string | null
          label_url?: string | null
          length_cm?: number | null
          metadata?: Json | null
          order_item_id?: string
          relay_point_address?: string | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          seller_id?: string
          sendcloud_label_id?: string | null
          sendcloud_parcel_id?: string | null
          service_type?: string | null
          shipped_at?: string | null
          shipping_cost_cents?: number
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          weight_grams?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          created_at: string | null
          currency: string | null
          description: string | null
          fee_cents: number | null
          id: string
          metadata: Json | null
          net_cents: number
          order_id: string | null
          order_item_id: string | null
          seller_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          stripe_id: string | null
          stripe_type: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fee_cents?: number | null
          id?: string
          metadata?: Json | null
          net_cents: number
          order_id?: string | null
          order_item_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          stripe_id?: string | null
          stripe_type?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fee_cents?: number | null
          id?: string
          metadata?: Json | null
          net_cents?: number
          order_id?: string | null
          order_item_id?: string | null
          seller_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          stripe_id?: string | null
          stripe_type?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      unlockable_features: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon_name: string
          id: string
          is_active: boolean | null
          name: string
          preview_data: Json | null
          rarity: string
          unlock_type: string
          unlock_value: number
        }
        Insert: {
          category?: string
          created_at?: string | null
          description: string
          icon_name?: string
          id: string
          is_active?: boolean | null
          name: string
          preview_data?: Json | null
          rarity?: string
          unlock_type: string
          unlock_value: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          preview_data?: Json | null
          rarity?: string
          unlock_type?: string
          unlock_value?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          metadata: Json | null
          rarity: string | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          metadata?: Json | null
          rarity?: string | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          metadata?: Json | null
          rarity?: string | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string | null
          current_progress: number
          id: string
          is_completed: boolean | null
          reward_claimed: boolean | null
          user_id: string
          week_start: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean | null
          reward_claimed?: boolean | null
          user_id: string
          week_start: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number
          id?: string
          is_completed?: boolean | null
          reward_claimed?: boolean | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_movies: {
        Row: {
          created_at: string | null
          id: string
          is_favorite: boolean | null
          rating: number | null
          review: string | null
          status: string
          tmdb_id: number
          user_id: string
          watched_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          rating?: number | null
          review?: string | null
          status: string
          tmdb_id: number
          user_id: string
          watched_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          rating?: number | null
          review?: string | null
          status?: string
          tmdb_id?: number
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_movies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          completed_at: string | null
          current_progress: number | null
          id: string
          is_completed: boolean | null
          last_updated_at: string | null
          quest_id: string
          started_at: string | null
          target_count: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          last_updated_at?: string | null
          quest_id: string
          started_at?: string | null
          target_count: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_progress?: number | null
          id?: string
          is_completed?: boolean | null
          last_updated_at?: string | null
          quest_id?: string
          started_at?: string | null
          target_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rewards: {
        Row: {
          id: string
          is_equipped: boolean | null
          reward_data: Json | null
          reward_id: string
          reward_name: string
          reward_type: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean | null
          reward_data?: Json | null
          reward_id: string
          reward_name: string
          reward_type: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean | null
          reward_data?: Json | null
          reward_id?: string
          reward_name?: string
          reward_type?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          id: string
          last_login_date: string | null
          longest_streak: number
          streak_frozen_until: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_frozen_until?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_frozen_until?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_top_movies: {
        Row: {
          created_at: string
          id: string
          poster_path: string | null
          slot: number
          title: string
          tmdb_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          poster_path?: string | null
          slot: number
          title: string
          tmdb_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          poster_path?: string | null
          slot?: number
          title?: string
          tmdb_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_top_movies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_unlocks: {
        Row: {
          feature_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          feature_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          feature_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unlocks_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "unlockable_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wantlist: {
        Row: {
          conditions: string[] | null
          created_at: string | null
          editions: string[] | null
          formats: string[] | null
          id: string
          last_matched_at: string | null
          match_count: number | null
          max_price_cents: number | null
          movie_poster_path: string | null
          movie_release_year: number | null
          movie_title: string
          notes: string | null
          notify_on_match: boolean | null
          notify_price_drop: boolean | null
          priority: number | null
          region_codes: string[] | null
          tmdb_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conditions?: string[] | null
          created_at?: string | null
          editions?: string[] | null
          formats?: string[] | null
          id?: string
          last_matched_at?: string | null
          match_count?: number | null
          max_price_cents?: number | null
          movie_poster_path?: string | null
          movie_release_year?: number | null
          movie_title: string
          notes?: string | null
          notify_on_match?: boolean | null
          notify_price_drop?: boolean | null
          priority?: number | null
          region_codes?: string[] | null
          tmdb_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conditions?: string[] | null
          created_at?: string | null
          editions?: string[] | null
          formats?: string[] | null
          id?: string
          last_matched_at?: string | null
          match_count?: number | null
          max_price_cents?: number | null
          movie_poster_path?: string | null
          movie_release_year?: number | null
          movie_title?: string
          notes?: string | null
          notify_on_match?: boolean | null
          notify_price_drop?: boolean | null
          priority?: number | null
          region_codes?: string[] | null
          tmdb_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wantlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wantlist_matches: {
        Row: {
          condition_match: boolean | null
          created_at: string | null
          dismissed_at: string | null
          format_match: boolean | null
          id: string
          listing_id: string
          match_score: number | null
          notified_at: string | null
          price_match: boolean | null
          user_id: string
          viewed_at: string | null
          wantlist_id: string
        }
        Insert: {
          condition_match?: boolean | null
          created_at?: string | null
          dismissed_at?: string | null
          format_match?: boolean | null
          id?: string
          listing_id: string
          match_score?: number | null
          notified_at?: string | null
          price_match?: boolean | null
          user_id: string
          viewed_at?: string | null
          wantlist_id: string
        }
        Update: {
          condition_match?: boolean | null
          created_at?: string | null
          dismissed_at?: string | null
          format_match?: boolean | null
          id?: string
          listing_id?: string
          match_score?: number | null
          notified_at?: string | null
          price_match?: boolean | null
          user_id?: string
          viewed_at?: string | null
          wantlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wantlist_matches_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wantlist_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wantlist_matches_wantlist_id_fkey"
            columns: ["wantlist_id"]
            isOneToOne: false
            referencedRelation: "wantlist"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_challenges: {
        Row: {
          challenge_type: string
          created_at: string | null
          description: string
          icon_name: string
          id: string
          is_active: boolean | null
          popcorn_reward: number
          target_count: number
          target_value: string | null
          title: string
          xp_reward: number
        }
        Insert: {
          challenge_type: string
          created_at?: string | null
          description: string
          icon_name: string
          id: string
          is_active?: boolean | null
          popcorn_reward?: number
          target_count?: number
          target_value?: string | null
          title: string
          xp_reward?: number
        }
        Update: {
          challenge_type?: string
          created_at?: string | null
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean | null
          popcorn_reward?: number
          target_count?: number
          target_value?: string | null
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string | null
          desired_formats: string[] | null
          ebay_tracking_enabled: boolean | null
          id: string
          max_price: number | null
          notes: string | null
          poster_path: string | null
          priority: string | null
          release_year: number | null
          title: string
          tmdb_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          desired_formats?: string[] | null
          ebay_tracking_enabled?: boolean | null
          id?: string
          max_price?: number | null
          notes?: string | null
          poster_path?: string | null
          priority?: string | null
          release_year?: number | null
          title: string
          tmdb_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          desired_formats?: string[] | null
          ebay_tracking_enabled?: boolean | null
          id?: string
          max_price?: number | null
          notes?: string | null
          poster_path?: string | null
          priority?: string | null
          release_year?: number | null
          title?: string
          tmdb_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_daily_prices: { Args: never; Returns: undefined }
      cleanup_expired_price_cache: { Args: never; Returns: undefined }
      generate_order_number: { Args: never; Returns: string }
      generate_share_code: { Args: never; Returns: string }
      get_price_evolution: {
        Args: { p_days?: number; p_format: string; p_tmdb_id: number }
        Returns: {
          price_max: number
          price_median: number
          price_min: number
          recorded_at: string
        }[]
      }
      get_xp_for_format: { Args: { format_name: string }; Returns: number }
      increment_collection_views: {
        Args: { p_share_code: string }
        Returns: undefined
      }
      update_seller_stats: { Args: { seller_uuid: string }; Returns: undefined }
    }
    Enums: {
      dispute_reason:
        | "item_not_received"
        | "item_not_as_described"
        | "item_damaged"
        | "wrong_item"
        | "counterfeit"
        | "seller_unresponsive"
        | "shipping_issue"
        | "refund_not_received"
        | "other"
      dispute_status:
        | "open"
        | "seller_responded"
        | "escalated"
        | "resolved_buyer_favor"
        | "resolved_seller_favor"
        | "resolved_partial"
        | "closed"
        | "cancelled"
      listing_condition:
        | "mint"
        | "near_mint"
        | "very_good"
        | "good"
        | "acceptable"
      listing_status:
        | "draft"
        | "active"
        | "reserved"
        | "sold"
        | "cancelled"
        | "expired"
      order_item_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      order_status:
        | "pending_payment"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "completed"
        | "cancelled"
        | "refunded"
        | "disputed"
      transaction_status: "pending" | "succeeded" | "failed" | "cancelled"
      transaction_type: "payment" | "refund" | "payout" | "fee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dispute_reason: [
        "item_not_received",
        "item_not_as_described",
        "item_damaged",
        "wrong_item",
        "counterfeit",
        "seller_unresponsive",
        "shipping_issue",
        "refund_not_received",
        "other",
      ],
      dispute_status: [
        "open",
        "seller_responded",
        "escalated",
        "resolved_buyer_favor",
        "resolved_seller_favor",
        "resolved_partial",
        "closed",
        "cancelled",
      ],
      listing_condition: [
        "mint",
        "near_mint",
        "very_good",
        "good",
        "acceptable",
      ],
      listing_status: [
        "draft",
        "active",
        "reserved",
        "sold",
        "cancelled",
        "expired",
      ],
      order_item_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      order_status: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
        "refunded",
        "disputed",
      ],
      transaction_status: ["pending", "succeeded", "failed", "cancelled"],
      transaction_type: ["payment", "refund", "payout", "fee"],
    },
  },
} as const
