import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/services/notificationService";

export interface FollowStats {
  followers: number;
  following: number;
}

export function useFollows(targetUserId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState<FollowStats>({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (targetUserId) {
      checkFollowStatus();
      fetchStats();
    }
  }, [targetUserId, user?.id]);

  const checkFollowStatus = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    try {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const fetchStats = async () => {
    if (!targetUserId) return;

    try {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetUserId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetUserId),
      ]);

      setStats({
        followers: followers || 0,
        following: following || 0,
      });
    } catch (error) {
      console.error("Error fetching follow stats:", error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
        toast({ title: "Vous ne suivez plus cet utilisateur" });
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        if (error) throw error;
        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        toast({ title: "Vous suivez maintenant cet utilisateur" });

        // Créer une notification pour l'utilisateur suivi
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();
          
          await createNotification(
            targetUserId,
            'new_follower',
            '👤 Nouvel abonné !',
            `${profile?.username || 'Un utilisateur'} vous suit maintenant.`,
            { followerId: user.id, followerUsername: profile?.username }
          );
        } catch (notifError) {
          console.error('[Follows] Error creating notification:', notifError);
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le suivi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFollowers = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId);

      return data?.map((f) => f.follower_id) || [];
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
  };

  const getFollowing = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      return data?.map((f) => f.following_id) || [];
    } catch (error) {
      console.error("Error fetching following:", error);
      return [];
    }
  };

  return {
    isFollowing,
    stats,
    loading,
    toggleFollow,
    getFollowers,
    getFollowing,
    refreshStats: fetchStats,
  };
}
