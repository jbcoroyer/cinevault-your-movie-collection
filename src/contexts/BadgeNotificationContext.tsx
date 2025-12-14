import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeUnlockDialog } from "@/components/BadgeUnlockDialog";
import { supabase } from "@/integrations/supabase/client";
import { ICON_MAP, getXpProgress, getTitleForLevel } from "@/data/videoClubData";
import { Sparkles } from "lucide-react";
import { checkAndUnlockBadges } from "@/services/badgeService";

// --- TYPES ---
interface BadgeNotification {
  id: string;
  title: string;
  description: string;
  icon: any;
  xp: number;
  rarity: string;
}

interface BadgeNotificationContextType {
  currentXp: number;
  currentLevel: number;
  currentTitle: string;
  nextLevelXp: number;
  progressPercent: number;
  xpToNextLevel: number;
  triggerTestBadge: () => void;
  checkBadges: () => Promise<void>;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | null>(null);

export function useBadgeNotification() {
  const context = useContext(BadgeNotificationContext);
  if (!context) {
    throw new Error("useBadgeNotification must be used within a BadgeNotificationProvider");
  }
  return context;
}

export function BadgeNotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [xp, setXp] = useState(0);
  const [notificationQueue, setNotificationQueue] = useState<BadgeNotification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fonction centrale pour vérifier et débloquer les badges
  const checkBadges = useCallback(async () => {
    if (!user) return;

    console.log("[BadgeContext] Checking badges for user:", user.id);

    // Vérifie les critères et insère les badges si mérités
    const unlockedIds = await checkAndUnlockBadges(user.id);
    
    console.log("[BadgeContext] Newly unlocked badges:", unlockedIds);

    // Si des badges ont été débloqués ET que le realtime n'a pas déjà ajouté les notifs
    // on les ajoute manuellement (backup en cas de problème realtime)
    if (unlockedIds.length > 0) {
      for (const badgeId of unlockedIds) {
        // Vérifie si ce badge n'est pas déjà dans la queue
        const alreadyInQueue = notificationQueue.some((n) => n.id === badgeId);
        if (!alreadyInQueue) {
          const { data: def } = await supabase
            .from("badge_definitions")
            .select("*")
            .eq("id", badgeId)
            .maybeSingle();
          
          if (def) {
            console.log("[BadgeContext] Manually adding notification for:", def.title);
            const IconComponent = ICON_MAP[def.icon_name] || Sparkles;
            setNotificationQueue((prev) => {
              // Double check to avoid duplicates
              if (prev.some((n) => n.id === badgeId)) return prev;
              return [...prev, {
                id: def.id,
                title: def.title,
                description: def.description,
                icon: IconComponent,
                xp: def.xp_reward || 0,
                rarity: def.base_rarity || "common",
              }];
            });
          }
        }
      }
    }

    // Met à jour l'XP
    const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
    if (profile) {
      setXp(profile.total_xp || 0);
    }
  }, [user, notificationQueue]);

  // Écouter les nouveaux badges en Temps Réel
  useEffect(() => {
    if (!user) return;

    console.log("[BadgeContext] Setting up real-time subscription for user:", user.id);

    // Vérification initiale au chargement
    checkBadges();

    const channel = supabase
      .channel(`badge-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("[BadgeContext] Real-time badge INSERT detected:", payload);
          
          const newBadgeId = payload.new.badge_id;
          const rarity = payload.new.rarity;

          const { data: def, error } = await supabase
            .from("badge_definitions")
            .select("*")
            .eq("id", newBadgeId)
            .maybeSingle();

          console.log("[BadgeContext] Badge definition fetched:", def, error);

          if (def) {
            const IconComponent = ICON_MAP[def.icon_name] || Sparkles;

            const newNotif: BadgeNotification = {
              id: def.id,
              title: def.title,
              description: def.description,
              icon: IconComponent,
              xp: def.xp_reward || 0,
              rarity: rarity || def.base_rarity,
            };

            console.log("[BadgeContext] Adding notification to queue:", newNotif);
            setNotificationQueue((prev) => [...prev, newNotif]);

            // Recharge l'XP après un délai
            setTimeout(() => {
              supabase.from("profiles").select("total_xp").eq("id", user.id).single().then(({ data }) => {
                if (data) setXp(data.total_xp || 0);
              });
            }, 500);
          }
        },
      )
      .subscribe((status) => {
        console.log("[BadgeContext] Subscription status:", status);
      });

    return () => {
      console.log("[BadgeContext] Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Gestion de la file d'attente
  useEffect(() => {
    console.log("[BadgeContext] Queue updated:", notificationQueue.length, "items, dialog open:", isDialogOpen);
    if (notificationQueue.length > 0 && !isDialogOpen) {
      console.log("[BadgeContext] Opening badge dialog for:", notificationQueue[0].title);
      setIsDialogOpen(true);
    }
  }, [notificationQueue, isDialogOpen]);

  const handleCloseDialog = () => {
    console.log("[BadgeContext] Closing dialog");
    setIsDialogOpen(false);
    setTimeout(() => {
      setNotificationQueue((prev) => prev.slice(1));
    }, 300);
  };

  const triggerTestBadge = () => {
    setNotificationQueue((prev) => [
      ...prev,
      {
        id: "test_badge",
        title: "Badge de Test",
        description: "Ceci est une simulation.",
        icon: Sparkles,
        xp: 100,
        rarity: "legendary",
      },
    ]);
  };

  // Calculs basés sur la nouvelle formule XP
  const progress = getXpProgress(xp);
  const currentTitle = getTitleForLevel(progress.currentLevel);

  const value = {
    currentXp: xp,
    currentLevel: progress.currentLevel,
    currentTitle,
    nextLevelXp: progress.nextLevelXp,
    progressPercent: progress.progressPercent,
    xpToNextLevel: progress.xpToNextLevel,
    triggerTestBadge,
    checkBadges,
  };

  const currentBadgeData = notificationQueue[0];

  return (
    <BadgeNotificationContext.Provider value={value}>
      {children}
      {currentBadgeData && (
        <BadgeUnlockDialog
          open={isDialogOpen}
          onOpenChange={(open) => !open && handleCloseDialog()}
          badge={{
            id: currentBadgeData.id,
            title: currentBadgeData.title,
            description: currentBadgeData.description,
            xp: currentBadgeData.xp,
            icon: currentBadgeData.icon,
            color: "text-videoclub-cyan",
          }}
          onClose={handleCloseDialog}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
}
