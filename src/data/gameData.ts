import {
  Clapperboard,
  Skull,
  Rocket,
  Disc,
  Hourglass,
  Swords,
  Ghost,
  Crown,
  Eye,
  Star,
  Zap,
  Flame,
  Trophy,
  Ticket,
} from "lucide-react";

// Mapping des IDs de la DB vers les composants React Lucide
export const ICON_MAP: Record<string, any> = {
  Clapperboard,
  Skull,
  Rocket,
  Disc,
  Hourglass,
  Swords,
  Ghost,
  Crown,
  Eye,
  Star,
  Zap,
  Flame,
  Trophy,
  Ticket,
};

export type BadgeCategory = "auteur" | "frisson" | "imaginaire" | "archive";

export const DESTINIES = [
  {
    id: "auteur",
    title: "La Voie de l'Auteur",
    description: "Vénérez les visionnaires.",
    color: "from-amber-500 to-orange-600",
    icon: Clapperboard,
  },
  {
    id: "frisson",
    title: "La Route du Frisson",
    description: "Affrontez vos peurs.",
    color: "from-red-600 to-rose-900",
    icon: Skull,
  },
  {
    id: "imaginaire",
    title: "L'Odyssée",
    description: "Explorez l'inconnu.",
    color: "from-purple-500 to-indigo-600",
    icon: Rocket,
  },
  {
    id: "archive",
    title: "Le Gardien",
    description: "Préservez l'histoire.",
    color: "from-blue-400 to-cyan-600",
    icon: Disc,
  },
];
