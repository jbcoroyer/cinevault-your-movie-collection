import { 
  Film, Star, Video, Clapperboard, Zap, Medal, 
  Crown, Glasses, Rocket, Skull, Heart, 
  Music, Camera, Ticket, Swords, Ghost, 
  Smile, Hourglass, Globe, Trophy, Disc
} from "lucide-react";

// --- TYPES ---
export interface BadgeTier {
  target: number; // Nombre requis (ex: 5 films)
  xp: number;     // XP gagnée
  title: string;  // Titre du badge (ex: "Novice", "Expert")
}

export interface GameBadge {
  id: string;
  category: "general" | "director" | "genre" | "saga" | "physical";
  baseTitle: string;
  description: string;
  icon: any;
  color: string;
  // Si c'est une liste d'IDs spécifiques (ex: films de Nolan)
  movieIds?: number[]; 
  // Niveaux du badge (Bronze, Argent, Or, Platine, etc.)
  tiers: BadgeTier[];
}

export interface LevelReward {
  level: number;
  title: string;
  reward: string;
  icon: any;
}

// --- IDS DE FILMS POUR LES COLLECTIONS ---
// Ces IDs correspondent aux IDs TMDB
const DIRECTORS = {
  nolan: [27205, 157336, 155, 49026, 49026, 1124, 238, 299536, 361743, 505192], // Inception, Interstellar, TDK, etc.
  tarantino: [680, 500, 24, 393, 16869, 184934, 68718, 466272], // Pulp Fiction, Reservoir Dogs, Kill Bill...
  spielberg: [329, 857, 11, 424, 87, 601, 185, 597], // Jurassic Park, Saving Private Ryan, Star Wars (non), Indy...
  scorsese: [103, 115, 25, 106646, 313369, 15, 203], // Taxi Driver, Goodfellas, Wolf of Wall Street...
  villeneuve: [335984, 13, 264660, 398818, 693134, 438631], // BR2049, Prisoners, Dune...
  fincher: [550, 74, 14, 19404, 210577], // Fight Club, Se7en, Social Network...
  miyazaki: [129, 128, 4935, 81, 10515, 497, 12477], // Chihiro, Mononoke, Howl...
  wes_anderson: [120467, 545, 17480, 83666, 399174], // Grand Budapest, Royal Tenenbaums...
  kubrick: [62, 238, 185, 694, 703, 949], // 2001, Shining...
  hitchcock: [539, 213, 426, 221], // Psycho, North by Northwest...
};

const GENRES_COLLECTIONS = {
  horror_classics: [539, 694, 948, 73, 348, 30497, 1091, 19907], // Psycho, Shining, Halloween...
  scifi_masterpieces: [11, 1891, 1892, 157336, 603, 27205, 335984, 105], // Star Wars, Matrix, BR...
  action_cult: [24, 603, 155, 1893, 98, 1571, 550, 272], // Kill Bill, Matrix, TDK, Die Hard...
  romance_feels: [13, 38, 11036, 12405, 596, 289], // Forrest Gump, Eternal Sunshine, Titanic...
};

const SAGAS = {
  starwars: [11, 1891, 1892, 1893, 1894, 1895], // OT + Prequels
  lotr: [120, 121, 122], // Lord of the Rings
  matrix: [603, 604, 605], // Matrix Trilogy
  godfather: [238, 240, 242], // Godfather Trilogy
  dark_knight: [272, 155, 49026], // Nolan Batman
};

// --- CONFIGURATION DES NIVEAUX ---
// XP nécessaire pour atteindre le niveau suivant
// Courbe progressive : 100, 300, 600, 1000, 1500, 2100...
export const LEVEL_MILESTONES = Array.from({ length: 50 }, (_, i) => {
  const level = i + 1;
  return Math.floor(100 * Math.pow(level, 1.2));
});

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 1, title: "Spectateur", reward: "Débloque le profil de base", icon: Ticket },
  { level: 5, title: "Amateur", reward: "Bordure Bronze pour l'avatar", icon: Medal },
  { level: 10, title: "Cinéphile", reward: "Thème 'Dark Cinema'", icon: Video },
  { level: 15, title: "Critique", reward: "Badge 'Critique Certifié' sur vos avis", icon: Star },
  { level: 20, title: "Collectionneur", reward: "Bordure Argent pour l'avatar", icon: Disc },
  { level: 30, title: "Expert", reward: "Accès aux statistiques avancées", icon: Hourglass },
  { level: 40, title: "Historien", reward: "Bordure Or pour l'avatar", icon: Crown },
  { level: 50, title: "Légende", reward: "Thème 'Gold Prestige' & Badge Légende", icon: Trophy },
];

