import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CollectionGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goal_type: GoalType;
  target_config: Record<string, any>;
  target_count: number;
  current_count: number;
  is_completed: boolean;
  is_ai_suggested: boolean;
  priority: "low" | "medium" | "high";
  deadline: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type GoalType = "genre" | "director" | "studio" | "decade" | "format" | "count" | "custom";

export interface CreateGoalInput {
  title: string;
  description?: string;
  goal_type: GoalType;
  target_config: Record<string, any>;
  target_count: number;
  priority?: "low" | "medium" | "high";
  deadline?: string;
  is_ai_suggested?: boolean;
}

export const useCollectionGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<CollectionGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("collection_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals((data as CollectionGoal[]) || []);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (input: CreateGoalInput): Promise<CollectionGoal | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("collection_goals")
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description || null,
          goal_type: input.goal_type,
          target_config: input.target_config,
          target_count: input.target_count,
          priority: input.priority || "medium",
          deadline: input.deadline || null,
          is_ai_suggested: input.is_ai_suggested || false,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchGoals();
      toast.success("Objectif créé !");
      return data as CollectionGoal;
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Erreur lors de la création de l'objectif");
      return null;
    }
  };

  const updateGoal = async (id: string, updates: Partial<CollectionGoal>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("collection_goals")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchGoals();
      return true;
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("collection_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchGoals();
      toast.success("Objectif supprimé");
      return true;
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  const completeGoal = async (id: string): Promise<boolean> => {
    return updateGoal(id, {
      is_completed: true,
      completed_at: new Date().toISOString(),
    });
  };

  // Calculate progress for a goal based on collection
  const calculateProgress = useCallback(async (goal: CollectionGoal): Promise<number> => {
    if (!user) return 0;

    try {
      // Fetch user's physical movies for progress calculation
      const { data: movies } = await supabase
        .from("physical_movies")
        .select("*")
        .eq("user_id", user.id);

      if (!movies) return 0;

      switch (goal.goal_type) {
        case "count":
          return movies.length;

        case "format": {
          const format = goal.target_config.format;
          return movies.filter((m) => m.format === format).length;
        }

        case "genre":
        case "director":
        case "studio":
        case "decade":
          // These require TMDB data, return stored count
          return goal.current_count;

        default:
          return goal.current_count;
      }
    } catch (error) {
      console.error("Error calculating progress:", error);
      return goal.current_count;
    }
  }, [user]);

  // Get active (non-completed) goals
  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  return {
    goals,
    activeGoals,
    completedGoals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    calculateProgress,
    refresh: fetchGoals,
  };
};
