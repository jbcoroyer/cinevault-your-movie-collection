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
    <div className="mb-10">
      <h3 className="text-xl md:text-2xl font-bold mb-6 text-center">🏆 Mon Top 5</h3>
      <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((slot) => {
          const movie = getMovieForSlot(slot);
          return (
            <button
              key={slot}
              onClick={() => handleSlotClick(slot)}
              className="relative group"
            >
              <div className="relative w-24 h-36 md:w-32 md:h-48 lg:w-40 lg:h-60 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-all duration-200 flex items-center justify-center bg-muted/30 hover:scale-105">
                {movie ? (
                  <>
                    <img
                      src={getImageUrl(movie.poster_path, 'w300') || '/placeholder.svg'}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Rank badge */}
                    <div className="absolute top-2 left-2 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm md:text-base shadow-lg">
                      {slot}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">#{slot}</span>
                  </div>
                )}
              </div>
              {movie && (
                <p className="mt-2 text-xs md:text-sm font-medium text-center line-clamp-2 max-w-24 md:max-w-32 lg:max-w-40">
                  {movie.title}
                </p>
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
