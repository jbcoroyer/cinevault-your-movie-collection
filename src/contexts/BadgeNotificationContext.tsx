import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeUnlockDialog } from "@/components/BadgeUnlockDialog";
import { supabase } from "@/lib/supabase";
import { ICON_MAP } from "@/data/gameData";
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
  nextLevelXp: number;
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
  const [notificationQueue, setNotificationQueue] = useState<BadgeNotification[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 1. Fonction pour vérifier l'XP et tenter de débloquer les badges manquants
  const refreshStats = useCallback(async () => {
    if (!user) return;

    // On lance la vérification : si des badges sont mérités, ils seront insérés en DB
    await checkAndUnlockBadges(user.id);

    // On recharge l'XP
    const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
    if (profile) {
      setXp(profile.total_xp || 0);
    }
  }, [user]);

  // 2. Écouter TOUT ce qui se passe (Badges, Films, Reviews)
  useEffect(() => {
    if (!user) return;

    refreshStats();

    const channel = supabase
      .channel("game-events")
      // A. Quand un badge est gagné (inséré en DB via badgeService ou Debug)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_badges", filter: `user_id=eq.${user.id}` },
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
            // Petit délai pour mettre à jour l'XP affichée
            setTimeout(refreshStats, 1000);
          }
        },
      )
      // B. Quand l'utilisateur modifie ses films (ajoute, note, change status) -> On revérifie les badges
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_movies", filter: `user_id=eq.${user.id}` },
        () => {
          console.log("Movie change detected, checking badges...");
          refreshStats();
        },
      )
      // C. Quand l'utilisateur poste une review -> On revérifie les badges
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews", filter: `user_id=eq.${user.id}` },
        () => {
          console.log("Review change detected, checking badges...");
          refreshStats();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshStats]);

  // 3. Gestion de la file d'attente des popups
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
        rarity: "holographic",
      },
    ]);
  };

  // Niveaux
  const LEVEL_THRESHOLD = 1000;
  const currentLevel = Math.floor(xp / LEVEL_THRESHOLD) + 1;
  const nextLevelXp = currentLevel * LEVEL_THRESHOLD;
  const xpInCurrentLevel = xp % LEVEL_THRESHOLD;
  const progressPercent = (xpInCurrentLevel / LEVEL_THRESHOLD) * 100;

  const value = {
    currentXp: xp,
    currentLevel,
    nextLevelXp,
    progressPercent,
    triggerTestBadge,
    refreshStats,
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
            color: "text-amber-500",
          }}
          onClose={handleCloseDialog}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
}
