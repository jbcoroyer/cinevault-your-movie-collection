import { Link } from "react-router-dom";
import { Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Star, Disc } from "lucide-react";

/**
 * MovieCard - Carte de film avec effet glassmorphism premium
 *
 * Features:
 * - Hover avec scale + glow aurora
 * - Badge de note flottant
 * - Overlay gradient animé
 * - Badge de disponibilité (plateforme ou format physique)
 */

// Icônes des plateformes de streaming (SVG simplifiés)
const PlatformIcons: Record<string, React.FC<{ className?: string }>> = {
  netflix: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.913.002-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z" />
    </svg>
  ),
  prime: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M1.846 16.154c.282-.153.436-.027.564.09.346.317.694.632 1.04.949 1.02.933 2.235 1.556 3.56 1.99 1.95.64 3.964.776 6.008.542 2.378-.272 4.582-1.065 6.574-2.424.258-.176.513-.358.768-.538.197-.14.3-.108.388.108.176.43.076.764-.256 1.07a12.48 12.48 0 01-3.524 2.188c-2.073.882-4.242 1.276-6.498 1.186-2.14-.085-4.155-.64-6.004-1.76-.898-.545-1.688-1.215-2.368-2.01-.284-.332-.284-.54.064-1.39zm14.508-1.786c.32-.004.746.078 1.152.282.49.247.756.648.798 1.192.042.536-.098 1.04-.294 1.53-.168.42-.376.82-.554 1.234-.046.106-.102.14-.214.118-.546-.108-1.093-.206-1.64-.31-.116-.022-.15-.072-.112-.184.252-.74.5-1.48.74-2.224.11-.346.22-.693.376-1.02.102-.214.27-.396.502-.494.118-.05.24-.088.374-.1.036-.003.072-.004.108-.004h-.236zm-2.85-6.082c-.048-.006-.096-.008-.144-.008-.388 0-.776.076-1.14.276-.722.398-1.132 1.006-1.268 1.808-.158.932.062 1.778.536 2.56.15.248.324.48.516.698.396.452.848.84 1.33 1.194.158.116.31.24.47.354.07.05.07.094.014.156-.284.316-.618.576-.992.79-.308.176-.634.316-.988.388-.23.046-.462.068-.696.038-.354-.046-.622-.218-.818-.504-.21-.308-.316-.656-.38-1.02-.082-.466-.09-.938-.054-1.41.074-.978.316-1.912.7-2.804.428-.994.998-1.894 1.74-2.684.35-.374.73-.718 1.144-1.022.348-.256.72-.476 1.132-.622.21-.074.424-.12.644-.138.04-.004.08-.006.12-.006.336 0 .66.08.95.274.35.236.55.568.63.974.072.368.044.736-.028 1.1-.18.91-.546 1.74-1.024 2.518-.44.716-.962 1.368-1.554 1.962-.15.15-.306.296-.468.432-.024.02-.054.034-.084.042-.016.004-.032.006-.048.006-.032 0-.062-.01-.086-.032-.082-.072-.048-.154-.01-.226.3-.556.554-1.132.7-1.752.064-.27.1-.544.072-.824-.034-.34-.168-.6-.474-.754-.092-.046-.19-.072-.292-.08z" />
    </svg>
  ),
  disney: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M2.056 6.834c-.117.09-.207.207-.27.342-.063.135-.09.279-.09.432 0 .18.054.36.162.54.108.18.27.324.486.432.216.108.477.162.783.162.27 0 .513-.045.729-.135.216-.09.387-.216.513-.378.126-.162.189-.342.189-.54 0-.198-.072-.387-.216-.567-.144-.18-.351-.324-.621-.432-.27-.108-.585-.162-.945-.162-.198 0-.387.027-.567.081-.18.054-.342.135-.486.243z" />
    </svg>
  ),
  canal: ({ className }) => <div className={cn("font-bold text-[8px] leading-none", className)}>C+</div>,
  apple: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  ),
  max: ({ className }) => <div className={cn("font-bold text-[8px] leading-none", className)}>MAX</div>,
  hbo: ({ className }) => <div className={cn("font-bold text-[8px] leading-none", className)}>MAX</div>,
  paramount: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2L2 22h20L12 2zm0 4l7 14H5l7-14z" />
    </svg>
  ),
  crunchyroll: ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm10-6a6 6 0 100 12 6 6 0 000-12z" />
    </svg>
  ),
};

// Couleurs des plateformes
const platformColors: Record<string, string> = {
  netflix: "bg-red-600",
  prime: "bg-blue-500",
  disney: "bg-indigo-600",
  canal: "bg-black",
  apple: "bg-zinc-700",
  max: "bg-purple-600",
  hbo: "bg-purple-600",
  paramount: "bg-blue-700",
  crunchyroll: "bg-orange-500",
};

// Couleurs des formats physiques
const formatColors: Record<string, string> = {
  dvd: "bg-slate-500",
  bluray: "bg-blue-600",
  "4k": "bg-purple-600",
  steelbook: "bg-amber-600",
  collector: "bg-red-600",
};

const formatLabels: Record<string, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  "4k": "4K",
  steelbook: "Steel",
  collector: "Collector",
};

export interface AvailabilityInfo {
  type: "platform" | "physical";
  id: string; // platform id or format
  name?: string;
}

interface MovieCardProps {
  movie: Movie;
  size?: "sm" | "md" | "lg" | "xl";
  showInfo?: boolean;
  showQuickActions?: boolean;
  priority?: boolean;
  className?: string;
  availability?: AvailabilityInfo[]; // Nouvelles infos de disponibilité
}

