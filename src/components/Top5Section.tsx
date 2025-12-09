import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X, Edit2, GripVertical, Check, Trophy } from "lucide-react";
import { getImageUrl, Movie } from "../services/tmdb";
import { MovieSearchDialog } from "./MovieSearchDialog";
import { TopMovie } from "../hooks/useUserTopMovies";
import { toast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface Top5SectionProps {
  topMovies: TopMovie[];
  onSetMovie: (
    slot: number,
    movie: { tmdb_id: number; title: string; poster_path: string | null } | null,
  ) => Promise<{ error: Error | null }>;
  editable?: boolean;
  compact?: boolean; // Mode compact pour le header du profil
}

export function Top5Section({ topMovies, onSetMovie, editable = true, compact = false }: Top5SectionProps) {
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
      if (!movie) {
        setSelectedSlot(slot);
        setDialogOpen(true);
      }
      return;
    }

    if (editable && !movie) {
      setSelectedSlot(slot);
      setDialogOpen(true);
    } else if (movie) {
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
        title: "Erreur",
        description: "Impossible de sauvegarder le film",
        variant: "destructive",
      });
    } else {
      toast({ title: "Film ajouté à votre Top 5" });
    }
  };

  const handleRemoveMovie = async (slot: number) => {
    const { error } = await onSetMovie(slot, null);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le film",
        variant: "destructive",
      });
    } else {
      toast({ title: "Film retiré de votre Top 5" });
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
    toast({ title: "Ordre mis à jour" });
  };

  return (
    <div className={cn("w-full", compact ? "mb-0" : "mb-10")}>
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            Mon Top 5
          </h3>
          {editable && (
            <Button variant={isEditMode ? "default" : "outline"} size="sm" onClick={() => setIsEditMode(!isEditMode)}>
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
      )}

      {/* Grid container: 
         - Mobile: 5 columns tight (gap-2), restricted width (max-w-md mx-auto) ONLY if explicitly needed, 
           but here we want it to match parent width on desktop.
         - Desktop (md): full width, bigger gaps.
      */}
      <div
        className={cn(
          "grid grid-cols-5 gap-2 md:gap-4 w-full",
          compact
            ? "max-w-md mx-auto md:max-w-none md:w-full" // Mobile: compact / Desktop: full width
            : "justify-center flex-wrap",
        )}
      >
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
                "relative group aspect-[2/3]",
                isEditMode && movie && "cursor-grab active:cursor-grabbing",
                draggedSlot === slot && "opacity-50",
              )}
            >
              <button
                onClick={() => handleSlotClick(slot)}
                disabled={isEditMode && !!movie}
                className="w-full h-full relative"
              >
                <div
                  className={cn(
                    "w-full h-full rounded-lg overflow-hidden border border-border/50 transition-all duration-200 flex items-center justify-center bg-muted/30 shadow-sm",
                    !isEditMode && "hover:border-primary/50 hover:shadow-md hover:scale-[1.02]",
                    isEditMode && !movie && "hover:border-primary border-dashed",
                    compact && "rounded-md",
                  )}
                >
                  {movie ? (
                    <>
                      <img
                        src={getImageUrl(movie.poster_path, "w300") || "/placeholder.svg"} // Increased resolution for desktop
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Rank badge */}
                      <div
                        className={cn(
                          "absolute top-1 left-1 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center font-bold shadow-sm border border-white/10",
                          compact ? "w-5 h-5 text-[10px] md:w-7 md:h-7 md:text-sm" : "w-7 h-7 text-sm",
                        )}
                      >
                        {slot}
                      </div>

                      {/* Edit mode overlay */}
                      {isEditMode && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                          <GripVertical className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      {/* Empty State visual */}
                      <div
                        className={cn(
                          "rounded-full bg-muted flex items-center justify-center",
                          compact ? "w-6 h-6 md:w-10 md:h-10" : "w-10 h-10",
                        )}
                      >
                        <Plus className={cn("text-muted-foreground", compact ? "w-3 h-3 md:w-5 md:h-5" : "w-5 h-5")} />
                      </div>
                      {!compact && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">#{slot}</span>
                      )}
                    </div>
                  )}
                </div>
              </button>

              {/* Delete button in edit mode */}
              {isEditMode && movie && (
                <button
                  onClick={() => handleRemoveMovie(slot)}
                  className="absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-30"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit button specifically for compact mode */}
      {compact && editable && (
        <div className="flex justify-center mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="text-xs text-muted-foreground h-7 px-3 hover:bg-muted/50"
          >
            {isEditMode ? "Terminé" : "Modifier mon Top 5"}
          </Button>
        </div>
      )}

      <MovieSearchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectMovie={handleSelectMovie}
        title={`Top 5 - Position ${selectedSlot}`}
      />
    </div>
  );
}
