import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeUnlockDialog } from "@/components/BadgeUnlockDialog";
import { STATIC_BADGES, getLevel, XP_LEVELS } from "@/data/gameData";
import { UserBadgeProgress } from "@/services/badgeService";
import { supabase } from "@/lib/supabase";

// --- CONTEXT TYPE ---
interface BadgeNotificationContextType {
  currentXp: number;
  currentLevel: number;
  nextLevelXp: number;
  currentLevelXp: number;
  progressPercent: number;
  triggerTestBadge: () => void;
  refreshStats: () => void;
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
  const [unlockedBadgeQueue, setUnlockedBadgeQueue] = useState<UserBadgeProgress[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Récupérer les stats (XP)
  const refreshStats = useCallback(async () => {
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();

    if (profile) {
      setXp(profile.total_xp || 0);
    }
  }, [user]);

  // Initialisation et écoute temps réel des nouveaux badges
  useEffect(() => {
    if (!user) return;

    refreshStats();

    // Écoute les insertions dans la table user_badges (déclenchées par le backend)
    const channel = supabase
      .channel("gamification-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Nouveau badge détecté en temps réel !
          const newBadgeId = payload.new.badge_id;
          const badgeDef = STATIC_BADGES.find((b) => b.id === newBadgeId);

          if (badgeDef) {
            const newBadgeUserProgress: UserBadgeProgress = {
              badgeId: badgeDef.id,
              current: badgeDef.criteria.count || 1,
              target: badgeDef.criteria.count || 1,
              isUnlocked: true,
              unlockedAt: new Date().toISOString(),
              rarity: payload.new.rarity || badgeDef.baseRarity,
            };
            // Ajouter à la file d'attente pour affichage
            setUnlockedBadgeQueue((prev) => [...prev, newBadgeUserProgress]);
            // Mettre à jour l'XP
            refreshStats();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshStats]);

  // Gestion de la file d'attente des notifications (Dialog)
  useEffect(() => {
    if (unlockedBadgeQueue.length > 0 && !isDialogOpen) {
      setIsDialogOpen(true);
    }
  }, [unlockedBadgeQueue, isDialogOpen]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Attendre la fin de l'animation de fermeture avant de passer au suivant
    setTimeout(() => {
      setUnlockedBadgeQueue((prev) => prev.slice(1));
    }, 300);
  };

  const triggerTestBadge = () => {
    const demoBadge = STATIC_BADGES[0];
    if (demoBadge) {
      setUnlockedBadgeQueue((prev) => [
        ...prev,
        {
          badgeId: demoBadge.id,
          current: 1,
          target: 1,
          isUnlocked: true,
          rarity: "holographic",
        },
      ]);
    }
  };

  // Calculs de niveau
  const currentLevel = getLevel(xp);
  // Protection contre les index hors limites
  const safeLevelIndex = Math.min(currentLevel, XP_LEVELS.length - 1);
  const safePrevLevelIndex = Math.max(0, currentLevel - 1);

  const nextLevelXp = XP_LEVELS[safeLevelIndex] || XP_LEVELS[XP_LEVELS.length - 1];
  const currentLevelXp = XP_LEVELS[safePrevLevelIndex] || 0;

  const progressPercent =
    nextLevelXp === currentLevelXp
      ? 100
      : Math.min(100, Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));

  const value = {
    currentXp: xp,
    currentLevel,
    nextLevelXp,
    currentLevelXp,
    progressPercent,
    triggerTestBadge,
    refreshStats,
  };

  const currentBadgeData = unlockedBadgeQueue[0]
    ? STATIC_BADGES.find((b) => b.id === unlockedBadgeQueue[0].badgeId)
    : null;

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
            xp: 100, // Valeur par défaut si non spécifiée
            icon: currentBadgeData.icon,
            color: "text-amber-500", // Couleur par défaut
          }}
          onClose={handleCloseDialog}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
}
