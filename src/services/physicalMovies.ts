import { supabase } from "@/lib/supabase";

export type PhysicalFormat = "dvd" | "bluray" | "4k" | "steelbook" | "collector";

export interface PhysicalMovie {
  id: string;
  user_id: string;
  tmdb_id: number;
  format: PhysicalFormat;
  price: number | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddPhysicalMovieData {
  tmdb_id: number;
  format: PhysicalFormat;
  price?: number | null;
  purchase_date?: string | null;
  notes?: string | null;
}

export const formatLabels: Record<PhysicalFormat, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  "4k": "4K UHD",
  steelbook: "Steelbook",
  collector: "Édition Collector",
};

export const getPhysicalMovies = async (userId: string): Promise<PhysicalMovie[]> => {
  const { data, error } = await supabase
    .from("physical_movies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching physical movies:", error);
    return [];
  }

  return data || [];
};

export const addPhysicalMovie = async (
  userId: string,
  movieData: AddPhysicalMovieData
): Promise<PhysicalMovie | null> => {
  const { data, error } = await supabase
    .from("physical_movies")
    .insert({
      user_id: userId,
      tmdb_id: movieData.tmdb_id,
      format: movieData.format,
      price: movieData.price || null,
      purchase_date: movieData.purchase_date || null,
      notes: movieData.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding physical movie:", error);
    throw error;
  }

  return data;
};

export const updatePhysicalMovie = async (
  id: string,
  updates: Partial<AddPhysicalMovieData>
): Promise<PhysicalMovie | null> => {
  const { data, error } = await supabase
    .from("physical_movies")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating physical movie:", error);
    throw error;
  }

  return data;
};

export const deletePhysicalMovie = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("physical_movies")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting physical movie:", error);
    return false;
  }

  return true;
};

export const getPhysicalMovieStats = (movies: PhysicalMovie[]) => {
  const totalMovies = movies.length;
  const totalValue = movies.reduce((sum, m) => sum + (m.price || 0), 0);
  const byFormat = movies.reduce((acc, m) => {
    acc[m.format] = (acc[m.format] || 0) + 1;
    return acc;
  }, {} as Record<PhysicalFormat, number>);

  return { totalMovies, totalValue, byFormat };
};
