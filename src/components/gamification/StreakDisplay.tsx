import { useState, useEffect } from "react";
import { Flame, Calendar, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getUserStreak, UserStreak } from "@/services/gamificationService";

interface StreakDisplayProps {
  compact?: boolean;
  className?: string;
}

export function StreakDisplay({ compact = false, className }: StreakDisplayProps) {
  const { user } = useAuth();
  const [streak, setStreak] = useState<UserStreak | null>(null);

  useEffect(() => {
    if (user) {
      loadStreak();
    }
  }, [user]);

  const loadStreak = async () => {
    if (!user) return;
    const data = await getUserStreak(user.id);
    setStreak(data);
  };

  if (!streak) {
    return null;
  }

  const currentStreak = streak.current_streak;
  const longestStreak = streak.longest_streak;

  // Couleur basée sur le streak
  const getFlameColor = () => {
    if (currentStreak >= 100) return "text-orange-500";
    if (currentStreak >= 30) return "text-yellow-500";
    if (currentStreak >= 7) return "text-amber-400";
    return "text-primary";
  };

  if (compact) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10",
          className
        )}
      >
        <Flame className={cn("w-4 h-4", getFlameColor())} />
        <span className="text-sm font-bold">{currentStreak}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "p-4 rounded-xl bg-gradient-to-br from-primary/10 to-orange-500/10 border border-primary/20",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            currentStreak >= 30 
              ? "bg-gradient-to-br from-orange-500 to-yellow-500" 
              : "bg-primary/20"
          )}>
            <Flame className={cn(
              "w-6 h-6",
              currentStreak >= 30 ? "text-white" : getFlameColor()
            )} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Streak actuel</p>
            <p className="text-2xl font-bold">{currentStreak} <span className="text-sm font-normal text-muted-foreground">jours</span></p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Trophy className="w-3 h-3" />
            <span>Record</span>
          </div>
          <p className="text-lg font-semibold text-primary">{longestStreak}</p>
        </div>
      </div>

      {/* Barre de progression vers le prochain palier */}
      {currentStreak < 365 && (
        <div className="mt-3">
          {(() => {
            const milestones = [7, 14, 30, 100, 365];
            const nextMilestone = milestones.find(m => m > currentStreak) || 365;
            const prevMilestone = milestones.filter(m => m <= currentStreak).pop() || 0;
            const progress = ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

            return (
              <>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{currentStreak} / {nextMilestone} jours</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    Prochain bonus
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-orange-500"
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Week preview */}
      <div className="flex justify-center gap-1.5 mt-4">
        {Array.from({ length: 7 }).map((_, i) => {
          const dayInStreak = i < (currentStreak % 7 || (currentStreak >= 7 ? 7 : 0));
          return (
            <div
              key={i}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                dayInStreak
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
