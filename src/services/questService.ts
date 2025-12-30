/**
 * Quest Service - Gestion des quêtes permanentes
 * 
 * Les quêtes sont des objectifs à long terme qui récompensent
 * la découverte et la collection de films.
 */

import { supabase } from "@/integrations/supabase/client";

export interface Quest {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  category: string;
  quest_type: string;
  target_config: {
    director_id?: number;
    director_name?: string;
    genre_id?: number;
    genre_name?: string;
    decade?: number;
    before_year?: number;
    format?: string;
    count: number;
  };
  xp_reward: number;
  badge_reward_id?: string;
  rarity: string;
}

export interface UserQuest {
  id: string;
  quest_id: string;
  current_progress: number;
  target_count: number;
  is_completed: boolean;
  completed_at?: string;
  started_at: string;
  quest?: Quest;
}

export interface QuestWithProgress extends Quest {
  progress: number;
  current_progress: number;
  is_started: boolean;
  is_completed: boolean;
  completed_at?: string;
}

// Récupérer toutes les quêtes avec progression
export async function getAllQuests(userId: string): Promise<QuestWithProgress[]> {
  try {
    // Récupérer les quêtes actives
    const { data: quests, error: questsError } = await supabase
      .from("quests")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true });

    if (questsError) throw questsError;

    // Récupérer la progression de l'utilisateur
    const { data: userQuests, error: userQuestsError } = await supabase
      .from("user_quests")
      .select("*")
      .eq("user_id", userId);

    if (userQuestsError) throw userQuestsError;

    const userQuestMap = new Map(
      userQuests?.map((uq) => [uq.quest_id, uq]) || []
    );

    // Calculer la progression réelle basée sur la collection
    const questList = (quests || []) as unknown as Quest[];
    const progressData = await calculateQuestProgress(userId, questList);

    return questList.map((quest) => {
      const userQuest = userQuestMap.get(quest.id);
      const calculatedProgress = progressData[quest.id] || 0;
      const targetCount = quest.target_config?.count || 1;
      const progressPercent = Math.min(100, Math.round((calculatedProgress / targetCount) * 100));

      return {
        ...quest,
        progress: progressPercent,
        current_progress: calculatedProgress,
        is_started: !!userQuest,
        is_completed: userQuest?.is_completed || false,
        completed_at: userQuest?.completed_at,
      };
    });
  } catch (error) {
    console.error("[QuestService] Error fetching quests:", error);
    return [];
  }
}

// Calculer la progression pour toutes les quêtes
async function calculateQuestProgress(
  userId: string,
  quests: Quest[]
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};

  // Récupérer les films de l'utilisateur avec métadonnées
  const { data: physicalMovies } = await supabase
    .from("physical_movies")
    .select("tmdb_id, format")
    .eq("user_id", userId);

  if (!physicalMovies?.length) return result;

  const tmdbIds = physicalMovies.map((m) => m.tmdb_id);

  // Récupérer les métadonnées
  const { data: metadata } = await supabase
    .from("movies_metadata")
    .select("tmdb_id, genres, director_id, release_year")
    .in("tmdb_id", tmdbIds);

  const metadataMap = new Map(metadata?.map((m) => [m.tmdb_id, m]) || []);

  // Calculer pour chaque quête
  for (const quest of quests) {
    const config = quest.target_config as any;
    let count = 0;

    switch (quest.quest_type) {
      case "director_complete":
        count = physicalMovies.filter((m) => {
          const meta = metadataMap.get(m.tmdb_id);
          return meta?.director_id === config.director_id;
        }).length;
        break;

      case "genre_master":
        count = physicalMovies.filter((m) => {
          const meta = metadataMap.get(m.tmdb_id);
          if (!meta?.genres) return false;
          return (meta.genres as { id: number }[]).some(
            (g) => g.id === config.genre_id
          );
        }).length;
        break;

      case "decade_explorer":
        if (config.decade) {
          const decadeStart = config.decade;
          const decadeEnd = decadeStart + 9;
          count = physicalMovies.filter((m) => {
            const meta = metadataMap.get(m.tmdb_id);
            return meta?.release_year && 
                   meta.release_year >= decadeStart && 
                   meta.release_year <= decadeEnd;
          }).length;
        } else if (config.before_year) {
          count = physicalMovies.filter((m) => {
            const meta = metadataMap.get(m.tmdb_id);
            return meta?.release_year && meta.release_year < config.before_year;
          }).length;
        }
        break;

      case "format_collector":
        const targetFormat = config.format?.toLowerCase();
        count = physicalMovies.filter((m) => {
          const format = m.format.toLowerCase();
          if (targetFormat === "bluray") {
            return format.includes("blu") || format.includes("bluray");
          }
          if (targetFormat === "4k") {
            return format.includes("4k") || format.includes("uhd");
          }
          return format.includes(targetFormat);
        }).length;
        break;
    }

    result[quest.id] = count;
  }

  return result;
}

