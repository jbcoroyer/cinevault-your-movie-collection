/**
 * Badge Detail Dialog - Shows full badge details when clicked
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Lock, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ElementType } from "react";

interface BadgeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: {
    id: string;
    title: string;
    description: string;
    icon: ElementType;
    rarity: string;
    isUnlocked: boolean;
    progress: number;
    xpReward?: number;
    criteria?: string;
    unlockedAt?: string;
  } | null;
}

const rarityConfig: Record<string, { 
  gradient: string; 
  border: string; 
  text: string;
  glow: string;
  label: string;
}> = {
  common: {
    gradient: "from-zinc-500 to-zinc-600",
    border: "border-zinc-500/30",
    text: "text-zinc-400",
    glow: "",
    label: "Commun",
  },
  rare: {
    gradient: "from-blue-500 to-cyan-500",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
    label: "Rare",
  },
  epic: {
    gradient: "from-purple-500 to-pink-500",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
    label: "Épique",
  },
  legendary: {
    gradient: "from-amber-400 to-orange-500",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/30",
    label: "Légendaire",
  },
  holographic: {
    gradient: "from-pink-500 via-purple-500 to-cyan-500",
    border: "border-pink-500/30",
    text: "text-pink-400",
    glow: "shadow-pink-500/30",
    label: "Holographique",
  },
};

export function BadgeDetailDialog({ open, onOpenChange, badge }: BadgeDetailDialogProps) {
  if (!badge) return null;

  const config = rarityConfig[badge.rarity] || rarityConfig.common;
  const Icon = badge.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-zinc-900/95 border-white/10 backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{badge.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-4">
          {/* Large badge icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative mb-6"
          >
            {/* Glow effect */}
            {badge.isUnlocked && (
              <div 
                className={cn(
                  "absolute inset-0 blur-2xl opacity-50 rounded-full",
                  `bg-gradient-to-br ${config.gradient}`
                )}
              />
            )}
            
            {/* Icon container */}
            <div 
              className={cn(
                "relative w-24 h-24 rounded-2xl flex items-center justify-center",
                badge.isUnlocked 
                  ? `bg-gradient-to-br ${config.gradient} shadow-xl ${config.glow}`
                  : "bg-zinc-800 border-2 border-zinc-700"
              )}
            >
              {badge.isUnlocked ? (
                <Icon className="w-12 h-12 text-white drop-shadow-lg" />
              ) : (
                <Lock className="w-10 h-10 text-zinc-500" />
              )}
            </div>

            {/* Sparkles for unlocked */}
            {badge.isUnlocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className={cn("w-6 h-6", config.text)} />
              </motion.div>
            )}
          </motion.div>

          {/* Title and rarity */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-display font-bold text-white mb-2">
              {badge.title}
            </h2>
            
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
              badge.isUnlocked 
                ? `bg-gradient-to-r ${config.gradient} text-white`
                : "bg-zinc-800 text-zinc-400"
            )}>
              <Trophy className="w-3 h-3" />
              {config.label}
            </span>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-white/60 text-sm leading-relaxed max-w-xs"
          >
            {badge.description}
          </motion.p>

          {/* XP Reward */}
          {badge.xpReward && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex items-center gap-2 text-amber-400"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-bold">+{badge.xpReward} XP</span>
            </motion.div>
          )}

          {/* Progress for locked badges */}
          {!badge.isUnlocked && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-6 w-full max-w-xs"
            >
              <div className="flex justify-between text-xs mb-2">
                <span className="text-white/40">Progression</span>
                <span className="text-white/60 font-medium">{Math.round(badge.progress)}%</span>
              </div>
              <Progress value={badge.progress} className="h-2" />
              
              {badge.criteria && (
                <p className="mt-3 text-xs text-white/40 bg-white/5 rounded-lg p-3">
                  {badge.criteria}
                </p>
              )}
            </motion.div>
          )}

          {/* Unlock date */}
          {badge.isUnlocked && badge.unlockedAt && (
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-4 text-xs text-white/30"
            >
              Débloqué le {new Date(badge.unlockedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </motion.p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
