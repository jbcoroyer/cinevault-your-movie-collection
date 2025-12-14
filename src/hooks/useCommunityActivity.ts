import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useCommunityActivity — Hook pour l'activité récente de la communauté
 * 
 * Récupère les dernières actions:
 * - Films ajoutés aux collections
 * - Notes attribuées
 * - Reviews publiées
 * - Films ajoutés aux favoris
 */

export type ActivityType = "physical_added" | "rated" | "reviewed" | "favorite" | "watched";

export interface CommunityActivity {
  id: string;
  type: ActivityType;
  userId: string;
  username: string;
  avatarUrl: string | null;
  movieTitle: string;
  moviePosterPath: string | null;
  tmdbId: number;
  metadata: {
    format?: string;
    rating?: number;
    condition?: string;
  };
  createdAt: string;
}

interface UseCommunityActivityOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCommunityActivity(options: UseCommunityActivityOptions = {}) {
  const { limit = 20, autoRefresh = true, refreshInterval = 30000 } = options;
  
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      // Fetch recent physical movie additions with user profiles
      const { data: physicalData, error: physicalError } = await supabase
        .from("physical_movies")
        .select(`
          id,
          tmdb_id,
          format,
          condition,
          created_at,
          user_id,
          profiles!inner(username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (physicalError) throw physicalError;

      // Fetch movie details from activities table for titles/posters
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("activities")
        .select(`
          id,
          type,
          tmdb_id,
          movie_title,
          movie_poster_path,
          metadata,
          created_at,
          user_id,
          profiles!inner(username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (activitiesError) throw activitiesError;

      // Transform physical movies data
      const physicalActivities: CommunityActivity[] = (physicalData || []).map((item: any) => ({
        id: `physical-${item.id}`,
        type: "physical_added" as ActivityType,
        userId: item.user_id,
        username: item.profiles?.username || "Utilisateur",
        avatarUrl: item.profiles?.avatar_url || null,
        movieTitle: "", // Will be enriched later
        moviePosterPath: null,
        tmdbId: item.tmdb_id,
        metadata: {
          format: item.format,
          condition: item.condition,
        },
        createdAt: item.created_at,
      }));

      // Transform activities data
      const otherActivities: CommunityActivity[] = (activitiesData || []).map((item: any) => ({
        id: item.id,
        type: item.type as ActivityType,
        userId: item.user_id,
        username: item.profiles?.username || "Utilisateur",
        avatarUrl: item.profiles?.avatar_url || null,
        movieTitle: item.movie_title,
        moviePosterPath: item.movie_poster_path,
        tmdbId: item.tmdb_id,
        metadata: item.metadata || {},
        createdAt: item.created_at,
      }));

      // Merge and sort by date
      const allActivities = [...physicalActivities, ...otherActivities]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      // Enrich physical movies with TMDB data (titles/posters)
      const enrichedActivities = await enrichWithTMDBData(allActivities);

      setActivities(enrichedActivities);
      setError(null);
    } catch (err) {
      console.error("Error fetching community activity:", err);
      setError("Erreur lors du chargement de l'activité");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Fetch movie titles from TMDB for physical additions
  const enrichWithTMDBData = async (activities: CommunityActivity[]): Promise<CommunityActivity[]> => {
    const physicalActivities = activities.filter(a => a.type === "physical_added" && !a.movieTitle);
    
    if (physicalActivities.length === 0) return activities;

    // Fetch from TMDB API (using existing cache if available)
    const tmdbIds = [...new Set(physicalActivities.map(a => a.tmdbId))];
    
    try {
      const movieDataMap = new Map<number, { title: string; poster_path: string | null }>();
      
      // Batch fetch from TMDB (in parallel, max 5 at a time)
      const batchSize = 5;
      for (let i = 0; i < tmdbIds.length; i += batchSize) {
        const batch = tmdbIds.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(async (id) => {
            try {
              const response = await fetch(
                `https://api.themoviedb.org/3/movie/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&language=fr-FR`
              );
              if (response.ok) {
                const data = await response.json();
                return { id, title: data.title, poster_path: data.poster_path };
              }
            } catch {
              // Ignore individual failures
            }
            return null;
          })
        );
        
        results.forEach((result) => {
          if (result) {
            movieDataMap.set(result.id, { title: result.title, poster_path: result.poster_path });
          }
        });
      }

      // Enrich activities with movie data
      return activities.map((activity) => {
        if (activity.type === "physical_added" && !activity.movieTitle) {
          const movieData = movieDataMap.get(activity.tmdbId);
          if (movieData) {
            return {
              ...activity,
              movieTitle: movieData.title,
              moviePosterPath: movieData.poster_path,
            };
          }
        }
        return activity;
      });
    } catch {
      return activities;
    }
  };

  useEffect(() => {
    fetchActivities();

    // Real-time subscription
    const channel = supabase
      .channel("community-activity-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "physical_movies" },
        () => fetchActivities()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        () => fetchActivities()
      )
      .subscribe();

    // Auto-refresh interval
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchActivities, refreshInterval);
    }

    return () => {
      supabase.removeChannel(channel);
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchActivities, autoRefresh, refreshInterval]);

  return { activities, loading, error, refresh: fetchActivities };
}

// Format labels for display
export const formatLabels: Record<string, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  "4k": "4K UHD",
  steelbook: "Steelbook",
  collector: "Édition Collector",
};

export const activityLabels: Record<ActivityType, string> = {
  physical_added: "a ajouté",
  rated: "a noté",
  reviewed: "a critiqué",
  favorite: "a ajouté aux favoris",
  watched: "a vu",
};
