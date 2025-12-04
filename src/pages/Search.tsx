import { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, X, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/BottomNav';
import { MovieCard, MovieCardSkeleton } from '@/components/MovieCard';
import { searchMovies, getGenres, discoverMoviesByGenre, searchMoviesByAI, Movie, Genre } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);

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
        if (isAIMode) {
          // Already in AI mode, use AI search directly
          const data = await searchMoviesByAI(query);
          setResults(data);
        } else {
          // Standard search first
          const data = await searchMovies(query);
          
          if (data.length > 0) {
            // Standard search found results
            setResults(data);
          } else {
            // No results - automatically try AI search
            toast.info('Aucun titre exact trouvé, recherche intelligente activée...', {
              icon: <Sparkles className="w-4 h-4" />,
              duration: 3000,
            });
            
            try {
              const aiData = await searchMoviesByAI(query);
              setResults(aiData);
              // Visually activate AI mode to show user what happened
              setIsAIMode(true);
            } catch (aiError) {
              console.error('AI fallback error:', aiError);
              setResults([]);
            }
          }
        }
      } else if (selectedGenre) {
        const data = await discoverMoviesByGenre(selectedGenre);
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      if (isAIMode) {
        toast.error('Erreur lors de la recherche IA');
      }
    } finally {
      setLoading(false);
    }
  }, [query, selectedGenre, isAIMode]);

  useEffect(() => {
    // Longer debounce for AI mode since it's more expensive
    const debounceTime = isAIMode ? 800 : 300;
    const debounce = setTimeout(performSearch, debounceTime);
    return () => clearTimeout(debounce);
  }, [performSearch, isAIMode]);

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

  const handleAIModeChange = (checked: boolean) => {
    setIsAIMode(checked);
    setQuery('');
    setSelectedGenre(null);
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border p-4">
        {/* AI Mode Toggle */}
        <div className="flex items-center justify-end gap-2 mb-3">
          <Label htmlFor="ai-mode" className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            Recherche IA
          </Label>
          <Switch
            id="ai-mode"
            checked={isAIMode}
            onCheckedChange={handleAIModeChange}
          />
        </div>

        <div className="relative mb-4">
          {loading && isAIMode ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          ) : (
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          <Input
            type="text"
            placeholder={isAIMode ? "Ex: Film de gangster des années 90..." : "Rechercher un film..."}
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

        {/* Genre filters - hidden in AI mode */}
        {!isAIMode && (
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
        )}

        {/* AI mode hint */}
        {isAIMode && !searched && (
          <p className="text-xs text-muted-foreground text-center">
            Décrivez le type de film que vous cherchez en langage naturel
          </p>
        )}
      </div>

      <main className="p-4">
        {loading ? (
          <div className="space-y-4">
            {isAIMode && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">L'IA analyse votre demande...</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <MovieCardSkeleton key={i} size="lg" />
              ))}
            </div>
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
              {isAIMode 
                ? "Décrivez le film de vos rêves..." 
                : "Recherchez un film ou sélectionnez un genre"
              }
            </p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
