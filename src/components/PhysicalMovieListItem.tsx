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
import { ConditionBadge } from "./collection/ConditionBadge";

interface PhysicalMovieListItemProps {
  physicalMovie: PhysicalMovie;
  movieDetails: Movie | null;
  director?: string;
  onDeleted: () => void;
  onEdit: (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => void;
  editionCount?: number;
}

export const PhysicalMovieListItem: React.FC<PhysicalMovieListItemProps> = ({
  physicalMovie,
  movieDetails,
  director,
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

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-menu-trigger]")) {
      return;
    }
    onEdit(physicalMovie, movieDetails);
  };

  const posterUrl = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w200") : null;

  const condition = physicalMovie.condition || "good";
  const year = movieDetails?.release_date?.split("-")[0];

  return (
    <>
      <div
        className="flex items-center gap-3 p-3 bg-card rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group"
        onClick={handleClick}
      >
        {/* Poster */}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movieDetails?.title || "Film"}
            className="w-12 h-18 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-18 bg-muted rounded flex items-center justify-center flex-shrink-0">
            <Disc className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{movieDetails?.title || "Chargement..."}</h3>
            {editionCount > 1 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                <Copy className="w-3 h-3" />
                {editionCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            {year && <span>{year}</span>}
            {director && (
              <>
                <span>•</span>
                <span className="truncate">{director}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={cn("px-2 py-0.5 text-xs font-medium text-white rounded", formatColors[physicalMovie.format])}
            >
              {formatLabels[physicalMovie.format]}
            </span>
            <ConditionBadge condition={condition} size="sm" />
          </div>
        </div>

        {/* Price */}
        {physicalMovie.price && (
          <div className="text-right flex-shrink-0">
            <span className="font-medium text-primary">{physicalMovie.price.toFixed(2)} €</span>
          </div>
        )}

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-menu-trigger
              className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
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

export const PhysicalMovieListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
      <div className="w-12 h-18 bg-muted rounded animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-5 bg-muted rounded animate-pulse w-1/4" />
      </div>
    </div>
  );
};
