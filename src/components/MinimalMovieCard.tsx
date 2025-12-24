/**
 * CineVault — Minimal Movie Card
 * 
 * Design: Poster-centric, minimal UI
 * - Poster only by default
 * - Optional format badge
 * - Hover/tap reveals title
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Movie, getImageUrl } from "@/services/tmdb";
import { PhysicalFormat, formatLabels } from "@/services/physicalMovies";
import { cn } from "@/lib/utils";
import { Film } from "lucide-react";

interface MinimalMovieCardProps {
  movie: Movie;
  index?: number;
  showFormat?: boolean;
  format?: PhysicalFormat;
  onClick?: () => void;
}

const formatColors: Record<PhysicalFormat, string> = {
  dvd: "bg-slate-500",
  bluray: "bg-blue-600",
  "4k": "bg-purple-600",
  steelbook: "bg-amber-600",
  collector: "bg-red-600",
};

export const MinimalMovieCard = ({
  movie,
  index = 0,
  showFormat = false,
  format,
  onClick,
}: MinimalMovieCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const posterUrl = movie.poster_path ? getImageUrl(movie.poster_path, "w342") : null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/movie/${movie.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5">
        {/* Poster */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className={cn(
              "w-full h-full object-cover",
              "transition-transform duration-500",
              "group-hover:scale-105"
            )}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Film className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Format badge */}
        {showFormat && format && (
          <div className="absolute top-2 right-2 z-10">
            <span className={cn(
              "px-2 py-1 rounded-md text-[10px] font-bold text-white",
              formatColors[format]
            )}>
              {formatLabels[format]}
            </span>
          </div>
        )}

        {/* Gradient overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none"
        />

        {/* Title overlay on hover */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none"
        >
          <h3 className="text-sm font-medium text-white line-clamp-2">
            {movie.title}
          </h3>
          {movie.release_date && (
            <p className="text-xs text-white/60 mt-0.5">
              {new Date(movie.release_date).getFullYear()}
            </p>
          )}
        </motion.div>

        {/* Rating badge */}
        {movie.vote_average > 0 && (
          <div className={cn(
            "absolute top-2 left-2",
            "px-1.5 py-0.5 rounded-md",
            "bg-black/60 backdrop-blur-sm",
            "text-[10px] font-bold text-white",
            "opacity-0 group-hover:opacity-100 transition-opacity"
          )}>
            {movie.vote_average.toFixed(1)}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Skeleton
export const MinimalMovieCardSkeleton = () => (
  <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/5 animate-pulse" />
);

export default MinimalMovieCard;
