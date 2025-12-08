import { supabase } from "@/integrations/supabase/client";

// Modification : Utilisation de la variable d'environnement
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const getImageUrl = (path: string | null, size: "w92" | "w200" | "w300" | "w500" | "w780" | "w1280" | "original" = "w500") => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
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

export interface ReleaseDate {
  certification: string;
  release_date: string;
  type: number;
}

export interface ReleaseDatesResult {
  iso_3166_1: string;
  release_dates: ReleaseDate[];
}

export interface MovieImage {
  aspect_ratio: number;
  height: number;
  width: number;
  file_path: string;
  vote_average: number;
  vote_count: number;
}

export interface MovieImages {
  backdrops: MovieImage[];
  posters: MovieImage[];
  logos?: MovieImage[];
}

export interface PersonMovieCredit {
  id: number;
  title: string;
  original_title?: string;
  poster_path: string | null;
  release_date?: string;
  character?: string;
  job?: string;
  vote_average?: number;
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
    cast: PersonMovieCredit[];
    crew: PersonMovieCredit[];
  };
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  budget?: number;
  revenue?: number;
  production_countries?: { iso_3166_1: string; name: string }[];
  spoken_languages?: { iso_639_1: string; name: string; english_name: string }[];
  original_language?: string;
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

// Get writers from credits
export const getWriters = (movie: MovieDetails): CrewMember[] => {
  return (
    movie.credits?.crew
      .filter((c) => c.job === "Writer" || c.job === "Screenplay" || c.department === "Writing")
      .slice(0, 3) || []
  );
};

// Get composer from credits
export const getComposer = (movie: MovieDetails): CrewMember | undefined => {
  return movie.credits?.crew.find((c) => c.job === "Original Music Composer" || c.job === "Music");
};

// Format budget/revenue
export const formatMoney = (amount: number): string => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    amount,
  );
};

// Extract director from credits
export const getDirector = (movie: MovieDetails): CrewMember | undefined => {
  return movie.credits?.crew.find((c) => c.job === "Director");
};

// Extract certification (age rating) for a specific country
export const getCertification = (movie: MovieDetails, country: string = "FR"): string | null => {
  const countryRelease = movie.release_dates?.results.find((r) => r.iso_3166_1 === country);
  if (!countryRelease) return null;

  const certification = countryRelease.release_dates.find((rd) => rd.certification)?.certification;
  return certification || null;
};

// Ajoutez cette fonction avec les autres exports
export const getRecommendations = async (movieId: number): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>(`/movie/${movieId}/recommendations`);
  return data.results;
};

// Get trailers from videos
export const getTrailers = (movie: MovieDetails): Video[] => {
  return (
    movie.videos?.results.filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) || []
  );
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

export const getWatchProviders = async (movieId: number, country: string = "FR"): Promise<WatchProviders | null> => {
  const data = await fetchTMDB<{ results: Record<string, WatchProviders> }>(`/movie/${movieId}/watch/providers`);
  return data.results[country] || null;
};

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

export const searchMoviesByAI = async (prompt: string): Promise<Movie[]> => {
  if (!prompt.trim()) return [];

  // Call the edge function to analyze the prompt
  const { data, error } = await supabase.functions.invoke("analyze-movie-prompt", {
    body: { prompt },
  });

  if (error) {
    console.error("Error calling AI analysis:", error);
    throw new Error("Erreur lors de l'analyse IA");
  }

  if (!data?.filters) {
    throw new Error("Aucun filtre retourné par l'IA");
  }

  const filters: AIFilters = data.filters;
  console.log("AI Filters:", filters);

  // Build params for discover endpoint
  const params: Record<string, string> = {
    include_adult: "false",
    include_video: "false",
    page: "1",
  };

  if (filters.with_genres) {
    params.with_genres = filters.with_genres;
  }
  if (filters.without_genres) {
    params.without_genres = filters.without_genres;
  }
  if (filters["primary_release_date.gte"]) {
    params["primary_release_date.gte"] = filters["primary_release_date.gte"];
  }
  if (filters["primary_release_date.lte"]) {
    params["primary_release_date.lte"] = filters["primary_release_date.lte"];
  }
  if (filters.with_people) {
    params.with_people = filters.with_people;
  }
  if (filters.with_original_language) {
    params.with_original_language = filters.with_original_language;
  }
  if (filters.sort_by) {
    params.sort_by = filters.sort_by;
  }
  if (filters["vote_count.gte"]) {
    params["vote_count.gte"] = filters["vote_count.gte"];
  }
  if (filters["vote_average.gte"]) {
    params["vote_average.gte"] = filters["vote_average.gte"];
  }

  // Call TMDB discover endpoint with filters
  const movieData = await fetchTMDB<TMDBResponse<Movie>>("/discover/movie", params);
  return movieData.results;
};

export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
};

export const getYear = (dateString: string): string => {
  if (!dateString) return "";
  return new Date(dateString).getFullYear().toString();
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

  // Fusionner et supprimer les doublons par ID
  const allMovies = [...nowPlayingData.results, ...streamingData.results];
  const uniqueMovies = allMovies.filter((movie, index, self) => index === self.findIndex((m) => m.id === movie.id));

  // Trier par date de sortie (plus récent en premier)
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

// Discover movies with custom filters
export const discoverMovies = async (params: Record<string, string>): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>("/discover/movie", params);
  return data.results;
};
