import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserMovie } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";

export const useUserMovies = () => {
  const { user } = useAuth();
  const { checkBadges } = useBadgeNotification(); // Connexion aux badges
  const [userMovies, setUserMovies] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const userMoviesRef = useRef<UserMovie[]>([]);

  useEffect(() => {
    userMoviesRef.current = userMovies;
  }, [userMovies]);

  const fetchUserMovies = useCallback(async () => {
    if (!user) {
      setUserMovies([]);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.from("user_movies").select("*").eq("user_id", user.id);
      if (error) throw error;
      setUserMovies((data as UserMovie[]) || []);
    } catch (error) {
      console.error("Error fetching user movies:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserMovies();
  }, [fetchUserMovies]);

  const getLatestUserMovie = (tmdbId: number): UserMovie | undefined => {
    return userMoviesRef.current.find((m) => m.tmdb_id === tmdbId);
  };

  const getUserMovie = useCallback(
    (tmdbId: number): UserMovie | undefined => {
      return userMovies.find((m) => m.tmdb_id === tmdbId);
    },
    [userMovies],
  );

  // --- ACTIONS ---

  const addToWatchlist = async (tmdbId: number) => {
    if (!user) return;
    try {
      const existing = getLatestUserMovie(tmdbId);
      if (existing) {
        if (existing.status === "watchlist") {
          await supabase.from("user_movies").update({ status: "none" }).eq("id", existing.id);
          toast({ title: "Retiré de la watchlist" });
        } else {
          await supabase.from("user_movies").update({ status: "watchlist" }).eq("id", existing.id);
          toast({ title: "Ajouté à la watchlist" });
        }
      } else {
        await supabase.from("user_movies").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: "watchlist",
          is_favorite: false,
        });
        toast({ title: "Ajouté à la watchlist" });
      }
      await fetchUserMovies();
      checkBadges(); // Vérification des badges
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const markAsWatched = async (tmdbId: number) => {
    if (!user) return;
    try {
      const existing = getLatestUserMovie(tmdbId);
      if (existing) {
        if (existing.status === "watched") {
          await supabase.from("user_movies").update({ status: "none", watched_at: null }).eq("id", existing.id);
          toast({ title: "Retiré des films vus" });
        } else {
          await supabase
            .from("user_movies")
            .update({ status: "watched", watched_at: new Date().toISOString() })
            .eq("id", existing.id);
          toast({ title: "Marqué comme vu" });
        }
      } else {
        await supabase.from("user_movies").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: "watched",
          is_favorite: false,
          watched_at: new Date().toISOString(),
        });
        toast({ title: "Marqué comme vu" });
      }
      await fetchUserMovies();
      checkBadges(); // Vérification des badges
    } catch (error) {
      console.error("Error toggling watched:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const markAsWatchedWithDetails = async (
    tmdbId: number,
    details: { watchedDate?: string; rating?: number; review?: string },
  ) => {
    if (!user) return;
    try {
      const existing = getLatestUserMovie(tmdbId);
      const updateData = {
        status: "watched",
        watched_at: details.watchedDate ? new Date(details.watchedDate).toISOString() : new Date().toISOString(),
        rating: details.rating,
        review: details.review,
      };

      if (existing) {
        if (existing.status === "watched" && !details.watchedDate && !details.rating && !details.review) {
          // Cas toggle off
          await supabase.from("user_movies").update({ status: "none", watched_at: null }).eq("id", existing.id);
          toast({ title: "Retiré des films vus" });
        } else {
          await supabase.from("user_movies").update(updateData).eq("id", existing.id);
          toast({ title: "Marqué comme vu" });
        }
      } else {
        await supabase.from("user_movies").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          is_favorite: false,
          ...updateData,
        });
        toast({ title: "Marqué comme vu" });
      }
      await fetchUserMovies();
      checkBadges(); // Vérification des badges
    } catch (error) {
      console.error("Error marking as watched:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const toggleFavorite = async (tmdbId: number) => {
    if (!user) return;
    try {
      const existing = getLatestUserMovie(tmdbId);
      if (existing) {
        const newValue = !existing.is_favorite;
        await supabase.from("user_movies").update({ is_favorite: newValue }).eq("id", existing.id);
        toast({ title: newValue ? "Ajouté aux favoris" : "Retiré des favoris" });
      } else {
        await supabase.from("user_movies").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: "none",
          is_favorite: true,
        });
        toast({ title: "Ajouté aux favoris" });
      }
      await fetchUserMovies();
      // Pas forcément de badge pour favori, mais on peut laisser la vérif
      checkBadges();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const updateRating = async (tmdbId: number, rating: number) => {
    if (!user) return;
    try {
      const existing = getUserMovie(tmdbId);
      if (existing) {
        await supabase.from("user_movies").update({ rating }).eq("id", existing.id);
      } else {
        await supabase.from("user_movies").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: "none",
          is_favorite: false,
          rating,
        });
      }
      await fetchUserMovies();
      toast({ title: "Note enregistrée" });
      checkBadges(); // Vérification des badges
    } catch (error) {
      console.error("Error updating rating:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const updateReview = async (tmdbId: number, review: string) => {
    if (!user) return;
    try {
      const existing = getUserMovie(tmdbId);
      if (existing) {
        await supabase.from("user_movies").update({ review }).eq("id", existing.id);
      } else {
        await supabase.from("user_movies").insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: "none",
          is_favorite: false,
          review,
        });
      }
      await fetchUserMovies();
      toast({ title: "Avis enregistré" });
      checkBadges(); // Vérification des badges
    } catch (error) {
      console.error("Error updating review:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const removeMovie = async (tmdbId: number) => {
    if (!user) return;
    try {
      const existing = getUserMovie(tmdbId);
      if (!existing) return;
      await supabase.from("user_movies").delete().eq("id", existing.id);
      await fetchUserMovies();
      toast({ title: "Film supprimé de votre collection" });
      // On ne vérifie pas les badges à la suppression (on ne retire pas les badges acquis)
    } catch (error) {
      console.error("Error removing movie:", error);
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return {
    userMovies,
    loading,
    getUserMovie,
    addToWatchlist,
    markAsWatched,
    markAsWatchedWithDetails,
    toggleFavorite,
    updateRating,
    updateReview,
    removeMovie,
    refresh: fetchUserMovies,
  };
};
