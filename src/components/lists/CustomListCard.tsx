import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Globe, Lock, ListVideo, Film, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl } from "@/services/tmdb";
import { Badge } from "@/components/ui/badge";

interface CustomListCardProps {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
  lastPosterPath?: string | null;
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
  lastPosterPath,
  itemCount = 0,
  onEdit,
  onDelete,
  className,
}: CustomListCardProps) {
  return (
    <Link to={`/lists/${id}`} className={cn("block group relative", className)}>
      {/* Effet de "pile" derrière la carte si elle contient des éléments */}
      {itemCount > 0 && (
        <div className="absolute top-2 left-2 right-2 bottom-0 bg-foreground/5 rounded-2xl -z-10 transition-transform duration-300 group-hover:translate-y-2 group-hover:scale-[0.98]" />
      )}

      <div className="relative h-full bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Partie Visuelle (Affiche) */}
        <div className="relative aspect-[2/1] sm:aspect-[16/9] w-full overflow-hidden bg-muted">
          {lastPosterPath ? (
            <>
              {/* Fond flouté pour remplir l'espace */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                style={{ backgroundImage: `url(${getImageUrl(lastPosterPath, "w300")})` }}
              />
              <div className="absolute inset-0 bg-black/20" />

              {/* Affiche nette positionnée artistiquement */}
              <div className="absolute right-4 top-4 bottom-[-40px] w-24 sm:w-32 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out origin-bottom-right">
                <img
                  src={getImageUrl(lastPosterPath, "w300") || ""}
                  alt="Dernier ajout"
                  className="w-full h-full object-cover rounded-lg border border-white/20"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-muted-foreground/30">
              <Film className="w-12 h-12 mb-2" />
              <span className="text-xs font-medium uppercase tracking-widest">Vide</span>
            </div>
          )}

          {/* Badge Count */}
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="secondary"
              className="bg-black/60 backdrop-blur-md text-white border-white/10 gap-1.5 pl-2 pr-2.5 h-7"
            >
              <Layers className="w-3.5 h-3.5" />
              {itemCount}
            </Badge>
          </div>
        </div>

        {/* Partie Contenu */}
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                  {title}
                </h3>
                {isPublic ? (
                  <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                )}
              </div>

              {description ? (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic">Aucune description</p>
              )}
            </div>

            {/* Menu Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-elevated">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit();
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-between pt-2 mt-auto border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mis à jour</p>
            <p className="text-xs font-medium">
              {new Date(updatedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
