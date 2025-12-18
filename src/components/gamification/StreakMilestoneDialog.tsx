import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Sparkles, Trophy, Zap, Star, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface StreakMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: number;
  currentStreak: number;
  xpBonus: number;
  onClose: () => void;
}

const MILESTONES = [
  { days: 7, label: "1 semaine", icon: Flame, color: "from-amber-400 to-orange-500" },
  { days: 14, label: "2 semaines", icon: Star, color: "from-yellow-400 to-amber-500" },
  { days: 30, label: "1 mois", icon: Trophy, color: "from-orange-500 to-red-500" },
  { days: 100, label: "100 jours", icon: Crown, color: "from-purple-500 to-pink-500" },
  { days: 365, label: "1 an", icon: Crown, color: "from-yellow-300 via-amber-400 to-yellow-500" },
];

export function StreakMilestoneDialog({
  open,
  onOpenChange,
  milestone,
  currentStreak,
  xpBonus,
  onClose,
}: StreakMilestoneDialogProps) {
  const [showContent, setShowContent] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const milestoneData = MILESTONES.find(m => m.days === milestone) || MILESTONES[0];
  const MilestoneIcon = milestoneData.icon;

  useEffect(() => {
    if (open) {
      setShowContent(false);
      setShowFireworks(false);
      const contentTimer = setTimeout(() => setShowContent(true), 200);
      const fireworksTimer = setTimeout(() => setShowFireworks(true), 500);
      return () => {
        clearTimeout(contentTimer);
        clearTimeout(fireworksTimer);
      };
    } else {
      setShowContent(false);
      setShowFireworks(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md border-none bg-transparent shadow-none p-0 overflow-visible"
        onPointerDownOutside={(e) => {
          e.preventDefault();
          onClose();
        }}
        onEscapeKeyDown={onClose}
      >
        <div className="relative bg-gradient-to-br from-card via-card to-primary/10 border-2 border-primary/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Animated background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-30 animate-pulse",
            `bg-gradient-to-br ${milestoneData.color}`
          )} />

          {/* Fireworks/particles */}
          <AnimatePresence>
            {showFireworks && (
              <>
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      opacity: 0, 
                      scale: 0,
                      x: "50%",
                      y: "50%"
                    }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0, 1, 1.5],
                      x: `${50 + (Math.cos(i * 30 * Math.PI / 180) * 100)}%`,
                      y: `${50 + (Math.sin(i * 30 * Math.PI / 180) * 100)}%`
                    }}
                    transition={{ 
                      duration: 1.5, 
                      delay: i * 0.05,
                      ease: "easeOut"
                    }}
                    className="absolute w-3 h-3 rounded-full bg-primary"
                    style={{ left: 0, top: 0 }}
                  />
                ))}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.5, 2], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 1 }}
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full blur-3xl",
                    `bg-gradient-to-br ${milestoneData.color}`
                  )}
                />
              </>
            )}
          </AnimatePresence>

          {/* Floating fire emojis */}
          {showFireworks && (
            <>
              {['🔥', '⭐', '✨', '🎉', '🏆'].map((emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 100, x: 20 + i * 60 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: [-20, -80, -120],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    delay: 0.2 + i * 0.15,
                    ease: "easeOut"
                  }}
                  className="absolute bottom-0 text-2xl"
                >
                  {emoji}
                </motion.div>
              ))}
            </>
          )}

          <div className="relative p-8 flex flex-col items-center text-center space-y-6">
            {/* Header */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={showContent ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: "spring", duration: 0.8 }}
              className="flex items-center gap-2"
            >
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              <h2 className={cn(
                "text-2xl font-bold bg-clip-text text-transparent",
                `bg-gradient-to-r ${milestoneData.color}`
              )}>
                Palier Atteint !
              </h2>
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </motion.div>

            {/* Milestone badge */}
            <motion.div
              initial={{ scale: 0, y: 50 }}
              animate={showContent ? { scale: 1, y: 0 } : {}}
              transition={{ type: "spring", delay: 0.2 }}
              className="relative"
            >
              {/* Glow effect */}
              <div className={cn(
                "absolute inset-0 -m-4 rounded-full blur-2xl opacity-50",
                `bg-gradient-to-br ${milestoneData.color}`
              )} />
              
              {/* Ring animation */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-6 rounded-full border-4 border-dashed border-primary/30"
              />

              {/* Icon container */}
              <div className={cn(
                "relative w-32 h-32 rounded-full flex items-center justify-center",
                `bg-gradient-to-br ${milestoneData.color}`
              )}>
                <MilestoneIcon className="w-16 h-16 text-white drop-shadow-lg" />
              </div>

              {/* Streak number badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={showContent ? { scale: 1 } : {}}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border-2 border-primary px-4 py-1 rounded-full shadow-lg"
              >
                <span className="text-xl font-bold text-primary">{currentStreak}</span>
                <span className="text-sm text-muted-foreground ml-1">jours</span>
              </motion.div>
            </motion.div>

            {/* Milestone label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h3 className="text-3xl font-bold">{milestoneData.label}</h3>
              <p className="text-muted-foreground">
                de connexion quotidienne consécutive !
              </p>
            </motion.div>

            {/* XP Bonus */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={showContent ? { scale: 1, opacity: 1 } : {}}
              transition={{ delay: 0.6, type: "spring" }}
              className={cn(
                "flex items-center gap-3 px-6 py-3 rounded-full",
                `bg-gradient-to-r ${milestoneData.color} text-white shadow-lg`
              )}
            >
              <Zap className="w-6 h-6 fill-current" />
              <span className="text-2xl font-bold">+{xpBonus} XP</span>
              <span className="text-sm opacity-80">Bonus palier</span>
            </motion.div>

            {/* Motivational message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={showContent ? { opacity: 1 } : {}}
              transition={{ delay: 0.8 }}
              className="text-sm text-muted-foreground italic"
            >
              {milestone >= 100 
                ? "Vous êtes une légende ! 🏆" 
                : milestone >= 30 
                  ? "Incroyable détermination !" 
                  : "Continuez comme ça !"}
            </motion.p>

            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={showContent ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1 }}
              className="w-full"
            >
              <Button
                onClick={onClose}
                className={cn(
                  "w-full text-white shadow-lg",
                  `bg-gradient-to-r ${milestoneData.color} hover:opacity-90`
                )}
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Continuer ma série
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
