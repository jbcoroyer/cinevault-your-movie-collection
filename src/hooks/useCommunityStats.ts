import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * useCommunityStats — Hook pour les statistiques globales de la communauté
 * 
 * Récupère:
 * - Nombre total de DVD/Blu-ray dans toutes les collections
 * - Nombre de collectionneurs actifs
 * - Films ajoutés cette semaine
 * - Nombre de reviews publiées
 */

export interface CommunityStats {
  totalPhysicalMovies: number;
  totalCollectors: number;
  moviesAddedThisWeek: number;
  totalReviews: number;
}

export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStats>({
    totalPhysicalMovies: 0,
    totalCollectors: 0,
    moviesAddedThisWeek: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();

    // Real-time subscription for live updates
    const channel = supabase
      .channel("community-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "physical_movies" },
        () => fetchStats()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Get one week ago date
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const oneWeekAgoISO = oneWeekAgo.toISOString();

      // Parallel requests for better performance
      const [
        { count: totalPhysicalMovies },
        { data: collectorsData },
        { count: moviesAddedThisWeek },
        { count: totalReviews },
      ] = await Promise.all([
        // Total physical movies
        supabase
          .from("physical_movies")
          .select("*", { count: "exact", head: true }),
        
        // Unique collectors (users with at least 1 physical movie)
        supabase
          .from("physical_movies")
          .select("user_id")
          .limit(10000),
        
        // Movies added this week
        supabase
          .from("physical_movies")
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneWeekAgoISO),
        
        // Total reviews
        supabase
          .from("reviews")
          .select("*", { count: "exact", head: true }),
      ]);

      // Count unique collectors
      const uniqueCollectors = new Set(collectorsData?.map(d => d.user_id) || []);

      setStats({
        totalPhysicalMovies: totalPhysicalMovies || 0,
        totalCollectors: uniqueCollectors.size,
        moviesAddedThisWeek: moviesAddedThisWeek || 0,
        totalReviews: totalReviews || 0,
      });
      setError(null);
    } catch (err) {
      console.error("Error fetching community stats:", err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refresh: fetchStats };
}
