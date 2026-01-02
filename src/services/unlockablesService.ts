/**
 * CineVault - Unlockables Service
 * 
 * Service pour gérer les fonctionnalités débloquables par niveau/XP/badges
 */

import { supabase } from "@/integrations/supabase/client";
import { getLevelFromXp } from "@/data/videoClubData";

export interface UnlockableFeature {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  unlock_type: 'level' | 'xp' | 'badge_count' | 'movie_count' | 'streak';
  unlock_value: number;
  category: 'feature' | 'cosmetic' | 'social' | 'stats';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'grail';
  preview_data: Record<string, any>;
  is_active: boolean;
  isUnlocked?: boolean;
  progress?: number;
}

export interface UserStats {
  level: number;
  xp: number;
  badge_count: number;
  movie_count: number;
  streak: number;
}

/**
 * Récupère toutes les fonctionnalités débloquables avec l'état de déblocage
 */
export async function fetchUnlockableFeatures(userId: string): Promise<UnlockableFeature[]> {
  // Récupérer les définitions
  const { data: features, error: featuresError } = await supabase
    .from('unlockable_features')
    .select('*')
    .eq('is_active', true)
    .order('unlock_value', { ascending: true });

  if (featuresError) {
    console.error('Error fetching unlockable features:', featuresError);
    return [];
  }

  // Récupérer les déblocages de l'utilisateur
  const { data: unlocks } = await supabase
    .from('user_unlocks')
    .select('feature_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(unlocks?.map(u => u.feature_id) || []);

  // Récupérer les stats utilisateur pour calculer la progression
  const stats = await getUserStats(userId);

  return features.map(feature => ({
    ...feature,
    isUnlocked: unlockedIds.has(feature.id) || checkUnlockEligibility(feature, stats),
    progress: calculateProgress(feature, stats),
  })) as UnlockableFeature[];
}

/**
 * Récupère les statistiques de l'utilisateur
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  const [profileRes, badgeCountRes, movieCountRes, streakRes] = await Promise.all([
    supabase.from('profiles').select('total_xp').eq('id', userId).single(),
    supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('physical_movies').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_streaks').select('current_streak').eq('user_id', userId).single(),
  ]);

  const xp = profileRes.data?.total_xp || 0;
  
  return {
    level: getLevelFromXp(xp),
    xp,
    badge_count: badgeCountRes.count || 0,
    movie_count: movieCountRes.count || 0,
    streak: streakRes.data?.current_streak || 0,
  };
}

/**
 * Vérifie si l'utilisateur est éligible au déblocage
 */
function checkUnlockEligibility(feature: any, stats: UserStats): boolean {
  switch (feature.unlock_type) {
    case 'level':
      return stats.level >= feature.unlock_value;
    case 'xp':
      return stats.xp >= feature.unlock_value;
    case 'badge_count':
      return stats.badge_count >= feature.unlock_value;
    case 'movie_count':
      return stats.movie_count >= feature.unlock_value;
    case 'streak':
      return stats.streak >= feature.unlock_value;
    default:
      return false;
  }
}

/**
 * Calcule la progression vers le déblocage (0-100)
 */
function calculateProgress(feature: any, stats: UserStats): number {
  let current = 0;
  
  switch (feature.unlock_type) {
    case 'level':
      current = stats.level;
      break;
    case 'xp':
      current = stats.xp;
      break;
    case 'badge_count':
      current = stats.badge_count;
      break;
    case 'movie_count':
      current = stats.movie_count;
      break;
    case 'streak':
      current = stats.streak;
      break;
  }

  return Math.min((current / feature.unlock_value) * 100, 100);
}

/**
 * Enregistre un déblocage pour l'utilisateur
 */
export async function unlockFeature(userId: string, featureId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_unlocks')
    .insert({ user_id: userId, feature_id: featureId });

  return !error;
}

/**
 * Vérifie et débloque automatiquement les fonctionnalités éligibles
 */
export async function checkAndUnlockFeatures(userId: string): Promise<string[]> {
  const stats = await getUserStats(userId);
  
  const { data: features } = await supabase
    .from('unlockable_features')
    .select('*')
    .eq('is_active', true);

  const { data: existingUnlocks } = await supabase
    .from('user_unlocks')
    .select('feature_id')
    .eq('user_id', userId);

  const unlockedIds = new Set(existingUnlocks?.map(u => u.feature_id) || []);
  const newUnlocks: string[] = [];

  for (const feature of features || []) {
    if (unlockedIds.has(feature.id)) continue;

    if (checkUnlockEligibility(feature, stats)) {
      const { error } = await supabase
        .from('user_unlocks')
        .insert({ user_id: userId, feature_id: feature.id });

      if (!error) {
        newUnlocks.push(feature.id);
      }
    }
  }

  return newUnlocks;
}

/**
 * Vérifie si une fonctionnalité spécifique est débloquée
 */
export async function isFeatureUnlocked(userId: string, featureId: string): Promise<boolean> {
  const stats = await getUserStats(userId);
  
  const { data: feature } = await supabase
    .from('unlockable_features')
    .select('*')
    .eq('id', featureId)
    .single();

  if (!feature) return false;

  // Vérifier si déjà enregistré comme débloqué
  const { data: unlock } = await supabase
    .from('user_unlocks')
    .select('id')
    .eq('user_id', userId)
    .eq('feature_id', featureId)
    .single();

  if (unlock) return true;

  // Sinon vérifier l'éligibilité
  return checkUnlockEligibility(feature, stats);
}