// Démarrer une quête
export async function startQuest(
  userId: string,
  questId: string
): Promise<boolean> {
  try {
    const { data: quest } = await supabase
      .from("quests")
      .select("target_config")
      .eq("id", questId)
      .single();

    if (!quest) return false;

    const targetCount = (quest.target_config as any)?.count || 1;

    const { error } = await supabase.from("user_quests").upsert(
      {
        user_id: userId,
        quest_id: questId,
        target_count: targetCount,
        current_progress: 0,
        is_completed: false,
      },
      { onConflict: "user_id,quest_id" }
    );

    return !error;
  } catch (error) {
    console.error("[QuestService] Error starting quest:", error);
    return false;
  }
}

// Mettre à jour la progression des quêtes
export async function updateQuestProgress(userId: string): Promise<{
  completedQuests: string[];
  xpEarned: number;
}> {
  try {
    const quests = await getAllQuests(userId);
    const completedQuests: string[] = [];
    let xpEarned = 0;

    for (const quest of quests) {
      if (quest.is_started && !quest.is_completed) {
        const targetCount = quest.target_config.count;
        const isNowComplete = quest.current_progress >= targetCount;

        if (isNowComplete) {
          // Marquer comme complétée
          await supabase
            .from("user_quests")
            .update({
              is_completed: true,
              completed_at: new Date().toISOString(),
              current_progress: quest.current_progress,
            })
            .eq("user_id", userId)
            .eq("quest_id", quest.id);

          // Ajouter XP via requête séparée
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_xp")
            .eq("id", userId)
            .single();
          
          if (profile) {
            await supabase
              .from("profiles")
              .update({ total_xp: (profile.total_xp || 0) + quest.xp_reward })
              .eq("id", userId);
          }

          completedQuests.push(quest.id);
          xpEarned += quest.xp_reward;
        } else {
          // Mettre à jour la progression
          await supabase
            .from("user_quests")
            .update({
              current_progress: quest.current_progress,
              last_updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .eq("quest_id", quest.id);
        }
      }
    }

    return { completedQuests, xpEarned };
  } catch (error) {
    console.error("[QuestService] Error updating progress:", error);
    return { completedQuests: [], xpEarned: 0 };
  }
}

// Récupérer les quêtes par catégorie
export async function getQuestsByCategory(
  userId: string,
  category: string
): Promise<QuestWithProgress[]> {
  const allQuests = await getAllQuests(userId);
  return allQuests.filter((q) => q.category === category);
}

// Récupérer les quêtes recommandées (proches de la complétion)
export async function getRecommendedQuests(
  userId: string,
  limit = 3
): Promise<QuestWithProgress[]> {
  const allQuests = await getAllQuests(userId);
  
  // Trier par progression (en excluant les complétées)
  return allQuests
    .filter((q) => !q.is_completed && q.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}

// Récupérer les stats de quêtes
export async function getQuestStats(userId: string): Promise<{
  total: number;
  started: number;
  completed: number;
  inProgress: number;
}> {
  const quests = await getAllQuests(userId);
  
  return {
    total: quests.length,
    started: quests.filter((q) => q.is_started).length,
    completed: quests.filter((q) => q.is_completed).length,
    inProgress: quests.filter((q) => q.is_started && !q.is_completed).length,
  };
}
