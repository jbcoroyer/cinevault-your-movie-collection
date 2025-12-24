/**
 * CineVault - Poster Wall View
 * 
 * Vue "Mur de posters" - affichage compact et visuel
 * des posters de la collection façon mosaïque
 */

import { motion } from "framer-motion";
import { Film } from "lucide-react";
import { PhysicalMovie, PhysicalFormat } from "@/services/physicalMovies";
import { MovieDetails, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

interface PosterWallViewProps {
  movies: PhysicalMovie[];
  movieDetails: Record<number, ExtendedMovieDetails>;
  onMovieClick: (movie: PhysicalMovie) => void;
}

const FORMAT_CONFIG: Record<PhysicalFormat, { label: string; color: string; borderColor: string }> = {
  dvd: { label: "DVD", color: "bg-slate-500", borderColor: "border-slate-500" },
  bluray: { label: "Blu-ray", color: "bg-blue-600", borderColor: "border-blue-500" },
  "4k": { label: "4K UHD", color: "bg-purple-600", borderColor: "border-purple-500" },
  steelbook: { label: "Steelbook", color: "bg-amber-600", borderColor: "border-amber-500" },
  collector: { label: "Collector", color: "bg-red-600", borderColor: "border-red-500" },
};

export const PosterWallView = ({
  movies,
  movieDetails,
  onMovieClick,
}: PosterWallViewProps) => {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Film className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Aucun film à afficher</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative">
        {/* Masonry-like grid */}
        <div 
          className={cn(
            "grid gap-1.5",
            "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
          )}
        >
          {movies.map((movie, index) => {
            const details = movieDetails[movie.tmdb_id];
            const posterUrl = details?.poster_path 
              ? getImageUrl(details.poster_path, "w185") 
              : null;
            const formatConfig = FORMAT_CONFIG[movie.format] || FORMAT_CONFIG.dvd;
            const year = details?.release_date?.substring(0, 4);

            return (
              <Tooltip key={movie.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    whileHover={{ 
                      scale: 1.08, 
                      zIndex: 50,
                      transition: { duration: 0.2 }
                    }}
                    className={cn(
                      "relative aspect-[2/3] rounded-md overflow-hidden cursor-pointer",
                      "ring-2 ring-transparent hover:ring-amber-500/50",
                      "shadow-sm hover:shadow-xl hover:shadow-amber-500/20",
                      "transition-shadow duration-300",
                      formatConfig.borderColor
                    )}
                    onClick={() => onMovieClick(movie)}
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={details?.title || "Film"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <Film className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}

                    {/* Format indicator - small colored dot */}
                    <div 
                      className={cn(
                        "absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full",
                        "ring-1 ring-white/50",
                        formatConfig.color
                      )}
                    />

                    {/* Hover overlay with gradient */}
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
                      "opacity-0 hover:opacity-100 transition-opacity duration-200"
                    )} />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-[200px] bg-card/95 backdrop-blur-sm border-border"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm line-clamp-2">
                      {details?.title || "Titre inconnu"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {year && <span>{year}</span>}
                      <Badge 
                        className={cn("text-[10px] px-1.5 py-0 text-white", formatConfig.color)}
                      >
                        {formatConfig.label}
                      </Badge>
                    </div>
                    {details?.vote_average && details.vote_average > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-amber-500">★</span>
                        <span>{details.vote_average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {Object.entries(FORMAT_CONFIG).map(([format, config]) => {
            const count = movies.filter(m => m.format === format).length;
            if (count === 0) return null;
            
            return (
              <div key={format} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn("w-2.5 h-2.5 rounded-full", config.color)} />
                <span>{config.label}</span>
                <span className="font-medium text-foreground">({count})</span>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PosterWallView;
