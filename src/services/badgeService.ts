import { supabase } from "@/integrations/supabase/client";

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: string;
  icon_name: string;
  xp_reward: number;
  base_rarity: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  rarity?: string;
  criteria: any;
  progress?: number;
  currentVal?: number;
  targetVal?: number;
}

// Helper pour récupérer les stats complètes (incluant genres et réalisateurs)
const getUserStats = async (userId: string) => {
  // Comptage des films physiques
  const { data: physicalData } = await supabase
    .from("physical_movies")
    .select("tmdb_id, format")
    .eq("user_id", userId);

  const physicalCount = physicalData?.length || 0;
  const tmdbIds = physicalData?.map(p => p.tmdb_id) || [];

  // Comptage par format
  const formatCounts: Record<string, number> = {};
  if (physicalData) {
    physicalData.forEach((item) => {
      const format = item.format.toLowerCase();
      let normalizedFormat = format;
      if (format.includes("blu") || format.includes("bluray")) normalizedFormat = "bluray";
      if (format.includes("4k") || format.includes("uhd")) normalizedFormat = "4k";
      if (format.includes("vhs")) normalizedFormat = "vhs";
      if (format.includes("dvd") && !format.includes("hd")) normalizedFormat = "dvd";
      if (format.includes("laser")) normalizedFormat = "laserdisc";
      
      formatCounts[normalizedFormat] = (formatCounts[normalizedFormat] || 0) + 1;
    });
  }

  // Films vus
  const { count: watchedCount } = await supabase
    .from("user_movies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "watched");

  // Critiques écrites
  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Récupérer les métadonnées des films pour genres et réalisateurs
  let genreCounts: Record<number, number> = {};
  let directorCounts: Record<number, number> = {};
  let decadeCounts: Record<number, number> = {};
  const uniqueGenres = new Set<number>();
  const uniqueDirectors = new Set<number>();

  if (tmdbIds.length > 0) {
    const { data: metadataList } = await supabase
      .from("movies_metadata")
      .select("tmdb_id, genres, director_id, release_year")
      .in("tmdb_id", tmdbIds);

    if (metadataList) {
      metadataList.forEach((movie) => {
        // Comptage par genre
        if (movie.genres && Array.isArray(movie.genres)) {
          (movie.genres as { id: number }[]).forEach((genre) => {
            genreCounts[genre.id] = (genreCounts[genre.id] || 0) + 1;
            uniqueGenres.add(genre.id);
          });
        }

        // Comptage par réalisateur
        if (movie.director_id) {
          directorCounts[movie.director_id] = (directorCounts[movie.director_id] || 0) + 1;
          uniqueDirectors.add(movie.director_id);
        }

        // Comptage par décennie
        if (movie.release_year) {
          const decade = Math.floor(movie.release_year / 10) * 10;
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }
      });
    }
  }

  // Comptage des followers
  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);

  return {
    movie_count: physicalCount,
    physical_count: physicalCount,
    watched_count: watchedCount || 0,
    review_count: reviewCount || 0,
    format_counts: formatCounts,
    genre_counts: genreCounts,
    director_counts: directorCounts,
    decade_counts: decadeCounts,
    genre_diversity: uniqueGenres.size,
    director_diversity: uniqueDirectors.size,
    follower_count: followerCount || 0,
  };
};

// Vérifie si un critère est satisfait
const checkCriteria = (
  criteria: any, 
  stats: Awaited<ReturnType<typeof getUserStats>>
): { eligible: boolean; currentVal: number; targetVal: number } => {
  if (!criteria || !criteria.type) {
    return { eligible: false, currentVal: 0, targetVal: 1 };
  }

  const targetVal = criteria.count || 1;
  let currentVal = 0;

  switch (criteria.type) {
    case "movie_count":
    case "physical_count":
      currentVal = stats.movie_count;
      break;
    
    case "watched_count":
      currentVal = stats.watched_count;
      break;
    
    case "review_count":
      currentVal = stats.review_count;
      break;
    
    case "format_count":
      const format = (criteria.value || "").toLowerCase();
      currentVal = stats.format_counts[format] || 0;
      break;
    
    case "genre_count":
      // Comptage de films d'un genre spécifique
      currentVal = stats.genre_counts[criteria.genre_id] || 0;
      break;
    
    case "genre_diversity":
      // Nombre de genres différents représentés
      currentVal = stats.genre_diversity;
      break;
    
    case "director_count":
      // Films d'un réalisateur spécifique
      currentVal = stats.director_counts[criteria.director_id] || 0;
      break;
    
    case "director_diversity":
      // Nombre de réalisateurs différents
      currentVal = stats.director_diversity;
      break;
    
    case "decade":
      // Films d'une décennie spécifique
      const decade = criteria.value || criteria.decade;
      if (decade) {
        currentVal = stats.decade_counts[parseInt(decade)] || 0;
      }
      break;
    
    case "followers":
      currentVal = stats.follower_count;
      break;
    
    default:
      currentVal = 0;
  }

  return {
    eligible: currentVal >= targetVal,
    currentVal,
    targetVal,
  };
};

