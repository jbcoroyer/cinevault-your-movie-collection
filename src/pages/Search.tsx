import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { MovieCard, MovieCardSkeleton } from '@/components/MovieCard';
import { searchMovies, getGenres, discoverMoviesByGenre, searchMoviesByAI, Movie, Genre } from '@/services/tmdb';
import { cn } from '@/lib/utils';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isAIResults, setIsAIResults] = useState(false);

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);

  const performSearch = useCallback(async () => {
    if (!query.trim() && !selectedGenre) {
      setResults([]);
      setSearched(false);
      setIsAIResults(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    setIsAIResults(false);

    try {
      if (query.trim()) {
        const standardResults = await searchMovies(query);
        
        if (standardResults.length > 0) {
          setResults(standardResults);
          setIsAIResults(false);
        } else {
          try {
            const aiResults = await searchMoviesByAI(query);
            setResults(aiResults);
            setIsAIResults(aiResults.length > 0);
          } catch (aiError) {
            console.error('AI search error:', aiError);
            setResults([]);
            setIsAIResults(false);
          }
        }
      } else if (selectedGenre) {
        const data = await discoverMoviesByGenre(selectedGenre);
        setResults(data);
        setIsAIResults(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, selectedGenre]);

  useEffect(() => {
    const debounce = setTimeout(performSearch, 400);
    return () => clearTimeout(debounce);
  }, [performSearch]);

  const handleGenreSelect = (genreId: number) => {
    setQuery('');
    setSelectedGenre(selectedGenre === genreId ? null : genreId);
    setIsAIResults(false);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedGenre(null);
    setResults([]);
    setSearched(false);
    setIsAIResults(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="sticky top-14 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto p-4">
          <div className="relative mb-4 max-w-2xl">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Titre, acteur, ou 'comédie des années 90'..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedGenre(null);
              }}
              className="pl-10 pr-10 md:text-base"
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
                  'px-4 py-2 rounded-button text-sm whitespace-nowrap transition-all md:px-5 md:py-2.5',
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
      </div>

      <main className="container mx-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} size="lg" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {isAIResults && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground md:text-base">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Suggestions basées sur votre demande</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} size="lg" />
              ))}
            </div>
          </div>
        ) : searched ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground md:text-base">Aucun film trouvé</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground md:text-base">
              Recherchez un film ou sélectionnez un genre
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}