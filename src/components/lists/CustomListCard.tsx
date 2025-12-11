import { Link } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, Globe, Lock, Layers } from "lucide-react";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { ListPosterStack } from "./ListPosterStack";

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
  return (
    <Link to={`/lists/${id}`} className={cn("block group relative", className)}>
      {/* Effet de "pile" derrière la carte globale */}
      {itemCount > 0 && (
        <div className="absolute top-2 left-2 right-2 bottom-0 bg-foreground/5 rounded-3xl -z-10 transition-transform duration-300 group-hover:translate-y-2 group-hover:scale-[0.98]" />
      )}

      <div className="relative h-full bg-card/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
        {/* Partie Visuelle (Stack d'affiches) */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/20">
          <ListPosterStack posters={posters} count={itemCount} />

          {/* Badge Count - Flottant */}
          <div className="absolute top-3 left-3 z-20">
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
        <div className="p-5 flex flex-col gap-3 flex-1">
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
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed h-10">{description}</p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic h-10">Aucune description</p>
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

          <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/50">
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
