import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please connect your Supabase project.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

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
