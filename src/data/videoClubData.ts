/**
 * CINEVAULT - VIDEO CLUB NÉO-RÉTRO
 * Système de gamification thématique
 */

import {
  Film,
  Disc,
  Tv,
  Skull,
  Eye,
  Crown,
  Star,
  Trophy,
  Ticket,
  VenetianMask,
  Clapperboard,
  Sparkles,
  Gem,
  Archive,
  Heart,
  Zap,
  type LucideIcon,
} from "lucide-react";

// ============================================
// TERMINOLOGIE "VIDÉO CLUB"
// ============================================
export const LORE_TERMINOLOGY = {
  user: "Membre du Club",
  collection: "Inventaire",
  watchlist: "Réservations",
  review: "Note du Staff",
  settings: "Arrière-Boutique",
  logout: "Rembobinage & Éjection",
  profile: "Carte de Membre",
  badges: "Écussons",
  level: "Rang",
  xp: "Points Vidéo",
} as const;

// ============================================
// SOURCES D'XP
// ============================================
export const XP_SOURCES = {
  DVD: 50,
  "Blu-ray": 75,
  "4K UHD": 100,
  VHS: 150,
  Laserdisc: 150,
  review: 100,
} as const;

// ============================================
// FORMULE DE PROGRESSION XP
// Courbe géométrique: XP_Total(N) = 500 * ((1 - 1.15^(N-1)) / (1 - 1.15))
// ============================================
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  const r = 1.15;
  return Math.floor(500 * ((1 - Math.pow(r, level - 1)) / (1 - r)));
}

export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  while (getXpForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

export function getXpProgress(totalXp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  xpToNextLevel: number;
} {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  const xpInLevel = totalXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min(100, (xpInLevel / xpNeeded) * 100);
  
  return {
    currentLevel,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
    xpToNextLevel: xpNeeded - xpInLevel,
  };
}

// ============================================
// TITRES DE NIVEAUX
// ============================================
export interface LevelTitle {
  level: number;
  title: string;
  minXp: number;
}

export const LEVEL_TITLES: LevelTitle[] = [
  { level: 1, title: "Visiteur Curieux", minXp: 0 },
  { level: 2, title: "Nouvel Adhérent", minXp: 500 },
  { level: 5, title: "Client Régulier", minXp: 3300 },
  { level: 10, title: "Chasseur de VHS", minXp: 12000 },
  { level: 20, title: "Clerk (Employé)", minXp: 55000 },
  { level: 30, title: "Responsable Rayon", minXp: 150000 },
  { level: 50, title: "Gérant du Club", minXp: 500000 },
  { level: 100, title: "Légende du Format", minXp: 5000000 },
];

export function getTitleForLevel(level: number): string {
  let title = LEVEL_TITLES[0].title;
  for (const t of LEVEL_TITLES) {
    if (level >= t.level) {
      title = t.title;
    }
  }
  return title;
}

// ============================================
// RARETÉS
// ============================================
export type Rarity = "common" | "rare" | "epic" | "legendary" | "grail";

export const RARITY_CONFIG: Record<Rarity, {
  label: string;
  color: string;
  glowColor: string;
  bgGradient: string;
}> = {
  common: {
    label: "Commun",
    color: "hsl(142 70% 45%)", // Vert
    glowColor: "rgba(34, 197, 94, 0.5)",
    bgGradient: "from-emerald-900/30 to-emerald-950/50",
  },
  rare: {
    label: "Rare",
    color: "hsl(199 89% 48%)", // Cyan
    glowColor: "rgba(6, 182, 212, 0.6)",
    bgGradient: "from-cyan-900/30 to-cyan-950/50",
  },
  epic: {
    label: "Épique",
    color: "hsl(280 100% 70%)", // Magenta
    glowColor: "rgba(192, 38, 211, 0.6)",
    bgGradient: "from-fuchsia-900/30 to-fuchsia-950/50",
  },
  legendary: {
    label: "Légendaire",
    color: "hsl(45 93% 55%)", // Or
    glowColor: "rgba(234, 179, 8, 0.7)",
    bgGradient: "from-amber-900/30 to-amber-950/50",
  },
  grail: {
    label: "Graal",
    color: "hsl(0 0% 100%)", // Blanc pur
    glowColor: "rgba(255, 255, 255, 0.8)",
    bgGradient: "from-white/10 to-slate-950/80",
  },
};

// ============================================
// BADGES (ÉCUSSONS)
// ============================================
export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  category: "collection" | "format" | "genre" | "secret";
  rarity: Rarity;
  criteria: {
    type: "movie_count" | "format_count" | "genre_count" | "review_count" | "secret";
    value?: string;
    count: number;
  };
}

