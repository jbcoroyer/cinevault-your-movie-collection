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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_title: string | null
          id: string
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
          id: string
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
          id?: string
          popcorn_points?: number | null
          streaming_services?: string[] | null
          total_xp?: number | null
          username?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_xp_for_format: { Args: { format_name: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
