import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useCollectionGoals, CollectionGoal, CreateGoalInput } from "@/hooks/useCollectionGoals";
import { getAISuggestions, AISuggestion, CollectionStats } from "@/services/goalSuggestionService";
import { getPhysicalMovies, PhysicalMovie } from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails } from "@/services/tmdb";
import { GoalCard } from "./GoalCard";
import { GoalSuggestions } from "./GoalSuggestions";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { GoalDetailDialog } from "./GoalDetailDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Target,
  Plus,
  Sparkles,
  Trophy,
  ChevronRight,
  CheckCircle2,
  Flame,
} from "lucide-react";

interface GoalsSectionProps {
  movies?: PhysicalMovie[];
  movieDetails?: Record<number, MovieDetails>;
}

export function GoalsSection({ movies: propMovies, movieDetails: propMovieDetails }: GoalsSectionProps) {
  const { user } = useAuth();
  const { 
    goals, 
    activeGoals, 
    completedGoals, 
    loading: goalsLoading,
    createGoal,
    deleteGoal,
    completeGoal,
    refresh: refreshGoals,
  } = useCollectionGoals();

  const [movies, setMovies] = useState<PhysicalMovie[]>(propMovies || []);
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetails>>(propMovieDetails || {});
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<CollectionGoal | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // Load collection if not provided
  useEffect(() => {
    if (!user || propMovies) return;

    const loadCollection = async () => {
      try {
        const physicalMovies = await getPhysicalMovies(user.id);
        setMovies(physicalMovies);

        // Load movie details for stats
        const details: Record<number, MovieDetails> = {};
        const promises = physicalMovies.slice(0, 50).map(async (pm) => {
          try {
            const d = await getMovieDetails(pm.tmdb_id);
            if (d) details[pm.tmdb_id] = d;
          } catch {}
        });
        await Promise.all(promises);
        setMovieDetails(details);
      } catch (error) {
        console.error("Error loading collection:", error);
      }
    };

    loadCollection();
  }, [user, propMovies]);

  // Calculate collection stats
  const getCollectionStats = useCallback((): CollectionStats => {
    const stats: CollectionStats = {
      totalMovies: movies.length,
      formats: {},
      genres: {},
      decades: {},
      directors: {},
    };

    movies.forEach((movie) => {
      // Formats
      stats.formats[movie.format] = (stats.formats[movie.format] || 0) + 1;

      // Get movie details for genres, decades, directors
      const details = movieDetails[movie.tmdb_id];
      if (details) {
        // Genres
        details.genres?.forEach((genre) => {
          stats.genres[genre.name] = (stats.genres[genre.name] || 0) + 1;
        });

        // Decades
        if (details.release_date) {
          const year = new Date(details.release_date).getFullYear();
          const decade = Math.floor(year / 10) * 10;
          stats.decades[decade.toString()] = (stats.decades[decade.toString()] || 0) + 1;
        }

        // Directors (from credits if available)
        // Simplified: using first crew member as director placeholder
      }
    });

    return stats;
  }, [movies, movieDetails]);

  // Fetch AI suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!user || movies.length < 3) return;

    setSuggestionsLoading(true);
    try {
      const stats = getCollectionStats();
      const aiSuggestions = await getAISuggestions(user.id, stats);
      setSuggestions(aiSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [user, movies, getCollectionStats]);

  // Fetch suggestions on mount if collection is loaded
  useEffect(() => {
    if (movies.length > 0 && suggestions.length === 0 && !suggestionsLoading) {
      fetchSuggestions();
    }
  }, [movies.length]);

  const handleCreateGoal = async (input: CreateGoalInput) => {
    await createGoal(input);
    // Remove accepted suggestion from list
    if (input.is_ai_suggested) {
      setSuggestions((prev) => prev.filter((s) => s.title !== input.title));
    }
  };

  const handleCompleteGoal = async (id: string) => {
    await completeGoal(id);
  };

  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    setSelectedGoal(null);
  };

  // Overall progress calculation
  const overallProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + Math.min(100, (g.current_count / g.target_count) * 100), 0) / activeGoals.length
    : 0;

  if (goalsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-white/5 animate-pulse rounded-xl" />
        <div className="h-32 bg-white/5 animate-pulse rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {activeGoals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-400" />
              <span className="font-medium text-white">Progression globale</span>
            </div>
            <span className="text-sm text-amber-400 font-medium">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500" />
          <div className="flex items-center justify-between mt-2 text-xs text-white/50">
            <span>{activeGoals.length} objectif{activeGoals.length > 1 ? "s" : ""} actif{activeGoals.length > 1 ? "s" : ""}</span>
            <span>{completedGoals.length} terminé{completedGoals.length > 1 ? "s" : ""}</span>
          </div>
        </motion.div>
      )}

      {/* AI Suggestions */}
      {movies.length >= 3 && (
        <GoalSuggestions
          suggestions={suggestions}
          loading={suggestionsLoading}
          onAccept={handleCreateGoal}
          onRefresh={fetchSuggestions}
        />
      )}

      {/* Goals Tabs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
            <TabsList className="bg-white/5 border border-white/10 p-1">
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-white data-[state=active]:text-black gap-1.5"
              >
                <Flame className="w-4 h-4" />
                Actifs
                {activeGoals.length > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-400 ml-1 h-5 px-1.5">
                    {activeGoals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="data-[state=active]:bg-white data-[state=active]:text-black gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Terminés
                {completedGoals.length > 0 && (
                  <Badge className="bg-green-500/20 text-green-400 ml-1 h-5 px-1.5">
                    {completedGoals.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-white text-black hover:bg-white/90 gap-2 ml-4"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer</span>
          </Button>
        </div>

        {/* Active Goals */}
        <AnimatePresence mode="wait">
          {activeTab === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {activeGoals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Aucun objectif actif
                  </h3>
                  <p className="text-white/50 text-sm mb-4 max-w-sm mx-auto">
                    Créez des objectifs pour guider votre collection et suivre vos progrès
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-white text-black hover:bg-white/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un objectif
                  </Button>
                </div>
              ) : (
                activeGoals.map((goal, index) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    index={index}
                    onComplete={handleCompleteGoal}
                    onClick={setSelectedGoal}
                  />
                ))
              )}
            </motion.div>
          )}

          {activeTab === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {completedGoals.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Pas encore d'objectifs terminés
                  </h3>
                  <p className="text-white/50 text-sm">
                    Terminez vos objectifs actifs pour les voir ici
                  </p>
                </div>
              ) : (
                completedGoals.map((goal, index) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    index={index}
                    onClick={setSelectedGoal}
                  />
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <CreateGoalDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateGoal}
        filterOptions={{
          genres: Object.keys(getCollectionStats().genres),
          directors: Object.keys(getCollectionStats().directors),
          formats: Object.keys(getCollectionStats().formats),
          decades: Object.keys(getCollectionStats().decades),
        }}
      />

      <GoalDetailDialog
        goal={selectedGoal}
        onOpenChange={(open) => !open && setSelectedGoal(null)}
        onDelete={handleDeleteGoal}
        onComplete={handleCompleteGoal}
      />
    </div>
  );
}
