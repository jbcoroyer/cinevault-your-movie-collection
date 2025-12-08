import { Movie } from "@/services/tmdb";
import { MovieCard, MovieCardSkeleton } from "./MovieCard";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
  seeMoreLink?: string;
}

export const MovieSection: React.FC<MovieSectionProps> = ({ title, movies, loading = false, seeMoreLink }) => {
  return (
    <section className="mb-6 sm:mb-8 w-full overflow-hidden">
      <div className="flex items-center justify-between px-3 sm:px-4 mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
        {seeMoreLink && (
          <Link
            to={seeMoreLink}
            className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Voir plus
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="relative w-full">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto px-3 sm:px-4 pb-2 scrollbar-hide scroll-smooth snap-x snap-mandatory">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : movies.slice(0, 20).map((movie) => (
                <div key={movie.id} className="snap-start flex-shrink-0">
                  <MovieCard movie={movie} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};
