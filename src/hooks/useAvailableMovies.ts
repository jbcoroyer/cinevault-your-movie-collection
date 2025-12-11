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
      // Si l'utilisateur n'a pas de plateformes, inutile de faire un appel API
      if (userPlatforms.length === 0) return [];

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

  // NOUVEAU : Fonction optimisée pour filtrer une liste de films (Parallélisé)
  const filterMoviesByAvailability = useCallback(
    async (candidates: Movie[]): Promise<AvailableMovieResult[]> => {
      // On traite tout en parallèle avec Promise.all
      const results = await Promise.all(
        candidates.map(async (movie) => {
          // 1. Vérif physique (Synchrone)
          const physicalAvail = getPhysicalAvailability(movie.id);

          // 2. Vérif streaming (Asynchrone)
          let platformAvail: AvailabilityInfo[] = [];
          
          // Optimisation : ne vérifier les plateformes que si nécessaire et si non présent physiquement (optionnel, ici on vérifie tout)
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
        })
      );

      // On retire les nulls (films non disponibles)
      return results.filter((r): r is AvailableMovieResult => r !== null);
    },
    [getPhysicalAvailability, checkPlatformAvailability, userPlatforms],
  );

  const hasSubscriptions = userPlatforms.length > 0;
  const hasCollection = physicalMoviesMap.size > 0;
  const physicalMoviesCount = physicalMoviesMap.size;

  return {
    movies,
    loading,
    error,
    region,
    physicalMoviesMap,
    userPlatforms,
    userProviderIds,
    checkPlatformAvailability,
    getPhysicalAvailability,
    filterMoviesByAvailability,
    hasSubscriptions,
    hasCollection,
    physicalMoviesCount,
  };
}