/**
 * Quest Detail Dialog - Shows full quest details and requirements
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Target, Sparkles, CheckCircle2, Film, Disc, Users, Library, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElementType } from "react";

interface QuestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest: {
    id: string;
    title: string;
    description: string;
    icon: ElementType;
    rarity: string;
    questType: string;
    targetConfig: {
      director_id?: number;
      director_name?: string;
      genre_id?: number;
      genre_name?: string;
      decade?: number;
      before_year?: number;
      format?: string;
      count: number;
    };
    xpReward: number;
    currentProgress: number;
    isCompleted: boolean;
  } | null;
}

const rarityConfig: Record<string, { 
  color: string; 
  bg: string;
  label: string;
}> = {
  common: { color: "text-zinc-400", bg: "bg-zinc-500/20", label: "Commun" },
  rare: { color: "text-blue-400", bg: "bg-blue-500/20", label: "Rare" },
  epic: { color: "text-purple-400", bg: "bg-purple-500/20", label: "Épique" },
  legendary: { color: "text-amber-400", bg: "bg-amber-500/20", label: "Légendaire" },
};

const questTypeLabels: Record<string, { label: string; icon: ElementType }> = {
  director_complete: { label: "Collection Réalisateur", icon: Users },
  genre_master: { label: "Maître du Genre", icon: Star },
  decade_explorer: { label: "Explorateur d'Époque", icon: Film },
  format_collector: { label: "Collection Format", icon: Disc },
};

function getQuestRequirements(quest: QuestDetailDialogProps['quest']): string[] {
  if (!quest) return [];
  
  const requirements: string[] = [];
  const config = quest.targetConfig;
  
  switch (quest.questType) {
    case "director_complete":
      if (config.director_name) {
        requirements.push(`Collectionner ${config.count} films de ${config.director_name}`);
        requirements.push(`Ajouter des éditions physiques à votre collection`);
        requirements.push(`Les films doivent être du même réalisateur`);
      }
      break;
      
    case "genre_master":
      if (config.genre_name) {
        requirements.push(`Posséder ${config.count} films du genre ${config.genre_name}`);
        requirements.push(`Tous les formats sont acceptés (DVD, Blu-ray, 4K)`);
        requirements.push(`Variez les réalisateurs pour enrichir votre collection`);
      }
      break;
      
    case "decade_explorer":
      if (config.decade) {
        const decadeEnd = config.decade + 9;
        requirements.push(`Collectionner ${config.count} films des années ${config.decade}-${decadeEnd}`);
        requirements.push(`Découvrez les classiques de cette époque`);
      } else if (config.before_year) {
        requirements.push(`Posséder ${config.count} films d'avant ${config.before_year}`);
        requirements.push(`Explorez le cinéma classique et vintage`);
      }
      break;
      
    case "format_collector":
      if (config.format) {
        const formatLabel = config.format === "4k" ? "4K UHD" : 
                           config.format === "bluray" ? "Blu-ray" : 
                           config.format.toUpperCase();
        requirements.push(`Posséder ${config.count} films au format ${formatLabel}`);
        requirements.push(`Construisez une collection de haute qualité`);
      }
      break;
      
    default:
      requirements.push(`Atteindre l'objectif de ${config.count} films`);
  }
  
  return requirements;
}

export function QuestDetailDialog({ open, onOpenChange, quest }: QuestDetailDialogProps) {
  if (!quest) return null;

  const config = rarityConfig[quest.rarity] || rarityConfig.common;
  const typeInfo = questTypeLabels[quest.questType] || { label: "Quête", icon: Target };
  const Icon = quest.icon;
  const TypeIcon = typeInfo.icon;
  const requirements = getQuestRequirements(quest);
  const targetCount = quest.targetConfig.count || 1;
  const progressPercent = Math.min(100, Math.round((quest.currentProgress / targetCount) * 100));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900/95 border-white/10 backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{quest.title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Header with icon */}
          <div className="flex items-start gap-4 mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center shrink-0",
                config.bg
              )}
            >
              <Icon className={cn("w-8 h-8", config.color)} />
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-display font-bold text-white mb-1">
                  {quest.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold uppercase",
                    config.bg, config.color
                  )}>
                    {config.label}
                  </span>
                  
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-white/5 text-white/50">
                    <TypeIcon className="w-3 h-3" />
                    {typeInfo.label}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Description */}
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-white/60 text-sm leading-relaxed mb-6"
          >
            {quest.description}
          </motion.p>

          {/* Progress */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/40">Progression</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {quest.currentProgress}/{targetCount}
                </span>
                {quest.isCompleted && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
            <Progress 
              value={progressPercent} 
              className={cn(
                "h-3",
                quest.isCompleted && "bg-green-500/20"
              )} 
            />
          </motion.div>

          {/* Requirements */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Comment compléter cette quête
            </h3>
            
            <div className="space-y-2">
              {requirements.map((req, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs text-white/50">{i + 1}</span>
                  </div>
                  <span className="text-white/60">{req}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Reward */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={cn(
              "mt-6 p-4 rounded-xl flex items-center justify-between",
              quest.isCompleted 
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-amber-500/10 border border-amber-500/20"
            )}
          >
            <span className="text-sm text-white/70">Récompense</span>
            <div className="flex items-center gap-2">
              <Sparkles className={cn(
                "w-5 h-5",
                quest.isCompleted ? "text-green-400" : "text-amber-400"
              )} />
              <span className={cn(
                "font-bold text-lg",
                quest.isCompleted ? "text-green-400" : "text-amber-400"
              )}>
                +{quest.xpReward} XP
              </span>
              {quest.isCompleted && (
                <span className="text-xs text-green-400/70 ml-1">Réclamé</span>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
