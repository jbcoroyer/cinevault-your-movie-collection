import { supabase } from "@/lib/supabase";
import { STATIC_BADGES } from "@/data/gameData";
import { toast } from "sonner";

export interface UserBadgeProgress {
  badgeId: string;
  current: number;
  target: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  rarity?: string;
}

/**
 * Récupère tous les badges de l'utilisateur avec leur état (débloqué/progression)
 */
export const fetchUserBadgesStatus = async (userId: string) => {
  try {
    // 1. Récupérer les badges débloqués depuis la DB
    const { data: unlockedBadges, error } = await supabase
      .from("user_badges") // Assurez-vous que cette table existe via la migration
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    // 2. Pour l'instant, on simule la progression basée sur les stats locales
    // Dans une version finale, ces stats viendraient d'une vue SQL "user_stats"
    const { data: movies } = await supabase.from("user_movies").select("tmdb_id, status").eq("user_id", userId);

    const { data: physical } = await supabase.from("physical_movies").select("format").eq("user_id", userId);

    // Calculs basiques (Mockup de la logique Edge Function)
    const stats = {
      totalWatched: movies?.filter((m) => m.status === "watched").length || 0,
      steelbooks: physical?.filter((p) => p.format === "steelbook").length || 0,
    };

    // 3. Mapper avec les définitions statiques
    const badgesStatus = STATIC_BADGES.map((def) => {
      const unlocked = unlockedBadges?.find((ub) => ub.badge_id === def.id);
      let current = 0;

      // Logique de progression simple (à remplacer par API backend)
      if (def.criteria.type === "format" && def.criteria.value === "steelbook") {
        current = stats.steelbooks;
      }
      // Ajouter d'autres logiques ici...

      return {
        ...def,
        isUnlocked: !!unlocked,
        rarity: unlocked?.rarity || def.baseRarity,
        progress: Math.min(100, (current / (def.criteria.count || 1)) * 100),
        currentVal: current,
        targetVal: def.criteria.count || 1,
      };
    });

    return badgesStatus;
  } catch (err) {
    console.error("Error fetching badges:", err);
    return [];
  }
};

/**
 * Fonction de debug pour débloquer un badge manuellement (pour test)
 */
export const debugUnlockBadge = async (userId: string, badgeId: string) => {
  const def = STATIC_BADGES.find((b) => b.id === badgeId);
  if (!def) return;

  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
    rarity: def.baseRarity, // Pourrait être calculé aléatoirement pour le "minting"
    metadata: { unlocked_via: "debug" },
  });

  if (!error) {
    toast.success(`Badge débloqué : ${def.title}`, {
      description: "Vous avez gagné de l'XP !",
      icon: "🏆" as any, // Casting as any to avoid type issues with sonner icons if strict
    });
  }
};
