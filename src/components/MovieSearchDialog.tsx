import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { searchMovies, Movie, getImageUrl } from '@/services/tmdb';
import { Search, Film } from 'lucide-react';

interface MovieSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectMovie: (movie: Movie) => void;
  title?: string;
}

export function MovieSearchDialog({
  open,
  onOpenChange,
  onSelectMovie,
  title = 'Rechercher un film',
}: MovieSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        const movies = await searchMovies(query);
        setResults(movies);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (movie: Movie) => {
    onSelectMovie(movie);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un film..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[300px] mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => handleSelect(movie)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  {movie.poster_path ? (
                    <img
                      src={getImageUrl(movie.poster_path, 'w200') || ''}
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-18 bg-muted rounded flex items-center justify-center">
                      <Film className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {movie.release_date?.split('-')[0] || 'N/A'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim().length > 1 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun résultat trouvé
            </p>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Commencez à taper pour rechercher
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
