import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GamificationNotifications {
  hasNewBadges: boolean;
  hasCompletedChallenges: boolean;
  hasNewRewards: boolean;
  totalNotifications: number;
  markBadgesAsSeen: () => void;
  markChallengesAsSeen: () => void;
  markRewardsAsSeen: () => void;
  refresh: () => Promise<void>;
}

const SEEN_BADGES_KEY = "cinevault_seen_badges";
const SEEN_CHALLENGES_KEY = "cinevault_seen_challenges";
const SEEN_REWARDS_KEY = "cinevault_seen_rewards";

export function useGamificationNotifications(): GamificationNotifications {
  const { user } = useAuth();
  const [hasNewBadges, setHasNewBadges] = useState(false);
  const [hasCompletedChallenges, setHasCompletedChallenges] = useState(false);
  const [hasNewRewards, setHasNewRewards] = useState(false);

  const checkNotifications = useCallback(async () => {
    if (!user) {
      setHasNewBadges(false);
      setHasCompletedChallenges(false);
      setHasNewRewards(false);
      return;
    }

    try {
      // Check for new badges
      const seenBadges = JSON.parse(localStorage.getItem(SEEN_BADGES_KEY) || "[]");
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);
      
      const currentBadgeIds = userBadges?.map(b => b.badge_id) || [];
      const newBadgeIds = currentBadgeIds.filter(id => !seenBadges.includes(id));
      setHasNewBadges(newBadgeIds.length > 0);

      // Check for completed but unclaimed challenges
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const weekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];

      const { data: completedChallenges } = await supabase
        .from("user_challenges")
        .select("challenge_id")
        .eq("user_id", user.id)
        .eq("week_start", weekStart)
        .eq("is_completed", true)
        .eq("reward_claimed", false);

      setHasCompletedChallenges((completedChallenges?.length || 0) > 0);

      // Check for new rewards
      const seenRewards = JSON.parse(localStorage.getItem(SEEN_REWARDS_KEY) || "[]");
      const { data: userRewards } = await supabase
        .from("user_rewards")
        .select("reward_id")
        .eq("user_id", user.id);
      
      const currentRewardIds = userRewards?.map(r => r.reward_id) || [];
      const newRewardIds = currentRewardIds.filter(id => !seenRewards.includes(id));
      setHasNewRewards(newRewardIds.length > 0);

    } catch (error) {
      console.error("Error checking gamification notifications:", error);
    }
  }, [user]);

  useEffect(() => {
    checkNotifications();
    
    // Set up realtime subscriptions
    if (!user) return;

    const badgesChannel = supabase
      .channel("badges-notifications")
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "user_badges",
        filter: `user_id=eq.${user.id}`
      }, () => {
        setHasNewBadges(true);
      })
      .subscribe();

    const rewardsChannel = supabase
      .channel("rewards-notifications")
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "user_rewards",
        filter: `user_id=eq.${user.id}`
      }, () => {
        setHasNewRewards(true);
      })
      .subscribe();

    const challengesChannel = supabase
      .channel("challenges-notifications")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "user_challenges",
        filter: `user_id=eq.${user.id}`
      }, () => {
        checkNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(badgesChannel);
      supabase.removeChannel(rewardsChannel);
      supabase.removeChannel(challengesChannel);
    };
  }, [user, checkNotifications]);

  const markBadgesAsSeen = useCallback(async () => {
    if (!user) return;
    
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", user.id);
    
    const badgeIds = userBadges?.map(b => b.badge_id) || [];
    localStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(badgeIds));
    setHasNewBadges(false);
  }, [user]);

  const markChallengesAsSeen = useCallback(() => {
    // Challenges are marked as seen when claimed
    setHasCompletedChallenges(false);
  }, []);

  const markRewardsAsSeen = useCallback(async () => {
    if (!user) return;
    
    const { data: userRewards } = await supabase
      .from("user_rewards")
      .select("reward_id")
      .eq("user_id", user.id);
    
    const rewardIds = userRewards?.map(r => r.reward_id) || [];
    localStorage.setItem(SEEN_REWARDS_KEY, JSON.stringify(rewardIds));
    setHasNewRewards(false);
  }, [user]);

  const totalNotifications = 
    (hasNewBadges ? 1 : 0) + 
    (hasCompletedChallenges ? 1 : 0) + 
    (hasNewRewards ? 1 : 0);

  return {
    hasNewBadges,
    hasCompletedChallenges,
    hasNewRewards,
    totalNotifications,
    markBadgesAsSeen,
    markChallengesAsSeen,
    markRewardsAsSeen,
    refresh: checkNotifications,
  };
}
