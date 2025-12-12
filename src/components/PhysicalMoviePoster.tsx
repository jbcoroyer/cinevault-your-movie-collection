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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Movie, getImageUrl } from "@/services/tmdb";
import { PhysicalMovie, formatLabels, conditionLabels, deletePhysicalMovie } from "@/services/physicalMovies";
import { toast } from "@/hooks/use-toast";
import { ConditionDot } from "./collection/ConditionBadge";

interface PhysicalMoviePosterProps {
  physicalMovie: PhysicalMovie;
  movieDetails: Movie | null;
  onDeleted: () => void;
  onEdit: (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => void;
  editionCount?: number;
}

export const PhysicalMoviePoster: React.FC<PhysicalMoviePosterProps> = ({
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

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-menu-trigger]")) {
      return;
    }
    onEdit(physicalMovie, movieDetails);
  };

  const posterUrl = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w300") : null;

  const condition = physicalMovie.condition || "good";
  const tooltipContent = `${movieDetails?.title || "Film"} • ${formatLabels[physicalMovie.format]} • ${conditionLabels[condition]}`;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative aspect-[2/3] rounded overflow-hidden cursor-pointer group" onClick={handleClick}>
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movieDetails?.title || "Film"}
                className="w-full h-full object-cover transition-transform duration-150 ease-out group-hover:scale-[1.03]"
                style={{ willChange: 'transform' }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Disc className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            {/* Overlay on hover - GPU accelerated */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
              <span className="text-white text-xs font-medium px-2 text-center line-clamp-2">
                {movieDetails?.title}
              </span>
            </div>

            {/* Condition indicator */}
            <div className="absolute top-1 left-1">
              <ConditionDot condition={condition} className="w-2 h-2" />
            </div>

            {/* Multi-edition badge */}
            {editionCount > 1 && (
              <div className="absolute top-1 right-1 px-1 py-0.5 bg-background/90 text-foreground text-[9px] font-medium rounded flex items-center gap-0.5">
                <Copy className="w-2.5 h-2.5" />
                {editionCount}
              </div>
            )}

            {/* Menu (visible on hover) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-menu-trigger
                  className="absolute bottom-1 right-1 w-6 h-6 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3 h-3" />
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
                  Retirer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>

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
  return <div className="aspect-[2/3] rounded bg-muted animate-pulse" />;
};
