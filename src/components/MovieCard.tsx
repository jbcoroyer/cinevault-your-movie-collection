/**
 * CineVault - MovieCard AMÉLIORÉ
 *
 * AMÉLIORATIONS:
 * - Micro-animations au hover et tap
 * - Skeleton shimmer intégré
 * - Rating badge amélioré
 * - Transition fluide
 * - Feedback haptique simulation
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Play, Plus, Check, Eye } from "lucide-react";
import { Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { useState } from "react";

// Size configuration
const sizeConfig = {
  sm: {
    wrapper: "w-24",
    badge: "px-1.5 py-0.5 text-[10px]",
    title: "text-xs",
    year: "text-[10px]",
  },
  md: {
    wrapper: "w-32",
    badge: "px-2 py-0.5 text-xs",
    title: "text-sm",
    year: "text-xs",
  },
  lg: {
    wrapper: "w-40",
    badge: "px-2 py-1 text-xs",
    title: "text-sm font-medium",
    year: "text-xs",
  },
};

// Availability info type
export interface AvailabilityInfo {
  type: "platform" | "physical";
  name: string;
  logoUrl?: string;
}

interface MovieCardProps {
  movie: Movie;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  showInfo?: boolean;
  availability?: AvailabilityInfo[];
  className?: string;
  // Quick action callbacks
  onQuickAdd?: () => void;
  isInCollection?: boolean;
  isInWatchlist?: boolean;
}

export const MovieCard = ({
  movie,
  size = "md",
  priority = false,
  showInfo = true,
  availability,
  className,
  onQuickAdd,
  isInCollection,
  isInWatchlist,
}: MovieCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  const posterUrl = getImageUrl(movie.poster_path, size === "lg" ? "w500" : "w300");
  const year = movie.release_date?.split("-")[0];
  const config = sizeConfig[size];
  const hasGoodRating = movie.vote_average >= 7;

  const handleTap = () => {
    setIsTapped(true);
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
    setTimeout(() => setIsTapped(false), 150);
  };

  return (
    <Link
      to={`/movie/${movie.id}`}
      onClick={handleTap}
      className={cn("group flex-shrink-0 block", config.wrapper, className)}
    >
      {/* Poster Container */}
      <motion.div
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative aspect-[2/3] bg-muted rounded-lg overflow-hidden"
      >
        {/* Skeleton shimmer while loading */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-muted">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}

        {/* Poster Image */}
        {posterUrl ? (
          <motion.img
            src={posterUrl}
            alt={movie.title}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            loading={priority ? "eager" : "lazy"}
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-muted-foreground text-xs text-center px-3 font-medium">
              {movie.title}
            </span>
          </div>
        )}

        {/* Rating Badge - Visible on hover */}
        {movie.vote_average > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className={cn(
              "absolute top-2 right-2 flex items-center gap-1",
              "glass rounded-full",
              config.badge,
              hasGoodRating ? "text-amber-500" : "text-muted-foreground"
            )}
          >
            <Star
              className={cn(
                "w-3 h-3",
                hasGoodRating && "fill-amber-500"
              )}
            />
            <span className="font-medium">{movie.vote_average.toFixed(1)}</span>
          </motion.div>
        )}

        {/* Collection/Watchlist indicators */}
        {(isInCollection || isInWatchlist) && (
          <div className="absolute top-2 left-2 flex gap-1">
            {isInCollection && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            {isInWatchlist && (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Hover Overlay with Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
            "flex flex-col items-center justify-end p-3 gap-2"
          )}
        >
          {/* Quick action buttons */}
          <div className="flex gap-2 w-full">
            {onQuickAdd && !isInCollection && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onQuickAdd();
                }}
                className={cn(
                  "flex-1 py-2 rounded-lg",
                  "bg-amber-500 text-white",
                  "flex items-center justify-center gap-1",
                  "text-xs font-medium"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </motion.button>
            )}
          </div>

          {/* Availability badges */}
          {availability && availability.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {availability.slice(0, 3).map((item, index) => (
                <span
                  key={index}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-medium",
                    item.type === "platform"
                      ? "bg-blue-500/80 text-white"
                      : "bg-amber-500/80 text-white"
                  )}
                >
                  {item.name}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Tap ripple effect */}
        {isTapped && (
          <motion.span
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-lg bg-white/20"
          />
        )}
      </motion.div>

      {/* Info below poster */}
      {showInfo && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 space-y-0.5"
        >
          <h3 className={cn("line-clamp-1", config.title)}>{movie.title}</h3>
          {year && (
            <p className={cn("text-muted-foreground", config.year)}>{year}</p>
          )}
        </motion.div>
      )}
    </Link>
  );
};

/**
 * MovieCard Skeleton
 */
export const MovieCardSkeleton = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex-shrink-0", config.wrapper)}>
      {/* Poster skeleton with shimmer */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      
      {/* Title skeleton */}
      <div className="mt-2 space-y-1.5">
        <div className="h-4 bg-muted rounded w-full relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        <div className="h-3 bg-muted rounded w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

/**
 * Featured Movie Card - Larger variant for hero sections
 */
export const MovieCardFeatured = ({
  movie,
  onQuickAdd,
  className,
}: {
  movie: Movie;
  onQuickAdd?: () => void;
  className?: string;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const backdropUrl = getImageUrl(movie.backdrop_path, "w780");
  const posterUrl = getImageUrl(movie.poster_path, "w342");

  return (
    <Link
      to={`/movie/${movie.id}`}
      className={cn("group relative block rounded-2xl overflow-hidden", className)}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative aspect-[16/9] md:aspect-[21/9]"
      >
        {/* Background Image */}
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={movie.title}
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              "group-hover:scale-105",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end p-6">
          <div className="flex gap-4 items-end max-w-2xl">
            {/* Poster */}
            {posterUrl && (
              <motion.img
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                src={posterUrl}
                alt={movie.title}
                className="hidden sm:block w-24 md:w-32 rounded-lg shadow-2xl"
              />
            )}

            {/* Info */}
            <div className="space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl md:text-3xl font-display font-bold text-white"
              >
                {movie.title}
              </motion.h2>

              <div className="flex items-center gap-3 text-white/80">
                {movie.release_date && (
                  <span className="text-sm">{movie.release_date.split("-")[0]}</span>
                )}
                {movie.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </div>

              {movie.overview && (
                <p className="text-sm text-white/70 line-clamp-2 max-w-lg hidden md:block">
                  {movie.overview}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-4 py-2 rounded-full",
                    "bg-white text-black",
                    "flex items-center gap-2",
                    "text-sm font-medium"
                  )}
                >
                  <Play className="w-4 h-4 fill-current" />
                  Voir
                </motion.button>

                {onQuickAdd && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      onQuickAdd();
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full",
                      "bg-amber-500 text-white",
                      "flex items-center gap-2",
                      "text-sm font-medium"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Collection
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default MovieCard;
