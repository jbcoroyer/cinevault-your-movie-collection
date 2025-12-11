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

  // Récupérer les films physiques de l'utilisateur
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
      if (!error && data) {
        setPhysicalMovies(data);
      }
    };

    fetchPhysicalMovies();

    const channel = supabase
      .channel("user-physical-movies")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "physical_movies",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchPhysicalMovies(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkPlatformAvailability = useCallback(
    async (movieId: number): Promise<AvailabilityInfo[]> => {
      if (userPlatforms.length === 0) return [];

      try {
        const providers = await getWatchProviders(movieId, region);
        if (!providers?.flatrate) return [];

        const available: AvailabilityInfo[] = [];

        providers.flatrate.forEach((provider) => {
          // Check if provider matches our user platforms list
          const platformEntry = Object.entries(STREAMING_PROVIDER_IDS).find(([, id]) => {
            // Permissive check: strict ID match OR specific case for Prime (9 or 119)
            if (provider.provider_id === 119 || provider.provider_id === 9) {
              return id === 119 || id === 9;
            }
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
      return formats.map((format) => ({
        type: "physical" as const,
        id: format,
      }));
    },
    [physicalMoviesMap],
  );

  const filterMoviesByAvailability = useCallback(
    async (candidates: Movie[]): Promise<AvailableMovieResult[]> => {
      const results = await Promise.all(
        candidates.map(async (movie) => {
          const physicalAvail = getPhysicalAvailability(movie.id);
          let platformAvail: AvailabilityInfo[] = [];

          if (userPlatforms.length > 0) {
            platformAvail = await checkPlatformAvailability(movie.id);
          }

          const totalAvailability = [...physicalAvail, ...platformAvail];

          if (totalAvailability.length > 0) {
            return {
              movie,
              availability: totalAvailability,
            };
          }
          return null;
        }),
      );
      return results.filter((r): r is AvailableMovieResult => r !== null);
    },
    [getPhysicalAvailability, checkPlatformAvailability, userPlatforms],
  );

  const fetchAvailableMovies = useCallback(async () => {
    if (!enabled || !user) {
      if (!enabled) setMovies([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allResults: AvailableMovieResult[] = [];
      const seenIds = new Set<number>();

      if (physicalMovies.length > 0) {
        const physicalTmdbIds = [...new Set(physicalMovies.map((pm) => pm.tmdb_id))];
        const batches = [];
        const batchSize = 10;

        for (let i = 0; i < physicalTmdbIds.length; i += batchSize) {
          batches.push(physicalTmdbIds.slice(i, i + batchSize));
        }

        for (const batch of batches) {
          const batchResults = await Promise.all(
            batch.map(async (tmdbId) => {
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
              allResults.push(res);
            }
          });
        }
      }

      if (userProviderIds.length > 0) {
        const params: Record<string, string> = {
          watch_region: region,
          with_watch_providers: userProviderIds.join("|"),
          with_watch_monetization_types: "flatrate",
          sort_by: "popularity.desc",
          "vote_count.gte": "100",
          ...additionalFilters,
        };

        const streamingMovies = await discoverMovies(params);

        const streamingResults = await Promise.all(
          streamingMovies.map(async (movie) => {
            if (seenIds.has(movie.id)) return null;

            const platformAvailability = await checkPlatformAvailability(movie.id);
            const physicalAvailability = getPhysicalAvailability(movie.id);
            const avail = [...physicalAvailability, ...platformAvailability];

            if (avail.length > 0) {
              return { movie, availability: avail };
            }
            return null;
          }),
        );

        streamingResults.forEach((res) => {
          if (res) {
            seenIds.add(res.movie.id);
            allResults.push(res);
          }
        });
      }

      allResults.sort((a, b) => {
        const aHasPhysical = a.availability.some((av) => av.type === "physical");
        const bHasPhysical = b.availability.some((av) => av.type === "physical");
        if (aHasPhysical && !bHasPhysical) return -1;
        if (!aHasPhysical && bHasPhysical) return 1;
        return b.movie.popularity - a.movie.popularity;
      });

      setMovies(allResults);
    } catch (err) {
      console.error("Error fetching available movies:", err);
      setError("Erreur lors du chargement des films disponibles");
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    user,
    physicalMovies,
    userProviderIds,
    region,
    additionalFilters,
    checkPlatformAvailability,
    getPhysicalAvailability,
  ]);

  useEffect(() => {
    fetchAvailableMovies();
  }, [fetchAvailableMovies]);

  const getMovieAvailability = useCallback(
    async (movie: Movie): Promise<AvailabilityInfo[]> => {
      const physical = getPhysicalAvailability(movie.id);
      const platform = await checkPlatformAvailability(movie.id);
      return [...physical, ...platform];
    },
    [getPhysicalAvailability, checkPlatformAvailability],
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
    refresh: fetchAvailableMovies,
    getMovieAvailability,
    getPhysicalAvailability,
    filterMoviesByAvailability,
  };
}
