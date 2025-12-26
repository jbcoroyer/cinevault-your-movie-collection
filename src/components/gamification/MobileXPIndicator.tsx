/**
 * CineVault — Mobile XP Indicator
 *
 * Phase 2: Polish Gamification
 * - Micro-barre de progression XP pour mobile
 * - Visible dans le header mobile
 * - Animation au gain d'XP
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getLevelFromXp, getXpProgress } from "@/data/videoClubData";
import { Link } from "react-router-dom";

interface MobileXPIndicatorProps {
  className?: string;
  compact?: boolean;
}

export const MobileXPIndicator: React.FC<MobileXPIndicatorProps> = ({
  className,
  compact = false,
}) => {
  const { user, profile } = useAuth();
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showPulse, setShowPulse] = useState(false);

  // Fetch XP and streak
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      // XP
      if (profile?.total_xp) {
        setTotalXp(profile.total_xp);
      }

      // Streak
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      if (streakData?.current_streak) {
        setStreak(streakData.current_streak);
      }
    };

    fetchStats();
  }, [user, profile?.total_xp]);

  // Subscribe to XP changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`xp-indicator-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newXp = (payload.new as any).total_xp;
          if (newXp && newXp !== totalXp) {
            setTotalXp(newXp);
            setShowPulse(true);
            setTimeout(() => setShowPulse(false), 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, totalXp]);

  if (!user) return null;

  const level = getLevelFromXp(totalXp);
  const { percentage } = getXpProgress(totalXp);

  if (compact) {
    return (
      <Link
        to="/badges"
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full",
          "bg-amber-500/10 border border-amber-500/20",
          "transition-all duration-200 hover:bg-amber-500/20",
          className
        )}
      >
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">{level}</span>
          </div>
          {/* Progress ring */}
          <svg
            className="absolute -inset-0.5 w-6 h-6 -rotate-90"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-amber-500/20"
            />
            <motion.circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${percentage * 0.628} 100`}
              className="text-amber-500"
              initial={false}
              animate={{ pathLength: percentage / 100 }}
            />
          </svg>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-0.5">
            <Flame
              className={cn(
                "w-3 h-3",
                streak >= 7
                  ? "text-orange-500"
                  : streak >= 3
                    ? "text-amber-500"
                    : "text-yellow-500"
              )}
              fill="currentColor"
            />
            <span className="text-[10px] font-bold text-amber-500">{streak}</span>
          </div>
        )}

        {/* Pulse animation on XP gain */}
        <AnimatePresence>
          {showPulse && (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-full bg-amber-500"
            />
          )}
        </AnimatePresence>
      </Link>
    );
  }

  return (
    <Link
      to="/badges"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
        "border border-amber-500/20",
        "transition-all duration-200 hover:border-amber-500/40",
        className
      )}
    >
      {/* Level badge */}
      <div className="relative">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-xs font-bold text-white">{level}</span>
        </div>
        {/* Progress ring */}
        <svg
          className="absolute -inset-0.5 w-8 h-8 -rotate-90"
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-amber-500/20"
          />
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray={`${percentage} 100`}
            className="text-amber-500"
            initial={false}
            animate={{ pathLength: percentage / 100 }}
          />
        </svg>
      </div>

      {/* XP and streak */}
      <div className="flex flex-col items-start">
        <span className="text-xs font-semibold text-amber-500">
          {totalXp.toLocaleString()} XP
        </span>
        {streak > 0 && (
          <span className="text-[10px] text-amber-500/70 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {streak}j streak
          </span>
        )}
      </div>

      {/* Pulse animation on XP gain */}
      <AnimatePresence>
        {showPulse && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-full bg-amber-500/30"
          />
        )}
      </AnimatePresence>
    </Link>
  );
};

export default MobileXPIndicator;
