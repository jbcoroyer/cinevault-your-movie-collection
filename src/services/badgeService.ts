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
  criteria: any;
  progress?: number;
  currentVal?: number;
  targetVal?: number;
}

export const fetchAllBadges = async (userId: string): Promise<Badge[]> => {
  try {
    // 1. Récupérer toutes les définitions
    const { data: definitions, error: defError } = await supabase.from("badge_definitions").select("*");

    if (defError) throw defError;

    // 2. Récupérer les badges acquis par l'utilisateur
    const { data: userBadges, error: userError } = await supabase.from("user_badges").select("*").eq("user_id", userId);

    if (userError) throw userError;

    // 3. Fusionner les données
    // Note: Dans une vraie prod, on récupèrerait aussi les stats (counts) pour la barre de progression
    // Pour l'instant, on simule une progression à 0 si non débloqué pour simplifier l'UI

    const fullBadges = definitions.map((def) => {
      const userBadge = userBadges.find((ub) => ub.badge_id === def.id);

      return {
        ...def,
        isUnlocked: !!userBadge,
        unlockedAt: userBadge?.unlocked_at,
        rarity: userBadge?.rarity || def.base_rarity,
        progress: userBadge ? 100 : 0, // TODO: Connecter aux vrais stats user_movies
        currentVal: userBadge ? def.criteria.count || 1 : 0,
        targetVal: def.criteria.count || 1,
      };
    });

    return fullBadges;
  } catch (error) {
    console.error("Error fetching badges:", error);
    return [];
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
