import { Link } from "react-router-dom";
import { Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Star, Play, Clock, Heart } from "lucide-react";

/**
 * MovieCard — Carte de film premium avec effet glassmorphism
 *
 * @description Carte interactive avec hover effects sophistiqués,
 * overlay d'informations et animations fluides.
 */

interface MovieCardProps {
  movie: Movie;
  size?: "sm" | "md" | "lg" | "xl";
  showInfo?: boolean;
  /** Affiche un badge de rang (1, 2, 3...) */
  rank?: number;
  /** Animation delay pour stagger effect */
  delay?: number;
  /** Affiche les actions rapides au hover */
  showQuickActions?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  size = "md",
  showInfo = false,
  rank,
  delay = 0,
  showQuickActions = false,
}) => {
  const posterUrl = getImageUrl(movie.poster_path, size === "sm" ? "w200" : "w300");
  const year = movie.release_date?.split("-")[0];
  const rating = movie.vote_average?.toFixed(1);

  const sizeClasses = {
    sm: "w-[90px] sm:w-[100px]",
    md: "w-[130px] sm:w-[150px]",
    lg: "w-[160px] sm:w-[180px]",
    xl: "w-[200px] sm:w-[220px]",
  };

  return (
    <Link
      to={`/movie/${movie.id}`}
      className={cn("group relative flex-shrink-0 block", "opacity-0 animate-fade-in-up", sizeClasses[size])}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Container avec effet glass au hover */}
      <div className="relative">
        {/* Rank Badge */}
        {rank && (
          <div
            className={cn(
              "absolute -left-2 -top-2 z-20",
              "w-8 h-8 sm:w-10 sm:h-10",
              "rounded-xl bg-gradient-to-br from-primary to-primary/80",
              "flex items-center justify-center",
              "font-stats text-sm sm:text-base font-bold text-primary-foreground",
              "shadow-glow-sm",
              "transition-transform duration-300 group-hover:scale-110",
            )}
          >
            {rank}
          </div>
        )}

        {/* Image Container */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl sm:rounded-2xl",
            "aspect-poster",
            "bg-muted",
            // Transition et shadow
            "transition-all duration-500 ease-out",
            "shadow-[0_4px_20px_rgba(0,0,0,0.1)]",
            "dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
            // Hover effects
            "group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
            "dark:group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]",
            "group-hover:translate-y-[-6px]",
            // Border subtle
            "ring-1 ring-white/10 dark:ring-white/5",
            "group-hover:ring-primary/30",
          )}
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt={movie.title}
              className={cn(
                "w-full h-full object-cover",
                "transition-transform duration-700 ease-out",
                "group-hover:scale-110",
              )}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-muted-foreground text-xs text-center px-2 font-medium">{movie.title}</span>
            </div>
          )}

          {/* Gradient Overlay - Always visible, enhanced on hover */}
          <div
            className={cn(
              "absolute inset-0",
              "bg-gradient-to-t from-black/70 via-black/0 to-transparent",
              "opacity-60 group-hover:opacity-100",
              "transition-opacity duration-500",
            )}
          />

          {/* Top Overlay - Rating Badge */}
          {rating && Number(rating) > 0 && (
            <div
              className={cn(
                "absolute top-2 right-2",
                "flex items-center gap-1",
                "px-2 py-1 rounded-lg",
                "bg-black/60 backdrop-blur-md",
                "border border-white/10",
                "opacity-0 group-hover:opacity-100",
                "transform translate-y-2 group-hover:translate-y-0",
                "transition-all duration-300",
              )}
            >
              <Star className="w-3 h-3 text-primary fill-primary" />
              <span className="text-xs font-semibold text-white">{rating}</span>
            </div>
          )}

          {/* Bottom Overlay - Info on hover */}
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 p-3",
              "transform translate-y-full group-hover:translate-y-0",
              "transition-transform duration-500 ease-out",
            )}
          >
            {/* Quick Actions */}
            {showQuickActions && (
              <div className="flex items-center gap-2 mb-2">
                <button
                  className={cn(
                    "w-8 h-8 rounded-full",
                    "bg-white/20 backdrop-blur-md",
                    "flex items-center justify-center",
                    "hover:bg-primary hover:scale-110",
                    "transition-all duration-200",
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Add to watchlist
                  }}
                >
                  <Clock className="w-4 h-4 text-white" />
                </button>
                <button
                  className={cn(
                    "w-8 h-8 rounded-full",
                    "bg-white/20 backdrop-blur-md",
                    "flex items-center justify-center",
                    "hover:bg-red-500 hover:scale-110",
                    "transition-all duration-200",
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Add to favorites
                  }}
                >
                  <Heart className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {/* Year Badge */}
            {year && <span className="text-xs text-white/80 font-medium">{year}</span>}
          </div>

          {/* Play Icon Center - on hover */}
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-300",
            )}
          >
            <div
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-full",
                "bg-primary/90 backdrop-blur-sm",
                "flex items-center justify-center",
                "shadow-glow",
                "transform scale-50 group-hover:scale-100",
                "transition-all duration-500 ease-out",
              )}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
      </div>

      {/* Title & Info - Below card */}
      {showInfo && (
        <div className="mt-3 space-y-1">
          <h3
            className={cn(
              "font-medium line-clamp-2 leading-tight",
              "text-sm sm:text-base",
              "transition-colors duration-300",
              "group-hover:text-primary",
            )}
          >
            {movie.title}
          </h3>
          {year && <p className="text-xs text-muted-foreground">{year}</p>}
        </div>
      )}
    </Link>
  );
};

