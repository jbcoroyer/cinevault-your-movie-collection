import { cn } from "@/lib/utils";
// import { getImageUrl } from "@/services/tmdb"; // Import supprimé pour éviter l'erreur de résolution
import { Layers, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SpecialListCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  posters?: string[];
  onClick: () => void;
  loading?: boolean;
  type: "watchlist" | "watched" | "favorites" | null;
  className?: string;
}

// Fonction utilitaire intégrée localement pour éviter les problèmes d'import
const getImageUrl = (path: string | null | undefined, size: string = "w500") => {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export function SpecialListCard({
  title,
  count,
  icon: Icon,
  posters = [],
  onClick,
  loading = false,
  type,
  className,
}: SpecialListCardProps) {
  // Définir les couleurs spécifiques selon le type de liste
  const colorMap = {
    watchlist: "from-amber-500 to-orange-900", // Watchlist -> Tons chauds/Orange
    watched: "from-blue-600 to-indigo-900", // Vus -> Tons froids/Bleu
    favorites: "from-pink-600 to-rose-900", // Favoris -> Tons passion/Rose
  };

  const gradient = type ? colorMap[type] : "from-gray-600 to-gray-900";

  // Gestion des images : on s'assure d'en avoir 3 (même vides) pour l'animation
  const displayPosters = useMemo(() => {
    const safePosters = [...posters];
    while (safePosters.length < 3) {
      safePosters.push(""); // Une chaine vide déclenchera le placeholder
    }
    return safePosters.slice(0, 3);
  }, [posters]);

  if (loading) {
    return (
      <div className={cn("pt-12 pb-4", className)}>
        <Skeleton className="w-full h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div
      className={cn("group relative w-full pt-12 pb-4 cursor-pointer perspective-1000", className)}
      onClick={onClick}
    >
      {/* --- CONTAINER PRINCIPAL --- */}
      <div className="relative w-full bg-card/80 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-2xl p-4 shadow-xl transition-all duration-500 group-hover:bg-card group-hover:border-primary/20 group-hover:shadow-2xl overflow-visible">
        {/* --- LA PILE DE POSTERS (Floating Stack) --- */}
        <div className="absolute -top-10 left-0 right-0 h-40 flex justify-center items-end z-10 pointer-events-none">
          <div className="relative w-28 h-40">
            {/* Carte Arrière (Gauche) */}
            <PosterCard
              url={displayPosters[0]}
              className="z-0 -rotate-12 group-hover:rotate-0 translate-y-2 group-hover:-translate-y-2 opacity-80 group-hover:opacity-100 grayscale-[30%] group-hover:grayscale-0"
              fallbackIcon={Icon}
            />

            {/* Carte Milieu (Droite) */}
            <PosterCard
              url={displayPosters[1]}
              className="z-10 rotate-12 group-hover:rotate-0 translate-y-2 group-hover:-translate-y-3.5 opacity-90 group-hover:opacity-100 grayscale-[15%] group-hover:grayscale-0"
              fallbackIcon={Icon}
            />

            {/* Carte Avant (Principale) */}
            <PosterCard
              url={displayPosters[2]}
              className="z-20 rotate-0 group-hover:scale-105 group-hover:-translate-y-5"
              fallbackIcon={Icon}
              isMain
            />
          </div>
        </div>

        {/* --- CONTENU DE LA CARTE --- */}
        <div className="mt-28 relative z-30">
          {/* Metadata Header */}
          <div className="flex justify-between items-center mb-3">
            <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${gradient}`}></div>
            <div className="flex items-center text-[10px] font-medium text-muted-foreground gap-1 bg-muted/50 px-2 py-0.5 rounded-full border border-white/5">
              <Layers size={10} />
              <span>{count}</span>
            </div>
          </div>

          {/* Titre avec Icône */}
          <div className="mb-1">
            <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors font-display flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {title}
            </h3>
          </div>

          {/* Footer / Description */}
          <div className="flex items-end justify-between mt-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground line-clamp-1">
                {type === "watchlist" && "À voir absolument"}
                {type === "watched" && "Historique de visionnage"}
                {type === "favorites" && "Vos coups de cœur"}
                {!type && "Collection spéciale"}
              </p>
            </div>

            {/* Bouton Play au survol */}
            <div
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center 
                                opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 
                                transition-all duration-300 shadow-lg shadow-primary/20 scale-50 group-hover:scale-100"
            >
              <Play size={12} fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Effet de lueur arrière */}
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10`}
        ></div>
      </div>
    </div>
  );
}

// Sous-composant pour gérer l'affichage d'un poster avec fallback robuste
function PosterCard({
  url,
  className,
  fallbackIcon: Icon,
  isMain = false,
}: {
  url: string;
  className?: string;
  fallbackIcon: any;
  isMain?: boolean;
}) {
  const [error, setError] = useState(false);
  const imageUrl = getImageUrl(url, "w200");

  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full rounded-lg shadow-xl overflow-hidden transform transition-all duration-500 ease-out origin-bottom bg-muted border border-white/5",
        isMain ? "ring-1 ring-black/50" : "",
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
        // Placeholder visible si pas d'URL ou erreur de chargement
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground/20">
          <Icon className="w-8 h-8 opacity-50" />
        </div>
      )}

      {/* Overlay sombre pour la profondeur (sauf sur la principale) */}
      {!isMain && <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>}

      {/* Effet brillant sur la principale */}
      {isMain && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      )}
    </div>
  );
}
