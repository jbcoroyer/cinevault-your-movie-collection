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
      try {
        const providers = await getWatchProviders(movieId, region);
        if (!providers?.flatrate) return [];

        const available: AvailabilityInfo[] = [];

        providers.flatrate.forEach((provider) => {
          // Trouver le nom de la plateforme à partir de l'ID
          const platformEntry = Object.entries(STREAMING_PROVIDER_IDS).find(([, id]) => id === provider.provider_id);

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

  // NOUVEAU : Fonction pour filtrer une liste de films selon la disponibilité
  // Cette fonction est utilisée par la recherche standard pour appliquer le filtre "Disponible pour moi"
  const filterMoviesByAvailability = useCallback(
    async (candidates: Movie[]): Promise<AvailableMovieResult[]> => {
      const results: AvailableMovieResult[] = [];

      // On traite les films en parallèle pour vérifier le streaming (la partie physique est instantanée)
      await Promise.all(
        candidates.map(async (movie) => {
          // 1. Vérif physique (Synchrone et rapide)
          const physicalAvail = getPhysicalAvailability(movie.id);

          // 2. Vérif streaming (Asynchrone) - Uniquement si on a des plateformes configurées
          let platformAvail: AvailabilityInfo[] = [];
          if (userPlatforms.length > 0) {
            platformAvail = await checkPlatformAvailability(movie.id);
          }

          const totalAvailability = [...physicalAvail, ...platformAvail];

          // Si le film est disponible quelque part, on le garde
          if (totalAvailability.length > 0) {
            results.push({
              movie,
              availability: totalAvailability,
            });
          }
        }),
      );

      return results;
    },
    [getPhysicalAvailability, checkPlatformAvailability, userPlatforms],
  );

  // Charger les films disponibles (Mode découverte par défaut, sans recherche texte)
  const fetchAvailableMovies = useCallback(async () => {
    if (!enabled || !user) {
      // Si désactivé, on vide la liste pour éviter les effets de bord
      if (!enabled) setMovies([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allResults: AvailableMovieResult[] = [];
      const seenIds = new Set<number>();

      // 1. D'abord, ajouter les films de la collection physique
      if (physicalMovies.length > 0) {
        const physicalTmdbIds = [...new Set(physicalMovies.map((pm) => pm.tmdb_id))];

        const batchSize = 20;
        for (let i = 0; i < Math.min(physicalTmdbIds.length, 40); i += batchSize) {
          const batch = physicalTmdbIds.slice(i, i + batchSize);

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
                // Ignorer les erreurs individuelles
              }
              return null;
            }),
          );

          batchResults.forEach((result) => {
            if (result && !seenIds.has(result.movie.id)) {
              seenIds.add(result.movie.id);
              allResults.push(result);
            }
          });
        }
      }

      // 2. Ensuite, ajouter les films disponibles sur les plateformes de streaming (Découverte)
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

        for (const movie of streamingMovies) {
          if (seenIds.has(movie.id)) continue;
          seenIds.add(movie.id);

          // On revérifie spécifiquement pour construire l'objet availability complet
          const platformAvailability = await checkPlatformAvailability(movie.id);
          const physicalAvailability = getPhysicalAvailability(movie.id);

          allResults.push({
            movie,
            availability: [...physicalAvailability, ...platformAvailability],
          });
        }
      }

      // Trier : films physiques d'abord, puis par popularité
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

  // Helper pour enrichir n'importe quel film avec ses infos de disponibilité (utilisé par les cartes individuelles)
  const getMovieAvailability = useCallback(
    async (movie: Movie): Promise<AvailabilityInfo[]> => {
      const physical = getPhysicalAvailability(movie.id);
      const platform = await checkPlatformAvailability(movie.id);
      return [...physical, ...platform];
    },
    [getPhysicalAvailability, checkPlatformAvailability],
  );

  return {
    movies, // Liste par défaut (populaires + collection)
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
    filterMoviesByAvailability, // Nouvelle fonction exportée
  };
}
