/**
 * CineVault - Community Hooks Exports
 * 
 * Hooks pour les fonctionnalités communautaires de la page d'accueil
 */

export { useCommunityStats, type CommunityStats } from "./useCommunityStats";
export { 
  useCommunityActivity, 
  formatLabels, 
  activityLabels,
  type CommunityActivity,
  type ActivityType 
} from "./useCommunityActivity";
export { 
  useMostOwnedMovies, 
  rarityConfig,
  type MostOwnedMovie 
} from "./useMostOwnedMovies";
export { 
  useTopCollectors, 
  formatConfig,
  type CollectorProfile 
} from "./useTopCollectors";
export { 
  useRareEditions, 
  editionFormatConfig,
  conditionLabels,
  type RareEdition 
} from "./useRareEditions";