// --- LISTE COMPLÈTE DES BADGES ---
export const BADGES_DATA: GameBadge[] = [
  // --- GÉNÉRAL (QUANTITÉ) ---
  {
    id: "total_watched",
    category: "general",
    baseTitle: "Visionneur",
    description: "films marqués comme vus",
    icon: Film,
    color: "text-blue-500",
    tiers: [
      { target: 1, xp: 50, title: "Première Séance" },
      { target: 10, xp: 100, title: "Habitué" },
      { target: 50, xp: 300, title: "Passionné" },
      { target: 100, xp: 500, title: "Cinéphile" },
      { target: 250, xp: 1000, title: "Dévoreur de Pellicule" },
      { target: 500, xp: 2000, title: "Encyclopédie Vivante" },
      { target: 1000, xp: 5000, title: "Légende du Cinéma" },
    ]
  },
  {
    id: "reviews_count",
    category: "general",
    baseTitle: "Plume",
    description: "avis rédigés",
    icon: Star,
    color: "text-yellow-500",
    tiers: [
      { target: 1, xp: 50, title: "Premier Avis" },
      { target: 5, xp: 150, title: "Critique en Herbe" },
      { target: 20, xp: 400, title: "Voix Influente" },
      { target: 50, xp: 1000, title: "Référence Critique" },
    ]
  },
  {
    id: "favorites_count",
    category: "general",
    baseTitle: "Curateur",
    description: "films en favoris",
    icon: Heart,
    color: "text-red-500",
    tiers: [
      { target: 1, xp: 30, title: "Coup de Foudre" },
      { target: 10, xp: 150, title: "Collectionneur de Pépites" },
      { target: 50, xp: 500, title: "Musée Personnel" },
    ]
  },
  {
    id: "physical_count",
    category: "physical",
    baseTitle: "Matérialiste",
    description: "films en DVD/Blu-ray",
    icon: Disc,
    color: "text-purple-500",
    tiers: [
      { target: 1, xp: 50, title: "Premier Disque" },
      { target: 10, xp: 200, title: "Étagère Remplie" },
      { target: 50, xp: 800, title: "Vidéoclub Privé" },
      { target: 100, xp: 1500, title: "Bibliothèque Ultime" },
    ]
  },

  // --- RÉALISATEURS (Basé sur les IDs) ---
  {
    id: "dir_nolan",
    category: "director",
    baseTitle: "Nolan",
    description: "films de Christopher Nolan vus",
    icon: Hourglass,
    color: "text-slate-500",
    movieIds: DIRECTORS.nolan,
    tiers: [
      { target: 1, xp: 50, title: "Initiation Temporelle" },
      { target: 3, xp: 150, title: "Voyageur de Rêves" },
      { target: 5, xp: 400, title: "Maître du Temps" },
    ]
  },
  {
    id: "dir_tarantino",
    category: "director",
    baseTitle: "Tarantino",
    description: "films de Quentin Tarantino vus",
    icon: Swords,
    color: "text-red-700",
    movieIds: DIRECTORS.tarantino,
    tiers: [
      { target: 1, xp: 50, title: "Pulp Débutant" },
      { target: 3, xp: 150, title: "Reservoir Dog" },
      { target: 5, xp: 400, title: "Inglourious Basterd" },
    ]
  },
  {
    id: "dir_scorsese",
    category: "director",
    baseTitle: "Scorsese",
    description: "films de Martin Scorsese vus",
    icon: Clapperboard,
    color: "text-zinc-600",
    movieIds: DIRECTORS.scorsese,
    tiers: [
      { target: 1, xp: 50, title: "Affranchi" },
      { target: 3, xp: 150, title: "Loup de Wall Street" },
      { target: 5, xp: 400, title: "Gangster de New York" },
    ]
  },
  {
    id: "dir_spielberg",
    category: "director",
    baseTitle: "Spielberg",
    description: "films de Steven Spielberg vus",
    icon: Camera,
    color: "text-blue-600",
    movieIds: DIRECTORS.spielberg,
    tiers: [
      { target: 1, xp: 50, title: "Aventurier" },
      { target: 3, xp: 150, title: "Rencontre du 3ème Type" },
      { target: 5, xp: 400, title: "Roi du Blockbuster" },
    ]
  },
  {
    id: "dir_miyazaki",
    category: "director",
    baseTitle: "Miyazaki",
    description: "films du Studio Ghibli vus",
    icon: Ghost,
    color: "text-green-500",
    movieIds: DIRECTORS.miyazaki,
    tiers: [
      { target: 1, xp: 50, title: "Voyage de Chihiro" },
      { target: 3, xp: 150, title: "Voisin de Totoro" },
      { target: 5, xp: 400, title: "Magicien de l'Animation" },
    ]
  },
  {
    id: "dir_wes",
    category: "director",
    baseTitle: "Wes Anderson",
    description: "films symétriques vus",
    icon: Smile,
    color: "text-pink-400",
    movieIds: DIRECTORS.wes_anderson,
    tiers: [
      { target: 1, xp: 50, title: "Esthète" },
      { target: 3, xp: 150, title: "Symétrique" },
      { target: 5, xp: 400, title: "Grand Budapest Guest" },
    ]
  },
  {
    id: "dir_fincher",
    category: "director",
    baseTitle: "Fincher",
    description: "films de David Fincher vus",
    icon: Skull,
    color: "text-cyan-700",
    movieIds: DIRECTORS.fincher,
    tiers: [
      { target: 1, xp: 50, title: "Membre du Club" },
      { target: 3, xp: 150, title: "Enquêteur" },
      { target: 5, xp: 400, title: "Gone Boy/Girl" },
    ]
  },

  // --- SAGAS (Collection complète requise pour le max) ---
  {
    id: "saga_starwars",
    category: "saga",
    baseTitle: "La Force",
    description: "films Star Wars (I-VI) vus",
    icon: Rocket,
    color: "text-blue-400",
    movieIds: SAGAS.starwars,
    tiers: [
      { target: 1, xp: 50, title: "Padawan" },
      { target: 3, xp: 200, title: "Chevalier Jedi" },
      { target: 6, xp: 1000, title: "Maître Jedi" },
    ]
  },
  {
    id: "saga_lotr",
    category: "saga",
    baseTitle: "L'Anneau",
    description: "trilogie Seigneur des Anneaux vue",
    icon: Crown,
    color: "text-yellow-600",
    movieIds: SAGAS.lotr,
    tiers: [
      { target: 1, xp: 50, title: "Hobbit" },
      { target: 3, xp: 500, title: "Porteur de l'Anneau" },
    ]
  },
  {
    id: "saga_godfather",
    category: "saga",
    baseTitle: "La Famille",
    description: "trilogie Le Parrain vue",
    icon: Globe,
    color: "text-red-800",
    movieIds: SAGAS.godfather,
    tiers: [
      { target: 1, xp: 50, title: "Soldat" },
      { target: 3, xp: 500, title: "Don Corleone" },
    ]
  },

  // --- GENRES (Simulés par ID Lists pour l'instant pour la perf) ---
  {
    id: "genre_horror",
    category: "genre",
    baseTitle: "Frisson",
    description: "classiques de l'horreur vus",
    icon: Skull,
    color: "text-red-600",
    movieIds: GENRES_COLLECTIONS.horror_classics,
    tiers: [
      { target: 1, xp: 50, title: "Survivant" },
      { target: 5, xp: 200, title: "Chasseur de Fantômes" },
      { target: 8, xp: 500, title: "Scream King/Queen" },
    ]
  },
  {
    id: "genre_scifi",
    category: "genre",
    baseTitle: "Futuriste",
    description: "chefs-d'œuvre SF vus",
    icon: Rocket,
    color: "text-cyan-500",
    movieIds: GENRES_COLLECTIONS.scifi_masterpieces,
    tiers: [
      { target: 1, xp: 50, title: "Visiteur" },
      { target: 5, xp: 200, title: "Cyborg" },
      { target: 8, xp: 500, title: "Blade Runner" },
    ]
  },
  {
    id: "genre_romance",
    category: "genre",
    baseTitle: "Romantique",
    description: "films d'amour cultes vus",
    icon: Heart,
    color: "text-pink-500",
    movieIds: GENRES_COLLECTIONS.romance_feels,
    tiers: [
      { target: 1, xp: 50, title: "Cœur Tendre" },
      { target: 5, xp: 200, title: "Amoureux" },
    ]
  },
];

