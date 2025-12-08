import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { getPhysicalMovies } from "@/services/physicalMovies";
import { BadgeUnlockDialog } from "@/components/BadgeUnlockDialog";
import { BADGES_DATA, LEVEL_MILESTONES, GameBadge, BadgeTier } from "@/data/gameData";
import { supabase } from "@/integrations/supabase/client";

// --- HELPERS ---
const getSeenBadgesKey = (userId: string) => `cinevault_seen_badges_v2_${userId}`;

const getSeenBadges = (userId: string): Set<string> => {
  try {
    const stored = localStorage.getItem(getSeenBadgesKey(userId));
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (e) {
    console.error("Error reading seen badges from localStorage:", e);
  }
  return new Set();
};

const saveSeenBadges = (userId: string, badgeIds: Set<string>) => {
  try {
    localStorage.setItem(getSeenBadgesKey(userId), JSON.stringify(Array.from(badgeIds)));
  } catch (e) {
    console.error("Error saving seen badges to localStorage:", e);
  }
};

// --- TYPES DE DONNÉES UTILISATEUR POUR LE JEU ---
interface UserGameStats {
  watchedIds: Set<number>;
  favoriteIds: Set<number>;
  reviewCount: number;
  physicalCount: number;
}

// --- CONTEXT TYPE ---
export interface UnlockedBadgeInfo {
  badgeId: string;
  tierIndex: number;
  tier: BadgeTier;
  unlockedAt: Date; // Pour le tri futur si on le stocke
}

interface BadgeNotificationContextType {
  currentXp: number;
  currentLevel: number;
  nextLevelXp: number;
  currentLevelXp: number; // XP au début du niveau actuel
  progressPercent: number;
  unlockedBadges: UnlockedBadgeInfo[]; // Liste enrichie des badges débloqués
  userStats: UserGameStats;
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
  const { userMovies, loading: moviesLoading } = useUserMovies();
  
  // État local pour le nombre de films physiques et d'avis
  const [physicalCount, setPhysicalCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const [unlockedBadgeQueue, setUnlockedBadgeQueue] = useState<{ badge: GameBadge; tier: BadgeTier }[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessingClose, setIsProcessingClose] = useState(false);

  // Track seen badges (persisted in localStorage) - Format: "badgeId_tierIndex"
  const [seenBadges, setSeenBadges] = useState<Set<string>>(new Set());

  // Track if initial load is complete
  const isInitialized = useRef(false);

  // Fonction pour récupérer les stats
  const fetchUserStats = useCallback(async () => {
    if (!user) return;
    
    // Récupérer les films physiques
    const physicalData = await getPhysicalMovies(user.id);
    setPhysicalCount(physicalData.length);
    
    // Récupérer le nombre d'avis depuis la table reviews
    const { count, error } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    
    if (!error && count !== null) {
      setReviewCount(count);
    }
  }, [user]);

  // Récupérer les stats au chargement et quand l'utilisateur change
  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  // Calculer les stats de jeu
  const userStats: UserGameStats = useMemo(() => {
    const watched = new Set<number>();
    const favorites = new Set<number>();

    userMovies.forEach(m => {
      if (m.status === 'watched') {
        watched.add(m.tmdb_id);
      }
      if (m.is_favorite) favorites.add(m.tmdb_id);
    });

    return {
      watchedIds: watched,
      favoriteIds: favorites,
      reviewCount: reviewCount,
      physicalCount: physicalCount
    };
  }, [userMovies, physicalCount, reviewCount]);

  // Cœur du système : Calculer l'XP et les badges débloqués
  const { currentXp, currentLevel, nextLevelXp, currentLevelXp, progressPercent, unlockedBadges, newlyUnlocked } = useMemo(() => {
    let xp = 0;
    const unlocked: UnlockedBadgeInfo[] = [];
    const newUnlocks: { badge: GameBadge; tier: BadgeTier; uniqueKey: string }[] = [];

    // Parcourir toutes les configs de badges
    BADGES_DATA.forEach(badge => {
      // Déterminer la progression actuelle pour ce badge
      let currentProgress = 0;

      if (badge.id === 'total_watched') currentProgress = userStats.watchedIds.size;
      else if (badge.id === 'reviews_count') currentProgress = userStats.reviewCount;
      else if (badge.id === 'favorites_count') currentProgress = userStats.favoriteIds.size;
      else if (badge.id === 'physical_count') currentProgress = userStats.physicalCount;
      else if (badge.movieIds) {
        // Pour les collections (Réalisateurs, Sagas, Genres)
        // Compte combien d'IDs de la liste sont dans watchedIds
        currentProgress = badge.movieIds.filter(id => userStats.watchedIds.has(id)).length;
      }

      // Vérifier quels tiers sont débloqués
      badge.tiers.forEach((tier, index) => {
        if (currentProgress >= tier.target) {
          xp += tier.xp;
          unlocked.push({
            badgeId: badge.id,
            tierIndex: index,
            tier: tier,
            unlockedAt: new Date() // Idéalement, viendrait de la date du dernier film vu
          });

          // Vérifier si c'est nouveau pour la notification
          const uniqueKey = `${badge.id}_${index}`;
          if (!seenBadges.has(uniqueKey) && isInitialized.current) {
            newUnlocks.push({ badge, tier, uniqueKey });
          }
        }
      });
    });

    // Calcul du niveau
    let level = 1;
    let levelXpStart = 0;
    let levelXpEnd = LEVEL_MILESTONES[0];

    for (let i = 0; i < LEVEL_MILESTONES.length; i++) {
      if (xp >= LEVEL_MILESTONES[i]) {
        level = i + 2; // Index 0 = completion du niveau 1 -> passage niveau 2
        levelXpStart = LEVEL_MILESTONES[i];
      } else {
        levelXpEnd = LEVEL_MILESTONES[i];
        break;
      }
    }

    const xpInCurrentLevel = xp - levelXpStart;
    const xpNeededForCurrentLevel = levelXpEnd - levelXpStart;
    const percent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForCurrentLevel) * 100));

    return {
      currentXp: xp,
      currentLevel: level,
      nextLevelXp: levelXpEnd,
      currentLevelXp: levelXpStart,
      progressPercent: percent,
      unlockedBadges: unlocked,
      newlyUnlocked: newUnlocks
    };
  }, [userStats, seenBadges]);

  // Chargement des badges vus depuis localStorage
  useEffect(() => {
    if (user) {
      const stored = getSeenBadges(user.id);
      setSeenBadges(stored);
      // Petite pause pour laisser le temps de charger avant de déclencher des notifs
      setTimeout(() => {
        isInitialized.current = true;
      }, 1000);
    } else {
      setSeenBadges(new Set());
      isInitialized.current = false;
    }
  }, [user?.id]);

  // Gestion de la file d'attente des notifications
  useEffect(() => {
    if (newlyUnlocked.length > 0) {
      // Ajouter à la queue
      const queueItems = newlyUnlocked.map(item => ({
        badge: {
          ...item.badge,
          // Surcharge temporaire pour l'affichage dans le dialog
          title: item.tier.title, // On affiche "Expert" au lieu de "Visionneur"
          xp: item.tier.xp
        },
        tier: item.tier
      }));
      
      setUnlockedBadgeQueue(prev => [...prev, ...queueItems]);

      // Marquer comme vu immédiatement pour ne pas re-trigger
      setSeenBadges(prev => {
        const updated = new Set(prev);
        newlyUnlocked.forEach(item => updated.add(item.uniqueKey));
        if (user) saveSeenBadges(user.id, updated);
        return updated;
      });
    }
  }, [newlyUnlocked, user]);

  // Afficher le dialog
  useEffect(() => {
    if (unlockedBadgeQueue.length > 0 && !isDialogOpen && !isProcessingClose) {
      setIsDialogOpen(true);
    }
  }, [unlockedBadgeQueue, isDialogOpen, isProcessingClose]);

  const handleCloseDialog = useCallback(() => {
    if (isProcessingClose) return;
    setIsProcessingClose(true);
    setIsDialogOpen(false);

    setTimeout(() => {
      setUnlockedBadgeQueue(prev => prev.slice(1));
      setIsProcessingClose(false);
    }, 300);
  }, [isProcessingClose]);

  const triggerTestBadge = useCallback(() => {
    const randomBadge = BADGES_DATA[0];
    const randomTier = randomBadge.tiers[0];
    setUnlockedBadgeQueue(prev => [...prev, { 
      badge: { ...randomBadge, title: "Test Badge", xp: 500 }, 
      tier: randomTier 
    }]);
  }, []);

  const value = {
    currentXp,
    currentLevel,
    nextLevelXp,
    currentLevelXp,
    progressPercent,
    unlockedBadges,
    userStats,
    triggerTestBadge,
    refreshStats: fetchUserStats
  };

  return (
    <BadgeNotificationContext.Provider value={value}>
      {children}
      <BadgeUnlockDialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
        badge={unlockedBadgeQueue[0] ? {
          id: unlockedBadgeQueue[0].badge.id,
          title: unlockedBadgeQueue[0].tier.title,
          description: unlockedBadgeQueue[0].badge.description,
          xp: unlockedBadgeQueue[0].tier.xp,
          icon: unlockedBadgeQueue[0].badge.icon,
          color: unlockedBadgeQueue[0].badge.color
        } : null}
        onClose={handleCloseDialog}
      />
    </BadgeNotificationContext.Provider>
  );
}
