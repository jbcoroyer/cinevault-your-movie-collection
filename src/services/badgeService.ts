import { supabase } from "@/lib/supabase";

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

// Helper pour récupérer les stats complètes
const getUserStats = async (userId: string) => {
  // Comptage des films physiques (inventaire vidéo club)
  const { count: physicalCount } = await supabase
    .from("physical_movies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Comptage par format
  const { data: formatData } = await supabase
    .from("physical_movies")
    .select("format")
    .eq("user_id", userId);

  const formatCounts: Record<string, number> = {};
  if (formatData) {
    formatData.forEach((item) => {
      const format = item.format.toLowerCase();
      // Normaliser les formats (bluray, blu-ray -> bluray)
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

  return {
    movie_count: physicalCount || 0, // Compte les films physiques pour movie_count
    physical_count: physicalCount || 0,
    watched_count: watchedCount || 0,
    review_count: reviewCount || 0,
    format_counts: formatCounts,
  };
};

// Vérifie si un critère est satisfait
const checkCriteria = (criteria: any, stats: Awaited<ReturnType<typeof getUserStats>>): { eligible: boolean; currentVal: number; targetVal: number } => {
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
      // Récupère le format demandé et compte
      const format = (criteria.value || "").toLowerCase();
      currentVal = stats.format_counts[format] || 0;
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
        .select("*");
      
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
      supabase.from("badge_definitions").select("*"),
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
    console.log("[BadgeService] Stats:", stats);

    for (const def of definitions) {
      // Déjà débloqué ? On passe.
      if (existingBadgeIds.has(def.id)) continue;

      const { eligible } = checkCriteria(def.criteria as any, stats);
      
      console.log(`[BadgeService] Badge ${def.id}: eligible=${eligible}`);

      if (eligible) {
        newBadgesToInsert.push({
          user_id: userId,
          badge_id: def.id,
          rarity: def.base_rarity,
        });
        unlockedBadgeIds.push(def.id);
      }
    }

    if (newBadgesToInsert.length > 0) {
      console.log("[BadgeService] Inserting badges:", newBadgesToInsert);
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
