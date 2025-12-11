import { Film } from "lucide-react";
import { getImageUrl } from "../../services/tmdb";
import { cn } from "../../lib/utils";

interface ListPosterStackProps {
  posters: string[];
  count: number;
  className?: string;
}

export function ListPosterStack({ posters, count, className }: ListPosterStackProps) {
  // Limiter le nombre de posters affichés pour l'effet visuel
  const displayPosters = posters.slice(0, 5);
  const hasPosters = displayPosters.length > 0;

  return (
    <div className={cn("relative w-full h-full bg-muted/30 overflow-hidden", className)}>
      {/* Fond flouté basé sur le premier poster */}
      {hasPosters && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 scale-150 transition-all duration-700"
          style={{ backgroundImage: `url(${getImageUrl(displayPosters[0], "w300")})` }}
        />
      )}

      {/* Overlay sombre pour contraste */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-0" />

      {/* Conteneur des cartes superposées */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-10 perspective-1000">
        {hasPosters ? (
          <div className="relative w-2/3 h-4/5">
            {displayPosters.map((poster, index) => {
              // Calculs pour l'effet de pile
              const scale = 1 - index * 0.08; // Réduction progressive
              const translateY = index * -8; // Décalage vers le haut
              const rotate = index % 2 === 0 ? index * 2 : index * -2; // Rotation alternée
              const zIndex = 20 - index; // Les premiers éléments ont un z-index plus élevé
              const opacity = 1 - index * 0.15; // Transparence progressive

              return (
                <div
                  key={`${poster}-${index}`}
                  className={cn(
                    "absolute top-0 left-0 w-full h-full rounded-lg shadow-xl border border-white/10 overflow-hidden transition-all duration-500 ease-out origin-bottom",
                    "group-hover:translate-y-0 group-hover:rotate-0",
                  )}
                  style={{
                    zIndex,
                    transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                    opacity,
                  }}
                >
                  <img src={getImageUrl(poster, "w300") || ""} alt="" className="w-full h-full object-cover" />
                  {/* Effet de brillance sur chaque carte */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </div>
              );
            })}

            {/* Si plus de 5 films, indication visuelle au fond */}
            {count > 5 && (
              <div
                className="absolute top-0 left-0 w-full h-full bg-black/80 rounded-lg border border-white/5 flex items-center justify-center -z-10"
                style={{ transform: `translateY(-40px) scale(0.6)` }}
              >
                <span className="text-white/50 text-xs font-bold">+{count - 5}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/30">
            <Film className="w-12 h-12 mb-2" />
            <span className="text-xs font-medium uppercase tracking-widest">Vide</span>
          </div>
        )}
      </div>
    </div>
  );
}
