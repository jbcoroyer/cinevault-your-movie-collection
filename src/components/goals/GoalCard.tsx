import { motion } from "framer-motion";
import { CollectionGoal } from "@/hooks/useCollectionGoals";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Target,
  CheckCircle2,
  Trash2,
  Sparkles,
  Film,
  Disc,
  Calendar,
  User,
  Building2,
  Clock,
  ChevronRight,
  Flame,
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";

interface GoalCardProps {
  goal: CollectionGoal;
  index?: number;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (goal: CollectionGoal) => void;
}

const GOAL_ICONS: Record<string, React.ElementType> = {
  genre: Film,
  director: User,
  studio: Building2,
  decade: Clock,
  format: Disc,
  count: Target,
  custom: Target,
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  high: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
};

export function GoalCard({ goal, index = 0, onComplete, onDelete, onClick }: GoalCardProps) {
  const progressPercent = Math.min(100, (goal.current_count / goal.target_count) * 100);
  const isComplete = goal.is_completed || progressPercent >= 100;
  const Icon = GOAL_ICONS[goal.goal_type] || Target;
  const priorityStyle = PRIORITY_COLORS[goal.priority] || PRIORITY_COLORS.medium;

  // Calculate deadline info
  const deadlineInfo = goal.deadline ? {
    date: new Date(goal.deadline),
    daysLeft: differenceInDays(new Date(goal.deadline), new Date()),
    isPast: isPast(new Date(goal.deadline)),
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick?.(goal)}
      className={cn(
        "relative overflow-hidden rounded-xl border p-4 transition-all cursor-pointer",
        isComplete
          ? "bg-green-500/5 border-green-500/20"
          : "bg-white/5 border-white/10 hover:border-white/20"
      )}
    >
      {/* AI Badge */}
      {goal.is_ai_suggested && (
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-0 gap-1 text-[10px]">
            <Sparkles className="w-3 h-3" />
            IA
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          isComplete ? "bg-green-500/20" : priorityStyle.bg
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <Icon className={cn("w-6 h-6", priorityStyle.text)} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-medium text-sm truncate",
              isComplete ? "text-green-400" : "text-white"
            )}>
              {goal.title}
            </h4>
          </div>

          {goal.description && (
            <p className="text-xs text-white/50 mb-2 line-clamp-1">
              {goal.description}
            </p>
          )}

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">
                {goal.current_count} / {goal.target_count}
              </span>
              <span className={cn(
                "font-medium",
                isComplete ? "text-green-400" : progressPercent > 50 ? "text-amber-400" : "text-white/60"
              )}>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className={cn("h-1.5", isComplete && "[&>div]:bg-green-500")}
            />
          </div>

          {/* Footer info */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {/* Priority */}
              <Badge 
                variant="secondary" 
                className={cn("text-[10px] border", priorityStyle.bg, priorityStyle.text, priorityStyle.border)}
              >
                {goal.priority === "high" && <Flame className="w-3 h-3 mr-0.5" />}
                {goal.priority === "high" ? "Prioritaire" : goal.priority === "medium" ? "Moyen" : "Bas"}
              </Badge>

              {/* Deadline */}
              {deadlineInfo && !isComplete && (
                <Badge 
                  variant="secondary"
                  className={cn(
                    "text-[10px] border-0",
                    deadlineInfo.isPast 
                      ? "bg-red-500/20 text-red-400"
                      : deadlineInfo.daysLeft <= 7
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-white/5 text-white/50"
                  )}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {deadlineInfo.isPast 
                    ? "Expiré" 
                    : `${deadlineInfo.daysLeft}j`}
                </Badge>
              )}
            </div>

            {/* Actions */}
            {!isComplete && (
              <ChevronRight className="w-4 h-4 text-white/30" />
            )}
          </div>
        </div>
      </div>

      {/* Complete/Delete actions (shown on hover or when complete) */}
      {(isComplete || progressPercent >= 100) && !goal.is_completed && onComplete && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(goal.id);
            }}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Marquer comme terminé
          </Button>
        </div>
      )}
    </motion.div>
  );
}
