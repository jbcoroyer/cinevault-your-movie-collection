import { supabase } from "@/integrations/supabase/client";
import { CreateGoalInput, GoalType } from "@/hooks/useCollectionGoals";

export interface CollectionStats {
  totalMovies: number;
  formats: Record<string, number>;
  genres: Record<string, number>;
  decades: Record<string, number>;
  directors: Record<string, number>;
}

export interface AISuggestion {
  title: string;
  description: string;
  goal_type: GoalType;
  target_config: Record<string, any>;
  target_count: number;
  priority: "low" | "medium" | "high";
  reasoning: string;
}

export const getAISuggestions = async (
  userId: string,
  stats: CollectionStats
): Promise<AISuggestion[]> => {
  try {
    const { data, error } = await supabase.functions.invoke("suggest-collection-goals", {
      body: { userId, stats },
    });

    if (error) {
      console.error("Edge function error:", error);
      throw error;
    }

    return data.suggestions || [];
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    // Return fallback suggestions if AI fails
    return generateFallbackSuggestions(stats);
  }
};

// Fallback suggestions based on collection analysis
const generateFallbackSuggestions = (stats: CollectionStats): AISuggestion[] => {
  const suggestions: AISuggestion[] = [];

  // Suggest reaching a milestone count
  const countMilestones = [10, 25, 50, 100, 200, 500];
  const nextMilestone = countMilestones.find((m) => m > stats.totalMovies);
  if (nextMilestone) {
    suggestions.push({
      title: `Atteindre ${nextMilestone} films`,
      description: `Agrandissez votre collection jusqu'à ${nextMilestone} films`,
      goal_type: "count",
      target_config: {},
      target_count: nextMilestone,
      priority: "medium",
      reasoning: `Vous avez actuellement ${stats.totalMovies} films. Le prochain palier est ${nextMilestone}.`,
    });
  }

  // Suggest exploring a less collected format
  const formatEntries = Object.entries(stats.formats);
  if (formatEntries.length > 0) {
    const sortedFormats = formatEntries.sort((a, b) => a[1] - b[1]);
    const leastFormat = sortedFormats[0];
    if (leastFormat[1] < 5) {
      suggestions.push({
        title: `Explorer le format ${formatLabels[leastFormat[0]] || leastFormat[0]}`,
        description: `Ajoutez 5 films en ${formatLabels[leastFormat[0]] || leastFormat[0]} à votre collection`,
        goal_type: "format",
        target_config: { format: leastFormat[0] },
        target_count: 5,
        priority: "low",
        reasoning: `Vous n'avez que ${leastFormat[1]} films dans ce format.`,
      });
    }
  }

  // Suggest completing a genre collection
  const genreEntries = Object.entries(stats.genres);
  if (genreEntries.length > 0) {
    const topGenre = genreEntries.sort((a, b) => b[1] - a[1])[0];
    const targetCount = Math.ceil((topGenre[1] + 5) / 5) * 5; // Round up to next 5
    suggestions.push({
      title: `Maître du ${topGenre[0]}`,
      description: `Atteignez ${targetCount} films du genre ${topGenre[0]}`,
      goal_type: "genre",
      target_config: { genre: topGenre[0] },
      target_count: targetCount,
      priority: "high",
      reasoning: `Le ${topGenre[0]} est votre genre préféré avec ${topGenre[1]} films.`,
    });
  }

  // Suggest a decade focus
  const decadeEntries = Object.entries(stats.decades);
  if (decadeEntries.length > 0) {
    const randomDecade = decadeEntries[Math.floor(Math.random() * decadeEntries.length)];
    suggestions.push({
      title: `Rétrospective ${randomDecade[0]}`,
      description: `Collectionnez 10 films des années ${randomDecade[0]}`,
      goal_type: "decade",
      target_config: { decade: randomDecade[0] },
      target_count: 10,
      priority: "medium",
      reasoning: `Explorez le cinéma des années ${randomDecade[0]}.`,
    });
  }

  return suggestions.slice(0, 3);
};

const formatLabels: Record<string, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  uhd: "4K UHD",
  vhs: "VHS",
  laserdisc: "LaserDisc",
  steelbook: "Steelbook",
};

export const convertSuggestionToGoal = (suggestion: AISuggestion): CreateGoalInput => {
  return {
    title: suggestion.title,
    description: suggestion.description,
    goal_type: suggestion.goal_type,
    target_config: suggestion.target_config,
    target_count: suggestion.target_count,
    priority: suggestion.priority,
    is_ai_suggested: true,
  };
};
