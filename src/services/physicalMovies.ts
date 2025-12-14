import { supabase } from "@/integrations/supabase/client";

// ============================================
// Types
// ============================================

export type PhysicalFormat = "dvd" | "bluray" | "4k" | "steelbook" | "collector";
export type PhysicalCondition = "mint" | "very_good" | "good" | "acceptable";

export interface PhysicalMovie {
  id: string;
  user_id: string;
  tmdb_id: number;
  format: PhysicalFormat;
  condition: PhysicalCondition;
  price: number | null;
  purchase_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddPhysicalMovieData {
  tmdb_id: number;
  format: PhysicalFormat;
  condition?: PhysicalCondition;
  price?: number | null;
  purchase_date?: string | null;
  notes?: string | null;
}

// ============================================
// Labels & Colors
// ============================================

export const formatLabels: Record<PhysicalFormat, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  "4k": "4K UHD",
  steelbook: "Steelbook",
  collector: "Édition Collector",
};

export const formatColors: Record<PhysicalFormat, string> = {
  dvd: "bg-slate-500",
  bluray: "bg-blue-600",
  "4k": "bg-purple-600",
  steelbook: "bg-amber-600",
  collector: "bg-red-600",
};

export const conditionLabels: Record<PhysicalCondition, string> = {
  mint: "Neuf",
  very_good: "Très bon",
  good: "Bon",
  acceptable: "Acceptable",
};

export const conditionColors: Record<PhysicalCondition, string> = {
  mint: "bg-emerald-500",
  very_good: "bg-blue-500",
  good: "bg-amber-500",
  acceptable: "bg-orange-500",
};

// ============================================
// CRUD Operations
// ============================================

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

  return (data as PhysicalMovie[]) || [];
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
      condition: movieData.condition || "good",
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

  return data as PhysicalMovie;
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

  return data as PhysicalMovie;
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

// ============================================
// Statistics Functions
// ============================================

export interface CollectionStats {
  totalMovies: number;
  totalValue: number;
  averagePrice: number;
  byFormat: Record<PhysicalFormat, number>;
  byCondition: Record<PhysicalCondition, number>;
  uniqueTitles: number;
  duplicateEditions: number;
}

export const getPhysicalMovieStats = (movies: PhysicalMovie[]): CollectionStats => {
  const totalMovies = movies.length;
  const totalValue = movies.reduce((sum, m) => sum + (m.price || 0), 0);
  const moviesWithPrice = movies.filter(m => m.price !== null && m.price > 0);
  const averagePrice = moviesWithPrice.length > 0 
    ? totalValue / moviesWithPrice.length 
    : 0;

  const byFormat = movies.reduce((acc, m) => {
    acc[m.format] = (acc[m.format] || 0) + 1;
    return acc;
  }, {} as Record<PhysicalFormat, number>);

  const byCondition = movies.reduce((acc, m) => {
    const condition = m.condition || "good";
    acc[condition] = (acc[condition] || 0) + 1;
    return acc;
  }, {} as Record<PhysicalCondition, number>);

  // Calcul des titres uniques et doublons
  const tmdbIds = movies.map(m => m.tmdb_id);
  const uniqueTmdbIds = new Set(tmdbIds);
  const uniqueTitles = uniqueTmdbIds.size;
  const duplicateEditions = totalMovies - uniqueTitles;

  return { 
    totalMovies, 
    totalValue, 
    averagePrice,
    byFormat, 
    byCondition,
    uniqueTitles,
    duplicateEditions
  };
};

// Stats par genre (nécessite movieDetails)
export interface GenreStats {
  name: string;
  count: number;
}

