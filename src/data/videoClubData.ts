/**
 * CineVault - Video Club Data & Gamification Helpers
 * 
 * Données et fonctions utilitaires pour le système de gamification
 * Niveaux, titres, XP, badges, etc.
 */

// ============================================
// RARITY SYSTEM
// ============================================

export type Rarity = "common" | "rare" | "epic" | "legendary" | "grail";

export const RARITY_CONFIG: Record<Rarity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  xpMultiplier: number;
}> = {
  common: {
    label: "Commun",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/20",
    borderColor: "border-zinc-500/30",
    glowColor: "rgba(161, 161, 170, 0.3)",
    xpMultiplier: 1,
  },
  rare: {
    label: "Rare",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    glowColor: "rgba(59, 130, 246, 0.3)",
    xpMultiplier: 1.5,
  },
  epic: {
    label: "Épique",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    glowColor: "rgba(168, 85, 247, 0.4)",
    xpMultiplier: 2,
  },
  legendary: {
    label: "Légendaire",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    glowColor: "rgba(245, 158, 11, 0.5)",
    xpMultiplier: 3,
  },
  grail: {
    label: "Graal",
    color: "text-rose-400",
    bgColor: "bg-gradient-to-r from-rose-500/20 to-amber-500/20",
    borderColor: "border-rose-500/30",
    glowColor: "rgba(244, 63, 94, 0.5)",
    xpMultiplier: 5,
  },
};

// ============================================
// LEVEL SYSTEM
// ============================================

// XP required to reach each level (cumulative)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2600,   // Level 8
  3500,   // Level 9
  4600,   // Level 10
  5900,   // Level 11
  7400,   // Level 12
  9100,   // Level 13
  11000,  // Level 14
  13100,  // Level 15
  15400,  // Level 16
  17900,  // Level 17
  20600,  // Level 18
  23500,  // Level 19
  26600,  // Level 20
  30000,  // Level 21
  34000,  // Level 22
  38500,  // Level 23
  43500,  // Level 24
  49000,  // Level 25
  55000,  // Level 26
  62000,  // Level 27
  70000,  // Level 28
  79000,  // Level 29
  89000,  // Level 30
  100000, // Level 31+
];

// Titles for each level tier
const LEVEL_TITLES: Record<number, string> = {
  1: "Novice",
  2: "Cinéphile Amateur",
  3: "Cinéphile Amateur",
  4: "Collectionneur",
  5: "Collectionneur",
  6: "Collectionneur Averti",
  7: "Collectionneur Averti",
  8: "Passionné",
  9: "Passionné",
  10: "Expert",
  11: "Expert",
  12: "Expert",
  13: "Connaisseur",
  14: "Connaisseur",
  15: "Connaisseur",
  16: "Archiviste",
  17: "Archiviste",
  18: "Archiviste",
  19: "Conservateur",
  20: "Conservateur",
  21: "Maître Collectionneur",
  22: "Maître Collectionneur",
  23: "Maître Collectionneur",
  24: "Légende Vivante",
  25: "Légende Vivante",
  26: "Gardien du 7ème Art",
  27: "Gardien du 7ème Art",
  28: "Gardien du 7ème Art",
  29: "Oracle du Cinéma",
  30: "Oracle du Cinéma",
};

/**
 * Get level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, 30);
}

/**
 * Get XP progress within current level
 */
export function getXpProgress(totalXp: number): {
  current: number;
  required: number;
  percentage: number;
  level: number;
  nextLevelXp: number;
} {
  const level = getLevelFromXp(totalXp);
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] || currentLevelXp + 10000;
  
  const current = totalXp - currentLevelXp;
  const required = nextLevelXp - currentLevelXp;
  const percentage = Math.min((current / required) * 100, 100);

  return {
    current,
    required,
    percentage,
    level,
    nextLevelXp,
  };
}

/**
 * Get title for a level
 */
export function getTitleForLevel(level: number): string {
  return LEVEL_TITLES[Math.min(level, 30)] || LEVEL_TITLES[30];
}

/**
 * Calculate XP for adding a movie based on rarity
 */
export function calculateMovieXp(rarity: Rarity = "common"): number {
  const baseXp = 25;
  return Math.round(baseXp * RARITY_CONFIG[rarity].xpMultiplier);
}

// ============================================
// BADGE CATEGORIES
// ============================================

export const BADGE_CATEGORIES = [
  { id: "collection", label: "Collection", icon: "Library" },
  { id: "format", label: "Formats", icon: "Disc" },
  { id: "social", label: "Social", icon: "Users" },
  { id: "genres", label: "Genres", icon: "Film" },
  { id: "achievement", label: "Réussites", icon: "Trophy" },
  { id: "special", label: "Spéciaux", icon: "Sparkles" },
];

// ============================================
// LORE TERMINOLOGY
// ============================================

export const LORE_TERMINOLOGY = {
  collection: "Archive",
  level: "Rang",
  xp: "Points de Prestige",
  badge: "Insigne",
  streak: "Flamme",
  member: "Archiviste",
  currency: "Popcorn",
};

// ============================================
// STREAK MILESTONES
// ============================================

export const STREAK_MILESTONES = [
  { days: 3, label: "3 jours", xpBonus: 25, icon: "🔥" },
  { days: 7, label: "1 semaine", xpBonus: 50, icon: "🔥" },
  { days: 14, label: "2 semaines", xpBonus: 75, icon: "💫" },
  { days: 30, label: "1 mois", xpBonus: 100, icon: "⭐" },
  { days: 60, label: "2 mois", xpBonus: 150, icon: "🌟" },
  { days: 100, label: "100 jours", xpBonus: 200, icon: "👑" },
  { days: 365, label: "1 an", xpBonus: 500, icon: "🏆" },
];

/**
 * Get next streak milestone
 */
export function getNextStreakMilestone(currentStreak: number) {
  return STREAK_MILESTONES.find(m => m.days > currentStreak);
}

/**
 * Check if streak reached a milestone
 */
export function isStreakMilestone(streak: number): boolean {
  return STREAK_MILESTONES.some(m => m.days === streak);
}

/**
 * Get current streak milestone data
 */
export function getStreakMilestoneData(streak: number) {
  return STREAK_MILESTONES.find(m => m.days === streak);
}

// ============================================
// FORMAT RARITY MAPPING
// ============================================

export function getFormatRarity(format: string): Rarity {
  switch (format) {
    case "vhs":
    case "laserdisc":
      return "rare";
    case "steelbook":
      return "epic";
    case "collector":
      return "legendary";
    case "4k":
      return "rare";
    case "bluray":
      return "common";
    case "dvd":
    default:
      return "common";
  }
}

export default {
  RARITY_CONFIG,
  getLevelFromXp,
  getXpProgress,
  getTitleForLevel,
  calculateMovieXp,
  BADGE_CATEGORIES,
  LORE_TERMINOLOGY,
  STREAK_MILESTONES,
  getNextStreakMilestone,
  isStreakMilestone,
  getStreakMilestoneData,
  getFormatRarity,
};