// --- DESTINIES (Catégories pour l'affichage des badges) ---
export const DESTINIES = [
  { id: "auteur", title: "Auteur", icon: Clapperboard },
  { id: "collector", title: "Collectionneur", icon: Disc },
  { id: "explorer", title: "Explorateur", icon: Globe },
  { id: "critic", title: "Critique", icon: Star },
];

// --- STATIC_BADGES (Format simplifié pour le service) ---
export interface StaticBadge {
  id: string;
  title: string;
  description: string;
  icon: any;
  destinyId: string;
  baseRarity: "common" | "rare" | "epic" | "legendary";
  criteria: {
    type: string;
    value?: string;
    count?: number;
  };
}

export const STATIC_BADGES: StaticBadge[] = [
  // Auteur destiny
  { id: "dir_nolan", title: "Nolaniste", description: "Maîtrisez l'œuvre de Christopher Nolan", icon: Hourglass, destinyId: "auteur", baseRarity: "rare", criteria: { type: "director", value: "nolan", count: 5 } },
  { id: "dir_tarantino", title: "Tarantinophile", description: "Maîtrisez l'œuvre de Quentin Tarantino", icon: Swords, destinyId: "auteur", baseRarity: "rare", criteria: { type: "director", value: "tarantino", count: 5 } },
  { id: "dir_scorsese", title: "Scorsesien", description: "Maîtrisez l'œuvre de Martin Scorsese", icon: Clapperboard, destinyId: "auteur", baseRarity: "rare", criteria: { type: "director", value: "scorsese", count: 5 } },
  { id: "dir_miyazaki", title: "Ghibliphile", description: "Maîtrisez l'œuvre du Studio Ghibli", icon: Ghost, destinyId: "auteur", baseRarity: "epic", criteria: { type: "director", value: "miyazaki", count: 5 } },
  
  // Collector destiny
  { id: "steelbook_collector", title: "Steelbook Addict", description: "Collectionnez des steelbooks", icon: Disc, destinyId: "collector", baseRarity: "epic", criteria: { type: "format", value: "steelbook", count: 10 } },
  { id: "physical_count", title: "Matérialiste", description: "Possédez des films physiques", icon: Disc, destinyId: "collector", baseRarity: "common", criteria: { type: "physical", count: 50 } },
  
  // Explorer destiny
  { id: "genre_horror", title: "Chasseur de Frissons", description: "Explorez les classiques de l'horreur", icon: Skull, destinyId: "explorer", baseRarity: "rare", criteria: { type: "genre", value: "horror", count: 8 } },
  { id: "genre_scifi", title: "Voyageur Spatial", description: "Explorez les chefs-d'œuvre de la SF", icon: Rocket, destinyId: "explorer", baseRarity: "rare", criteria: { type: "genre", value: "scifi", count: 8 } },
  { id: "saga_starwars", title: "Maître Jedi", description: "Complétez la saga Star Wars", icon: Rocket, destinyId: "explorer", baseRarity: "legendary", criteria: { type: "saga", value: "starwars", count: 6 } },
  
  // Critic destiny
  { id: "reviews_count", title: "Plume d'Or", description: "Rédigez des critiques", icon: Star, destinyId: "critic", baseRarity: "common", criteria: { type: "reviews", count: 50 } },
  { id: "total_watched", title: "Encyclopédie Vivante", description: "Visionnez un grand nombre de films", icon: Film, destinyId: "critic", baseRarity: "legendary", criteria: { type: "watched", count: 500 } },
];
