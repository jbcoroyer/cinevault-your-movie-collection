/**
 * WatchedTimeline - Beautiful chronological timeline of watched movies
 * Minimalist design matching CineVault's aesthetic
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Film, ChevronDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMovie } from "@/types/database";
import { getImageUrl } from "@/services/tmdb";
import { useNavigate } from "react-router-dom";

interface MovieMetadata {
  title: string;
  poster_path: string | null;
  release_year?: number;
}

interface WatchedTimelineProps {
  userMovies: UserMovie[];
  movieMetadata: Record<number, MovieMetadata>;
  isLoading?: boolean;
}

interface TimelineGroup {
  label: string;
  monthKey: string;
  movies: (UserMovie & { metadata?: MovieMetadata })[];
}

const groupMoviesByMonth = (
  movies: UserMovie[],
  metadata: Record<number, MovieMetadata>
): TimelineGroup[] => {
  // Filter only watched movies with a watched_at date
  const watchedMovies = movies
    .filter((m) => m.status === "watched" && m.watched_at)
    .map((m) => ({
      ...m,
      metadata: metadata[m.tmdb_id],
    }))
    .sort((a, b) => new Date(b.watched_at!).getTime() - new Date(a.watched_at!).getTime());

  const groups: Record<string, TimelineGroup> = {};

  watchedMovies.forEach((movie) => {
    const date = new Date(movie.watched_at!);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    if (!groups[monthKey]) {
      groups[monthKey] = {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        monthKey,
        movies: [],
      };
    }
    groups[monthKey].movies.push(movie);
  });

  return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
};

export const WatchedTimeline: React.FC<WatchedTimelineProps> = ({
  userMovies,
  movieMetadata,
  isLoading = false,
}) => {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const timelineGroups = useMemo(
    () => groupMoviesByMonth(userMovies, movieMetadata),
    [userMovies, movieMetadata]
  );

  const displayedGroups = showAll ? timelineGroups : timelineGroups.slice(0, 3);
  const hasMore = timelineGroups.length > 3;

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-white/50" />
          <h3 className="font-display text-lg text-white">TIMELINE</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (timelineGroups.length === 0) {
    return (
      <div className="text-center py-8 border border-white/10 rounded-xl bg-white/5">
        <Film className="w-10 h-10 mx-auto mb-3 text-white/20" />
        <p className="text-white/50 text-sm">Aucun film vu avec date</p>
        <p className="text-white/30 text-xs mt-1">
          Marquez des films comme vus pour voir votre timeline
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-white/50" />
          <h3 className="font-display text-lg text-white">TIMELINE</h3>
        </div>
        <span className="text-xs text-white/40">
          {userMovies.filter((m) => m.status === "watched").length} films vus
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" />

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedGroups.map((group, groupIndex) => (
              <motion.div
                key={group.monthKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: groupIndex * 0.05 }}
              >
                <TimelineMonth
                  group={group}
                  isExpanded={expandedMonths.has(group.monthKey)}
                  onToggle={() => toggleMonth(group.monthKey)}
                  onMovieClick={(tmdbId) => navigate(`/movie/${tmdbId}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Show more button */}
      {hasMore && (
        <motion.button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 text-sm text-white/50 hover:text-white transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {showAll ? "Voir moins" : `Voir ${timelineGroups.length - 3} mois de plus`}
          <ChevronDown
            className={cn("w-4 h-4 transition-transform", showAll && "rotate-180")}
          />
        </motion.button>
      )}
    </div>
  );
};

interface TimelineMonthProps {
  group: TimelineGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onMovieClick: (tmdbId: number) => void;
}

const TimelineMonth: React.FC<TimelineMonthProps> = ({
  group,
  isExpanded,
  onToggle,
  onMovieClick,
}) => {
  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <motion.div
        className={cn(
          "absolute left-1.5 top-4 w-3 h-3 rounded-full border-2 border-background transition-colors",
          isExpanded ? "bg-white" : "bg-white/30"
        )}
        animate={{ scale: isExpanded ? 1.2 : 1 }}
      />

      {/* Month header */}
      <motion.button
        onClick={onToggle}
        className={cn(
          "w-full p-4 rounded-xl border text-left transition-all",
          isExpanded
            ? "bg-white/10 border-white/20"
            : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/15"
        )}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.995 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-white">{group.label}</h4>
            <p className="text-xs text-white/50 mt-0.5">
              {group.movies.length} film{group.movies.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Stacked posters preview */}
            <div className="hidden sm:flex items-center">
              {group.movies.slice(0, 4).map((movie, i) => {
                const poster = movie.metadata?.poster_path
                  ? getImageUrl(movie.metadata.poster_path, "w92")
                  : null;
                return (
                  <motion.div
                    key={movie.id}
                    className="relative"
                    style={{ marginLeft: i > 0 ? -12 : 0, zIndex: 4 - i }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {poster ? (
                      <img
                        src={poster}
                        alt=""
                        className="w-8 h-11 object-cover rounded border-2 border-background shadow-lg"
                      />
                    ) : (
                      <div className="w-8 h-11 bg-white/10 rounded border-2 border-background flex items-center justify-center">
                        <Film className="w-3 h-3 text-white/30" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {group.movies.length > 4 && (
                <div
                  className="w-8 h-11 bg-white/10 rounded border-2 border-background flex items-center justify-center text-[10px] font-medium text-white/60"
                  style={{ marginLeft: -12 }}
                >
                  +{group.movies.length - 4}
                </div>
              )}
            </div>

            <ChevronDown
              className={cn(
                "w-4 h-4 text-white/40 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </div>
        </div>
      </motion.button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-1.5">
              {group.movies.map((movie, index) => (
                <TimelineMovieItem
                  key={movie.id}
                  movie={movie}
                  index={index}
                  onClick={() => onMovieClick(movie.tmdb_id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface TimelineMovieItemProps {
  movie: UserMovie & { metadata?: MovieMetadata };
  index: number;
  onClick: () => void;
}

const TimelineMovieItem: React.FC<TimelineMovieItemProps> = ({
  movie,
  index,
  onClick,
}) => {
  const poster = movie.metadata?.poster_path
    ? getImageUrl(movie.metadata.poster_path, "w92")
    : null;

  const watchedDate = movie.watched_at
    ? new Date(movie.watched_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      })
    : null;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left group"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Poster */}
      {poster ? (
        <img
          src={poster}
          alt={movie.metadata?.title}
          className="w-10 h-14 object-cover rounded shadow-md group-hover:shadow-lg transition-shadow"
        />
      ) : (
        <div className="w-10 h-14 bg-white/10 rounded flex items-center justify-center">
          <Film className="w-4 h-4 text-white/30" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate text-sm group-hover:text-white/90">
          {movie.metadata?.title || "Film inconnu"}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {watchedDate && (
            <span className="text-xs text-white/40">{watchedDate}</span>
          )}
          {movie.metadata?.release_year && (
            <span className="text-xs text-white/30">
              ({movie.metadata.release_year})
            </span>
          )}
        </div>
      </div>

      {/* Rating if available */}
      {movie.rating && (
        <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-xs font-medium text-white">{movie.rating}</span>
        </div>
      )}
    </motion.button>
  );
};
