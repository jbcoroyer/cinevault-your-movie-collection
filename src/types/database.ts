// Types à ajouter dans src/integrations/supabase/types.ts

// Ajouter ces interfaces dans la section Database["public"]["Tables"]

/*
entity_follows: {
  Row: {
    id: string
    user_id: string
    entity_type: string
    entity_id: number
    entity_name: string
    entity_image_path: string | null
    entity_role: string
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    entity_type: string
    entity_id: number
    entity_name: string
    entity_image_path?: string | null
    entity_role: string
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    entity_type?: string
    entity_id?: number
    entity_name?: string
    entity_image_path?: string | null
    entity_role?: string
    created_at?: string
  }
  Relationships: []
}

release_notifications: {
  Row: {
    id: string
    user_id: string
    tmdb_id: number
    movie_title: string
    movie_poster_path: string | null
    release_date: string | null
    entity_type: string
    entity_id: number
    entity_name: string
    entity_role: string
    is_read: boolean
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    tmdb_id: number
    movie_title: string
    movie_poster_path?: string | null
    release_date?: string | null
    entity_type: string
    entity_id: number
    entity_name: string
    entity_role: string
    is_read?: boolean
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    tmdb_id?: number
    movie_title?: string
    movie_poster_path?: string | null
    release_date?: string | null
    entity_type?: string
    entity_id?: number
    entity_name?: string
    entity_role?: string
    is_read?: boolean
    created_at?: string
  }
  Relationships: []
}

companies_metadata: {
  Row: {
    id: number
    name: string
    description: string | null
    headquarters: string | null
    homepage: string | null
    logo_path: string | null
    origin_country: string | null
    parent_company_id: number | null
    parent_company_name: string | null
    updated_at: string
  }
  Insert: {
    id: number
    name: string
    description?: string | null
    headquarters?: string | null
    homepage?: string | null
    logo_path?: string | null
    origin_country?: string | null
    parent_company_id?: number | null
    parent_company_name?: string | null
    updated_at?: string
  }
  Update: {
    id?: number
    name?: string
    description?: string | null
    headquarters?: string | null
    homepage?: string | null
    logo_path?: string | null
    origin_country?: string | null
    parent_company_id?: number | null
    parent_company_name?: string | null
    updated_at?: string
  }
  Relationships: []
}
*/

// Exporter les types pour utilisation dans l'app
export type EntityFollow = {
  id: string;
  user_id: string;
  entity_type: "person" | "company";
  entity_id: number;
  entity_name: string;
  entity_image_path: string | null;
  entity_role: "actor" | "director" | "studio" | "production_company";
  created_at: string;
};

export type ReleaseNotification = {
  id: string;
  user_id: string;
  tmdb_id: number;
  movie_title: string;
  movie_poster_path: string | null;
  release_date: string | null;
  entity_type: string;
  entity_id: number;
  entity_name: string;
  entity_role: string;
  is_read: boolean;
  created_at: string;
};

export type CompanyMetadata = {
  id: number;
  name: string;
  description: string | null;
  headquarters: string | null;
  homepage: string | null;
  logo_path: string | null;
  origin_country: string | null;
  parent_company_id: number | null;
  parent_company_name: string | null;
  updated_at: string;
};

// Profile type matching Supabase profiles table
export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string | null;
  current_title: string | null;
  equipped_frame: string | null;
  equipped_theme: string | null;
  onboarding_complete: boolean | null;
  popcorn_points: number | null;
  streaming_services: string[] | null;
  total_xp: number | null;
};

// UserMovie type matching Supabase user_movies table
export type UserMovie = {
  id: string;
  user_id: string;
  tmdb_id: number;
  status: string;
  rating: number | null;
  review: string | null;
  is_favorite: boolean | null;
  watched_at: string | null;
  created_at: string | null;
};
