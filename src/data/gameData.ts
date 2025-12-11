import {
  Clapperboard,
  Skull,
  Rocket,
  Heart,
  Crown,
  Swords,
  Ghost,
  Camera,
  Hourglass,
  Globe,
  Flame,
  Sparkles,
  BookOpen,
  User,
  Disc,
} from "lucide-react";

export type BadgeCategory = "destiny" | "collection" | "special";

export interface DestinyTree {
  id: string;
  title: string;
  description: string;
  color: string; // Tailwind class prefix ex: "amber"
  icon: any;
}

export const DESTINIES: DestinyTree[] = [
  {
    id: "auteur",
    title: "La Voie de l'Auteur",
    description: "Pour ceux qui vénèrent les réalisateurs visionnaires.",
    color: "amber",
    icon: Clapperboard,
  },
  {
    id: "frisson",
    title: "La Route du Frisson",
    description: "Explorez les tréfonds de l'horreur et du thriller.",
    color: "red",
    icon: Skull,
  },
  {
    id: "imaginaire",
    title: "L'Odyssée de l'Imaginaire",
    description: "Sci-Fi, Fantasy et mondes extraordinaires.",
    color: "purple",
    icon: Rocket,
  },
  {
    id: "archive",
    title: "Le Gardien du Temple",
    description: "Collectionneurs de formats physiques et éditions rares.",
    color: "blue",
    icon: Disc,
  },
];

// Cette liste servira d'init pour la DB ou de fallback
export const STATIC_BADGES = [
  // --- VOIE DE L'AUTEUR ---
  {
    id: "nolan_architect",
    destinyId: "auteur",
    title: "L'Architecte",
    description: "Posséder 3 films de Christopher Nolan en 4K.",
    icon: Hourglass,
    criteria: { type: "director", value: 525, count: 3, format: "4k" }, // 525 = Nolan TMDB ID
    baseRarity: "epic",
  },
  {
    id: "tarantino_blood",
    destinyId: "auteur",
    title: "Le Poète Violent",
    description: "Voir 5 films de Quentin Tarantino.",
    icon: Swords,
    criteria: { type: "director", value: 138, count: 5 },
    baseRarity: "rare",
  },

  // --- ROUTE DU FRISSON ---
  {
    id: "horror_survivor",
    destinyId: "frisson",
    title: "Survivant",
    description: "Regarder 10 films d'horreur entre minuit et 4h du matin.",
    icon: Ghost,
    criteria: { type: "genre", value: 27, count: 10, time_window: "night" },
    baseRarity: "rare",
  },

  // --- GARDIEN DU TEMPLE ---
  {
    id: "steelbook_collector",
    destinyId: "archive",
    title: "Homme de Fer",
    description: "Ajouter 5 Steelbooks à votre collection.",
    icon: Disc,
    criteria: { type: "format", value: "steelbook", count: 5 },
    baseRarity: "legendary",
  },
];

export const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500];

export const getLevel = (xp: number) => {
  const level = XP_LEVELS.findIndex((threshold) => xp < threshold);
  return level === -1 ? XP_LEVELS.length : level;
};
