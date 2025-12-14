/**
 * XP SERVICE - Vidéo Club Néo-Rétro
 * Gestion des points, niveaux et progression
 */

import { supabase } from "@/integrations/supabase/client";
import { XP_SOURCES, getXpProgress, getTitleForLevel, type Rarity, RARITY_CONFIG } from "@/data/videoClubData";

export interface XpGain {
  amount: number;
  source: string;
  rarity: Rarity;
}

/**
 * Calcule l'XP gagnée pour un format donné
 */
export function getXpForFormat(format: string): number {
  const normalizedFormat = format.toLowerCase();
  
  if (normalizedFormat.includes("vhs")) return XP_SOURCES.VHS;
  if (normalizedFormat.includes("laserdisc")) return XP_SOURCES.Laserdisc;
  if (normalizedFormat.includes("4k") || normalizedFormat.includes("uhd")) return XP_SOURCES["4K UHD"];
  if (normalizedFormat.includes("blu")) return XP_SOURCES["Blu-ray"];
  if (normalizedFormat.includes("dvd")) return XP_SOURCES.DVD;
  
  return XP_SOURCES.DVD; // Défaut
}

/**
 * Détermine la rareté basée sur le format et l'aléatoire
 */
export function calculateRarity(format: string): Rarity {
  const random = Math.random() * 100;
  const isRareFormat = format.toLowerCase().includes("vhs") || format.toLowerCase().includes("laserdisc");
  
  // Probabilités ajustées pour formats rares
  if (isRareFormat) {
    if (random < 5) return "grail";
    if (random < 20) return "legendary";
    if (random < 45) return "epic";
    if (random < 75) return "rare";
    return "common";
  }
  
  // Probabilités standard
  if (random < 1) return "grail";
  if (random < 5) return "legendary";
  if (random < 15) return "epic";
  if (random < 40) return "rare";
  return "common";
}

/**
 * Ajoute de l'XP au profil utilisateur
 */
export async function addXpToUser(userId: string, xpAmount: number): Promise<{
  success: boolean;
  newTotal: number;
  levelUp: boolean;
  newLevel: number;
  newTitle: string;
}> {
  try {
    // Récupérer l'XP actuel
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("total_xp")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    const currentXp = profile?.total_xp || 0;
    const newTotal = currentXp + xpAmount;
    
    const oldProgress = getXpProgress(currentXp);
    const newProgress = getXpProgress(newTotal);
    const levelUp = newProgress.currentLevel > oldProgress.currentLevel;
    const newTitle = getTitleForLevel(newProgress.currentLevel);

    // Mettre à jour le profil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        total_xp: newTotal,
        current_title: newTitle,
      })
      .eq("id", userId);

    if (updateError) throw updateError;

    return {
      success: true,
      newTotal,
      levelUp,
      newLevel: newProgress.currentLevel,
      newTitle,
    };
  } catch (error) {
    console.error("Error adding XP:", error);
    return {
      success: false,
      newTotal: 0,
      levelUp: false,
      newLevel: 1,
      newTitle: "Visiteur Curieux",
    };
  }
}

/**
 * Reset complet de l'XP utilisateur (pour migration)
 */
export async function resetUserXp(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        total_xp: 0,
        current_title: "Visiteur Curieux",
      })
      .eq("id", userId);

    return !error;
  } catch (error) {
    console.error("Error resetting XP:", error);
    return false;
  }
}

/**
 * Recalcule l'XP total basé sur la collection physique
 */
export async function recalculateUserXp(userId: string): Promise<number> {
  try {
    // Récupérer tous les films physiques
    const { data: movies, error } = await supabase
      .from("physical_movies")
      .select("format")
      .eq("user_id", userId);

    if (error) throw error;

    let totalXp = 0;
    for (const movie of movies || []) {
      totalXp += getXpForFormat(movie.format);
    }

    // Récupérer les reviews
    const { count: reviewCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    totalXp += (reviewCount || 0) * XP_SOURCES.review;

    // Mettre à jour le profil
    const newTitle = getTitleForLevel(getXpProgress(totalXp).currentLevel);
    await supabase
      .from("profiles")
      .update({ 
        total_xp: totalXp,
        current_title: newTitle,
      })
      .eq("id", userId);

    return totalXp;
  } catch (error) {
    console.error("Error recalculating XP:", error);
    return 0;
  }
}
