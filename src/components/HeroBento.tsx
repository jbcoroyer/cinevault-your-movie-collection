import { Link } from "react-router-dom";
import { Movie, getImageUrl } from "@/services/tmdb";
import { BentoGrid, BentoCard, BentoCardImage } from "./bento/BentoGrid";
import { GlassCard, GlassCardStat } from "./ui/GlassCard";
import { 
  Film, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp, 
  Sparkles,
  Library,
  Heart,
  Eye,
  ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HeroBento - Dashboard utilisateur avec layout Bento asymétrique
 * 
 * Affiche:
 * - Film à l'affiche (grande carte)
 * - Statistiques utilisateur
 * - Niveau et progression XP
 * - Dernier film vu
 * - Quick actions
 */

interface HeroBentoProps {
  featuredMovie: Movie | null;
  stats: {
    watched: number;
    watchlist: number;
    favorites: number;
    collection: number;
  };
  level: {
    current: number;
    xp: number;
    nextLevelXp: number;
    progress: number;
  };
  lastWatched?: {
    movie: Movie;
    date: string;
  } | null;
  loading?: boolean;
}

export const HeroBento: React.FC<HeroBentoProps> = ({
  featuredMovie,
  stats,
  level,
  lastWatched,
  loading = false,
}) => {
  if (loading) {
    return <HeroBentoSkeleton />;
  }

  return (
    <section className="px-4 sm:px-6 py-6 sm:py-10 mb-6">
      <div className="max-w-7xl mx-auto">
        <BentoGrid gap="md">
          {/* Featured Movie - Large Card */}
          {featuredMovie && (
            <BentoCardImage
              src={getImageUrl(featuredMovie.backdrop_path, "w1280") || ""}
              alt={featuredMovie.title}
              size="lg"
              colSpan={4}
              rowSpan={2}
              delay={0}
              className="md:col-span-4 lg:col-span-6"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-xs font-medium text-white mb-3">
                <Sparkles className="w-3 h-3" />
                À l'affiche
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 line-clamp-2">
                {featuredMovie.title}
              </h2>
              <div className="flex items-center gap-3 text-white/80 text-sm">
                {featuredMovie.release_date && (
                  <span>{featuredMovie.release_date.split("-")[0]}</span>
                )}
                {featuredMovie.vote_average > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {featuredMovie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
              <Link
                to={`/movie/${featuredMovie.id}`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Découvrir
                <ArrowRight className="w-4 h-4" />
              </Link>
            </BentoCardImage>
          )}

          {/* Stats Cards */}
          <BentoCard size="sm" variant="stat" delay={100} className="lg:col-span-3">
            <GlassCardStat
              icon={<Eye className="w-5 h-5" />}
              value={stats.watched}
              label="Films vus"
              variant="primary"
            />
          </BentoCard>

          <BentoCard size="sm" variant="stat" delay={150} className="lg:col-span-3">
            <GlassCardStat
              icon={<Clock className="w-5 h-5" />}
              value={stats.watchlist}
              label="À voir"
            />
          </BentoCard>

          {/* Level Progress */}
          <BentoCard size="md" delay={200} className="md:col-span-3 lg:col-span-3">
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg glow-gold">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Niveau</p>
                  <p className="text-2xl font-display font-bold text-gold">{level.current}</p>
                </div>
              </div>
              
              {/* XP Progress Bar */}
              <div className="mt-auto">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{level.xp} XP</span>
                  <span>{level.nextLevelXp} XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${level.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Quick Stats Row */}
          <BentoCard size="sm" variant="stat" delay={250} className="lg:col-span-3">
            <GlassCardStat
              icon={<Heart className="w-5 h-5" />}
              value={stats.favorites}
              label="Favoris"
            />
          </BentoCard>

          <BentoCard size="sm" variant="stat" delay={300} className="lg:col-span-3">
            <GlassCardStat
              icon={<Library className="w-5 h-5" />}
              value={stats.collection}
              label="Collection"
              variant="primary"
            />
          </BentoCard>

          {/* Last Watched */}
          {lastWatched && (
            <BentoCardImage
              src={getImageUrl(lastWatched.movie.poster_path, "w500") || ""}
              alt={lastWatched.movie.title}
              size="sm"
              colSpan={2}
              rowSpan={2}
              delay={350}
              className="md:col-span-2 lg:col-span-3"
              gradientDirection="bottom"
            >
              <span className="text-xs text-white/70 mb-1">Dernier vu</span>
              <p className="font-medium text-white line-clamp-2 text-sm">
                {lastWatched.movie.title}
              </p>
            </BentoCardImage>
          )}

          {/* Quick Actions */}
          <BentoCard
            size="sm"
            variant="interactive"
            delay={400}
            className="lg:col-span-3"
          >
            <Link
              to="/search"
              className="h-full flex flex-col items-center justify-center gap-2 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="font-medium text-sm">Explorer</span>
              <span className="text-xs text-muted-foreground">Découvrir des films</span>
            </Link>
          </BentoCard>
        </BentoGrid>
      </div>
    </section>
  );
};

/**
 * HeroBentoSkeleton - Placeholder animé
 */
const HeroBentoSkeleton: React.FC = () => (
  <section className="px-4 sm:px-6 py-6 sm:py-10 mb-6">
    <div className="max-w-7xl mx-auto">
      <div className="bento-grid gap-4">
        {/* Featured skeleton */}
        <div className="bento-lg animate-shimmer rounded-3xl" style={{ minHeight: "240px" }} />
        
        {/* Stats skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bento-sm animate-shimmer rounded-3xl"
            style={{ 
              minHeight: "120px",
              animationDelay: `${i * 100}ms` 
            }}
          />
        ))}
        
        {/* Level skeleton */}
        <div className="bento-md animate-shimmer rounded-3xl" style={{ minHeight: "160px" }} />
      </div>
    </div>
  </section>
);

export default HeroBento;
