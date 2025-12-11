import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Movie, discoverMovies, getWatchProviders, STREAMING_PROVIDER_IDS, getUserCountryCode } from "@/services/tmdb";
import { AvailabilityInfo } from "@/components/MovieCard";

interface PhysicalMovieSimple {
  tmdb_id: number;
  format: string;
}

interface UseAvailableMoviesOptions {
  enabled?: boolean;
  additionalFilters?: Record<string, string>;
}

interface AvailableMovieResult {
  movie: Movie;
  availability: AvailabilityInfo[];
}

export function useAvailableMovies(options: UseAvailableMoviesOptions = {}) {
  const { enabled = false, additionalFilters = {} } = options;
  const { user, profile } = useAuth();

  const [movies, setMovies] = useState<AvailableMovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState("FR");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sécurisation des filtres (comme vu précédemment)
  const stableAdditionalFilters = useMemo(
    () => additionalFilters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(additionalFilters)],
  );

  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovieSimple[]>([]);

  const physicalMoviesMap = useMemo(() => {
    const map = new Map<number, string[]>();
    physicalMovies.forEach((pm) => {
      const formats = map.get(pm.tmdb_id) || [];
      formats.push(pm.format);
      map.set(pm.tmdb_id, formats);
    });
    return map;
  }, [physicalMovies]);

  const userPlatforms = useMemo(() => {
    return profile?.streaming_services || [];
  }, [profile]);

  const userProviderIds = useMemo(() => {
    return userPlatforms.map((p) => STREAMING_PROVIDER_IDS[p]).filter(Boolean);
  }, [userPlatforms]);

  useEffect(() => {
    const detectRegion = async () => {
      try {
        const code = await getUserCountryCode();
        setRegion(code);
      } catch {
        setRegion("FR");
      }
    };
    detectRegion();
  }, []);

  useEffect(() => {
    if (!user) {
      setPhysicalMovies([]);
      return;
    }

    const fetchPhysicalMovies = async () => {
      const { data, error } = await supabase.from("physical_movies").select("tmdb_id, format").eq("user_id", user.id);
      if (!error && data) setPhysicalMovies(data);
    };

    fetchPhysicalMovies();

    const channel = supabase
      .channel("user-physical-movies")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "physical_movies", filter: `user_id=eq.${user.id}` },
        () => fetchPhysicalMovies(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Réinitialiser la pagination si les filtres changent
  useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
  }, [stableAdditionalFilters, enabled]);

  const checkPlatformAvailability = useCallback(
    async (movieId: number): Promise<AvailabilityInfo[]> => {
      if (userPlatforms.length === 0) return [];

      try {
        const providers = await getWatchProviders(movieId, region);
        if (!providers?.flatrate) return [];

        const available: AvailabilityInfo[] = [];
        providers.flatrate.forEach((provider) => {
          const platformEntry = Object.entries(STREAMING_PROVIDER_IDS).find(([, id]) => {
            if (provider.provider_id === 119 || provider.provider_id === 9) return id === 119 || id === 9;
            return id === provider.provider_id;
          });

          if (platformEntry && userPlatforms.includes(platformEntry[0])) {
            available.push({
              type: "platform",
              id: platformEntry[0],
              name: provider.provider_name,
            });
          }
        });
        return available;
      } catch {
        return [];
      }
    },
    [region, userPlatforms],
  );

  const getPhysicalAvailability = useCallback(
    (tmdbId: number): AvailabilityInfo[] => {
      const formats = physicalMoviesMap.get(tmdbId);
      if (!formats) return [];
      return formats.map((format) => ({ type: "physical" as const, id: format }));
    },
    [physicalMoviesMap],
  );

  const fetchAvailableMovies = useCallback(async () => {
    if (!enabled || !user) return;

    setLoading(true);
    try {
      const newResults: AvailableMovieResult[] = [];
      const seenIds = new Set<number>(page > 1 ? movies.map((m) => m.movie.id) : []);
      const ITEMS_PER_PAGE = 20;

      // 1. Charger les films physiques (seulement à la page 1)
      if (page === 1 && physicalMovies.length > 0) {
        const physicalTmdbIds = [...new Set(physicalMovies.map((pm) => pm.tmdb_id))];
        const batchResults = await Promise.all(
          physicalTmdbIds.map(async (tmdbId) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`,
              );
              if (response.ok) {
                const movie = await response.json();
                return {
                  movie: {
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path,
                    backdrop_path: movie.backdrop_path,
                    release_date: movie.release_date,
                    vote_average: movie.vote_average,
                    vote_count: movie.vote_count,
                    genre_ids: movie.genres?.map((g: any) => g.id) || [],
                    popularity: movie.popularity,
                  } as Movie,
                  availability: getPhysicalAvailability(tmdbId),
                };
              }
            } catch {
              return null;
            }
            return null;
          }),
        );

        batchResults.forEach((res) => {
          if (res && !seenIds.has(res.movie.id)) {
            seenIds.add(res.movie.id);
            newResults.push(res);
          }
        });
      }

      // 2. Charger les films streaming
      if (userProviderIds.length > 0) {
        const params: Record<string, string> = {
          watch_region: region,
          with_watch_providers: userProviderIds.join("|"),
          with_watch_monetization_types: "flatrate",
          // On demande à l'API de trier par note, mais avec un minimum de votes pour éviter les films obscurs à 10/10
          sort_by: "vote_average.desc",
          "vote_count.gte": "100",
          page: page.toString(),
          ...stableAdditionalFilters,
        };

        const streamingMovies = await discoverMovies(params);

        if (streamingMovies.length === 0) {
          setHasMore(false);
        }

        // Vérification disponibilité
        const streamingResults = await Promise.all(
          streamingMovies.map(async (movie) => {
            if (seenIds.has(movie.id)) return null;
            try {
              const platformAvailability = await checkPlatformAvailability(movie.id);
              const physicalAvailability = getPhysicalAvailability(movie.id);
              const avail = [...physicalAvailability, ...platformAvailability];

              if (avail.length > 0) {
                return { movie, availability: avail };
              }
            } catch {
              /* ignore */
            }
            return null;
          }),
        );

        streamingResults.forEach((res) => {
          if (res) {
            seenIds.add(res.movie.id);
            newResults.push(res);
          }
        });
      } else {
        setHasMore(false);
      }

      setMovies((prev) => {
        const combined = page === 1 ? newResults : [...prev, ...newResults];
        // TRI FINAL : Par Note (vote_average) décroissant
        return combined.sort((a, b) => b.movie.vote_average - a.movie.vote_average);
      });
    } catch (err) {
      console.error("Error fetching available movies:", err);
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    user,
    page,
    physicalMovies,
    userProviderIds,
    region,
    stableAdditionalFilters,
    checkPlatformAvailability,
    getPhysicalAvailability,
    // Note: movies dependencies removed to avoid cycle, used functional update instead
  ]);

  useEffect(() => {
    fetchAvailableMovies();
  }, [fetchAvailableMovies]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage((p) => p + 1);
    }
  }, [loading, hasMore]);

  const getMovieAvailability = useCallback(
    async (movie: Movie): Promise<AvailabilityInfo[]> => {
      const physical = getPhysicalAvailability(movie.id);
      const platform = await checkPlatformAvailability(movie.id);
      return [...physical, ...platform];
    },
    [getPhysicalAvailability, checkPlatformAvailability],
  );

  // Fonction utilitaire pour filtrer une liste externe (utilisée par Search.tsx)
  const filterMoviesByAvailability = useCallback(
    async (candidates: Movie[]): Promise<AvailableMovieResult[]> => {
      const processed = await Promise.all(
        candidates.map(async (movie) => {
          const avail = await getMovieAvailability(movie);
          return avail.length > 0 ? { movie, availability: avail } : null;
        }),
      );
      return processed.filter((r): r is AvailableMovieResult => r !== null);
    },
    [getMovieAvailability],
  );

  return {
    movies,
    loading,
    error,
    region,
    setRegion,
    userPlatforms,
    physicalMoviesCount: physicalMovies.length,
    hasSubscriptions: userPlatforms.length > 0,
    hasCollection: physicalMovies.length > 0,
    refresh: () => {
      setPage(1);
      fetchAvailableMovies();
    },
    loadMore,
    hasMore,
    getMovieAvailability,
    getPhysicalAvailability,
    filterMoviesByAvailability,
  };
}
