import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TopMovie {
  id: string;
  slot: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
}

export function useUserTopMovies(targetUserId?: string) {
  const { user } = useAuth();
  const [topMovies, setTopMovies] = useState<TopMovie[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = targetUserId || user?.id;

  const fetchTopMovies = async () => {
    if (!userId) {
      setTopMovies([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_top_movies')
      .select('*')
      .eq('user_id', userId)
      .order('slot', { ascending: true });

    if (!error && data) {
      setTopMovies(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTopMovies();
  }, [userId]);

  const setTopMovie = async (
    slot: number,
    movie: { tmdb_id: number; title: string; poster_path: string | null }
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Upsert: insert or update if slot already exists
    const { error } = await supabase
      .from('user_top_movies')
      .upsert(
        {
          user_id: user.id,
          slot,
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path,
        },
        { onConflict: 'user_id,slot' }
      );

    if (!error) {
      await fetchTopMovies();
    }

    return { error };
  };

  const removeTopMovie = async (slot: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_top_movies')
      .delete()
      .eq('user_id', user.id)
      .eq('slot', slot);

    if (!error) {
      await fetchTopMovies();
    }

    return { error };
  };

  return { topMovies, loading, setTopMovie, removeTopMovie, refetch: fetchTopMovies };
}
