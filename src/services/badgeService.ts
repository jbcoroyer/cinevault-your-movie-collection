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
  rarity?: string; // Peut être différent de base_rarity si 'holographic'
  criteria: {
    type: string;
    count: number;
    genre?: string;
    [key: string]: any;
  };
  progress?: number;
  currentVal?: number;
  targetVal?: number;
}

// Helper pour récupérer les stats globales de l'utilisateur
const getUserStats = async (userId: string) => {
  const { count: movieCount } = await supabase
    .from("user_movies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const { count: watchedCount } = await supabase
    .from("user_movies")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "watched");

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    movie_count: movieCount || 0,
    watched_count: watchedCount || 0,
    review_count: reviewCount || 0,
  };
};

export const fetchAllBadges = async (userId: string): Promise<Badge[]> => {
  try {
    // 1. Récupérer toutes les définitions, les badges utilisateur et les stats en parallèle
    const [definitionsRes, userBadgesRes, stats] = await Promise.all([
      supabase.from("badge_definitions").select("*"),
      supabase.from("user_badges").select("*").eq("user_id", userId),
      getUserStats(userId),
    ]);

    if (definitionsRes.error) throw definitionsRes.error;
    if (userBadgesRes.error) throw userBadgesRes.error;

    const definitions = definitionsRes.data;
    const userBadges = userBadgesRes.data;

    // 2. Fusionner les données avec calcul de progression réelle
    const fullBadges = definitions.map((def) => {
      const userBadge = userBadges.find((ub) => ub.badge_id === def.id);
      const criteria = def.criteria as any;

      // Calcul de la valeur actuelle selon le type de critère
      let currentVal = 0;
      if (criteria.type === "movie_count") currentVal = stats.movie_count;
      else if (criteria.type === "watched_count") currentVal = stats.watched_count;
      else if (criteria.type === "review_count") currentVal = stats.review_count;
      // Ajoutez d'autres types ici si nécessaire (ex: genre_count)

      const targetVal = criteria.count || 1;
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

// Fonction pour vérifier et débloquer les badges automatiquement
export const checkAndUnlockBadges = async (userId: string) => {
  try {
    const [definitionsRes, userBadgesRes, stats] = await Promise.all([
      supabase.from("badge_definitions").select("*"),
      supabase.from("user_badges").select("*").eq("user_id", userId),
      getUserStats(userId),
    ]);

    if (definitionsRes.error || userBadgesRes.error) return;

    const definitions = definitionsRes.data;
    const userBadges = userBadgesRes.data;
    const newBadgesToInsert = [];

    for (const def of definitions) {
      // Si l'utilisateur a déjà ce badge, on ignore
      if (userBadges.some((ub) => ub.badge_id === def.id)) continue;

      const criteria = def.criteria as any;
      let isEligible = false;

      // Vérification des critères
      if (criteria.type === "movie_count" && stats.movie_count >= criteria.count) isEligible = true;
      if (criteria.type === "watched_count" && stats.watched_count >= criteria.count) isEligible = true;
      if (criteria.type === "review_count" && stats.review_count >= criteria.count) isEligible = true;

      if (isEligible) {
        console.log(`Unlocking badge: ${def.title}`);
        newBadgesToInsert.push({
          user_id: userId,
          badge_id: def.id,
          rarity: def.base_rarity, // On pourrait ajouter une logique de chance pour les versions holo ici
        });
      }
    }

    if (newBadgesToInsert.length > 0) {
      const { error } = await supabase.from("user_badges").insert(newBadgesToInsert);
      if (error) console.error("Error unlocking badges:", error);
    }
  } catch (error) {
    console.error("Error checking badge eligibility:", error);
  }
};

// Fonction de debug pour forcer l'unlock (utile pour tester l'UI)
export const debugUnlockBadge = async (userId: string, badgeId: string) => {
  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
    rarity: "holographic", // On force le shiny pour le test
  });
  return { error };
};
