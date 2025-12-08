import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, Movie } from "@/services/tmdb";

interface FollowingMovie {
  movie: Movie;
  watchedBy: {
    userId: string;
    username: string;
    avatarUrl: string | null;
    watchedAt: string;
    rating?: number;
  }[];
}

export function useFollowingMovies() {
  const { user } = useAuth();
  const [movies, setMovies] = useState<FollowingMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowingMovies = useCallback(async () => {
    if (!user) {
      setMovies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Get users I'm following
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = follows?.map((f) => f.following_id) || [];

      if (followingIds.length === 0) {
        setMovies([]);
        setLoading(false);
        return;
      }

      // 2. Get watched movies from those users (recent first)
      const { data: userMovies } = await supabase
        .from("user_movies")
        .select("*")
        .in("user_id", followingIds)
        .eq("status", "watched")
        .order("watched_at", { ascending: false })
        .limit(50);

      if (!userMovies || userMovies.length === 0) {
        setMovies([]);
        setLoading(false);
        return;
      }

      // 3. Get profiles for those users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", followingIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.id, { username: p.username || "Utilisateur", avatarUrl: p.avatar_url }]) || []
      );

      // 4. Group by movie and fetch details
      const movieMap = new Map<number, { watchers: typeof userMovies }>();

      for (const um of userMovies) {
        if (!movieMap.has(um.tmdb_id)) {
          movieMap.set(um.tmdb_id, { watchers: [] });
        }
        movieMap.get(um.tmdb_id)!.watchers.push(um);
      }

      // 5. Fetch movie details for unique movies
      const uniqueMovieIds = Array.from(movieMap.keys()).slice(0, 20);
      
      const movieDetailsPromises = uniqueMovieIds.map(async (tmdbId) => {
        try {
          const details = await getMovieDetails(tmdbId);
          const watchers = movieMap.get(tmdbId)!.watchers;
          
          return {
            movie: details as Movie,
            watchedBy: watchers.map((w) => ({
              userId: w.user_id,
              username: profileMap.get(w.user_id)?.username || "Utilisateur",
              avatarUrl: profileMap.get(w.user_id)?.avatarUrl || null,
              watchedAt: w.watched_at || w.created_at,
              rating: w.rating || undefined,
            })),
          };
        } catch {
          return null;
        }
      });

      const results = (await Promise.all(movieDetailsPromises)).filter(Boolean) as FollowingMovie[];
      
      // Sort by most recent watch
      results.sort((a, b) => {
        const dateA = new Date(a.watchedBy[0]?.watchedAt || 0).getTime();
        const dateB = new Date(b.watchedBy[0]?.watchedAt || 0).getTime();
        return dateB - dateA;
      });

      setMovies(results);
    } catch (error) {
      console.error("Error fetching following movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFollowingMovies();
  }, [fetchFollowingMovies]);

  return { movies, loading, refresh: fetchFollowingMovies };
}
