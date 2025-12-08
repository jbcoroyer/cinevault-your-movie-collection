/**
 * CineVault 2.0 - Exports des nouveaux composants
 *
 * Architecture:
 * - ui/         : Composants de base (GlassCard)
 * - bento/      : Système de grille Bento
 * - (root)      : Composants métier (MovieCard, Header, etc.)
 */

// UI Components
export { GlassCard, GlassCardHeader, GlassCardStat } from "./ui/GlassCard";

// Bento Grid System
export { BentoGrid, BentoCard, BentoCardImage, BentoCardSkeleton } from "./bento/BentoGrid";

// Movie Components
export { MovieCard, MovieCardSkeleton, MovieCardFeatured } from "./MovieCard";
export { MovieSection, MovieSectionSkeleton } from "./MovieSection";

// Layout Components
export { Header } from "./Header";
export { BottomNav } from "./BottomNav";

// Dashboard Components
export { HeroBento } from "./HeroBento";