const sizeConfig = {
  sm: {
    wrapper: "w-[100px] sm:w-[110px]",
    title: "text-xs",
    meta: "text-[10px]",
    badge: "text-[9px] px-1.5 py-0.5",
    availBadge: "w-5 h-5",
  },
  md: {
    wrapper: "w-[140px] sm:w-[160px]",
    title: "text-sm",
    meta: "text-xs",
    badge: "text-[10px] px-2 py-1",
    availBadge: "w-6 h-6",
  },
  lg: {
    wrapper: "w-[180px] sm:w-[200px]",
    title: "text-base",
    meta: "text-sm",
    badge: "text-xs px-2 py-1",
    availBadge: "w-6 h-6",
  },
  xl: {
    wrapper: "w-[220px] sm:w-[260px]",
    title: "text-lg",
    meta: "text-sm",
    badge: "text-xs px-2.5 py-1",
    availBadge: "w-7 h-7",
  },
};

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  size = "md",
  showInfo = true,
  showQuickActions = false,
  priority = false,
  className,
  availability,
}) => {
  const posterUrl = getImageUrl(movie.poster_path, size === "xl" ? "w500" : "w300");
  const year = movie.release_date?.split("-")[0];
  const config = sizeConfig[size];
  const hasGoodRating = movie.vote_average >= 7;

  // Grouper les disponibilités par type
  const platforms = availability?.filter((a) => a.type === "platform") || [];
  const physicalFormats = availability?.filter((a) => a.type === "physical") || [];

  return (
    <Link to={`/movie/${movie.id}`} className={cn("group flex-shrink-0 block", config.wrapper, className)}>
      {/* Poster Container */}
      <div className="movie-card-hover aspect-[2/3] bg-muted relative overflow-hidden rounded-lg">
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
              hasGoodRating ? "text-amber-400" : "text-foreground/80",
            )}
          >
            <Star className="w-3 h-3 fill-current" />
            <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Gradient overlay au survol */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info section */}
      {showInfo && (
        <div className="mt-2 space-y-1">
          <h3 className={cn("font-medium line-clamp-1", config.title)}>{movie.title}</h3>

          <div className="flex items-center justify-between gap-2">
            <span className={cn("text-muted-foreground", config.meta)}>{year}</span>

            {/* Availability badges */}
            {availability && availability.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap justify-end">
                {/* Physical formats first */}
                {physicalFormats.slice(0, 2).map((avail, idx) => (
                  <div
                    key={`physical-${idx}`}
                    className={cn(
                      "flex items-center justify-center rounded",
                      formatColors[avail.id] || "bg-gray-600",
                      "px-1.5 py-0.5",
                    )}
                    title={formatLabels[avail.id] || avail.id}
                  >
                    <Disc className="w-3 h-3 text-white" />
                    <span className="text-[9px] text-white font-medium ml-0.5">
                      {formatLabels[avail.id]?.slice(0, 3) || avail.id.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                ))}

                {/* Platform icons */}
                {platforms.slice(0, 3).map((avail, idx) => {
                  const PlatformIcon = PlatformIcons[avail.id];
                  return (
                    <div
                      key={`platform-${idx}`}
                      className={cn(
                        "flex items-center justify-center rounded-full",
                        platformColors[avail.id] || "bg-gray-600",
                        "w-5 h-5",
                      )}
                      title={avail.name || avail.id}
                    >
                      {PlatformIcon ? (
                        <PlatformIcon className="w-3 h-3 text-white" />
                      ) : (
                        <span className="text-[8px] text-white font-bold">{avail.id.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  );
                })}

                {/* More indicator */}
                {availability.length > 5 && (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[9px] font-medium">+{availability.length - 5}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Link>
  );
};

// Skeleton loader
export const MovieCardSkeleton: React.FC<{ size?: "sm" | "md" | "lg" | "xl" }> = ({ size = "md" }) => {
  const config = sizeConfig[size];
  return (
    <div className={cn("flex-shrink-0", config.wrapper)}>
      <div className="aspect-[2/3] bg-muted rounded-lg skeleton-shimmer" />
      <div className="mt-2 space-y-2">
        <div className="h-4 bg-muted rounded skeleton-shimmer w-3/4" />
        <div className="h-3 bg-muted rounded skeleton-shimmer w-1/2" />
      </div>
    </div>
  );
};

// Featured card variant
export const MovieCardFeatured: React.FC<{ movie: Movie; className?: string }> = ({ movie, className }) => {
  const backdropUrl = getImageUrl(movie.backdrop_path, "w780");
  const posterUrl = getImageUrl(movie.poster_path, "w300");

  return (
    <Link
      to={`/movie/${movie.id}`}
      className={cn(
        "relative block overflow-hidden rounded-xl aspect-video group",
        "bg-gradient-to-br from-muted to-muted/50",
        className,
      )}
    >
      {backdropUrl && (
        <img
          src={backdropUrl}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex items-end gap-4">
        {posterUrl && (
          <img src={posterUrl} alt={movie.title} className="hidden sm:block w-24 rounded-lg shadow-xl -mb-2" />
        )}
        <div className="flex-1">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white line-clamp-2">{movie.title}</h3>
          <p className="text-white/70 text-sm mt-1 line-clamp-2 hidden sm:block">{movie.overview}</p>
        </div>
      </div>
    </Link>
  );
};
