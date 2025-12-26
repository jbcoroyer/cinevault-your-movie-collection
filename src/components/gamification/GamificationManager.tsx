/**
 * CineVault — Gamification Manager Amélioré
 *
 * Phase 2: Polish Gamification
 * - Notifications XP plus visuelles
 * - Streak tracking amélioré
 * - Level up celebrations
 * - Intégration avec XPToast
 */

import React, { useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useXPToast } from "./XPToast";
import { toast } from "sonner";
import { Trophy, Flame, Star, Gift } from "lucide-react";

// ============================================
// XP Configuration
// ============================================

export const XP_REWARDS = {
  // Collection actions
  ADD_PHYSICAL_MOVIE: 50,
  ADD_PHYSICAL_4K: 75,
  ADD_PHYSICAL_STEELBOOK: 100,
  ADD_PHYSICAL_COLLECTOR: 150,

  // Social actions
  WRITE_REVIEW: 30,
  RATE_MOVIE: 10,
  ADD_TO_WATCHLIST: 5,
  MARK_AS_WATCHED: 15,
  ADD_TO_FAVORITES: 10,

  // Engagement
  DAILY_LOGIN: 25,
  STREAK_BONUS_3: 50,
  STREAK_BONUS_7: 100,
  STREAK_BONUS_30: 500,

  // Lists
  CREATE_LIST: 20,
  ADD_TO_LIST: 5,
  SHARE_COLLECTION: 50,
} as const;

// ============================================
// Gamification Manager Component
// ============================================

interface GamificationManagerProps {
  children: React.ReactNode;
}

export const GamificationManager: React.FC<GamificationManagerProps> = ({
  children,
}) => {
  const { user, profile } = useAuth();
  const { showXPGain } = useXPToast();
  const lastXpRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  // Initialize with current XP
  useEffect(() => {
    if (profile?.total_xp !== undefined && !hasInitializedRef.current) {
      lastXpRef.current = profile.total_xp;
      hasInitializedRef.current = true;
    }
  }, [profile?.total_xp]);

  // Award XP function
  const awardXP = useCallback(
    async (amount: number, reason: string) => {
      if (!user) return;

      try {
        const currentXp = lastXpRef.current;

        // Update in database
        const { error } = await supabase.rpc("add_user_xp", {
          p_user_id: user.id,
          p_xp_amount: amount,
        });

        if (error) throw error;

        // Show toast with animation
        showXPGain(amount, reason, currentXp);

        // Update ref
        lastXpRef.current = currentXp + amount;
      } catch (error) {
        console.error("Error awarding XP:", error);
      }
    },
    [user, showXPGain]
  );

  // Listen for collection changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`gamification-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "physical_movies",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const format = payload.new.format;
          let xpAmount = XP_REWARDS.ADD_PHYSICAL_MOVIE;
          let reason = "Film ajouté à la collection";

          switch (format) {
            case "4k":
              xpAmount = XP_REWARDS.ADD_PHYSICAL_4K;
              reason = "Film 4K ajouté";
              break;
            case "steelbook":
              xpAmount = XP_REWARDS.ADD_PHYSICAL_STEELBOOK;
              reason = "Steelbook ajouté";
              break;
            case "collector":
              xpAmount = XP_REWARDS.ADD_PHYSICAL_COLLECTOR;
              reason = "Édition Collector ajoutée";
              break;
          }

          awardXP(xpAmount, reason);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reviews",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          awardXP(XP_REWARDS.WRITE_REVIEW, "Avis publié");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_movies",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const oldData = payload.old as any;
          const newData = payload.new as any;

          // Rating added/changed
          if (
            newData.rating &&
            (!oldData.rating || newData.rating !== oldData.rating)
          ) {
            awardXP(XP_REWARDS.RATE_MOVIE, "Film noté");
          }

          // Marked as watched
          if (newData.status === "watched" && oldData.status !== "watched") {
            awardXP(XP_REWARDS.MARK_AS_WATCHED, "Film marqué comme vu");
          }

          // Added to favorites
          if (newData.is_favorite && !oldData.is_favorite) {
            awardXP(XP_REWARDS.ADD_TO_FAVORITES, "Ajouté aux favoris");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, awardXP]);

  // Check streak on mount
  useEffect(() => {
    if (!user) return;

    const checkStreak = async () => {
      try {
        const { data: streakData } = await supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!streakData) return;

        const streak = streakData.current_streak;

        // Streak milestone notifications
        if (streak === 3) {
          toast(
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold">Streak de 3 jours ! 🔥</p>
                <p className="text-sm text-muted-foreground">
                  +{XP_REWARDS.STREAK_BONUS_3} XP bonus
                </p>
              </div>
            </div>,
            { duration: 4000 }
          );
        } else if (streak === 7) {
          toast(
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold">1 semaine de streak ! 🎉</p>
                <p className="text-sm text-muted-foreground">
                  +{XP_REWARDS.STREAK_BONUS_7} XP bonus
                </p>
              </div>
            </div>,
            { duration: 5000 }
          );
        } else if (streak === 30) {
          toast(
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold">30 jours consécutifs ! 🏆</p>
                <p className="text-sm text-muted-foreground">
                  +{XP_REWARDS.STREAK_BONUS_30} XP bonus légendaire !
                </p>
              </div>
            </div>,
            { duration: 6000 }
          );
        }
      } catch (error) {
        console.error("Error checking streak:", error);
      }
    };

    checkStreak();
  }, [user]);

  return <>{children}</>;
};

export default GamificationManager;
