import { Movie } from '@/services/tmdb';
import { MovieCard, MovieCardSkeleton } from './MovieCard';

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
}

export const MovieSection: React.FC<MovieSectionProps> = ({ title, movies, loading }) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 px-4">{title}</h2>
      
      <div className="flex gap-4 overflow-x-auto px-4 pb-2 hide-scrollbar">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} />)
          : movies.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
      </div>
    </section>
  );
};