export const fetchAllBadges = async (userId: string | null): Promise<Badge[]> => {
  try {
    // If no user, just return badge definitions without unlock status
    if (!userId) {
      const { data: definitions, error } = await supabase
        .from("badge_definitions")
        .select("*")
        .order("category", { ascending: true });
      
      if (error) throw error;
      
      return definitions.map((def) => ({
        ...def,
        criteria: def.criteria as any,
        isUnlocked: false,
        progress: 0,
        currentVal: 0,
        targetVal: (def.criteria as any)?.count || 1,
      }));
    }

    const [definitionsRes, userBadgesRes, stats] = await Promise.all([
      supabase.from("badge_definitions").select("*").order("category", { ascending: true }),
      supabase.from("user_badges").select("*").eq("user_id", userId),
      getUserStats(userId),
    ]);

    if (definitionsRes.error) throw definitionsRes.error;
    if (userBadgesRes.error) throw userBadgesRes.error;

    const definitions = definitionsRes.data;
    const userBadges = userBadgesRes.data;

    const fullBadges = definitions.map((def) => {
      const userBadge = userBadges.find((ub) => ub.badge_id === def.id);
      const criteria = def.criteria as any;
      
      const { currentVal, targetVal } = checkCriteria(criteria, stats);
      const progress = Math.min(100, Math.round((currentVal / targetVal) * 100));

      return {
        ...def,
        criteria,
        isUnlocked: !!userBadge,
        unlockedAt: userBadge?.unlocked_at,
        rarity: userBadge?.rarity || def.base_rarity,
        progress: userBadge ? 100 : progress,
        currentVal,
        targetVal,
      };
    });

    return fullBadges;
  } catch (error) {
    console.error("Error fetching badges:", error);
    return [];
  }
};

export const checkAndUnlockBadges = async (userId: string): Promise<string[]> => {
  const unlockedBadgeIds: string[] = [];
  
  try {
    const [definitionsRes, userBadgesRes, stats] = await Promise.all([
      supabase.from("badge_definitions").select("*"),
      supabase.from("user_badges").select("badge_id").eq("user_id", userId),
      getUserStats(userId),
    ]);

    if (definitionsRes.error || userBadgesRes.error) return [];

    const definitions = definitionsRes.data;
    const existingBadgeIds = new Set(userBadgesRes.data.map((ub) => ub.badge_id));
    const newBadgesToInsert = [];

    console.log("[BadgeService] Checking badges for user:", userId);
    console.log("[BadgeService] Stats:", {
      movies: stats.movie_count,
      genres: stats.genre_diversity,
      directors: stats.director_diversity,
    });

    for (const def of definitions) {
      // Déjà débloqué ? On passe.
      if (existingBadgeIds.has(def.id)) continue;

      const { eligible } = checkCriteria(def.criteria as any, stats);
      
      if (eligible) {
        console.log(`[BadgeService] Badge ${def.id} unlocked!`);
        newBadgesToInsert.push({
          user_id: userId,
          badge_id: def.id,
          rarity: def.base_rarity,
        });
        unlockedBadgeIds.push(def.id);
      }
    }

    if (newBadgesToInsert.length > 0) {
      console.log("[BadgeService] Inserting badges:", newBadgesToInsert.map(b => b.badge_id));
      const { error } = await supabase.from("user_badges").insert(newBadgesToInsert);
      if (error) {
        console.error("Error inserting unlocked badges:", error);
        return [];
      }
    }
    
    return unlockedBadgeIds;
  } catch (error) {
    console.error("Error checking badge eligibility:", error);
    return [];
  }
};

export const debugUnlockBadge = async (userId: string, badgeId: string) => {
  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
    rarity: "holographic",
  });
  return { error };
};

// Récupérer les stats de découverte pour l'affichage
export const getDiscoveryStats = async (userId: string) => {
  const stats = await getUserStats(userId);
  
  return {
    totalMovies: stats.movie_count,
    genresExplored: stats.genre_diversity,
    directorsDiscovered: stats.director_diversity,
    topGenres: Object.entries(stats.genre_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ genreId: parseInt(id), count })),
    topDirectors: Object.entries(stats.director_counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ directorId: parseInt(id), count })),
    decadeBreakdown: stats.decade_counts,
  };
};
