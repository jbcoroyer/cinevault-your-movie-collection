const API_KEY = 'c0cfa8d140fb26ff2a4b624502be9a95';
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w500') => {
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
  profile_path: string | null;
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
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
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

const fetchTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    language: 'fr-FR',
    ...params,
  });

  const response = await fetch(`${BASE_URL}${endpoint}?${queryParams}`);
  
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }

  return response.json();
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>('/trending/movie/week');
  return data.results;
};

export const getPopularMovies = async (): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>('/movie/popular');
  return data.results;
};

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
  const data = await fetchTMDB<MovieDetails>(`/movie/${movieId}`, {
    append_to_response: 'credits',
  });
  return data;
};

export const getPersonDetails = async (personId: number): Promise<PersonDetails> => {
  const data = await fetchTMDB<PersonDetails>(`/person/${personId}`, {
    append_to_response: 'movie_credits',
  });
  return data;
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
  if (!query.trim()) return [];
  const data = await fetchTMDB<TMDBResponse<Movie>>('/search/movie', { query });
  return data.results;
};

export const getGenres = async (): Promise<Genre[]> => {
  const data = await fetchTMDB<{ genres: Genre[] }>('/genre/movie/list');
  return data.genres;
};

export const discoverMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
  const data = await fetchTMDB<TMDBResponse<Movie>>('/discover/movie', {
    with_genres: genreId.toString(),
  });
  return data.results;
};

export const getWatchProviders = async (movieId: number, country: string = 'FR'): Promise<WatchProviders | null> => {
  const data = await fetchTMDB<{ results: Record<string, WatchProviders> }>(`/movie/${movieId}/watch/providers`);
  return data.results[country] || null;
};

export const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
};

export const getYear = (dateString: string): string => {
  if (!dateString) return '';
  return new Date(dateString).getFullYear().toString();
};
