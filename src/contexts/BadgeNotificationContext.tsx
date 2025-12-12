import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeUnlockDialog } from "@/components/BadgeUnlockDialog";
import { supabase } from "@/lib/supabase";
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

    // Vérifie les critères et insère les badges si mérités
    await checkAndUnlockBadges(user.id);

    // Met à jour l'XP
    const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
    if (profile) {
      setXp(profile.total_xp || 0);
    }
  }, [user]);

  // Écouter les nouveaux badges en Temps Réel
  useEffect(() => {
    if (!user) return;

    // Vérification initiale au chargement
    checkBadges();

    const channel = supabase
      .channel("badge-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const newBadgeId = payload.new.badge_id;
          const rarity = payload.new.rarity;

          const { data: def } = await supabase.from("badge_definitions").select("*").eq("id", newBadgeId).single();

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

            setNotificationQueue((prev) => [...prev, newNotif]);

            // Recharge l'XP
            setTimeout(checkBadges, 1000);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, checkBadges]);

  // Gestion de la file d'attente
  useEffect(() => {
    if (notificationQueue.length > 0 && !isDialogOpen) {
      setIsDialogOpen(true);
    }
  }, [notificationQueue, isDialogOpen]);

  const handleCloseDialog = () => {
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
