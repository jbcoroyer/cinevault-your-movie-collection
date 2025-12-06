import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useBadges, GameBadge, BADGES_CONFIG } from "./BadgeContext";
import { BadgeUnlockDialog } from "@/components/BadgeUnlockDialog";

interface BadgeNotificationContextType {
  checkForNewBadges: () => void;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextType | undefined>(undefined);

export function useBadgeNotifications() {
  const context = useContext(BadgeNotificationContext);
  if (context === undefined) {
    throw new Error("useBadgeNotifications must be used within a BadgeNotificationProvider");
  }
  return context;
}

interface BadgeNotificationProviderProps {
  children: ReactNode;
}

export function BadgeNotificationProvider({ children }: BadgeNotificationProviderProps) {
  const { user } = useAuth();
  const { unlockedBadges, watchedMovieIds, favoriteMovieIds } = useBadges();
  
  const [unlockedBadgeQueue, setUnlockedBadgeQueue] = useState<GameBadge[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastCheckedBadges, setLastCheckedBadges] = useState<Set<string>>(new Set());

  // Check for new badges when unlocked badges change
  useEffect(() => {
    if (!user) return;

    const seenBadgesKey = `seen_badges_${user.id}`;
    const storedSeenBadges = localStorage.getItem(seenBadgesKey);
    const seenBadges: string[] = storedSeenBadges ? JSON.parse(storedSeenBadges) : [];

    const newUnlocks: GameBadge[] = [];

    unlockedBadges.forEach((badgeId) => {
      if (!seenBadges.includes(badgeId) && !lastCheckedBadges.has(badgeId)) {
        const badgeConfig = BADGES_CONFIG.find((b) => b.id === badgeId);
        if (badgeConfig) {
          newUnlocks.push(badgeConfig);
        }
      }
    });

    if (newUnlocks.length > 0) {
      setUnlockedBadgeQueue((prev) => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(b => b.id));
        const uniqueNewUnlocks = newUnlocks.filter(b => !existingIds.has(b.id));
        return [...prev, ...uniqueNewUnlocks];
      });
      setLastCheckedBadges(new Set(unlockedBadges));
    }
  }, [unlockedBadges, user, lastCheckedBadges]);

  // Show dialog when there are badges in queue
  useEffect(() => {
    if (unlockedBadgeQueue.length > 0 && !isDialogOpen) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsDialogOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [unlockedBadgeQueue, isDialogOpen]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);

    if (unlockedBadgeQueue.length > 0 && user) {
      const badgeToMark = unlockedBadgeQueue[0];

      const seenBadgesKey = `seen_badges_${user.id}`;
      const storedSeenBadges = localStorage.getItem(seenBadgesKey);
      const seenBadges: string[] = storedSeenBadges ? JSON.parse(storedSeenBadges) : [];

      if (!seenBadges.includes(badgeToMark.id)) {
        const updatedSeen = [...seenBadges, badgeToMark.id];
        localStorage.setItem(seenBadgesKey, JSON.stringify(updatedSeen));
      }

      // Wait for close animation before removing from queue
      setTimeout(() => {
        setUnlockedBadgeQueue((prev) => prev.slice(1));
      }, 300);
    }
  }, [unlockedBadgeQueue, user]);

  const checkForNewBadges = useCallback(() => {
    // Force re-check by clearing last checked
    setLastCheckedBadges(new Set());
  }, []);

  return (
    <BadgeNotificationContext.Provider value={{ checkForNewBadges }}>
      {children}
      <BadgeUnlockDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        badge={unlockedBadgeQueue[0] || null}
        onClose={handleCloseDialog}
      />
    </BadgeNotificationContext.Provider>
  );
}
