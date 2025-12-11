import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Globe, Lock, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomListCardProps {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
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
  onEdit,
  onDelete,
  className,
}: CustomListCardProps) {
  return (
    <Link to={`/lists/${id}`} className={cn("block group", className)}>
      <div className="relative h-full p-4 rounded-2xl glass-elevated hover:scale-[1.02] transition-all duration-300 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex flex-col h-full min-h-[100px]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-muted/50">
                <ListVideo className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1.5">
                {isPublic ? (
                  <Globe className="w-3 h-3 text-primary" />
                ) : (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  {isPublic ? "Public" : "Privé"}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
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

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className="font-display font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Footer */}
          <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border/50">
            Modifié le {new Date(updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
