import { useState } from "react";
import { Trash2, Disc, MoreVertical, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Movie, getImageUrl } from "@/services/tmdb";
import { PhysicalMovie, formatLabels, formatColors, deletePhysicalMovie } from "@/services/physicalMovies";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ConditionBadge, ConditionDot } from "./collection/ConditionBadge";

interface PhysicalMovieCardProps {
  physicalMovie: PhysicalMovie;
  movieDetails: Movie | null;
  onDeleted: () => void;
  onEdit: (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => void;
  editionCount?: number; // Nombre d'éditions de ce film
}

export const PhysicalMovieCard: React.FC<PhysicalMovieCardProps> = ({
  physicalMovie,
  movieDetails,
  onDeleted,
  onEdit,
  editionCount = 1,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const success = await deletePhysicalMovie(physicalMovie.id);
    if (success) {
      toast({ title: "Film retiré de votre bibliothèque" });
      onDeleted();
    } else {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click if clicking on menu
    if ((e.target as HTMLElement).closest("[data-menu-trigger]")) {
      return;
    }
    onEdit(physicalMovie, movieDetails);
  };

  const posterUrl = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w300") : null;

  const condition = physicalMovie.condition || "good";

  return (
    <>
      <div
        className="bg-card rounded-lg overflow-hidden group relative cursor-pointer ring-0 hover:ring-2 hover:ring-primary/50 transition-shadow duration-150"
        onClick={handleCardClick}
      >
        {posterUrl ? (
          <img src={posterUrl} alt={movieDetails?.title || "Film"} className="w-full aspect-[2/3] object-cover" />
        ) : (
          <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
            <Disc className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Format badge */}
        <div
          className={cn(
            "absolute top-2 left-2 px-2 py-1 text-white text-xs font-medium rounded",
            formatColors[physicalMovie.format],
          )}
        >
          {formatLabels[physicalMovie.format]}
        </div>

        {/* Condition dot */}
        <div className="absolute top-2 left-20">
          <ConditionDot condition={condition} className="w-2.5 h-2.5" />
        </div>

        {/* Multi-edition badge */}
        {editionCount > 1 && (
          <div className="absolute top-2 right-10 px-1.5 py-0.5 bg-background/90 text-foreground text-[10px] font-medium rounded flex items-center gap-0.5">
            <Copy className="w-3 h-3" />
            {editionCount}
          </div>
        )}

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-menu-trigger
              className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Retirer (vendu)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-medium text-sm truncate">{movieDetails?.title || "Chargement..."}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{movieDetails?.release_date?.split("-")[0] || ""}</span>
            {physicalMovie.price && (
              <span className="text-xs font-medium text-primary">{physicalMovie.price.toFixed(2)} €</span>
            )}
          </div>
          {physicalMovie.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{physicalMovie.notes}</p>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce film ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez vendu ou donné "{movieDetails?.title}" ? Cette action retirera le film de votre bibliothèque
              physique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Retirer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const PhysicalMovieCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-lg overflow-hidden">
      <div className="w-full aspect-[2/3] bg-muted animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
};
