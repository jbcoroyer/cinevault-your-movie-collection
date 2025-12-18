/**
 * GamificationManager - Gestionnaire unifié des notifications de gamification
 * 
 * Ce composant gère :
 * - L'affichage du bonus quotidien
 * - Les célébrations de paliers de streak
 * - L'intégration avec le système de notifications
 * - La création automatique de notifications en base
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { DailyBonusDialog } from "./DailyBonusDialog";
import { StreakMilestoneDialog } from "./StreakMilestoneDialog";
import { processDailyLogin, DailyLoginResult } from "@/services/gamificationService";
import { createNotification } from "@/services/notificationService";

// Paliers de streak avec bonus XP
const STREAK_MILESTONES = [
  { days: 7, xpBonus: 50 },
  { days: 14, xpBonus: 75 },
  { days: 30, xpBonus: 100 },
  { days: 100, xpBonus: 150 },
  { days: 365, xpBonus: 200 },
];

interface GamificationManagerProps {
  children: React.ReactNode;
}

export function GamificationManager({ children }: GamificationManagerProps) {
  const { user } = useAuth();
  const { checkBadges } = useBadgeNotification();
  
  // État des dialogues
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  
  // Données du bonus quotidien
  const [dailyBonusData, setDailyBonusData] = useState<{
    streak: number;
    xpEarned: number;
    popcornEarned: number;
    streakBroken: boolean;
    newBadges: string[];
  } | null>(null);
  
  // Données du palier de streak
  const [milestoneData, setMilestoneData] = useState<{
    milestone: number;
    currentStreak: number;
    xpBonus: number;
  } | null>(null);

  // Queue pour afficher les dialogues dans l'ordre
  const [dialogQueue, setDialogQueue] = useState<('daily' | 'milestone')[]>([]);
  const [hasProcessedToday, setHasProcessedToday] = useState(false);

  // Vérifier si un palier a été atteint
  const checkMilestoneReached = useCallback((previousStreak: number, newStreak: number) => {
    for (const milestone of STREAK_MILESTONES) {
      // Vérifie si on vient de passer ce palier
      if (previousStreak < milestone.days && newStreak >= milestone.days) {
        return milestone;
      }
    }
    return null;
  }, []);

  // Créer une notification pour un palier de streak
  const createStreakMilestoneNotification = useCallback(async (userId: string, milestone: number, streak: number) => {
    try {
      await createNotification(
        userId,
        'badge_earned',
        `🔥 Palier de ${milestone} jours !`,
        `Félicitations ! Vous avez atteint ${streak} jours de connexion consécutive.`,
        { milestone, streak, type: 'streak_milestone' }
      );
    } catch (error) {
      console.error('[Gamification] Error creating milestone notification:', error);
    }
  }, []);

  // Créer une notification pour un nouveau badge
  const createBadgeNotification = useCallback(async (userId: string, badgeIds: string[]) => {
    if (badgeIds.length === 0) return;
    
    try {
      await createNotification(
        userId,
        'badge_earned',
        badgeIds.length === 1 ? '🏆 Nouveau badge débloqué !' : `🏆 ${badgeIds.length} nouveaux badges !`,
        badgeIds.length === 1 
          ? 'Vous avez débloqué un nouveau badge. Consultez votre collection !'
          : `Vous avez débloqué ${badgeIds.length} nouveaux badges. Consultez votre collection !`,
        { badgeIds, type: 'new_badges' }
      );
    } catch (error) {
      console.error('[Gamification] Error creating badge notification:', error);
    }
  }, []);

  // Vérifier le localStorage pour éviter le double traitement
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const lastProcessed = localStorage.getItem("cinevault_gamification_processed");
    if (lastProcessed === today) {
      setHasProcessedToday(true);
    }
  }, []);

  // Process daily login
  useEffect(() => {
    const handleDailyLogin = async () => {
      if (!user || hasProcessedToday) return;

      try {
        console.log('[GamificationManager] Processing daily login...');
        const result = await processDailyLogin(user.id);

        if (!result) {
          console.log('[GamificationManager] No result from daily login');
          setHasProcessedToday(true);
          return;
        }

        console.log('[GamificationManager] Daily login result:', result);

        // Toujours marquer comme traité pour éviter les appels multiples
        const today = new Date().toISOString().split("T")[0];
        localStorage.setItem("cinevault_gamification_processed", today);
        setHasProcessedToday(true);

        // Si déjà connecté aujourd'hui, pas de popup
        if (result.alreadyLoggedIn) {
          console.log('[GamificationManager] Already logged in today');
          return;
        }

        const queue: ('daily' | 'milestone')[] = [];

        // Vérifier si un palier de streak a été atteint
        const currentStreak = result.streak?.current_streak || 1;
        const previousStreak = currentStreak - 1; // Approximation
        
        // Vérifier les paliers
        const milestoneReached = STREAK_MILESTONES.find(m => m.days === currentStreak);
        
        if (milestoneReached) {
          console.log('[GamificationManager] Milestone reached:', milestoneReached);
          setMilestoneData({
            milestone: milestoneReached.days,
            currentStreak,
            xpBonus: milestoneReached.xpBonus,
          });
          queue.push('milestone');
          
          // Créer notification pour le palier
          await createStreakMilestoneNotification(user.id, milestoneReached.days, currentStreak);
        }

        // Préparer les données du bonus quotidien
        if (result.bonus && !result.bonus.alreadyClaimed) {
          setDailyBonusData({
            streak: currentStreak,
            xpEarned: result.bonus.xpEarned || 25,
            popcornEarned: result.bonus.popcornEarned || 5,
            streakBroken: result.streakBroken || false,
            newBadges: result.newBadges || [],
          });
          queue.push('daily');
        }

        // Créer notifications pour les nouveaux badges
        if (result.newBadges && result.newBadges.length > 0) {
          await createBadgeNotification(user.id, result.newBadges);
        }

        // Vérifier les badges (déclenche le contexte BadgeNotification)
        await checkBadges();

        // Afficher les dialogues
        if (queue.length > 0) {
          setDialogQueue(queue);
        }

      } catch (error) {
        console.error("[GamificationManager] Error processing daily login:", error);
        setHasProcessedToday(true);
      }
    };

    // Délai pour laisser l'UI se charger
    const timer = setTimeout(handleDailyLogin, 1500);
    return () => clearTimeout(timer);
  }, [user, hasProcessedToday, checkBadges, createStreakMilestoneNotification, createBadgeNotification]);

  // Gérer la queue des dialogues
  useEffect(() => {
    if (dialogQueue.length === 0) return;

    const currentDialog = dialogQueue[0];
    
    if (currentDialog === 'milestone' && milestoneData && !showMilestone && !showDailyBonus) {
      setShowMilestone(true);
    } else if (currentDialog === 'daily' && dailyBonusData && !showMilestone && !showDailyBonus) {
      setShowDailyBonus(true);
    }
  }, [dialogQueue, milestoneData, dailyBonusData, showMilestone, showDailyBonus]);

  // Fermer le dialogue du palier
  const handleCloseMilestone = useCallback(() => {
    setShowMilestone(false);
    setTimeout(() => {
      setDialogQueue(prev => prev.slice(1));
    }, 300);
  }, []);

  // Fermer le dialogue du bonus quotidien
  const handleCloseDailyBonus = useCallback(() => {
    setShowDailyBonus(false);
    setTimeout(() => {
      setDialogQueue(prev => prev.slice(1));
    }, 300);
  }, []);

  return (
    <>
      {children}

      {/* Dialogue de palier de streak */}
      {milestoneData && (
        <StreakMilestoneDialog
          open={showMilestone}
          onOpenChange={(open) => !open && handleCloseMilestone()}
          milestone={milestoneData.milestone}
          currentStreak={milestoneData.currentStreak}
          xpBonus={milestoneData.xpBonus}
          onClose={handleCloseMilestone}
        />
      )}

      {/* Dialogue de bonus quotidien */}
      {dailyBonusData && (
        <DailyBonusDialog
          open={showDailyBonus}
          onOpenChange={(open) => !open && handleCloseDailyBonus()}
          streak={dailyBonusData.streak}
          xpEarned={dailyBonusData.xpEarned}
          popcornEarned={dailyBonusData.popcornEarned}
          streakBroken={dailyBonusData.streakBroken}
          newBadges={dailyBonusData.newBadges}
        />
      )}
    </>
  );
}
