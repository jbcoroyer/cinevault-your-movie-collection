import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AISuggestion, convertSuggestionToGoal } from "@/services/goalSuggestionService";
import { CreateGoalInput } from "@/hooks/useCollectionGoals";
import {
  Sparkles,
  Plus,
  ChevronRight,
  Target,
  Film,
  Disc,
  User,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface GoalSuggestionsProps {
  suggestions: AISuggestion[];
  loading: boolean;
  onAccept: (goal: CreateGoalInput) => Promise<void>;
  onRefresh: () => void;
}

const GOAL_ICONS: Record<string, React.ElementType> = {
  genre: Film,
  director: User,
  decade: Clock,
  format: Disc,
  count: Target,
};

export function GoalSuggestions({ suggestions, loading, onAccept, onRefresh }: GoalSuggestionsProps) {
  const [accepting, setAccepting] = useState<number | null>(null);

  const handleAccept = async (suggestion: AISuggestion, index: number) => {
    setAccepting(index);
    try {
      await onAccept(convertSuggestionToGoal(suggestion));
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-center gap-3 text-purple-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">L'IA analyse votre collection...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 text-center">
        <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm mb-3">
          Aucune suggestion disponible pour le moment
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="border-white/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-medium text-white text-sm">Suggestions IA</h3>
            <p className="text-[10px] text-white/40">Basées sur votre collection</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="text-white/50 hover:text-white h-8 px-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Suggestions */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion, index) => {
            const Icon = GOAL_ICONS[suggestion.goal_type] || Target;
            const isAccepting = accepting === index;

            return (
              <motion.div
                key={`${suggestion.title}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl border border-purple-500/20 p-4 hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-purple-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-white truncate">
                        {suggestion.title}
                      </h4>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "text-[10px] shrink-0",
                          suggestion.priority === "high" 
                            ? "bg-red-500/20 text-red-400"
                            : suggestion.priority === "medium"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                        )}
                      >
                        {suggestion.target_count} films
                      </Badge>
                    </div>

                    <p className="text-xs text-white/50 mb-2 line-clamp-1">
                      {suggestion.description}
                    </p>

                    <p className="text-[10px] text-purple-400/70 italic mb-3">
                      💡 {suggestion.reasoning}
                    </p>

                    <Button
                      size="sm"
                      onClick={() => handleAccept(suggestion, index)}
                      disabled={isAccepting}
                      className="h-7 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                    >
                      {isAccepting ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      Ajouter cet objectif
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
