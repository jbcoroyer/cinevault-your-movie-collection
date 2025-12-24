/**
 * CineVault — Minimal Movie Card
 * 
 * Radical Minimalist design:
 * - Poster only, no text by default
 * - 2:3 aspect ratio
 * - Desktop: hover reveals title/year with scale
 * - Mobile: subtle gradient overlay with title
 */

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MinimalMovieCardProps {
  movie: Movie;
  index?: number;
  className?: string;
  showInfoOnMobile?: boolean;
}

export const MinimalMovieCard = ({
  movie,
  index = 0,
  className,
  showInfoOnMobile = true,
}: MinimalMovieCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const posterUrl = getImageUrl(movie.poster_path, "w500");
  const year = movie.release_date?.split("-")[0];

  return (
    <Link to={`/movie/${movie.id}`} className={cn("block group", className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.05, 
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1]
        }}
        whileHover={{ scale: 1.05 }}
        className={cn(
          "relative aspect-[2/3] overflow-hidden",
          "rounded-lg md:rounded-xl",
          "bg-white/5"
        )}
      >
        {/* Skeleton shimmer while loading */}
        {!isLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}

        {/* Poster Image */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className={cn(
              "w-full h-full object-cover",
              "transition-all duration-500",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <span className="text-white/20 text-xs text-center px-2">
              {movie.title}
            </span>
          </div>
        )}

        {/* Mobile: Subtle gradient with title (always visible) */}
        {showInfoOnMobile && (
          <div className="absolute inset-x-0 bottom-0 md:hidden poster-overlay">
            <p className="text-white text-xs font-medium line-clamp-1">
              {movie.title}
            </p>
            {year && (
              <p className="text-white/50 text-[10px]">{year}</p>
            )}
          </div>
        )}

        {/* Desktop: Hover overlay with info */}
        <div className={cn(
          "absolute inset-0 hidden md:flex flex-col justify-end p-3",
          "bg-gradient-to-t from-black/90 via-black/50 to-transparent",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity duration-300"
        )}>
          <p className="text-white text-sm font-medium line-clamp-2">
            {movie.title}
          </p>
          {year && (
            <p className="text-white/60 text-xs mt-0.5">{year}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

/**
 * Skeleton for loading state
 */
export const MinimalMovieCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={cn("aspect-[2/3] rounded-lg md:rounded-xl skeleton", className)} />
  );
};

export default MinimalMovieCard;
