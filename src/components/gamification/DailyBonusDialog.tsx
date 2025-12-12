import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Gift, Sparkles, Calendar, Zap, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DailyBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  streak: number;
  xpEarned: number;
  popcornEarned: number;
  streakBroken?: boolean;
  newBadges?: string[];
}

const streakMilestones = [
  { days: 7, label: "1 semaine", bonus: "+50 XP" },
  { days: 14, label: "2 semaines", bonus: "+75 XP" },
  { days: 30, label: "1 mois", bonus: "+100 XP" },
  { days: 100, label: "100 jours", bonus: "+150 XP" },
  { days: 365, label: "1 an", bonus: "+200 XP" },
];

export function DailyBonusDialog({
  open,
  onOpenChange,
  streak,
  xpEarned,
  popcornEarned,
  streakBroken,
  newBadges,
}: DailyBonusDialogProps) {
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => setShowReward(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowReward(false);
    }
  }, [open]);

  const nextMilestone = streakMilestones.find(m => m.days > streak);
  const daysToNext = nextMilestone ? nextMilestone.days - streak : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-primary/10 border-primary/30">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Gift className="w-6 h-6 text-primary animate-bounce" />
            Bonus Quotidien
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Streak Display */}
          <div className="text-center">
            {streakBroken ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-2"
              >
                <p className="text-muted-foreground">Streak perdu...</p>
                <div className="flex items-center justify-center gap-2">
                  <Flame className="w-8 h-8 text-muted-foreground" />
                  <span className="text-4xl font-bold text-muted-foreground">0</span>
                </div>
                <p className="text-sm text-muted-foreground">Recommencez à construire votre streak !</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-2"
              >
                <p className="text-muted-foreground">Streak actuel</p>
                <div className="flex items-center justify-center gap-2">
                  <Flame className={cn(
                    "w-8 h-8",
                    streak >= 30 ? "text-orange-500" : 
                    streak >= 7 ? "text-yellow-500" : "text-primary"
                  )} />
                  <span className="text-5xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                    {streak}
                  </span>
                  <span className="text-lg text-muted-foreground">jours</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Rewards */}
          <AnimatePresence>
            {showReward && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="space-y-4"
              >
                {/* XP et Popcorn */}
                <div className="flex justify-center gap-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary">+{xpEarned}</p>
                    <p className="text-sm text-muted-foreground">XP</p>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-3xl">🍿</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">+{popcornEarned}</p>
                    <p className="text-sm text-muted-foreground">Popcorn</p>
                  </motion.div>
                </div>

                {/* Next Milestone */}
                {nextMilestone && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-muted/50 rounded-lg p-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Prochain palier dans <strong className="text-foreground">{daysToNext}</strong> jours
                      </span>
                    </div>
                    <p className="text-xs text-primary mt-1">
                      {nextMilestone.label} → {nextMilestone.bonus}
                    </p>
                  </motion.div>
                )}

                {/* New Badges */}
                {newBadges && newBadges.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-lg p-3 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold">Nouveau(x) badge(s) débloqué(s) !</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {newBadges.length} badge{newBadges.length > 1 ? 's' : ''} ajouté{newBadges.length > 1 ? 's' : ''} à votre collection
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Streak Week Preview */}
          <div className="flex justify-center gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 * i }}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                  i < (streak % 7 || (streak >= 7 ? 7 : 0))
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i + 1}
              </motion.div>
            ))}
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Continuer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
