import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getImageUrl, Movie } from '@/services/tmdb';
import { MovieSearchDialog } from './MovieSearchDialog';
import { TopMovie } from '@/hooks/useUserTopMovies';
import { toast } from '@/hooks/use-toast';

interface Top5SectionProps {
  topMovies: TopMovie[];
  onSetMovie: (slot: number, movie: { tmdb_id: number; title: string; poster_path: string | null }) => Promise<{ error: Error | null }>;
  editable?: boolean;
}

export function Top5Section({ topMovies, onSetMovie, editable = true }: Top5SectionProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const getMovieForSlot = (slot: number) => {
    return topMovies.find((m) => m.slot === slot);
  };

  const handleSlotClick = (slot: number) => {
    if (editable) {
      setSelectedSlot(slot);
      setDialogOpen(true);
    } else {
      const movie = getMovieForSlot(slot);
      if (movie) {
        navigate(`/movie/${movie.tmdb_id}`);
      }
    }
  };

  const handleSelectMovie = async (movie: Movie) => {
    if (selectedSlot === null) return;

    const { error } = await onSetMovie(selectedSlot, {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
    });

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le film',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Film ajouté à votre Top 5' });
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-center">Mon Top 5</h3>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((slot) => {
          const movie = getMovieForSlot(slot);
          return (
            <button
              key={slot}
              onClick={() => handleSlotClick(slot)}
              className="relative w-16 h-24 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/30"
            >
              {movie ? (
                <img
                  src={getImageUrl(movie.poster_path, 'w200') || '/placeholder.svg'}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Plus className="w-6 h-6 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      <MovieSearchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectMovie={handleSelectMovie}
        title={`Top 5 - Position ${selectedSlot}`}
      />
    </div>
  );
}
