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
