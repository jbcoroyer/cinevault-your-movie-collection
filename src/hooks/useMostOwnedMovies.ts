import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * useMostOwnedMovies — Hook pour les films les plus possédés par la communauté
 * 
 * Récupère le classement des films les plus présents dans les collections
 * avec enrichissement TMDB pour les métadonnées
 */

export interface MostOwnedMovie {
  tmdbId: number;
  ownerCount: number;
  title: string;
  posterPath: string | null;
  year: string;
  voteAverage: number;
  rank: number;
  rarity: "popular" | "common" | "uncommon" | "rare";
}

interface UseMostOwnedMoviesOptions {
  limit?: number;
}

export function useMostOwnedMovies(options: UseMostOwnedMoviesOptions = {}) {
  const { limit = 10 } = options;
  
  const [movies, setMovies] = useState<MostOwnedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMostOwned = useCallback(async () => {
    try {
      setLoading(true);

      // Get count of each tmdb_id in physical_movies
      const { data, error: queryError } = await supabase
        .from("physical_movies")
        .select("tmdb_id");

      if (queryError) throw queryError;

      // Count occurrences of each tmdb_id
      const countMap = new Map<number, number>();
      (data || []).forEach((item) => {
        const current = countMap.get(item.tmdb_id) || 0;
        countMap.set(item.tmdb_id, current + 1);
      });

      // Sort by count and take top N
      const sortedEntries = Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      // Fetch TMDB data for each movie
      const enrichedMovies: MostOwnedMovie[] = [];
      const maxCount = sortedEntries[0]?.[1] || 1;

      for (let i = 0; i < sortedEntries.length; i++) {
        const [tmdbId, count] = sortedEntries[i];
        
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`
          );
          
          if (response.ok) {
            const movieData = await response.json();
            
            // Calculate rarity based on relative ownership
            const rarityPercentage = count / maxCount;
            let rarity: MostOwnedMovie["rarity"];
            if (rarityPercentage > 0.7) rarity = "popular";
            else if (rarityPercentage > 0.4) rarity = "common";
            else if (rarityPercentage > 0.2) rarity = "uncommon";
            else rarity = "rare";

            enrichedMovies.push({
              tmdbId,
              ownerCount: count,
              title: movieData.title,
              posterPath: movieData.poster_path,
              year: movieData.release_date?.split("-")[0] || "",
              voteAverage: movieData.vote_average || 0,
              rank: i + 1,
              rarity,
            });
          }
        } catch {
          // Skip movie if TMDB fetch fails
        }
      }

      setMovies(enrichedMovies);
      setError(null);
    } catch (err) {
      console.error("Error fetching most owned movies:", err);
      setError("Erreur lors du chargement du classement");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchMostOwned();

    // Subscribe to changes
    const channel = supabase
      .channel("most-owned-movies")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "physical_movies" },
        () => fetchMostOwned()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMostOwned]);

  return { movies, loading, error, refresh: fetchMostOwned };
}

// Rarity labels and colors for UI
export const rarityConfig = {
  popular: {
    label: "Populaire",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: "🔥",
  },
  common: {
    label: "Commun",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: "⭐",
  },
  uncommon: {
    label: "Peu commun",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    icon: "💎",
  },
  rare: {
    label: "Rare",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    icon: "🏆",
  },
};
