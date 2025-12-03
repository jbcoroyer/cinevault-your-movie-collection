import { useState, useEffect, useCallback } from 'react';
import { supabase, UserMovie } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const useUserMovies = () => {
  const { user } = useAuth();
  const [userMovies, setUserMovies] = useState<UserMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserMovies = useCallback(async () => {
    if (!user) {
      setUserMovies([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_movies')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserMovies(data || []);
    } catch (error) {
      console.error('Error fetching user movies:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserMovies();
  }, [fetchUserMovies]);

  const getUserMovie = useCallback(
    (tmdbId: number): UserMovie | undefined => {
      return userMovies.find((m) => m.tmdb_id === tmdbId);
    },
    [userMovies]
  );

  const addToWatchlist = async (tmdbId: number) => {
    if (!user) return;

    try {
      const existing = getUserMovie(tmdbId);
      
      if (existing) {
        const { error } = await supabase
          .from('user_movies')
          .update({ status: 'watchlist', updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_movies').insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: 'watchlist',
          is_favorite: false,
        });
        
        if (error) throw error;
      }
      
      await fetchUserMovies();
      toast({ title: 'Ajouté à la watchlist' });
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'ajouter à la watchlist', variant: 'destructive' });
    }
  };

  const markAsWatched = async (tmdbId: number) => {
    if (!user) return;

    try {
      const existing = getUserMovie(tmdbId);
      
      if (existing) {
        const { error } = await supabase
          .from('user_movies')
          .update({ status: 'watched', updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_movies').insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: 'watched',
          is_favorite: false,
        });
        
        if (error) throw error;
      }
      
      await fetchUserMovies();
      toast({ title: 'Marqué comme vu' });
    } catch (error) {
      console.error('Error marking as watched:', error);
      toast({ title: 'Erreur', description: 'Impossible de marquer comme vu', variant: 'destructive' });
    }
  };

  const toggleFavorite = async (tmdbId: number) => {
    if (!user) return;

    try {
      const existing = getUserMovie(tmdbId);
      
      if (existing) {
        const { error } = await supabase
          .from('user_movies')
          .update({ is_favorite: !existing.is_favorite, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_movies').insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: 'watchlist',
          is_favorite: true,
        });
        
        if (error) throw error;
      }
      
      await fetchUserMovies();
      toast({ title: existing?.is_favorite ? 'Retiré des favoris' : 'Ajouté aux favoris' });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const updateRating = async (tmdbId: number, rating: number) => {
    if (!user) return;

    try {
      const existing = getUserMovie(tmdbId);
      
      if (existing) {
        const { error } = await supabase
          .from('user_movies')
          .update({ rating, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_movies').insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: 'watchlist',
          is_favorite: false,
          rating,
        });
        
        if (error) throw error;
      }
      
      await fetchUserMovies();
      toast({ title: 'Note enregistrée' });
    } catch (error) {
      console.error('Error updating rating:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const updateReview = async (tmdbId: number, review: string) => {
    if (!user) return;

    try {
      const existing = getUserMovie(tmdbId);
      
      if (existing) {
        const { error } = await supabase
          .from('user_movies')
          .update({ review, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_movies').insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          status: 'watchlist',
          is_favorite: false,
          review,
        });
        
        if (error) throw error;
      }
      
      await fetchUserMovies();
      toast({ title: 'Avis enregistré' });
    } catch (error) {
      console.error('Error updating review:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const removeMovie = async (tmdbId: number) => {
    if (!user) return;

    try {
      const existing = getUserMovie(tmdbId);
      if (!existing) return;

      const { error } = await supabase
        .from('user_movies')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      
      await fetchUserMovies();
      toast({ title: 'Film supprimé de votre collection' });
    } catch (error) {
      console.error('Error removing movie:', error);
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  return {
    userMovies,
    loading,
    getUserMovie,
    addToWatchlist,
    markAsWatched,
    toggleFavorite,
    updateRating,
    updateReview,
    removeMovie,
    refresh: fetchUserMovies,
  };
};