export const getGenreStats = (
  movies: PhysicalMovie[], 
  movieDetailsMap: Record<number, { genres?: { id: number; name: string }[] }>
): GenreStats[] => {
  const genreCount: Record<string, number> = {};

  movies.forEach(pm => {
    const details = movieDetailsMap[pm.tmdb_id];
    if (details?.genres) {
      details.genres.forEach(genre => {
        genreCount[genre.name] = (genreCount[genre.name] || 0) + 1;
      });
    }
  });

  return Object.entries(genreCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

// Stats par décennie
export interface DecadeStats {
  decade: string;
  count: number;
}

export const getDecadeStats = (
  movies: PhysicalMovie[],
  movieDetailsMap: Record<number, { release_date?: string }>
): DecadeStats[] => {
  const decadeCount: Record<string, number> = {};

  movies.forEach(pm => {
    const details = movieDetailsMap[pm.tmdb_id];
    if (details?.release_date) {
      const year = new Date(details.release_date).getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      decadeCount[decade] = (decadeCount[decade] || 0) + 1;
    }
  });

  return Object.entries(decadeCount)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));
};

// Stats par réalisateur
export interface DirectorStats {
  name: string;
  count: number;
}

export const getDirectorStats = (
  movies: PhysicalMovie[],
  movieDetailsMap: Record<number, { credits?: { crew: { job: string; name: string }[] } }>
): DirectorStats[] => {
  const directorCount: Record<string, number> = {};

  movies.forEach(pm => {
    const details = movieDetailsMap[pm.tmdb_id];
    const director = details?.credits?.crew.find(c => c.job === "Director");
    if (director) {
      directorCount[director.name] = (directorCount[director.name] || 0) + 1;
    }
  });

  return Object.entries(directorCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

// Stats par acteur (top cast)
export interface ActorStats {
  name: string;
  count: number;
}

export const getActorStats = (
  movies: PhysicalMovie[],
  movieDetailsMap: Record<number, { credits?: { cast: { name: string; order: number }[] } }>
): ActorStats[] => {
  const actorCount: Record<string, number> = {};

  movies.forEach(pm => {
    const details = movieDetailsMap[pm.tmdb_id];
    // On prend les 5 premiers acteurs de chaque film
    const topCast = details?.credits?.cast.slice(0, 5) || [];
    topCast.forEach(actor => {
      actorCount[actor.name] = (actorCount[actor.name] || 0) + 1;
    });
  });

  return Object.entries(actorCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

// Timeline des achats par mois
export interface TimelineEntry {
  month: string; // Format: "2024-01"
  label: string; // Format: "Janvier 2024"
  count: number;
  totalSpent: number;
  movies: PhysicalMovie[];
}

export const getTimelineStats = (movies: PhysicalMovie[]): TimelineEntry[] => {
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const monthlyData: Record<string, { count: number; totalSpent: number; movies: PhysicalMovie[] }> = {};

  movies.forEach(pm => {
    const date = pm.purchase_date ? new Date(pm.purchase_date) : new Date(pm.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { count: 0, totalSpent: 0, movies: [] };
    }
    
    monthlyData[monthKey].count += 1;
    monthlyData[monthKey].totalSpent += pm.price || 0;
    monthlyData[monthKey].movies.push(pm);
  });

  return Object.entries(monthlyData)
    .map(([month, data]) => {
      const [year, monthNum] = month.split('-');
      const label = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
      return {
        month,
        label,
        ...data
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month)); // Plus récent en premier
};

// Obtenir les films avec plusieurs éditions
export interface MultiEditionGroup {
  tmdb_id: number;
  editions: PhysicalMovie[];
}

export const getMultiEditions = (movies: PhysicalMovie[]): MultiEditionGroup[] => {
  const grouped: Record<number, PhysicalMovie[]> = {};

  movies.forEach(pm => {
    if (!grouped[pm.tmdb_id]) {
      grouped[pm.tmdb_id] = [];
    }
    grouped[pm.tmdb_id].push(pm);
  });

  return Object.entries(grouped)
    .filter(([_, editions]) => editions.length > 1)
    .map(([tmdb_id, editions]) => ({
      tmdb_id: parseInt(tmdb_id),
      editions
    }));
};