export const BADGES: BadgeDefinition[] = [
  // Collection
  {
    id: "premier_clap",
    title: "Premier Clap",
    description: "Ajoutez votre premier film à l'inventaire",
    icon: Clapperboard,
    category: "collection",
    rarity: "common",
    criteria: { type: "movie_count", count: 1 },
  },
  {
    id: "mur_de_briques",
    title: "Mur de Briques",
    description: "100 films dans votre inventaire",
    icon: Archive,
    category: "collection",
    rarity: "rare",
    criteria: { type: "movie_count", count: 100 },
  },
  {
    id: "le_musee",
    title: "Le Musée",
    description: "5000 films - Une vraie vidéothèque !",
    icon: Crown,
    category: "collection",
    rarity: "grail",
    criteria: { type: "movie_count", count: 5000 },
  },
  
  // Format
  {
    id: "analogique_forever",
    title: "Analogique Forever",
    description: "Possédez 20 VHS",
    icon: Tv,
    category: "format",
    rarity: "epic",
    criteria: { type: "format_count", value: "VHS", count: 20 },
  },
  {
    id: "disc_jockey",
    title: "Disc Jockey",
    description: "Possédez 10 Laserdiscs",
    icon: Disc,
    category: "format",
    rarity: "legendary",
    criteria: { type: "format_count", value: "Laserdisc", count: 10 },
  },
  {
    id: "4k_pioneer",
    title: "4K Pioneer",
    description: "Possédez 50 films en 4K UHD",
    icon: Gem,
    category: "format",
    rarity: "rare",
    criteria: { type: "format_count", value: "4K UHD", count: 50 },
  },
  
  // Genre
  {
    id: "giallo_rosso",
    title: "Giallo Rosso",
    description: "5 films d'horreur italiens dans votre inventaire",
    icon: Skull,
    category: "genre",
    rarity: "epic",
    criteria: { type: "genre_count", value: "horror_italian", count: 5 },
  },
  {
    id: "criterion_collectionneur",
    title: "Criterion Collectionneur",
    description: "10 titres de la collection Criterion",
    icon: Star,
    category: "genre",
    rarity: "legendary",
    criteria: { type: "genre_count", value: "criterion", count: 10 },
  },
  
  // Secret
  {
    id: "be_kind_rewind",
    title: "Be Kind Rewind",
    description: "Vous avez trouvé l'easter egg !",
    icon: Sparkles,
    category: "secret",
    rarity: "legendary",
    criteria: { type: "secret", count: 1 },
  },
  
  // Reviews
  {
    id: "critique_en_herbe",
    title: "Critique en Herbe",
    description: "Rédigez votre première Note du Staff",
    icon: Film,
    category: "collection",
    rarity: "common",
    criteria: { type: "review_count", count: 1 },
  },
  {
    id: "plume_doree",
    title: "Plume Dorée",
    description: "50 Notes du Staff rédigées",
    icon: Trophy,
    category: "collection",
    rarity: "legendary",
    criteria: { type: "review_count", count: 50 },
  },
];

// ============================================
// DESTINÉES (Axes du radar)
// ============================================
export interface DestinyAxis {
  id: "guardian" | "specialist" | "completist";
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const DESTINY_AXES: DestinyAxis[] = [
  {
    id: "guardian",
    name: "Le Gardien",
    description: "Préserve l'histoire du cinéma (VHS, Noir & Blanc, films pré-1970)",
    icon: Archive,
    color: "hsl(199 89% 48%)", // Cyan
  },
  {
    id: "specialist",
    name: "Le Spécialiste",
    description: "Maîtrise un genre dominant (>30% du catalogue)",
    icon: Eye,
    color: "hsl(280 100% 70%)", // Magenta
  },
  {
    id: "completist",
    name: "Le Complétiste",
    description: "Collectionne les sagas complètes et labels premium",
    icon: Crown,
    color: "hsl(45 93% 55%)", // Or
  },
];

// ============================================
// ICON MAP pour compatibilité avec la DB
// ============================================
export const ICON_MAP: Record<string, LucideIcon> = {
  Clapperboard,
  Skull,
  Disc,
  Tv,
  Eye,
  Crown,
  Star,
  Zap,
  Trophy,
  Ticket,
  VenetianMask,
  Film,
  Sparkles,
  Gem,
  Archive,
  Heart,
};
