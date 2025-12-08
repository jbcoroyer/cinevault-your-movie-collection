import { Link } from "react-router-dom";
import { getImageUrl } from "@/services/tmdb";
import { useFollowingMovies } from "@/hooks/useFollowingMovies";
import { ArrowRight, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export const FollowingMoviesSection: React.FC = () => {
  const { movies, loading } = useFollowingMovies();

  if (loading) {
    return (
      <section className="mb-8 sm:mb-12 w-full overflow-hidden">
        <div className="flex items-end justify-between px-4 sm:px-6 mb-4 sm:mb-6">
          <div>
            <p className="section-label mb-1">Activité</p>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium">Vos abonnements</h2>
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[160px] sm:w-[180px]">
              <div className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (movies.length === 0) {
    return (
      <section className="mb-8 sm:mb-12 px-4 sm:px-6">
        <div className="mb-4 sm:mb-6">
          <p className="section-label mb-1">Activité</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium">Vos abonnements</h2>
        </div>
        <div className="bg-card rounded-xl p-6 sm:p-8 text-center border border-border/50">
          <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">Aucun film récent de vos abonnements</p>
          <p className="text-sm text-muted-foreground/70">
            Suivez des utilisateurs pour voir leurs films ici !
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 mt-4 text-primary text-sm hover:underline"
          >
            Découvrir des utilisateurs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 sm:mb-12 w-full overflow-hidden">
      <div className="flex items-end justify-between px-4 sm:px-6 mb-4 sm:mb-6">
        <div>
          <p className="section-label mb-1">Activité</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium">Vos abonnements</h2>
          <p className="text-sm text-muted-foreground mt-1">Films vus par les personnes que vous suivez</p>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide">
        {movies.map((item, index) => (
          <Link
            key={item.movie.id}
            to={`/movie/${item.movie.id}`}
            className="flex-shrink-0 w-[160px] sm:w-[180px] group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Poster */}
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted">
              {item.movie.poster_path ? (
                <img
                  src={getImageUrl(item.movie.poster_path, "w300")!}
                  alt={item.movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                  {item.movie.title}
                </div>
              )}

              {/* Watched by avatars overlay */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex -space-x-2">
                  {item.watchedBy.slice(0, 3).map((watcher, i) => (
                    <div
                      key={watcher.userId}
                      className="w-7 h-7 rounded-full border-2 border-background overflow-hidden bg-primary flex items-center justify-center text-[10px] font-medium text-primary-foreground"
                      title={watcher.username}
                    >
                      {watcher.avatarUrl ? (
                        <img src={watcher.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        watcher.username.slice(0, 2).toUpperCase()
                      )}
                    </div>
                  ))}
                  {item.watchedBy.length > 3 && (
                    <div className="w-7 h-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                      +{item.watchedBy.length - 3}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating badge */}
              {item.watchedBy[0]?.rating && (
                <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {item.watchedBy[0].rating}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-3 space-y-1">
              <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                {item.movie.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Vu par <span className="text-foreground">{item.watchedBy[0]?.username}</span>
                {item.watchedBy.length > 1 && ` et ${item.watchedBy.length - 1} autre${item.watchedBy.length > 2 ? "s" : ""}`}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                {formatDistanceToNow(new Date(item.watchedBy[0]?.watchedAt), { addSuffix: true, locale: fr })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
