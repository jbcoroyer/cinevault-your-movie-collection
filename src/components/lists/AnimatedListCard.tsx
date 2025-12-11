import { Link } from "react-router-dom";
import { MoreVertical, Pencil, Trash2, Layers, Play, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
// import { getImageUrl } from "@/services/tmdb"; // Import supprimé
import { useMemo, useState } from "react";

interface AnimatedListCardProps {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  itemCount: number;
  posters?: string[];
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
  index?: number;
}

// Fonction utilitaire locale pour éviter les problèmes d'import
const getImageUrl = (path: string | null | undefined, size: string = "w500") => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export function AnimatedListCard({
  id,
  title,
  description,
  isPublic,
  itemCount = 0,
  posters = [],
  onEdit,
  onDelete,
  className,
  index = 0,
}: AnimatedListCardProps) {
  // Générer un dégradé déterministe
  const gradient = useMemo(() => {
    const gradients = [
      "from-red-600 to-orange-900",
      "from-blue-600 to-indigo-900",
      "from-green-500 to-teal-900",
      "from-purple-600 to-pink-900",
      "from-amber-500 to-orange-800",
      "from-pink-600 to-rose-900",
      "from-cyan-600 to-blue-900",
    ];
    const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  }, [id]);

  // Préparer les images
  const displayPosters = useMemo(() => {
    const safePosters = [...posters];
    while (safePosters.length < 3) {
      safePosters.push("");
    }
    return safePosters.slice(0, 3);
  }, [posters]);

  return (
    <div className={cn("group relative w-full pt-12 pb-4 cursor-pointer perspective-1000", className)}>
      {/* --- CONTAINER PRINCIPAL --- */}
      <Link
        to={`/lists/${id}`}
        className="block relative w-full bg-card/80 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-2xl p-4 shadow-xl transition-all duration-500 group-hover:bg-card group-hover:border-primary/20 group-hover:shadow-2xl overflow-visible"
      >
        {/* --- LA PILE DE POSTERS --- */}
        <div className="absolute -top-10 left-0 right-0 h-40 flex justify-center items-end z-10 pointer-events-none">
          <div className="relative w-28 h-40">
            {/* Carte Arrière */}
            <PosterLayer
              url={displayPosters[0]}
              className="z-0 -rotate-12 group-hover:rotate-0 translate-y-2 group-hover:-translate-y-2 opacity-80 group-hover:opacity-100 grayscale-[30%] group-hover:grayscale-0"
            />

            {/* Carte Milieu */}
            <PosterLayer
              url={displayPosters[1]}
              className="z-10 rotate-12 group-hover:rotate-0 translate-y-2 group-hover:-translate-y-3.5 opacity-90 group-hover:opacity-100 grayscale-[15%] group-hover:grayscale-0"
            />

            {/* Carte Avant */}
            <PosterLayer
              url={displayPosters[2]}
              className="z-20 rotate-0 group-hover:scale-105 group-hover:-translate-y-5 ring-1 ring-black/50"
              isMain
            />
          </div>
        </div>

        {/* --- CONTENU DE LA CARTE --- */}
        <div className="mt-28 relative z-30">
          <div className="flex justify-between items-center mb-3">
            <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${gradient}`}></div>
            <div className="flex items-center text-[10px] font-medium text-muted-foreground gap-1 bg-muted/50 px-2 py-0.5 rounded-full border border-white/5">
              <Layers size={10} />
              <span>{itemCount}</span>
            </div>
          </div>

          <div className="mb-1 pr-8">
            <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-1 font-display">
              {title}
            </h3>
          </div>

          <div className="flex items-end justify-between mt-2">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              {description ? (
                <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic">Pas de description</p>
              )}

              <div className="flex items-center gap-1.5 mt-1">
                {isPublic ? (
                  <Globe className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                )}
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {isPublic ? "Publique" : "Privée"}
                </span>
              </div>
            </div>

            <div
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center 
                                opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 
                                transition-all duration-300 shadow-lg shadow-primary/20 scale-50 group-hover:scale-100"
            >
              <Play size={12} fill="currentColor" />
            </div>
          </div>
        </div>

        <div
          className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10`}
        ></div>
      </Link>

      <div className="absolute top-[60px] right-2 z-40">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/50 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-background/80 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm border border-white/5"
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
    </div>
  );
}

// Composant interne pour l'affichage des couches d'images
function PosterLayer({ url, className, isMain = false }: { url: string; className?: string; isMain?: boolean }) {
  const [error, setError] = useState(false);
  const imageUrl = getImageUrl(url, "w200");

  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full rounded-lg shadow-xl overflow-hidden transform transition-all duration-500 ease-out origin-bottom bg-muted border border-white/5",
        className,
      )}
    >
      {url && !error ? (
        <img
          src={imageUrl || ""}
          alt=""
          className="w-full h-full object-cover transition-all"
          onError={() => setError(true)}
        />
      ) : (
        // Placeholder affiché si pas d'image ou erreur
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/20">
          <Layers className="w-8 h-8 opacity-50" />
        </div>
      )}

      {!isMain && <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>}

      {isMain && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      )}
    </div>
  );
}
