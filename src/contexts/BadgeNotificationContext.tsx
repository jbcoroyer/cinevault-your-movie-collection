import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeUnlockDialog } from "@/components/BadgeUnlockDialog";
import { supabase } from "@/lib/supabase";
import { ICON_MAP } from "@/data/gameData"; // On utilise le nouveau mapping d'icônes
import { Sparkles } from "lucide-react";

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

  // 1. Récupérer l'XP actuelle depuis le profil
  const refreshStats = useCallback(async () => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single();
    if (profile) {
      setXp(profile.total_xp || 0);
    }
  }, [user]);

  // 2. Écouter les nouveaux badges en Temps Réel
  useEffect(() => {
    if (!user) return;

    refreshStats();

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
          // Un badge vient d'être inséré ! On récupère sa définition pour l'afficher.
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

            // On rafraichit l'XP global car le trigger DB a dû le mettre à jour
            setTimeout(refreshStats, 1000);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshStats]);

  // 3. Gestion de la file d'attente (Afficher une par une)
  useEffect(() => {
    if (notificationQueue.length > 0 && !isDialogOpen) {
      setIsDialogOpen(true);
    }
  }, [notificationQueue, isDialogOpen]);

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    // Petit délai pour laisser l'animation de fermeture se finir
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

  // 4. Logique de Niveau (Linéaire : 1 niveau tous les 1000 XP)
  const LEVEL_THRESHOLD = 1000;
  const currentLevel = Math.floor(xp / LEVEL_THRESHOLD) + 1;
  const nextLevelXp = currentLevel * LEVEL_THRESHOLD; // XP requis pour le prochain niveau (total)

  // Progression dans le niveau actuel (0 à 100%)
  // Ex: 1250 XP -> Niveau 2. XP dans le niveau = 250. % = 25%.
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
            // On peut déduire la couleur du texte depuis la rareté si besoin, ici défaut
            color: "text-amber-500",
          }}
          onClose={handleCloseDialog}
        />
      )}
    </BadgeNotificationContext.Provider>
  );
}