/* --- Skeleton Loader --- */

export const MovieCardSkeleton: React.FC<{ size?: "sm" | "md" | "lg" | "xl" }> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-[90px] sm:w-[100px]",
    md: "w-[130px] sm:w-[150px]",
    lg: "w-[160px] sm:w-[180px]",
    xl: "w-[200px] sm:w-[220px]",
  };

  return (
    <div className={cn("flex-shrink-0", sizeClasses[size])}>
      <div
        className={cn(
          "aspect-poster rounded-xl sm:rounded-2xl",
          "bg-gradient-to-br from-muted via-muted/80 to-muted",
          "animate-shimmer",
        )}
      />
      <div className="mt-3 space-y-2">
        <div className="h-4 bg-muted rounded animate-shimmer w-3/4" />
        <div className="h-3 bg-muted rounded animate-shimmer w-1/2" />
      </div>
    </div>
  );
};

/* --- Featured Movie Card (Large Hero Style) --- */

interface FeaturedMovieCardProps {
  movie: Movie;
  className?: string;
}

export const FeaturedMovieCard: React.FC<FeaturedMovieCardProps> = ({ movie, className }) => {
  const backdropUrl = getImageUrl(movie.backdrop_path, "w1280");
  const year = movie.release_date?.split("-")[0];
  const rating = movie.vote_average?.toFixed(1);

  return (
    <Link
      to={`/movie/${movie.id}`}
      className={cn(
        "group relative block overflow-hidden rounded-2xl sm:rounded-3xl",
        "aspect-[16/9] sm:aspect-[21/9]",
        className,
      )}
    >
      {/* Background Image */}
      {backdropUrl ? (
        <img
          src={backdropUrl}
          alt={movie.title}
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            "transition-transform duration-700 ease-out",
            "group-hover:scale-105",
          )}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
      )}

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8">
        {/* Label */}
        <span className="section-label mb-2 text-white/90">À l'affiche</span>

        {/* Title */}
        <h2
          className={cn(
            "font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold",
            "text-white text-shadow-hero",
            "max-w-2xl leading-tight",
          )}
        >
          {movie.title}
        </h2>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-3 text-white/80">
          {year && <span className="text-sm sm:text-base">{year}</span>}
          {rating && Number(rating) > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-sm sm:text-base font-medium">{rating}</span>
            </span>
          )}
        </div>

        {/* CTA Button - appears on hover */}
        <div
          className={cn(
            "mt-4 opacity-0 group-hover:opacity-100",
            "transform translate-y-4 group-hover:translate-y-0",
            "transition-all duration-500",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-2",
              "px-5 py-2.5 rounded-xl",
              "bg-primary text-primary-foreground",
              "font-semibold text-sm",
              "shadow-glow-sm",
            )}
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Découvrir
          </span>
        </div>
      </div>

      {/* Glass border effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-2xl sm:rounded-3xl",
          "ring-1 ring-inset ring-white/10",
          "group-hover:ring-primary/30",
          "transition-all duration-500",
        )}
      />
    </Link>
  );
};
