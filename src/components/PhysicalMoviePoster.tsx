import { useState } from "react";
import { Trash2, Disc, MoreVertical } from "lucide-react";
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
import { PhysicalMovie, formatLabels, deletePhysicalMovie } from "@/services/physicalMovies";
import { toast } from "@/hooks/use-toast";

interface PhysicalMoviePosterProps {
  physicalMovie: PhysicalMovie;
  movieDetails: Movie | null;
  onDeleted: () => void;
  onEdit: (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => void;
}

export const PhysicalMoviePoster: React.FC<PhysicalMoviePosterProps> = ({
  physicalMovie,
  movieDetails,
  onDeleted,
  onEdit,
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

  const handlePosterClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-menu-trigger]")) {
      return;
    }
    onEdit(physicalMovie, movieDetails);
  };

  const posterUrl = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w300") : null;

  return (
    <>
      <div className="relative group cursor-pointer" onClick={handlePosterClick}>
        <div className="overflow-hidden rounded-lg hover:ring-2 hover:ring-primary/50 transition-all">
          {posterUrl ? (
            <img src={posterUrl} alt={movieDetails?.title || "Film"} className="w-full aspect-[2/3] object-cover" />
          ) : (
            <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
              <Disc className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Format badge */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-medium rounded">
          {formatLabels[physicalMovie.format]}
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-menu-trigger
              className="absolute top-2 right-2 w-7 h-7 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

export const PhysicalMoviePosterSkeleton: React.FC = () => {
  return <div className="w-full aspect-[2/3] bg-muted rounded-lg animate-pulse" />;
};
