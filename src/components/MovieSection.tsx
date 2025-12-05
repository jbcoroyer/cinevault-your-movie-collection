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
    <section className="mb-8">
      <div className="flex items-center justify-between px-4 mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {seeMoreLink && (
          <Link
            to={seeMoreLink}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Voir plus
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 pb-2 hide-scrollbar">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)
          : movies.slice(0, 20).map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
    </section>
  );
};
