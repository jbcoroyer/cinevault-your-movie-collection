import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CollectionGoal } from "@/hooks/useCollectionGoals";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Target,
  Film,
  Disc,
  User,
  Building2,
  Clock,
  Calendar,
  Trash2,
  CheckCircle2,
  Sparkles,
  Flame,
  Trophy,
} from "lucide-react";

interface GoalDetailDialogProps {
  goal: CollectionGoal | null;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
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

export function GoalDetailDialog({ goal, onOpenChange, onDelete, onComplete }: GoalDetailDialogProps) {
  if (!goal) return null;

  const progressPercent = Math.min(100, (goal.current_count / goal.target_count) * 100);
  const isComplete = goal.is_completed || progressPercent >= 100;
  const Icon = GOAL_ICONS[goal.goal_type] || Target;

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet objectif ?")) {
      onDelete(goal.id);
    }
  };

  return (
    <Dialog open={!!goal} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isComplete ? "bg-green-500/20" : "bg-amber-500/20"
            )}>
              {isComplete ? (
                <Trophy className="w-6 h-6 text-green-500" />
              ) : (
                <Icon className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white font-display">{goal.title}</span>
                {goal.is_ai_suggested && (
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-0 gap-1 text-[10px]">
                    <Sparkles className="w-3 h-3" />
                    IA
                  </Badge>
                )}
              </div>
              <p className="text-xs text-white/50 font-normal">
                Créé le {format(new Date(goal.created_at), "d MMMM yyyy", { locale: fr })}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Description */}
          {goal.description && (
            <p className="text-white/70 text-sm">{goal.description}</p>
          )}

          {/* Progress Section */}
          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">Progression</span>
              <span className={cn(
                "font-bold",
                isComplete ? "text-green-400" : "text-amber-400"
              )}>
                {goal.current_count} / {goal.target_count}
              </span>
            </div>
            
            <Progress 
              value={progressPercent} 
              className={cn("h-3", isComplete && "[&>div]:bg-green-500")}
            />

            <div className="flex justify-between text-xs text-white/40">
              <span>{Math.round(progressPercent)}% complété</span>
              <span>{goal.target_count - goal.current_count} restant{goal.target_count - goal.current_count > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Priority */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                <Flame className="w-3.5 h-3.5" />
                Priorité
              </div>
              <span className={cn(
                "font-medium text-sm",
                goal.priority === "high" 
                  ? "text-red-400"
                  : goal.priority === "medium"
                    ? "text-amber-400"
                    : "text-blue-400"
              )}>
                {goal.priority === "high" ? "Haute" : goal.priority === "medium" ? "Moyenne" : "Basse"}
              </span>
            </div>

            {/* Type */}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                <Target className="w-3.5 h-3.5" />
                Type
              </div>
              <span className="font-medium text-sm text-white">
                {goal.goal_type === "count" && "Nombre total"}
                {goal.goal_type === "genre" && "Genre"}
                {goal.goal_type === "format" && "Format"}
                {goal.goal_type === "director" && "Réalisateur"}
                {goal.goal_type === "decade" && "Décennie"}
                {goal.goal_type === "studio" && "Studio"}
                {goal.goal_type === "custom" && "Personnalisé"}
              </span>
            </div>

            {/* Deadline */}
            {goal.deadline && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Date limite
                </div>
                <span className="font-medium text-sm text-white">
                  {format(new Date(goal.deadline), "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            )}

            {/* Completed date */}
            {goal.completed_at && (
              <div className="bg-green-500/10 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-400/70 text-xs mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terminé le
                </div>
                <span className="font-medium text-sm text-green-400">
                  {format(new Date(goal.completed_at), "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            )}
          </div>

          {/* Target Config Details */}
          {Object.keys(goal.target_config).length > 0 && (
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-white/50 text-xs mb-2">Cible spécifique</div>
              <div className="text-white text-sm">
                {goal.target_config.genre && `Genre: ${goal.target_config.genre}`}
                {goal.target_config.format && `Format: ${goal.target_config.format}`}
                {goal.target_config.decade && `Décennie: ${goal.target_config.decade}`}
                {goal.target_config.director_name && `Réalisateur: ${goal.target_config.director_name}`}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>

            {progressPercent >= 100 && !goal.is_completed && (
              <Button
                onClick={() => onComplete(goal.id)}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Terminer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
