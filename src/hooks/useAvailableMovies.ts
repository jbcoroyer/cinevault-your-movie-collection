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

  // Sécurisation contre les changements de référence d'objets (pour éviter les boucles infinies)
  // On mémoïse les filtres en interne sur la base de leur contenu stringifié
  const stableAdditionalFilters = useMemo(
    () => additionalFilters,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(additionalFilters)],
  );

  // Récupérer les films physiques de l'utilisateur
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovieSimple[]>([]);

  // Map des films physiques pour lookup rapide
  const physicalMoviesMap = useMemo(() => {
    const map = new Map<number, string[]>();
    physicalMovies.forEach((pm) => {
      const formats = map.get(pm.tmdb_id) || [];
      formats.push(pm.format);
      map.set(pm.tmdb_id, formats);
    });
    return map;
  }, [physicalMovies]);

  // Plateformes de l'utilisateur
  const userPlatforms = useMemo(() => {
    return profile?.streaming_services || [];
  }, [profile]);

  // Provider IDs pour les plateformes de l'utilisateur
  const userProviderIds = useMemo(() => {
    return userPlatforms.map((p) => STREAMING_PROVIDER_IDS[p]).filter(Boolean);
  }, [userPlatforms]);

  // Détecter la région automatiquement
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

  // Charger les films physiques de l'utilisateur
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

    // Souscrire aux changements
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

  // Fonction pour vérifier la disponibilité d'un film sur les plateformes
  const checkPlatformAvailability = useCallback(
    async (movieId: number): Promise<AvailabilityInfo[]> => {
      if (userPlatforms.length === 0) return [];

      try {
        const providers = await getWatchProviders(movieId, region);
        if (!providers?.flatrate) return [];

        const available: AvailabilityInfo[] = [];

        providers.flatrate.forEach((provider) => {
          // Gestion souple des IDs (ex: Prime 119 vs 9)
          const platformEntry = Object.entries(STREAMING_PROVIDER_IDS).find(([, id]) => {
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

  // Fonction pour obtenir la disponibilité physique d'un film
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

  // Fonction pour filtrer une liste de films selon la disponibilité (limité à 50)
  const filterMoviesByAvailability = useCallback(
    async (candidates: Movie[]): Promise<AvailableMovieResult[]> => {
      // On limite le traitement pour ne pas surcharger
      const candidatesToProcess = candidates.slice(0, 50);

      const processed = await Promise.all(
        candidatesToProcess.map(async (movie) => {
          const physicalAvail = getPhysicalAvailability(movie.id);
          let platformAvail: AvailabilityInfo[] = [];

          if (userPlatforms.length > 0) {
            try {
              platformAvail = await checkPlatformAvailability(movie.id);
            } catch {
              // Ignore errors
            }
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

      return processed.filter((r): r is AvailableMovieResult => r !== null);
    },
    [getPhysicalAvailability, checkPlatformAvailability, userPlatforms],
  );

  // Charger les films disponibles (Mode découverte par défaut)
  const fetchAvailableMovies = useCallback(async () => {
    if (!enabled || !user) {
      if (!enabled) setMovies([]);
      return;
    }

    setLoading(true);

    try {
      const allResults: AvailableMovieResult[] = [];
      const seenIds = new Set<number>();
      const MAX_ITEMS = 50; // LIMITE STRICTE

      // 1. D'abord, récupérer les films de la collection physique
      if (physicalMovies.length > 0) {
        const physicalTmdbIds = [...new Set(physicalMovies.map((pm) => pm.tmdb_id))].slice(0, MAX_ITEMS);

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
            allResults.push(res);
          }
        });
      }

      // MISE À JOUR 1 : On affiche immédiatement la collection physique (stable)
      setMovies([...allResults]);

      // 2. Ensuite, récupérer les films streaming, SI on n'a pas atteint la limite
      if (userProviderIds.length > 0 && allResults.length < MAX_ITEMS) {
        const params: Record<string, string> = {
          watch_region: region,
          with_watch_providers: userProviderIds.join("|"),
          with_watch_monetization_types: "flatrate",
          sort_by: "popularity.desc",
          "vote_count.gte": "100",
          ...stableAdditionalFilters,
        };

        const streamingMovies = await discoverMovies(params);

        // On ne traite que ce qu'il faut pour compléter jusqu'à 50 (avec une petite marge)
        const needed = MAX_ITEMS - allResults.length;
        const potentialStreaming = streamingMovies.filter((m) => !seenIds.has(m.id)).slice(0, needed + 5);

        // Vérification parallèle des disponibilités
        const streamingResults = await Promise.all(
          potentialStreaming.map(async (movie) => {
            try {
              const platformAvailability = await checkPlatformAvailability(movie.id);
              const physicalAvailability = getPhysicalAvailability(movie.id);

              const avail = [...physicalAvailability, ...platformAvailability];
              if (avail.length > 0) {
                return { movie, availability: avail };
              }
            } catch (e) {
              console.warn("Skipping movie check due to error", movie.id);
            }
            return null;
          }),
        );

        // Intégration des résultats streaming vérifiés
        streamingResults.forEach((res) => {
          if (res && allResults.length < MAX_ITEMS) {
            seenIds.add(res.movie.id);
            allResults.push(res);
          }
        });

        // Tri final : Physique en premier, puis Popularité
        allResults.sort((a, b) => {
          const aHasPhysical = a.availability.some((av) => av.type === "physical");
          const bHasPhysical = b.availability.some((av) => av.type === "physical");

          if (aHasPhysical && !bHasPhysical) return -1;
          if (!aHasPhysical && bHasPhysical) return 1;

          return b.movie.popularity - a.movie.popularity;
        });

        // MISE À JOUR 2 : On affiche le tout (Physique + Streaming) en une seule fois
        setMovies(allResults.slice(0, MAX_ITEMS));
      }
    } catch (err) {
      console.error("Error fetching available movies:", err);
    } finally {
      setLoading(false);
    }
  }, [
    enabled,
    user,
    physicalMovies,
    userProviderIds,
    region,
    stableAdditionalFilters, // Utilisation de la version stable
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
