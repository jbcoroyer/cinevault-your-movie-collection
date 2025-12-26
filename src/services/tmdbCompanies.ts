import { supabase } from "@/integrations/supabase/client";
import { Movie } from "./tmdb";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "demo";
const BASE_URL = "https://api.themoviedb.org/3";

// =====================================================
// TYPES
// =====================================================

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface CompanyDetails {
  id: number;
  name: string;
  description: string;
  headquarters: string;
  homepage: string;
  logo_path: string | null;
  origin_country: string;
  parent_company: {
    id: number;
    name: string;
    logo_path: string | null;
  } | null;
}

export interface CompanyMoviesResponse {
  id: number;
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

// Studios populaires avec leurs IDs TMDB
export const POPULAR_STUDIOS: { id: number; name: string; logo?: string }[] = [
  { id: 2, name: "Walt Disney Pictures" },
  { id: 3, name: "Pixar" },
  { id: 4, name: "Paramount Pictures" },
  { id: 5, name: "Columbia Pictures" },
  { id: 9, name: "Gaumont" },
  { id: 25, name: "20th Century Studios" },
  { id: 33, name: "Universal Pictures" },
  { id: 34, name: "Sony Pictures" },
  { id: 174, name: "Warner Bros. Pictures" },
  { id: 420, name: "Marvel Studios" },
  { id: 2622, name: "Pathé" },
  { id: 3172, name: "Blumhouse Productions" },
  { id: 7505, name: "Lionsgate" },
  { id: 10342, name: "Studio Ghibli" },
  { id: 12, name: "New Line Cinema" },
  { id: 41077, name: "A24" },
  { id: 128064, name: "DC Studios" },
  { id: 923, name: "Legendary Pictures" },
  { id: 507, name: "StudioCanal" },
  { id: 1632, name: "Lionsgate Films" },
];

// =====================================================
// API FUNCTIONS
// =====================================================

const fetchTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    language: "fr-FR",
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Récupère les détails d'une société de production
 */
export const getCompanyDetails = async (companyId: number): Promise<CompanyDetails> => {
  // Vérifier le cache Supabase d'abord
  const { data: cached } = await supabase
    .from("companies_metadata")
    .select("*")
    .eq("id", companyId)
    .single();

  if (cached) {
    // Si les données ont moins de 7 jours, utiliser le cache
    const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (cacheAge < sevenDays) {
      return {
        id: cached.id,
        name: cached.name,
        description: cached.description || "",
        headquarters: cached.headquarters || "",
        homepage: cached.homepage || "",
        logo_path: cached.logo_path,
        origin_country: cached.origin_country || "",
        parent_company: cached.parent_company_id ? {
          id: cached.parent_company_id,
          name: cached.parent_company_name || "",
          logo_path: null,
        } : null,
      };
    }
  }

  // Sinon, appeler l'API
  const data = await fetchTMDB<CompanyDetails>(`/company/${companyId}`);

  // Mettre à jour le cache
  await supabase.from("companies_metadata").upsert({
    id: data.id,
    name: data.name,
    description: data.description,
    headquarters: data.headquarters,
    homepage: data.homepage,
    logo_path: data.logo_path,
    origin_country: data.origin_country,
    parent_company_id: data.parent_company?.id || null,
    parent_company_name: data.parent_company?.name || null,
    updated_at: new Date().toISOString(),
  });

  return data;
};

/**
 * Récupère les films d'une société de production
 */
export const getCompanyMovies = async (
  companyId: number,
  page: number = 1,
  sortBy: string = "popularity.desc"
): Promise<CompanyMoviesResponse> => {
  const data = await fetchTMDB<CompanyMoviesResponse>(`/discover/movie`, {
    with_companies: companyId.toString(),
    sort_by: sortBy,
    page: page.toString(),
  });

  return {
    ...data,
    id: companyId,
  };
};

/**
 * Recherche des sociétés de production
 */
export const searchCompanies = async (query: string): Promise<ProductionCompany[]> => {
  if (!query.trim()) return [];
  
  const data = await fetchTMDB<{ results: ProductionCompany[] }>("/search/company", {
    query,
  });

  return data.results;
};

/**
 * Récupère les prochaines sorties d'une personne (acteur/réalisateur)
 */
export const getPersonUpcomingMovies = async (personId: number): Promise<Movie[]> => {
  const today = new Date().toISOString().split("T")[0];
  
  const data = await fetchTMDB<{ results: Movie[] }>("/discover/movie", {
    with_people: personId.toString(),
    "primary_release_date.gte": today,
    sort_by: "primary_release_date.asc",
  });

  return data.results;
};

/**
 * Récupère les prochaines sorties d'un studio
 */
export const getCompanyUpcomingMovies = async (companyId: number): Promise<Movie[]> => {
  const today = new Date().toISOString().split("T")[0];
  
  const data = await fetchTMDB<{ results: Movie[] }>("/discover/movie", {
    with_companies: companyId.toString(),
    "primary_release_date.gte": today,
    sort_by: "primary_release_date.asc",
  });

  return data.results;
};

/**
 * Récupère les films alternatifs (productions alternatives)
 */
export const getAlternativeCompanies = async (companyId: number): Promise<ProductionCompany[]> => {
  const data = await fetchTMDB<CompanyDetails>(`/company/${companyId}`);
  
  // Retourner la société mère et les studios similaires
  const alternatives: ProductionCompany[] = [];
  
  if (data.parent_company) {
    alternatives.push({
      id: data.parent_company.id,
      name: data.parent_company.name,
      logo_path: data.parent_company.logo_path,
      origin_country: data.origin_country,
    });
  }

  return alternatives;
};

/**
 * URL de l'image du logo
 */
export const getCompanyLogoUrl = (logoPath: string | null, size: string = "w200"): string | null => {
  if (!logoPath) return null;
  return `https://image.tmdb.org/t/p/${size}${logoPath}`;
};

/**
 * Récupère les statistiques d'un studio dans la collection de l'utilisateur
 */
export const getStudioCollectionStats = async (
  userId: string,
  companyId: number
): Promise<{ count: number; movies: number[] }> => {
  // Récupérer les films physiques de l'utilisateur
  const { data: physicalMovies } = await supabase
    .from("physical_movies")
    .select("tmdb_id")
    .eq("user_id", userId);

  if (!physicalMovies || physicalMovies.length === 0) {
    return { count: 0, movies: [] };
  }

  // Pour chaque film, vérifier s'il appartient au studio
  // Note: En production, on utiliserait un cache ou une table de métadonnées
  const tmdbIds = physicalMovies.map((pm) => pm.tmdb_id);
  const matchingMovies: number[] = [];

  // Récupérer les métadonnées en cache
  const { data: metadata } = await supabase
    .from("movies_metadata")
    .select("tmdb_id")
    .in("tmdb_id", tmdbIds);

  // On devrait avoir une colonne production_companies dans movies_metadata
  // Pour l'instant, on retourne un placeholder
  return { count: matchingMovies.length, movies: matchingMovies };
};
