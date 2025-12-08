import React from "react";
import { PhysicalMovie, PhysicalFormat, formatLabels } from "@/services/physicalMovies";
import { MovieDetails, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Disc, Zap } from "lucide-react";

interface ShelfViewProps {
  movies: PhysicalMovie[];
  movieDetailsMap: Record<number, MovieDetails>;
  onMovieClick: (physicalMovie: PhysicalMovie, movieDetails: MovieDetails | null) => void;
}

// Styles de base pour la forme et les bordures (sans les couleurs de fond fixes)
const SPINE_BASE_STYLES: Record<PhysicalFormat, string> = {
  dvd: "border-l border-white/10",
  bluray: "border-l border-white/10", // Le bleu viendra du logo
  "4k": "border-l border-white/10",
  steelbook: "border-l border-white/20",
  collector: "border-l border-white/20 w-12 sm:w-14",
};

// Logos de format adaptés pour être visibles sur n'importe quel fond
const FormatLogo = ({ format }: { format: PhysicalFormat }) => {
  if (format === "bluray")
    return (
      <div className="h-3 w-7 bg-blue-600/90 rounded-t-[2px] mx-auto mb-2 shadow-sm border-t border-white/20 flex items-center justify-center">
        <div className="w-4 h-[1px] bg-white/60"></div>
      </div>
    );
  if (format === "4k")
    return (
      <div className="bg-black/80 px-1 py-0.5 rounded-sm border border-white/10 mb-2">
        <div className="text-[6px] font-black text-center leading-none text-white tracking-tighter">4K</div>
      </div>
    );
  if (format === "dvd")
    return (
      <div className="mb-2 opacity-80">
        <div className="w-6 h-[2px] bg-white/20 mx-auto"></div>
      </div>
    );
  return <div className="h-1 w-full bg-white/10 mb-2" />;
};

export const ShelfView: React.FC<ShelfViewProps> = ({ movies, movieDetailsMap, onMovieClick }) => {
  if (movies.length === 0) return null;

  return (
    <div className="w-full bg-[#121212] border-8 border-[#1f1f1f] rounded-lg shadow-2xl overflow-hidden relative">
      {/* Texture bois sombre */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay" />

      {/* Ombre interne de l'étagère */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/60 pointer-events-none z-20" />

      <div className="relative z-10 flex flex-wrap items-end content-start p-4 sm:p-8 gap-[2px] min-h-[400px]">
        {movies.map((pm) => {
          const details = movieDetailsMap[pm.tmdb_id];
          const title = details?.title || "Titre inconnu";
          const poster = details?.poster_path ? getImageUrl(details.poster_path, "w500") : null;

          // Variation subtile pour le réalisme
          const randomHeight = Math.floor((pm.tmdb_id % 5) * 1.5);
          const randomTilt = (pm.tmdb_id % 2 === 0 ? 1 : -1) * ((pm.tmdb_id % 3) * 0.2);

          return (
            <Tooltip key={pm.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => onMovieClick(pm, details || null)}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-300 ease-out transform origin-bottom hover:z-50 hover:scale-110 hover:-translate-y-4",
                    pm.format === "collector" ? "w-10 sm:w-12" : "w-8 sm:w-10",
                    "h-48 sm:h-64 rounded-[2px] overflow-hidden shadow-lg",
                    SPINE_BASE_STYLES[pm.format],
                  )}
                  style={{
                    height: `${16 + (pm.format === "dvd" ? 0.5 : 0)}rem`,
                    transform: `rotate(${randomTilt}deg)`,
                    marginTop: `${randomHeight}px`,
                  }}
                >
                  {/* --- FOND DYNAMIQUE (Image de l'affiche) --- */}
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-80 blur-[0.5px] group-hover:blur-0 transition-all duration-300"
                    style={{
                      backgroundImage: poster ? `url(${poster})` : undefined,
                      backgroundColor: "#333", // Fallback
                    }}
                  />

                  {/* --- OVERLAYS POUR L'EFFET DE TRANCHE --- */}
                  {/* Assombrissement global pour lisibilité */}
                  <div className="absolute inset-0 z-0 bg-black/40" />

                  {/* Effet plastique/lumière sur la tranche (Cylindrique) */}
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-white/10 via-transparent to-black/60 pointer-events-none" />

                  {/* --- CONTENU DE LA TRANCHE --- */}
                  <div className="relative z-10 w-full h-full flex flex-col justify-between py-3">
                    {/* Haut : Logo Format */}
                    <div className="flex-shrink-0 flex justify-center w-full px-1">
                      <FormatLogo format={pm.format} />
                    </div>

                    {/* Centre : Titre du film */}
                    {/* Utilisation de flex-grow pour prendre tout l'espace disponible et centrer verticalement */}
                    <div className="flex-grow flex items-center justify-center w-full overflow-hidden px-1">
                      <h3
                        className="font-sans font-bold text-white text-xs sm:text-[13px] uppercase tracking-wider text-center w-full drop-shadow-md"
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          maxHeight: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </h3>
                    </div>

                    {/* Bas : Infos condition / studio */}
                    <div className="flex-shrink-0 w-full flex flex-col items-center gap-1.5 pt-2 opacity-80">
                      {/* Petit carré de couleur pour l'état si Mint */}
                      {pm.condition === "mint" && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                      )}
                      {/* Faux logo studio en bas */}
                      <div className="w-5 h-5 border border-white/30 rounded-sm flex items-center justify-center">
                        <span className="text-[6px] font-serif text-white/70">TM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>

              {/* Preview Poster au survol */}
              <TooltipContent side="right" className="p-0 border-none bg-transparent shadow-none" sideOffset={20}>
                <div className="relative w-48 rounded-lg overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 animate-in fade-in slide-in-from-left-4 duration-200">
                  {poster ? (
                    <img src={poster} alt={title} className="w-full h-auto object-cover" />
                  ) : (
                    <div className="w-48 h-72 bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <Disc className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badge de format sur le poster */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold text-white border border-white/10">
                    {formatLabels[pm.format]}
                  </div>

                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
                    <p className="text-white font-serif font-bold text-lg leading-tight">{title}</p>
                    {pm.price && <p className="text-primary font-medium text-sm mt-1">{pm.price} €</p>}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Espaces vides de l'étagère */}
        {Array.from({ length: Math.max(0, 8 - movies.length) }).map((_, i) => (
          <div key={`filler-${i}`} className="w-1.5 h-64 bg-white/5 mx-0.5 rounded-sm opacity-10" />
        ))}
      </div>

      {/* Planche de support de l'étagère */}
      <div className="h-8 w-full bg-[#181818] border-t border-white/5 relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.8)]">
        <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
      </div>
    </div>
  );
};
