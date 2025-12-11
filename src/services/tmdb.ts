import { supabase } from "@/integrations/supabase/client";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "demo";
const BASE_URL = "https://api.themoviedb.org/3";

// Types
export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  movie_credits?: {
    cast: (Movie & { character: string })[];
    crew: (Movie & { job: string })[];
  };
}

interface ReleaseDateEntry {
  certification: string;
  iso_639_1: string;
  release_date: string;
  type: number;
}

interface ReleaseDatesResult {
  iso_3166_1: string;
  release_dates: ReleaseDateEntry[];
}

export interface MovieImages {
  backdrops: { file_path: string; width: number; height: number }[];
  posters: { file_path: string; width: number; height: number }[];
  logos: { file_path: string; width: number; height: number }[];
}

export interface MovieDetails extends Movie {
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  genres: Genre[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { iso_639_1: string; name: string; english_name: string }[];
  imdb_id?: string;
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: {
    results: Video[];
  };
  recommendations?: {
    results: Movie[];
  };
  release_dates?: {
    results: ReleaseDatesResult[];
  };
  images?: MovieImages;
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviders {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Mapping des IDs de providers TMDB corrigés pour la France/Europe
export const STREAMING_PROVIDER_IDS: Record<string, number> = {
  netflix: 8,
  prime: 119, // ID correct pour Prime Video en France (9 est pour les US)
  disney: 337,
  canal: 381,
  apple: 350,
  max: 384, // HBO Max / Max
  paramount: 531,
  crunchyroll: 283,
};

// Mapping inverse pour afficher le nom du provider
export const PROVIDER_NAMES: Record<number, string> = {
  8: "Netflix",
  119: "Prime Video",
  9: "Prime Video", // Fallback
  337: "Disney+",
  381: "Canal+",
  350: "Apple TV+",
  384: "Max",
  531: "Paramount+",
  283: "Crunchyroll",
};

const fetchTMDB = async <T,>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
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

// Image URL helper
export const getImageUrl = (path: string | null, size: string = "w500"): string | null => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

// Basic fetchers
export const getTrendingMovies = async (): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>("/trending/movie/week");
  return data.results;
};

export const getTopRatedMovies = async (): Promise<Movie[]> => {
  const response = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR&region=FR`);
  const data = await response.json();
  return data.results;
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>("/movie/popular");
  return data.results;
};

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  const data = await fetchTMDB<MovieDetails>(`/movie/${movieId}`, {
    append_to_response: "credits,videos,recommendations,release_dates,watch/providers,images",
  });
  return data;
};

export const getMovieImages = async (movieId: number): Promise<MovieImages> => {
  const data = await fetchTMDB<MovieImages>(`/movie/${movieId}/images`, {
    include_image_language: "fr,en,null",
  });
  return data;
};

export const getWatchProviders = async (movieId: number, country: string = "FR"): Promise<WatchProviders | null> => {
  const data = await fetchTMDB<{ results: Record<string, WatchProviders> }>(`/movie/${movieId}/watch/providers`);
  return data.results[country] || null;
};

export const getPersonDetails = async (personId: number): Promise<PersonDetails> => {
  const data = await fetchTMDB<PersonDetails>(`/person/${personId}`, {
    append_to_response: "movie_credits",
  });
  return data;
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  if (!query.trim()) return [];
  const data = await fetchTMDB<TMDBResponse<Movie>>("/search/movie", { query });
  return data.results;
};

export const getGenres = async (): Promise<Genre[]> => {
  const data = await fetchTMDB<{ genres: Genre[] }>("/genre/movie/list");
  return data.genres;
};

export const discoverMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>("/discover/movie", {
    with_genres: genreId.toString(),
  });
  return data.results;
};

// Discover movies with custom filters
export const discoverMovies = async (params: Record<string, string>): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>("/discover/movie", params);
  return data.results;
};

// Discover movies with streaming platform filter
export const discoverMoviesByPlatform = async (
  providerIds: number[],
  region: string = "FR",
  additionalParams: Record<string, string> = {},
): Promise<Movie[]> => {
  const params: Record<string, string> = {
    watch_region: region,
    with_watch_providers: providerIds.join("|"),
    with_watch_monetization_types: "flatrate",
    sort_by: "popularity.desc",
    ...additionalParams,
  };

  const data = await fetchTMDB<TMDBResponse<Movie>>("/discover/movie", params);
  return data.results;
};

// AI Search
export interface AIFilters {
  with_genres?: string;
  without_genres?: string;
  "primary_release_date.gte"?: string;
  "primary_release_date.lte"?: string;
  with_people?: string;
  with_original_language?: string;
  sort_by?: string;
  "vote_count.gte"?: string;
  "vote_average.gte"?: string;
}

export interface AISearchResult {
  type: "specific" | "discover";
  movies: Movie[];
  title?: string; // For specific movie searches
}

export const searchMoviesByAI = async (prompt: string): Promise<AISearchResult> => {
  if (!prompt.trim()) return { type: "discover", movies: [] };

  // Call the edge function to analyze the prompt
  const { data, error } = await supabase.functions.invoke("analyze-movie-prompt", {
    body: { prompt },
  });

  if (error) {
    console.error("Error calling AI analysis:", error);
    throw new Error("Erreur lors de l'analyse IA");
  }

  console.log("AI Response:", data);

  // Handle specific movie search
  if (data?.type === "specific" && data?.title) {
    const searchResults = await searchMovies(data.title);
    if (data.original_title && data.original_title !== data.title) {
      const originalResults = await searchMovies(data.original_title);
      const allResults = [...searchResults];
      originalResults.forEach((movie) => {
        if (!allResults.find((m) => m.id === movie.id)) {
          allResults.push(movie);
        }
      });
      return {
        type: "specific",
        movies: allResults.slice(0, 10),
        title: data.title,
      };
    }
    return {
      type: "specific",
      movies: searchResults.slice(0, 10),
      title: data.title,
    };
  }

  const filters: AIFilters = data?.filters || data;
  if (!filters) throw new Error("Aucun filtre retourné par l'IA");

  const params: Record<string, string> = {
    include_adult: "false",
    include_video: "false",
    page: "1",
  };

  if (filters.with_genres) params.with_genres = filters.with_genres;
  if (filters.without_genres) params.without_genres = filters.without_genres;
  if (filters["primary_release_date.gte"]) params["primary_release_date.gte"] = filters["primary_release_date.gte"];
  if (filters["primary_release_date.lte"]) params["primary_release_date.lte"] = filters["primary_release_date.lte"];
  if (filters.with_people) params.with_people = filters.with_people;
  if (filters.with_original_language) params.with_original_language = filters.with_original_language;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters["vote_count.gte"]) params["vote_count.gte"] = filters["vote_count.gte"];
  if (filters["vote_average.gte"]) params["vote_average.gte"] = filters["vote_average.gte"];

  const movieData = await fetchTMDB<TMDBResponse<Movie>>("/discover/movie", params);
  return { type: "discover", movies: movieData.results };
};

// Helper functions
export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
};

export const getYear = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString).getFullYear().toString();
};

export const getDirector = (movie: MovieDetails): CrewMember | undefined => {
  return movie.credits?.crew.find((c) => c.job === "Director");
};

export const getWriters = (movie: MovieDetails): CrewMember[] => {
  return (
    movie.credits?.crew
      .filter((c) => c.job === "Writer" || c.job === "Screenplay" || c.department === "Writing")
      .slice(0, 3) || []
  );
};

export const getComposer = (movie: MovieDetails): CrewMember | undefined => {
  return movie.credits?.crew.find((c) => c.job === "Original Music Composer" || c.job === "Music");
};

export const formatMoney = (amount: number): string => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    amount,
  );
};

export const getCertification = (movie: MovieDetails, country: string = "FR"): string | null => {
  const countryRelease = movie.release_dates?.results.find((r) => r.iso_3166_1 === country);
  if (!countryRelease) return null;
  const certification = countryRelease.release_dates.find((rd) => rd.certification)?.certification;
  return certification || null;
};

export const getTrailers = (movie: MovieDetails): Video[] => {
  return (
    movie.videos?.results.filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) || []
  );
};

export const getRecommendations = async (movieId: number): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>(`/movie/${movieId}/recommendations`);
  return data.results;
};

export const getNowPlayingMovies = async (): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>("/movie/now_playing", {
    region: "FR",
  });
  return data.results;
};

export const getStreamingMovies = async (): Promise<Movie[]> => {
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);

  const data = await fetchTMDB<TMDBResponse<Movie>>("/discover/movie", {
    watch_region: "FR",
    with_watch_monetization_types: "flatrate",
    sort_by: "primary_release_date.desc",
    "primary_release_date.lte": today.toISOString().split("T")[0],
    "primary_release_date.gte": threeMonthsAgo.toISOString().split("T")[0],
  });
  return data.results;
};

export const getNowAvailableMovies = async (): Promise<Movie[]> => {
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);

  const [nowPlayingData, streamingData] = await Promise.all([
    fetchTMDB<TMDBResponse<Movie>>("/movie/now_playing", {
      region: "FR",
    }),
    fetchTMDB<TMDBResponse<Movie>>("/discover/movie", {
      watch_region: "FR",
      with_watch_monetization_types: "flatrate",
      sort_by: "primary_release_date.desc",
      "primary_release_date.lte": today.toISOString().split("T")[0],
      "primary_release_date.gte": threeMonthsAgo.toISOString().split("T")[0],
    }),
  ]);

  const allMovies = [...nowPlayingData.results, ...streamingData.results];
  const uniqueMovies = allMovies.filter((movie, index, self) => index === self.findIndex((m) => m.id === movie.id));

  return uniqueMovies.sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
};

export const getNowAvailableMoviesPaginated = async (
  page: number = 1,
): Promise<{ movies: Movie[]; totalPages: number }> => {
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);

  const [nowPlayingData, streamingData] = await Promise.all([
    fetchTMDB<TMDBResponse<Movie>>("/movie/now_playing", {
      region: "FR",
      page: page.toString(),
    }),
    fetchTMDB<TMDBResponse<Movie>>("/discover/movie", {
      watch_region: "FR",
      with_watch_monetization_types: "flatrate",
      sort_by: "primary_release_date.desc",
      "primary_release_date.lte": today.toISOString().split("T")[0],
      "primary_release_date.gte": threeMonthsAgo.toISOString().split("T")[0],
      page: page.toString(),
    }),
  ]);

  const allMovies = [...nowPlayingData.results, ...streamingData.results];
  const uniqueMovies = allMovies.filter((movie, index, self) => index === self.findIndex((m) => m.id === movie.id));

  const sortedMovies = uniqueMovies.sort(
    (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime(),
  );

  return {
    movies: sortedMovies,
    totalPages: Math.max(nowPlayingData.total_pages, streamingData.total_pages),
  };
};

export const getPopularMoviesPaginated = async (page: number = 1): Promise<{ movies: Movie[]; totalPages: number }> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>("/movie/popular", {
    page: page.toString(),
  });
  return {
    movies: data.results,
    totalPages: data.total_pages,
  };
};

export const getAvailableProviders = async (region: string = "FR"): Promise<WatchProvider[]> => {
  const data = await fetchTMDB<{ results: WatchProvider[] }>("/watch/providers/movie", {
    watch_region: region,
  });
  return data.results;
};

export const getUserCountryCode = async (): Promise<string> => {
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    return data.country_code || "FR";
  } catch (error) {
    console.error("Error getting user country:", error);
    return "FR"; // Default to France
  }
};
