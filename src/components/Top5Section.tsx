import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Edit2, GripVertical, Check } from 'lucide-react';
import { getImageUrl, Movie } from '@/services/tmdb';
import { MovieSearchDialog } from './MovieSearchDialog';
import { TopMovie } from '@/hooks/useUserTopMovies';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Top5SectionProps {
  topMovies: TopMovie[];
  onSetMovie: (slot: number, movie: { tmdb_id: number; title: string; poster_path: string | null } | null) => Promise<{ error: Error | null }>;
  editable?: boolean;
}

export function Top5Section({ topMovies, onSetMovie, editable = true }: Top5SectionProps) {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);

  const getMovieForSlot = (slot: number) => {
    return topMovies.find((m) => m.slot === slot);
  };

  const handleSlotClick = (slot: number) => {
    const movie = getMovieForSlot(slot);
    
    if (isEditMode) {
      // In edit mode, clicking an empty slot opens the dialog
      if (!movie) {
        setSelectedSlot(slot);
        setDialogOpen(true);
      }
      return;
    }

    if (editable && !movie) {
      // If empty slot and editable, open dialog
      setSelectedSlot(slot);
      setDialogOpen(true);
    } else if (movie) {
      // If has movie, navigate to movie details
      navigate(`/movie/${movie.tmdb_id}`);
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

  const handleRemoveMovie = async (slot: number) => {
    const { error } = await onSetMovie(slot, null);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le film',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Film retiré de votre Top 5' });
    }
  };

  const handleDragStart = (slot: number) => {
    if (!isEditMode) return;
    setDraggedSlot(slot);
  };

  const handleDragOver = (e: React.DragEvent, slot: number) => {
    if (!isEditMode || draggedSlot === null) return;
    e.preventDefault();
  };

  const handleDrop = async (targetSlot: number) => {
    if (!isEditMode || draggedSlot === null || draggedSlot === targetSlot) {
      setDraggedSlot(null);
      return;
    }

    const draggedMovie = getMovieForSlot(draggedSlot);
    const targetMovie = getMovieForSlot(targetSlot);

    // Swap movies
    if (draggedMovie) {
      await onSetMovie(targetSlot, {
        tmdb_id: draggedMovie.tmdb_id,
        title: draggedMovie.title,
        poster_path: draggedMovie.poster_path,
      });
    } else {
      await onSetMovie(targetSlot, null);
    }

    if (targetMovie) {
      await onSetMovie(draggedSlot, {
        tmdb_id: targetMovie.tmdb_id,
        title: targetMovie.title,
        poster_path: targetMovie.poster_path,
      });
    } else {
      await onSetMovie(draggedSlot, null);
    }

    setDraggedSlot(null);
    toast({ title: 'Ordre mis à jour' });
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl md:text-2xl font-bold">🏆 Mon Top 5</h3>
        {editable && (
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Terminé
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 mr-2" />
                Éditer
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-3 md:gap-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((slot) => {
          const movie = getMovieForSlot(slot);
          return (
            <div
              key={slot}
              draggable={isEditMode && !!movie}
              onDragStart={() => handleDragStart(slot)}
              onDragOver={(e) => handleDragOver(e, slot)}
              onDrop={() => handleDrop(slot)}
              className={cn(
                "relative group",
                isEditMode && movie && "cursor-grab active:cursor-grabbing",
                draggedSlot === slot && "opacity-50"
              )}
            >
              <button
                onClick={() => handleSlotClick(slot)}
                disabled={isEditMode && !!movie}
                className="relative"
              >
                <div className={cn(
                  "relative w-24 h-36 md:w-32 md:h-48 lg:w-40 lg:h-60 rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 transition-all duration-200 flex items-center justify-center bg-muted/30",
                  !isEditMode && "hover:border-primary hover:scale-105",
                  isEditMode && !movie && "hover:border-primary"
                )}>
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
                      
                      {/* Edit mode overlay */}
                      {isEditMode && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <GripVertical className="w-8 h-8 text-white" />
                        </div>
                      )}
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
              </button>
              
              {/* Delete button in edit mode */}
              {isEditMode && movie && (
                <button
                  onClick={() => handleRemoveMovie(slot)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {movie && (
                <p className="mt-2 text-xs md:text-sm font-medium text-center line-clamp-2 max-w-24 md:max-w-32 lg:max-w-40">
                  {movie.title}
                </p>
              )}
            </div>
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