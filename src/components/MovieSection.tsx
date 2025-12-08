import { Movie } from "@/services/tmdb";
import { MovieCard, MovieCardSkeleton } from "./MovieCard";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MovieSectionProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  loading?: boolean;
  seeMoreLink?: string;
}

export const MovieSection: React.FC<MovieSectionProps> = ({
  title,
  subtitle,
  movies,
  loading = false,
  seeMoreLink,
}) => {
  return (
    <section className="mb-8 sm:mb-12 w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 mb-4 sm:mb-6">
        <div>
          <p className="section-label mb-1">À découvrir</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {seeMoreLink && (
          <Link
            to={seeMoreLink}
            className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-4 transition-all"
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Movies scroll */}
      <div className="relative w-full">
        <div className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 pb-4 scrollbar-hide scroll-smooth">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : movies.slice(0, 20).map((movie, index) => (
                <div
                  key={movie.id}
                  className="flex-shrink-0 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <MovieCard movie={movie} showInfo />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};
