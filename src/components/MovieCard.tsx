import { Link } from "react-router-dom";
import { Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Star, Clock, Heart, Play } from "lucide-react";

/**
 * MovieCard - Carte de film avec effet glassmorphism premium
 *
 * Features:
 * - Hover avec scale + glow aurora
 * - Badge de note flottant
 * - Overlay gradient animé
 * - Quick actions au survol
 */

interface MovieCardProps {
  movie: Movie;
  size?: "sm" | "md" | "lg" | "xl";
  showInfo?: boolean;
  showQuickActions?: boolean;
  priority?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    wrapper: "w-[100px] sm:w-[110px]",
    title: "text-xs",
    meta: "text-[10px]",
    badge: "text-[9px] px-1.5 py-0.5",
  },
  md: {
    wrapper: "w-[140px] sm:w-[160px]",
    title: "text-sm",
    meta: "text-xs",
    badge: "text-[10px] px-2 py-1",
  },
  lg: {
    wrapper: "w-[180px] sm:w-[200px]",
    title: "text-base",
    meta: "text-sm",
    badge: "text-xs px-2 py-1",
  },
  xl: {
    wrapper: "w-[220px] sm:w-[260px]",
    title: "text-lg",
    meta: "text-sm",
    badge: "text-xs px-2.5 py-1",
  },
};

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  size = "md",
  showInfo = true,
  showQuickActions = false,
  priority = false,
  className,
}) => {
  const posterUrl = getImageUrl(movie.poster_path, size === "xl" ? "w500" : "w300");
  const year = movie.release_date?.split("-")[0];
  const config = sizeConfig[size];
  const hasGoodRating = movie.vote_average >= 7;

  return (
    <Link to={`/movie/${movie.id}`} className={cn("group flex-shrink-0 block", config.wrapper, className)}>
      {/* Poster Container */}
      <div className="movie-card-hover aspect-[2/3] bg-muted">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-muted-foreground text-xs text-center px-3 font-medium">{movie.title}</span>
          </div>
        )}

        {/* Rating Badge - Visible on hover */}
        {movie.vote_average > 0 && (
          <div
            className={cn(
              "absolute top-2 right-2 flex items-center gap-1",
              "glass rounded-full",
              "opacity-0 group-hover:opacity-100 transition-all duration-300",
              "translate-y-1 group-hover:translate-y-0",
              config.badge,
              hasGoodRating ? "text-amber-400" : "text-foreground",
            )}
          >
            <Star className="w-3 h-3 fill-current" />
            <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        {showQuickActions && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center gap-2",
              "opacity-0 group-hover:opacity-100 transition-all duration-300",
              "bg-black/40 backdrop-blur-sm",
            )}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to watchlist
              }}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:scale-110 transition-transform"
              aria-label="Ajouter à la watchlist"
            >
              <Clock className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                // TODO: Play trailer
              }}
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform glow-sm"
              aria-label="Voir la bande-annonce"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to favorites
              }}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:scale-110 transition-transform"
              aria-label="Ajouter aux favoris"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      {showInfo && (
        <div className="mt-3 space-y-1">
          <h3 className={cn("font-medium line-clamp-1 group-hover:text-primary transition-colors", config.title)}>
            {movie.title}
          </h3>
          {year && <p className={cn("text-muted-foreground", config.meta)}>{year}</p>}
        </div>
      )}
    </Link>
  );
};

/**
 * MovieCardSkeleton - Placeholder animé
 */
export const MovieCardSkeleton: React.FC<{ size?: "sm" | "md" | "lg" | "xl" }> = ({ size = "md" }) => {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex-shrink-0", config.wrapper)}>
      <div className="aspect-[2/3] rounded-2xl animate-shimmer" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 rounded animate-shimmer" />
        <div className="h-3 w-1/2 rounded animate-shimmer" />
      </div>
    </div>
  );
};

/**
 * MovieCardFeatured - Grande carte pour mise en avant
 */
interface MovieCardFeaturedProps {
  movie: Movie;
  className?: string;
}

export const MovieCardFeatured: React.FC<MovieCardFeaturedProps> = ({ movie, className }) => {
  const backdropUrl = getImageUrl(movie.backdrop_path, "w780");
  const year = movie.release_date?.split("-")[0];

  return (
    <Link
      to={`/movie/${movie.id}`}
      className={cn("relative block rounded-3xl overflow-hidden group", "aspect-[16/9] sm:aspect-[21/9]", className)}
    >
      {/* Background Image */}
      {backdropUrl ? (
        <img
          src={backdropUrl}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
        <div className="max-w-xl">
          {/* Label */}
          <span className="inline-block px-3 py-1 rounded-full glass text-xs font-medium text-white/90 mb-3">
            À l'affiche
          </span>

          {/* Title */}
          <h2 className="font-display text-2xl sm:text-4xl font-bold text-white mb-2 line-clamp-2">{movie.title}</h2>

          {/* Meta */}
          <div className="flex items-center gap-4 text-white/80 text-sm">
            {year && <span>{year}</span>}
            {movie.vote_average > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {movie.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          {/* Overview */}
          {movie.overview && (
            <p className="text-white/70 text-sm mt-3 line-clamp-2 max-w-lg hidden sm:block">{movie.overview}</p>
          )}
        </div>
      </div>

      {/* Hover Glow */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-t from-primary/20 via-transparent to-transparent",
        )}
      />
    </Link>
  );
};

export default MovieCard;
