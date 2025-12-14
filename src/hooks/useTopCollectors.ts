import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useTopCollectors — Hook pour les collectionneurs les plus actifs
 * 
 * Récupère les profils avec les plus grandes collections,
 * incluant leurs formats préférés et quelques films de leur collection
 */

export interface CollectorProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  collectionCount: number;
  favoriteFormat: string | null;
  formatBreakdown: Record<string, number>;
  recentMovies: {
    tmdbId: number;
    posterPath: string | null;
    title: string;
  }[];
  rank: number;
  specialty: string | null;
}

interface UseTopCollectorsOptions {
  limit?: number;
}

export function useTopCollectors(options: UseTopCollectorsOptions = {}) {
  const { limit = 10 } = options;
  
  const [collectors, setCollectors] = useState<CollectorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopCollectors = useCallback(async () => {
    try {
      setLoading(true);

      // Get all physical movies grouped by user
      const { data: physicalData, error: physicalError } = await supabase
        .from("physical_movies")
        .select(`
          user_id,
          tmdb_id,
          format,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (physicalError) throw physicalError;

      // Group by user
      const userCollections = new Map<string, {
        count: number;
        formats: Record<string, number>;
        recentTmdbIds: number[];
      }>();

      (physicalData || []).forEach((item) => {
        const existing = userCollections.get(item.user_id) || {
          count: 0,
          formats: {},
          recentTmdbIds: [],
        };

        existing.count++;
        existing.formats[item.format] = (existing.formats[item.format] || 0) + 1;
        
        if (existing.recentTmdbIds.length < 5) {
          existing.recentTmdbIds.push(item.tmdb_id);
        }

        userCollections.set(item.user_id, existing);
      });

      // Sort by collection size and take top N
      const sortedUsers = Array.from(userCollections.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, limit);

      if (sortedUsers.length === 0) {
        setCollectors([]);
        return;
      }

      // Fetch user profiles
      const userIds = sortedUsers.map(([userId]) => userId);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(
        (profilesData || []).map((p) => [p.id, p])
      );

      // Build collector profiles
      const enrichedCollectors: CollectorProfile[] = [];

      for (let i = 0; i < sortedUsers.length; i++) {
        const [userId, data] = sortedUsers[i];
        const profile = profilesMap.get(userId);

        if (!profile) continue;

        // Find favorite format
        const sortedFormats = Object.entries(data.formats)
          .sort((a, b) => b[1] - a[1]);
        const favoriteFormat = sortedFormats[0]?.[0] || null;

        // Determine specialty based on format distribution
        let specialty: string | null = null;
        if (sortedFormats.length > 0) {
          const topFormat = sortedFormats[0];
          const topPercentage = topFormat[1] / data.count;
          
          if (topPercentage > 0.6) {
            specialty = getSpecialtyLabel(topFormat[0]);
          } else if (sortedFormats.length >= 3) {
            specialty = "Collectionneur Éclectique";
          }
        }

        // Fetch TMDB data for recent movies
        const recentMovies = await fetchMoviePosters(data.recentTmdbIds.slice(0, 5));

        enrichedCollectors.push({
          id: userId,
          username: profile.username || "Collectionneur",
          avatarUrl: profile.avatar_url,
          collectionCount: data.count,
          favoriteFormat,
          formatBreakdown: data.formats,
          recentMovies,
          rank: i + 1,
          specialty,
        });
      }

      setCollectors(enrichedCollectors);
      setError(null);
    } catch (err) {
      console.error("Error fetching top collectors:", err);
      setError("Erreur lors du chargement des collectionneurs");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTopCollectors();

    // Subscribe to changes
    const channel = supabase
      .channel("top-collectors")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "physical_movies" },
        () => fetchTopCollectors()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTopCollectors]);

  return { collectors, loading, error, refresh: fetchTopCollectors };
}

// Helper to fetch movie posters from TMDB
async function fetchMoviePosters(tmdbIds: number[]): Promise<CollectorProfile["recentMovies"]> {
  const results: CollectorProfile["recentMovies"] = [];

  for (const tmdbId of tmdbIds) {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`
      );
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          tmdbId,
          posterPath: data.poster_path,
          title: data.title,
        });
      }
    } catch {
      // Skip failed fetches
    }
  }

  return results;
}

// Get specialty label based on format
function getSpecialtyLabel(format: string): string {
  const specialties: Record<string, string> = {
    steelbook: "Spécialiste Steelbook",
    "4k": "Amateur 4K UHD",
    bluray: "Fan Blu-ray",
    collector: "Chasseur d'Éditions",
    dvd: "Nostalgique DVD",
  };
  return specialties[format] || "Collectionneur";
}

// Format config for UI
export const formatConfig: Record<string, { label: string; color: string; emoji: string }> = {
  dvd: { label: "DVD", color: "bg-slate-500", emoji: "📀" },
  bluray: { label: "Blu-ray", color: "bg-blue-600", emoji: "💿" },
  "4k": { label: "4K UHD", color: "bg-purple-600", emoji: "🎬" },
  steelbook: { label: "Steelbook", color: "bg-amber-600", emoji: "🥇" },
  collector: { label: "Collector", color: "bg-red-600", emoji: "💎" },
};
