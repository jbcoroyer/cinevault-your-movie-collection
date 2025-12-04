import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Activity {
  id: string;
  user_id: string;
  type: "rated" | "watched" | "reviewed" | "listed" | "favorite";
  tmdb_id: number;
  movie_title: string;
  movie_poster_path: string | null;
  metadata: Record<string, any>;
  created_at: string;
  // Joined from profiles
  username?: string;
  avatar_url?: string;
}

export function useActivities() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createActivity = async (
    type: Activity["type"],
    movie: { tmdb_id: number; title: string; poster_path: string | null },
    metadata: Record<string, any> = {}
  ) => {
    if (!user) return;

    try {
      await supabase.from("activities").insert({
        user_id: user.id,
        type,
        tmdb_id: movie.tmdb_id,
        movie_title: movie.title,
        movie_poster_path: movie.poster_path,
        metadata,
      });
    } catch (error) {
      console.error("Error creating activity:", error);
    }
  };

  const getFollowingActivities = async (limit = 20): Promise<Activity[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      // First get the list of users I'm following
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = follows?.map((f) => f.following_id) || [];
      
      if (followingIds.length === 0) return [];

      // Get activities from those users
      const { data: activities, error } = await supabase
        .from("activities")
        .select("*")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get profiles for those users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", followingIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return (activities || []).map((a) => ({
        ...a,
        username: profileMap.get(a.user_id)?.username || "Utilisateur",
        avatar_url: profileMap.get(a.user_id)?.avatar_url,
      })) as Activity[];
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getUserActivities = async (userId: string, limit = 20): Promise<Activity[]> => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as Activity[];
    } catch (error) {
      console.error("Error fetching user activities:", error);
      return [];
    }
  };

  return {
    loading,
    createActivity,
    getFollowingActivities,
    getUserActivities,
  };
}
