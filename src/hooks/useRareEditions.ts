import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * useRareEditions — Hook pour les éditions rares et collectors récentes
 * 
 * Récupère les dernières éditions spéciales ajoutées:
 * - Steelbooks
 * - Éditions Collector
 * - 4K UHD
 */

export interface RareEdition {
  id: string;
  tmdbId: number;
  format: string;
  condition: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  movieTitle: string;
  moviePosterPath: string | null;
  movieYear: string;
}

interface UseRareEditionsOptions {
  limit?: number;
  formats?: string[];
}

export function useRareEditions(options: UseRareEditionsOptions = {}) {
  const { limit = 12, formats = ["steelbook", "collector", "4k"] } = options;
  
  const [editions, setEditions] = useState<RareEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRareEditions = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch recent rare editions
      const { data, error: queryError } = await supabase
        .from("physical_movies")
        .select(`
          id,
          tmdb_id,
          format,
          condition,
          user_id,
          created_at,
          profiles!inner(username, avatar_url)
        `)
        .in("format", formats)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (queryError) throw queryError;

      // Enrich with TMDB data
      const enrichedEditions: RareEdition[] = [];

      for (const item of data || []) {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/movie/${item.tmdb_id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`
          );
          
          if (response.ok) {
            const movieData = await response.json();
            
            enrichedEditions.push({
              id: item.id,
              tmdbId: item.tmdb_id,
              format: item.format,
              condition: item.condition,
              userId: item.user_id,
              username: (item as any).profiles?.username || "Collectionneur",
              avatarUrl: (item as any).profiles?.avatar_url || null,
              createdAt: item.created_at,
              movieTitle: movieData.title,
              moviePosterPath: movieData.poster_path,
              movieYear: movieData.release_date?.split("-")[0] || "",
            });
          }
        } catch {
          // Skip failed TMDB fetches
        }
      }

      setEditions(enrichedEditions);
      setError(null);
    } catch (err) {
      console.error("Error fetching rare editions:", err);
      setError("Erreur lors du chargement des éditions rares");
    } finally {
      setLoading(false);
    }
  }, [limit, formats]);

  useEffect(() => {
    fetchRareEditions();

    // Subscribe to changes
    const channel = supabase
      .channel("rare-editions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "physical_movies" },
        (payload) => {
          // Only refetch if the new item is a rare format
          if (formats.includes(payload.new?.format)) {
            fetchRareEditions();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRareEditions, formats]);

  return { editions, loading, error, refresh: fetchRareEditions };
}

// Edition format styling
export const editionFormatConfig = {
  steelbook: {
    label: "Steelbook",
    gradient: "from-amber-500 to-orange-600",
    bgGlow: "shadow-amber-500/20",
    icon: "🥇",
    description: "Édition métal exclusive",
  },
  collector: {
    label: "Collector",
    gradient: "from-red-500 to-pink-600",
    bgGlow: "shadow-red-500/20",
    icon: "💎",
    description: "Édition limitée premium",
  },
  "4k": {
    label: "4K UHD",
    gradient: "from-purple-500 to-indigo-600",
    bgGlow: "shadow-purple-500/20",
    icon: "🎬",
    description: "Ultra Haute Définition",
  },
};

// Condition labels
export const conditionLabels: Record<string, string> = {
  mint: "Neuf",
  very_good: "Très bon",
  good: "Bon",
  acceptable: "Acceptable",
};
