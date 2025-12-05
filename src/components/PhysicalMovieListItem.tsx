import { useState } from "react";
import { Trash2, Disc, MoreVertical, Calendar, Euro, User, Film } from "lucide-react";
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

interface PhysicalMovieListItemProps {
  physicalMovie: PhysicalMovie;
  movieDetails: Movie | null;
  director?: string;
  onDeleted: () => void;
  onEdit: (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => void;
}

export const PhysicalMovieListItem: React.FC<PhysicalMovieListItemProps> = ({
  physicalMovie,
  movieDetails,
  director,
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

  const handleItemClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-menu-trigger]")) {
      return;
    }
    onEdit(physicalMovie, movieDetails);
  };

  const posterUrl = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w200") : null;

  const year = movieDetails?.release_date?.split("-")[0];
  const genres = movieDetails?.genres
    ?.slice(0, 2)
    .map((g) => g.name)
    .join(", ");

  return (
    <>
      <div
        className="flex items-center gap-4 p-3 bg-card rounded-lg group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        onClick={handleItemClick}
      >
        {/* Poster */}
        <div className="flex-shrink-0">
          {posterUrl ? (
            <img src={posterUrl} alt={movieDetails?.title || "Film"} className="w-16 h-24 object-cover rounded" />
          ) : (
            <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
              <Disc className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{movieDetails?.title || "Chargement..."}</h3>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            {year && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {year}
              </span>
            )}
            {director && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {director}
              </span>
            )}
            {genres && (
              <span className="flex items-center gap-1">
                <Film className="w-3 h-3" />
                {genres}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
              {formatLabels[physicalMovie.format]}
            </span>
            {physicalMovie.price && (
              <span className="flex items-center gap-1 text-sm font-medium">
                <Euro className="w-3 h-3" />
                {physicalMovie.price.toFixed(2)}
              </span>
            )}
          </div>

          {physicalMovie.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{physicalMovie.notes}</p>
          )}
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-menu-trigger
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
    <div className="flex items-center gap-4 p-3 bg-card rounded-lg">
      <div className="w-16 h-24 bg-muted rounded animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
      </div>
    </div>
  );
};
