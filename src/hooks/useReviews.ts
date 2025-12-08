import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Review {
  id: string;
  user_id: string;
  tmdb_id: number;
  movie_title: string;
  movie_poster_path: string | null;
  movie_release_year: number | null;
  rating: number | null;
  content: string;
  contains_spoilers: boolean;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  username?: string;
  avatar_url?: string | null;
}

interface CreateReviewData {
  tmdb_id: number;
  movie_title: string;
  movie_poster_path: string | null;
  movie_release_year: number | null;
  rating?: number;
  content: string;
  contains_spoilers: boolean;
}

interface UpdateReviewData {
  rating?: number;
  content: string;
  contains_spoilers: boolean;
}

export function useReviews() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Helper to fetch profiles for reviews
  const fetchProfilesForReviews = async (reviews: any[]): Promise<Review[]> => {
    if (reviews.length === 0) return [];
    
    const userIds = [...new Set(reviews.map((r) => r.user_id))];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", userIds);
    
    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
    
    return reviews.map((r) => {
      const profile = profileMap.get(r.user_id);
      return {
        ...r,
        contains_spoilers: r.contains_spoilers ?? false,
        username: profile?.username ?? undefined,
        avatar_url: profile?.avatar_url,
      };
    });
  };

  // Fetch all reviews (global feed)
  const fetchAllReviews = useCallback(async (): Promise<Review[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return await fetchProfilesForReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reviews from followed users
  const fetchFollowingReviews = useCallback(async (): Promise<Review[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      // Get followed user IDs
      const { data: follows, error: followsError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followsError) throw followsError;

      const followingIds = follows?.map((f) => f.following_id) || [];
      
      if (followingIds.length === 0) return [];

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return await fetchProfilesForReviews(data || []);
    } catch (error) {
      console.error("Error fetching following reviews:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch reviews for a specific movie
  const fetchMovieReviews = useCallback(
    async (tmdbId: number, limit = 20): Promise<Review[]> => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("tmdb_id", tmdbId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) throw error;

        return await fetchProfilesForReviews(data || []);
      } catch (error) {
        console.error("Error fetching movie reviews:", error);
        return [];
      }
    },
    []
  );

  // Get my review for a movie
  const getMyReview = useCallback(
    async (tmdbId: number): Promise<Review | null> => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("tmdb_id", tmdbId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) return null;

        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        return {
          ...data,
          contains_spoilers: data.contains_spoilers ?? false,
          username: profile?.username ?? undefined,
          avatar_url: profile?.avatar_url,
        };
      } catch (error) {
        console.error("Error fetching my review:", error);
        return null;
      }
    },
    [user]
  );

  // Create a new review
  const createReview = useCallback(
    async (reviewData: CreateReviewData): Promise<Review | null> => {
      if (!user) {
        toast.error("Vous devez être connecté pour publier un avis");
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("reviews")
          .insert({
            user_id: user.id,
            tmdb_id: reviewData.tmdb_id,
            movie_title: reviewData.movie_title,
            movie_poster_path: reviewData.movie_poster_path,
            movie_release_year: reviewData.movie_release_year,
            rating: reviewData.rating ?? null,
            content: reviewData.content,
            contains_spoilers: reviewData.contains_spoilers,
          })
          .select("*")
          .single();

        if (error) throw error;

        // Fetch profile separately
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        toast.success("Avis publié avec succès !");

        return {
          ...data,
          contains_spoilers: data.contains_spoilers ?? false,
          username: profile?.username ?? undefined,
          avatar_url: profile?.avatar_url,
        };
      } catch (error: any) {
        console.error("Error creating review:", error);
        toast.error("Erreur lors de la publication de l'avis");
        return null;
      }
    },
    [user]
  );

  // Update an existing review
  const updateReview = useCallback(
    async (reviewId: string, reviewData: UpdateReviewData): Promise<boolean> => {
      if (!user) {
        toast.error("Vous devez être connecté pour modifier un avis");
        return false;
      }

      try {
        const { error } = await supabase
          .from("reviews")
          .update({
            rating: reviewData.rating ?? null,
            content: reviewData.content,
            contains_spoilers: reviewData.contains_spoilers,
            updated_at: new Date().toISOString(),
          })
          .eq("id", reviewId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("Avis modifié avec succès !");
        return true;
      } catch (error) {
        console.error("Error updating review:", error);
        toast.error("Erreur lors de la modification de l'avis");
        return false;
      }
    },
    [user]
  );

  // Delete a review
  const deleteReview = useCallback(
    async (reviewId: string): Promise<boolean> => {
      if (!user) {
        toast.error("Vous devez être connecté pour supprimer un avis");
        return false;
      }

      try {
        const { error } = await supabase
          .from("reviews")
          .delete()
          .eq("id", reviewId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("Avis supprimé");
        return true;
      } catch (error) {
        console.error("Error deleting review:", error);
        toast.error("Erreur lors de la suppression de l'avis");
        return false;
      }
    },
    [user]
  );

  return {
    loading,
    fetchAllReviews,
    fetchFollowingReviews,
    fetchMovieReviews,
    getMyReview,
    createReview,
    updateReview,
    deleteReview,
  };
}
