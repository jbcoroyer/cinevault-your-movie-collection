import { Link } from "react-router-dom";
import { getImageUrl } from "@/services/tmdb";
import { useFollowingMovies } from "@/hooks/useFollowingMovies";
import { ArrowRight, Users, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { GlassCard } from "./ui/GlassCard";

/**
 * FollowingMoviesSection — Activité des abonnements
 *
 * @description Section montrant les films vus par les utilisateurs
 * que l'on suit, avec avatars et timestamps.
 */

export const FollowingMoviesSection: React.FC = () => {
  const { movies, loading } = useFollowingMovies();

  // Loading State
  if (loading) {
    return (
      <section className="mb-10 sm:mb-14 w-full overflow-hidden">
        <div className="flex items-end justify-between px-4 sm:px-6 mb-5 sm:mb-6">
          <div className="space-y-1">
            <span className="section-label">Activité</span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold">Vos abonnements</h2>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px]">
              <div className="aspect-poster rounded-xl bg-muted animate-shimmer" />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-shimmer w-3/4" />
                <div className="h-3 bg-muted rounded animate-shimmer w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty State
  if (movies.length === 0) {
    return (
      <section className="mb-10 sm:mb-14 px-4 sm:px-6">
        <div className="mb-5 sm:mb-6 space-y-1">
          <span className="section-label">Activité</span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Vos abonnements</h2>
        </div>

        <GlassCard variant="subtle" padding="lg" className="text-center">
          <div className={cn("w-14 h-14 mx-auto mb-4 rounded-2xl", "bg-muted/50 flex items-center justify-center")}>
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">Aucun film récent de vos abonnements</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Suivez des utilisateurs pour voir leurs films ici !</p>
          <Link
            to="/search"
            className={cn(
              "inline-flex items-center gap-2 mt-5",
              "px-5 py-2.5 rounded-xl",
              "bg-primary text-primary-foreground",
              "font-medium text-sm",
              "transition-all duration-300",
              "hover:shadow-glow-sm hover:scale-[1.02]",
            )}
          >
            Découvrir des utilisateurs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </GlassCard>
      </section>
    );
  }

  // Main Content
  return (
    <section className="mb-10 sm:mb-14 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 mb-5 sm:mb-6">
        <div className="space-y-1">
          <span className="section-label">Activité</span>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold">Vos abonnements</h2>
          <p className="text-sm text-muted-foreground">Films vus par les personnes que vous suivez</p>
        </div>
      </div>

      {/* Scroll Container */}
      <div className="relative">
        {/* Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Movies */}
        <div className="flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
          {movies.map((item, index) => (
            <Link
              key={item.movie.id}
              to={`/movie/${item.movie.id}`}
              className={cn("flex-shrink-0 w-[160px] sm:w-[180px] group", "opacity-0 animate-fade-in-up")}
              style={{
                animationDelay: `${index * 60}ms`,
                animationFillMode: "forwards",
              }}
            >
              {/* Poster */}
              <div
                className={cn(
                  "relative aspect-poster rounded-xl sm:rounded-2xl overflow-hidden",
                  "bg-muted",
                  "transition-all duration-500 ease-out",
                  "shadow-[0_4px_20px_rgba(0,0,0,0.1)]",
                  "group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)]",
                  "group-hover:translate-y-[-6px]",
                  "ring-1 ring-white/10 group-hover:ring-primary/30",
                )}
              >
                {item.movie.poster_path ? (
                  <img
                    src={getImageUrl(item.movie.poster_path, "w300")!}
                    alt={item.movie.title}
                    className={cn(
                      "w-full h-full object-cover",
                      "transition-transform duration-700",
                      "group-hover:scale-110",
                    )}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <Film className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div
                  className={cn(
                    "absolute inset-0",
                    "bg-gradient-to-t from-black/80 via-transparent to-transparent",
                    "opacity-60 group-hover:opacity-100",
                    "transition-opacity duration-500",
                  )}
                />

                {/* Watchers Avatars */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex -space-x-2">
                    {item.watchedBy.slice(0, 3).map((watcher, i) => (
                      <div
                        key={watcher.userId}
                        className={cn(
                          "w-7 h-7 rounded-full overflow-hidden",
                          "border-2 border-background",
                          "bg-primary flex items-center justify-center",
                          "text-[10px] font-bold text-primary-foreground",
                          "transition-transform duration-300",
                          "group-hover:scale-110",
                        )}
                        style={{ zIndex: 3 - i }}
                        title={watcher.username}
                      >
                        {watcher.avatarUrl ? (
                          <img src={watcher.avatarUrl} alt={watcher.username} className="w-full h-full object-cover" />
                        ) : (
                          watcher.username?.slice(0, 2).toUpperCase() || "?"
                        )}
                      </div>
                    ))}
                    {item.watchedBy.length > 3 && (
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full",
                          "border-2 border-background",
                          "bg-muted flex items-center justify-center",
                          "text-[10px] font-semibold text-muted-foreground",
                        )}
                      >
                        +{item.watchedBy.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="mt-3 space-y-1">
                <h3
                  className={cn(
                    "font-medium line-clamp-2 leading-tight",
                    "text-sm sm:text-base",
                    "transition-colors duration-300",
                    "group-hover:text-primary",
                  )}
                >
                  {item.movie.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {item.watchedBy[0]?.watchedAt && formatDistanceToNow(new Date(item.watchedBy[0].watchedAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
