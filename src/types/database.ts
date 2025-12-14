/**
 * Custom database types for the application
 * These extend the auto-generated Supabase types
 */

export type Profile = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  streaming_services?: string[] | null;
  total_xp?: number | null;
  popcorn_points?: number | null;
  current_title?: string | null;
  equipped_frame?: string | null;
  equipped_theme?: string | null;
};

export type UserMovie = {
  id: string;
  user_id: string;
  tmdb_id: number;
  status: 'watchlist' | 'watched' | 'none';
  is_favorite: boolean;
  rating: number | null;
  review: string | null;
  created_at: string;
  watched_at: string | null;
};
