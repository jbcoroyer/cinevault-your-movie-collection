import { Link } from "react-router-dom";
import { Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";

interface MovieCardProps {
  movie: Movie;
  size?: "sm" | "md" | "lg";
  showInfo?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, size = "md", showInfo = false }) => {
  const posterUrl = getImageUrl(movie.poster_path, "w300");
  const year = movie.release_date?.split("-")[0];

  const sizeClasses = {
    sm: "w-[100px] sm:w-[110px]",
    md: "w-[130px] sm:w-[150px]",
    lg: "w-[160px] sm:w-[180px]",
  };

  const aspectClasses = {
    sm: "aspect-[2/3]",
    md: "aspect-[2/3]",
    lg: "aspect-[2/3]",
  };

  return (
    <Link to={`/movie/${movie.id}`} className={cn("group flex-shrink-0", sizeClasses[size])}>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-lg",
          aspectClasses[size],
        )}
      >
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-xs text-center px-2">{movie.title}</span>
          </div>
        )}

        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating badge */}
        {movie.vote_average > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {movie.vote_average.toFixed(1)}
          </div>
        )}
      </div>

      {/* Title & Year */}
      {showInfo && (
        <div className="mt-2 space-y-0.5">
          <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{movie.title}</h3>
          {year && <p className="text-xs text-muted-foreground">{year}</p>}
        </div>
      )}
    </Link>
  );
};

export const MovieCardSkeleton: React.FC<{ size?: "sm" | "md" | "lg" }> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "w-[100px] sm:w-[110px]",
    md: "w-[130px] sm:w-[150px]",
    lg: "w-[160px] sm:w-[180px]",
  };

  return (
    <div className={cn("flex-shrink-0", sizeClasses[size])}>
      <div className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
    </div>
  );
};
