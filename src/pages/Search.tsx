import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/BottomNav';
import { MovieCard, MovieCardSkeleton } from '@/components/MovieCard';
import { searchMovies, getGenres, discoverMoviesByGenre, Movie, Genre } from '@/services/tmdb';
import { cn } from '@/lib/utils';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);

  const performSearch = useCallback(async () => {
    if (!query.trim() && !selectedGenre) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      if (query.trim()) {
        const data = await searchMovies(query);
        setResults(data);
      } else if (selectedGenre) {
        const data = await discoverMoviesByGenre(selectedGenre);
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, selectedGenre]);

  useEffect(() => {
    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [performSearch]);

  const handleGenreSelect = (genreId: number) => {
    setQuery('');
    setSelectedGenre(selectedGenre === genreId ? null : genreId);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedGenre(null);
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un film..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedGenre(null);
            }}
            className="pl-10 pr-10"
          />
          {(query || selectedGenre) && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Genre filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreSelect(genre.id)}
              className={cn(
                'px-4 py-2 rounded-button text-sm whitespace-nowrap transition-all',
                selectedGenre === genre.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      <main className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <MovieCardSkeleton key={i} size="lg" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} size="lg" />
            ))}
          </div>
        ) : searched ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun résultat trouvé</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              Recherchez un film ou sélectionnez un genre
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
