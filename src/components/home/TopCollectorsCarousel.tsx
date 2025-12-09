import React from "react";
import { Link } from "react-router-dom";
import { useTopCollectors, formatConfig } from "@/hooks/useTopCollectors";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, Library, ArrowRight, Crown, Disc, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/**
 * TopCollectorsCarousel — Carrousel des collectionneurs populaires
 *
 * Affiche les profils avec les plus grandes collections,
 * incluant une mini-étagère visuelle de leurs films
 */

interface TopCollectorsCarouselProps {
  className?: string;
  limit?: number;
}

export const TopCollectorsCarousel: React.FC<TopCollectorsCarouselProps> = ({ className, limit = 8 }) => {
  const { collectors, loading } = useTopCollectors({ limit });

  if (loading) {
    return (
      <section className={cn("py-6 overflow-hidden", className)}>
        <div className="px-4 sm:px-6 mb-5">
          <div className="container mx-auto">
            <div className="h-5 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 h-48 rounded-2xl bg-muted/50 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (collectors.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-6 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 sm:px-6 mb-5">
        <div className="container mx-auto flex items-end justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-semibold">Collections Populaires</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Découvrez les vidéothèques de la communauté</p>
            </div>
          </div>
          <Link
            to="/search"
            className={cn("hidden sm:flex items-center gap-1.5", "text-sm font-medium text-primary", "hover:underline")}
          >
            Voir tous
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Cards */}
        <div className="flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
          {collectors.map((collector, index) => (
            <CollectorCard key={collector.id} collector={collector} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Individual collector card
interface CollectorCardProps {
  collector: ReturnType<typeof useTopCollectors>["collectors"][0];
  index: number;
}

const CollectorCard: React.FC<CollectorCardProps> = ({ collector, index }) => {
  const initials = collector.username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link
      to={`/profile/${collector.id}`}
      className={cn(
        "flex-shrink-0 w-72 sm:w-80",
        "group relative overflow-hidden rounded-2xl",
        "bg-card/80 backdrop-blur-xl",
        "border border-white/10 dark:border-white/5",
        "transition-all duration-500",
        "hover:shadow-xl hover:-translate-y-1",
        "opacity-0 animate-fade-in-up",
      )}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "forwards",
      }}
    >
      {/* Top section with rank badge */}
      {collector.rank <= 3 && (
        <div className="absolute top-3 right-3 z-10">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              "bg-gradient-to-br",
              collector.rank === 1 && "from-amber-400 to-amber-600",
              collector.rank === 2 && "from-slate-300 to-slate-500",
              collector.rank === 3 && "from-amber-600 to-amber-800",
            )}
          >
            <Crown className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Profile section */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="w-14 h-14 ring-2 ring-primary/20">
            <AvatarImage src={collector.avatarUrl || undefined} alt={collector.username} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold truncate group-hover:text-primary transition-colors">
              @{collector.username}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Library className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{collector.collectionCount} films</span>
            </div>
            {collector.specialty && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 mt-2",
                  "px-2.5 py-1 rounded-full",
                  "bg-primary/10 text-primary",
                  "text-xs font-medium",
                )}
              >
                {formatConfig[collector.favoriteFormat || ""]?.emoji || "🎬"}
                {collector.specialty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mini shelf visualization */}
      <div className="px-5 pb-2">
        <p className="text-xs text-muted-foreground mb-2">Aperçu de la collection</p>
        <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-b from-muted/30 to-muted/60">
          {/* Shelf effect */}
          <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-t from-amber-900/30 to-transparent" />

          {/* Movie spines */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-center gap-0.5">
            {collector.recentMovies.slice(0, 5).map((movie, i) => (
              <div
                key={movie.tmdbId}
                className={cn(
                  "relative overflow-hidden rounded-sm",
                  "transition-transform duration-300",
                  "hover:translate-y-[-4px]",
                )}
                style={{
                  width: `${14 + Math.random() * 4}px`,
                  height: `${70 + Math.random() * 10}px`,
                  transform: `rotate(${(Math.random() - 0.5) * 2}deg)`,
                }}
              >
                {movie.posterPath ? (
                  <img
                    src={getImageUrl(movie.posterPath, "w92") || ""}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-slate-600 to-slate-800" />
                )}
              </div>
            ))}
            {/* Placeholder spines */}
            {Array.from({ length: Math.max(0, 8 - collector.recentMovies.length) }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                className="rounded-sm bg-gradient-to-b from-slate-500/50 to-slate-700/50"
                style={{
                  width: `${12 + Math.random() * 4}px`,
                  height: `${65 + Math.random() * 10}px`,
                  transform: `rotate(${(Math.random() - 0.5) * 2}deg)`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Format breakdown */}
      <div className="px-5 pb-5 pt-2">
        <div className="flex gap-2 flex-wrap">
          {Object.entries(collector.formatBreakdown)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([format, count]) => {
              const config = formatConfig[format];
              return (
                <span
                  key={format}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                    "bg-muted/80 text-muted-foreground",
                  )}
                >
                  <span>{config?.emoji || "📀"}</span>
                  <span>{count}</span>
                </span>
              );
            })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-xl",
            "bg-primary/5 group-hover:bg-primary/10",
            "transition-colors duration-300",
          )}
        >
          <span className="text-sm font-medium">Voir la collection</span>
          <ChevronRight className="w-5 h-5 text-primary transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
};

export default TopCollectorsCarousel;
