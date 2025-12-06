import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { Film, Star, Video, Clapperboard, Crown, Zap, Medal } from "lucide-react";

// --- TYPES ---
export interface GameBadge {
  id: string;
  title: string;
  description: string;
  xp: number;
  icon: React.ElementType;
  color: string;
  condition: (movies: number[], favorites: number[]) => boolean;
  progress?: (movies: number[], favorites: number[]) => number;
  maxProgress?: number;
}

interface BadgeContextType {
  unlockedBadges: Set<string>;
  currentXp: number;
  currentLevel: number;
  nextLevelXp: number;
  progressPercent: number;
  watchedMovieIds: number[];
  favoriteMovieIds: number[];
  badges: GameBadge[];
  cultMovies: number[];
}

// --- CONSTANTES ---

// Liste des 50 films cultes à voir (IDs TMDB)
export const CULT_MOVIES = [
  238, 278, 155, 680, 13, 1891, 157336, 27205, 129, 497,
  111, 122, 105, 274, 16869, 399566, 637, 335983, 19404, 389,
  550, 603, 299536, 120, 121, 272, 185, 807, 101, 11,
  280, 539, 19995, 24428, 271110, 284054, 98, 920, 24, 601,
  128, 10681, 152601, 77338, 11324, 313369, 399055, 299534, 131631, 354912,
];

export const LEVELS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];

export const BADGES_CONFIG: GameBadge[] = [
  {
    id: "starter_1",
    title: "Premier Pas",
    description: "Marquer votre premier film comme vu",
    xp: 50,
    icon: Film,
    color: "text-blue-500",
    condition: (ids) => ids.length >= 1,
    progress: (ids) => Math.min(ids.length, 1),
    maxProgress: 1,
  },
  {
    id: "collector_1",
    title: "Coup de Cœur",
    description: "Ajouter 5 films à vos favoris",
    xp: 100,
    icon: Star,
    color: "text-yellow-500",
    condition: (_, favs) => favs.length >= 5,
    progress: (_, favs) => Math.min(favs ? favs.length : 0, 5),
    maxProgress: 5,
  },
  {
    id: "watcher_5",
    title: "Cinéphile en herbe",
    description: "Voir 5 films",
    xp: 100,
    icon: Video,
    color: "text-green-500",
    condition: (ids) => ids.length >= 5,
    progress: (ids) => Math.min(ids.length, 5),
    maxProgress: 5,
  },
  {
    id: "gangster_10",
    title: "Affranchi",
    description: "Voir 10 films (Challenge Gangster)",
    xp: 250,
    icon: Clapperboard,
    color: "text-red-600",
    condition: (ids) => ids.length >= 10,
    progress: (ids) => Math.min(ids.length, 10),
    maxProgress: 10,
  },
  {
    id: "watcher_20",
    title: "Binge Watcher",
    description: "Voir 20 films",
    xp: 300,
    icon: Zap,
    color: "text-purple-500",
    condition: (ids) => ids.length >= 20,
    progress: (ids) => Math.min(ids.length, 20),
    maxProgress: 20,
  },
  {
    id: "cult_50",
    title: "Légende du Cinéma",
    description: "Voir 50 films",
    xp: 1000,
    icon: Crown,
    color: "text-amber-500",
    condition: (ids) => ids.length >= 50,
    progress: (ids) => Math.min(ids.length, 50),
    maxProgress: 50,
  },
  {
    id: "critic_10",
    title: "Critique d'art",
    description: "Laisser 10 avis",
    xp: 500,
    icon: Medal,
    color: "text-pink-500",
    condition: () => false,
    progress: () => 3,
    maxProgress: 10,
  },
];

// --- CONTEXT ---

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

const defaultValue: BadgeContextType = {
  unlockedBadges: new Set<string>(),
  currentXp: 0,
  currentLevel: 1,
  nextLevelXp: 100,
  progressPercent: 0,
  watchedMovieIds: [],
  favoriteMovieIds: [],
  badges: BADGES_CONFIG,
  cultMovies: CULT_MOVIES,
};

export function useBadges() {
  const context = useContext(BadgeContext);
  // Return default value instead of throwing to prevent crashes
  return context ?? defaultValue;
}

interface BadgeProviderProps {
  children: ReactNode;
}

export function BadgeProvider({ children }: BadgeProviderProps) {
  const { user } = useAuth();
  const { userMovies } = useUserMovies();

  const watchedMovieIds = useMemo(
    () => userMovies?.filter((m) => m.status === "watched").map((m) => m.tmdb_id) || [],
    [userMovies]
  );

  const favoriteMovieIds = useMemo(
    () => userMovies?.filter((m) => m.is_favorite).map((m) => m.tmdb_id) || [],
    [userMovies]
  );

  const { currentXp, currentLevel, nextLevelXp, progressPercent, unlockedBadges } = useMemo(() => {
    let xp = 0;
    const unlocked = new Set<string>();

    for (const badge of BADGES_CONFIG) {
      if (badge.condition(watchedMovieIds, favoriteMovieIds)) {
        xp += badge.xp;
        unlocked.add(badge.id);
      }
    }

    let level = 1;
    for (let i = 0; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i]) {
        level = i + 1;
      } else {
        break;
      }
    }

    const currentLevelBaseXp = LEVELS[level - 1];
    const nextLevelTargetXp = LEVELS[level] || LEVELS[level - 1] * 1.5;
    const xpInLevel = xp - currentLevelBaseXp;
    const xpNeededForNext = nextLevelTargetXp - currentLevelBaseXp;
    const percent = Math.min(100, Math.max(0, (xpInLevel / xpNeededForNext) * 100));

    return {
      currentXp: xp,
      currentLevel: level,
      nextLevelXp: nextLevelTargetXp,
      progressPercent: percent,
      unlockedBadges: unlocked,
    };
  }, [watchedMovieIds, favoriteMovieIds]);

  const value: BadgeContextType = {
    unlockedBadges,
    currentXp,
    currentLevel,
    nextLevelXp,
    progressPercent,
    watchedMovieIds,
    favoriteMovieIds,
    badges: BADGES_CONFIG,
    cultMovies: CULT_MOVIES,
  };

  return <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>;
}
