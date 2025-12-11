import { Link } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, Globe, Lock, Layers } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface CustomListCardProps {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
  posters?: string[];
  itemCount?: number;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

export function CustomListCard({
  id,
  title,
  description,
  isPublic,
  updatedAt,
  posters = [],
  itemCount = 0,
  onEdit,
  onDelete,
  className,
}: CustomListCardProps) {
  // Utiliser le premier poster disponible comme couverture
  const coverPoster = posters.length > 0 ? posters[0] : null;
  const posterUrl = coverPoster ? `https://image.tmdb.org/t/p/w500${coverPoster}` : null;

  return (
    <Link to={`/lists/${id}`} className={cn("block group relative", className)}>
      {/* Effet de "pile" derrière la carte globale */}
      {itemCount > 1 && (
        <>
          <div className="absolute top-3 left-3 right-3 bottom-0 bg-foreground/8 rounded-3xl -z-20 transition-transform duration-300 group-hover:translate-y-3 group-hover:scale-[0.96]" />
          <div className="absolute top-1.5 left-1.5 right-1.5 bottom-0 bg-foreground/5 rounded-3xl -z-10 transition-transform duration-300 group-hover:translate-y-1.5 group-hover:scale-[0.98]" />
        </>
      )}

      <div className="relative h-full bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
        {/* Image de couverture */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/30">
          {posterUrl ? (
            <>
              {/* Image de fond avec effet zoom au hover */}
              <img
                src={posterUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay gradient pour le contraste */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            </>
          ) : (
            /* État vide - pas de film */
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
              <div className="text-center text-muted-foreground/60">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span className="text-sm">Liste vide</span>
              </div>
            </div>
          )}

          {/* Badge Count - Coin supérieur gauche */}
          <div className="absolute top-3 left-3 z-20">
            <Badge
              variant="secondary"
              className="bg-black/60 backdrop-blur-md text-white border-white/10 gap-1.5 pl-2 pr-2.5 h-7"
            >
              <Layers className="w-3.5 h-3.5" />
              {itemCount}
            </Badge>
          </div>

          {/* Menu actions - Coin supérieur droit */}
          <div className="absolute top-3 right-3 z-30" onClick={(e) => e.preventDefault()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-black/50 backdrop-blur-md hover:bg-black/70 text-white border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Titre et infos - Sur l'image avec contraste */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-lg leading-tight text-white truncate drop-shadow-lg">
                {title}
              </h3>
              {isPublic ? (
                <Globe className="w-3.5 h-3.5 text-white/80 flex-shrink-0 drop-shadow" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-white/80 flex-shrink-0 drop-shadow" />
              )}
            </div>
            {description && <p className="text-sm text-white/70 line-clamp-1 drop-shadow">{description}</p>}
          </div>
        </div>

        {/* Footer avec date de mise à jour */}
        <div className="px-4 py-3 border-t border-white/5 bg-card/50">
          <p className="text-xs text-muted-foreground">
            Mis à jour{" "}
            {new Date(updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
