import React from "react";
import { Link } from "react-router-dom";
import { useMostOwnedMovies, rarityConfig } from "@/hooks/useMostOwnedMovies";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Trophy, Users, Star, ArrowRight, Crown } from "lucide-react";

/**
 * MostOwnedMovies — Classement des films les plus possédés
 * 
 * Affiche le top 10 des films les plus présents dans les collections
 * avec badges de rareté et compteurs de propriétaires
 */

interface MostOwnedMoviesProps {
  className?: string;
  limit?: number;
}

export const MostOwnedMovies: React.FC<MostOwnedMoviesProps> = ({ 
  className,
  limit = 10 
}) => {
  const { movies, loading } = useMostOwnedMovies({ limit });

  if (loading) {
    return (
      <section className={cn("px-4 sm:px-6 py-8", className)}>
        <div className="container mx-auto">
          <div className="mb-6">
            <div className="h-6 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-poster rounded-xl bg-muted animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (movies.length === 0) {
    return null;
  }

  return (
    <section className={cn("px-4 sm:px-6 py-8", className)}>
      <div className="container mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-semibold">
                Films les Plus Collectionnés
              </h2>
              <p className="text-sm text-muted-foreground">
                Le classement de la communauté CineVault
              </p>
            </div>
          </div>
          <Link
            to="/search"
            className={cn(
              "hidden sm:flex items-center gap-1.5",
              "text-sm font-medium text-primary",
              "hover:underline"
            )}
          >
            Explorer plus
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Podium - Top 3 */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
          {movies.slice(0, 3).map((movie, index) => (
            <PodiumCard key={movie.tmdbId} movie={movie} position={(index + 1) as 1 | 2 | 3} />
          ))}
        </div>

        {/* Rest of ranking */}
        {movies.length > 3 && (
          <div className="space-y-2">
            {movies.slice(3).map((movie) => (
              <RankingRow key={movie.tmdbId} movie={movie} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// Podium card for top 3
interface PodiumCardProps {
  movie: ReturnType<typeof useMostOwnedMovies>["movies"][0];
  position: 1 | 2 | 3;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ movie, position }) => {
  const positionConfig = {
    1: {
      medal: "🥇",
      ring: "ring-amber-400/50",
      glow: "shadow-amber-500/20",
      gradient: "from-amber-500/30 to-amber-600/10",
      scale: "sm:scale-105",
    },
    2: {
      medal: "🥈",
      ring: "ring-slate-300/50",
      glow: "shadow-slate-400/20",
      gradient: "from-slate-400/20 to-slate-500/5",
      scale: "",
    },
    3: {
      medal: "🥉",
      ring: "ring-amber-700/50",
      glow: "shadow-amber-700/20",
      gradient: "from-amber-700/20 to-amber-800/5",
      scale: "",
    },
  };

  const config = positionConfig[position];
  const rarity = rarityConfig[movie.rarity];

  return (
    <Link
      to={`/movie/${movie.tmdbId}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-card/80 backdrop-blur-xl",
        "border border-white/10",
        "ring-2 ring-inset",
        config.ring,
        config.scale,
        "transition-all duration-500",
        "hover:shadow-xl hover:-translate-y-1",
        config.glow
      )}
    >
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t opacity-60",
        config.gradient
      )} />

      {/* Position badge */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md">
        <span className="text-lg">{config.medal}</span>
        {position === 1 && <Crown className="w-4 h-4 text-amber-400" />}
      </div>

      {/* Poster */}
      <div className="relative aspect-poster overflow-hidden">
        {movie.posterPath ? (
          <img
            src={getImageUrl(movie.posterPath, "w500") || ""}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Trophy className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Info */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <h3 className="font-display text-sm sm:text-base font-semibold text-white line-clamp-2 mb-1">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-white/80">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs sm:text-sm font-medium">
                {movie.ownerCount} propriétaires
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Ranking row for positions 4+
interface RankingRowProps {
  movie: ReturnType<typeof useMostOwnedMovies>["movies"][0];
}

const RankingRow: React.FC<RankingRowProps> = ({ movie }) => {
  const rarity = rarityConfig[movie.rarity];

  return (
    <Link
      to={`/movie/${movie.tmdbId}`}
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl",
        "bg-card/60 backdrop-blur-sm",
        "border border-border/50",
        "transition-all duration-300",
        "hover:bg-card hover:border-border hover:shadow-md",
        "group"
      )}
    >
      {/* Rank number */}
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <span className="font-stats text-lg font-bold text-muted-foreground">
          {movie.rank}
        </span>
      </div>

      {/* Poster thumbnail */}
      <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {movie.posterPath ? (
          <img
            src={getImageUrl(movie.posterPath, "w92") || ""}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Movie info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm sm:text-base truncate group-hover:text-primary transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{movie.year}</span>
          {movie.voteAverage > 0 && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {movie.voteAverage.toFixed(1)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Owner count & rarity badge */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className={cn(
          "hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
          rarity.bgColor,
          rarity.color
        )}>
          <span>{rarity.icon}</span>
          <span>{rarity.label}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">{movie.ownerCount}</span>
        </div>
      </div>
    </Link>
  );
};

export default MostOwnedMovies;
