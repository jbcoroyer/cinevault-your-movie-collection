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

// Configuration visuelle des tranches selon le format
const SPINE_STYLES: Record<PhysicalFormat, string> = {
  dvd: "bg-zinc-800 border-l border-zinc-700 text-zinc-300",
  bluray: "bg-blue-600/90 border-l border-blue-400/50 text-white shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]",
  "4k": "bg-black border-l border-zinc-800 text-zinc-100 shadow-[inset_0_0_5px_rgba(255,255,255,0.1)]",
  steelbook: "bg-slate-500 border-l border-slate-400 text-white bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px]",
  collector: "bg-red-700 border-l border-red-500 text-white shadow-lg z-10 w-12", // Plus large
};

// Logos simplifiés pour le haut de la tranche
const FormatLogo = ({ format }: { format: PhysicalFormat }) => {
  if (format === "bluray") return <div className="h-3 w-8 bg-gradient-to-b from-transparent via-white/20 to-transparent rounded-t-sm mx-auto mb-2" />;
  if (format === "4k") return <div className="text-[8px] font-black text-center leading-none mb-1 tracking-tighter opacity-80">ULTRA HD</div>;
  return <div className="h-1 w-full bg-white/10 mb-2" />;
};

export const ShelfView: React.FC<ShelfViewProps> = ({ movies, movieDetailsMap, onMovieClick }) => {
  if (movies.length === 0) return null;

  return (
    <div className="w-full bg-[#1a1a1a] border-8 border-[#2a2a2a] rounded-lg shadow-2xl overflow-hidden relative">
      {/* Texture bois/fond de l'étagère */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none" />
      
      {/* Lumière d'ambiance */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-20" />

      <div className="relative z-10 flex flex-wrap items-end content-start p-4 sm:p-8 gap-[2px] min-h-[400px]">
        {movies.map((pm, index) => {
          const details = movieDetailsMap[pm.tmdb_id];
          const title = details?.title || "Titre inconnu";
          const poster = details?.poster_path ? getImageUrl(details.poster_path, "w200") : null;
          
          // Variation aléatoire légère de la hauteur et de l'inclinaison pour le réalisme
          const randomHeight = Math.floor(Math.random() * 4); 
          const randomTilt = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;

          return (
            <Tooltip key={pm.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  onClick={() => onMovieClick(pm, details || null)}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-300 ease-out transform origin-bottom hover:z-50 hover:scale-110 hover:-translate-y-4",
                    pm.format === "collector" ? "w-10 sm:w-12" : "w-7 sm:w-9",
                    "h-48 sm:h-64 rounded-sm flex flex-col items-center justify-between py-2 overflow-hidden",
                    SPINE_STYLES[pm.format],
                    // Effet de tranche 3D
                    "before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:via-transparent before:to-black/30 before:pointer-events-none"
                  )}
                  style={{
                    height: `${16 + (pm.format === 'dvd' ? 1 : 0) * 0.5}rem`, // DVD légèrement plus grands
                    transform: `rotate(${randomTilt}deg)`,
                    marginTop: `${randomHeight}px`
                  }}
                >
                  {/* Top of spine */}
                  <div className="w-full px-1 opacity-70">
                    <FormatLogo format={pm.format} />
                  </div>

                  {/* Title (Vertical Text) */}
                  <div className="flex-1 flex items-center justify-center w-full overflow-hidden py-2">
                    <h3 
                      className="whitespace-nowrap text-xs sm:text-sm font-bold tracking-wide uppercase text-center w-full"
                      style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                    >
                      {title.length > 25 ? title.substring(0, 25) + "..." : title}
                    </h3>
                  </div>

                  {/* Bottom logos / details */}
                  <div className="w-full flex flex-col items-center gap-1 opacity-60 pb-1">
                    {pm.condition === "mint" && <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[8px]">
                      {pm.tmdb_id % 10} {/* Faux numéro de studio/catalogue */}
                    </div>
                  </div>
                </div>
              </TooltipTrigger>
              
              {/* Preview au survol (Poster) */}
              <TooltipContent side="right" className="p-0 border-none bg-transparent shadow-xl" sideOffset={20}>
                <div className="relative w-40 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                  {poster ? (
                    <img src={poster} alt={title} className="w-full h-auto object-cover" />
                  ) : (
                    <div className="w-40 h-60 bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Disc className="w-10 h-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                    <p className="text-white font-bold text-sm leading-tight">{title}</p>
                    <p className="text-white/70 text-xs mt-1">{formatLabels[pm.format]}</p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {/* Fillers pour combler l'étagère si vide */}
        {Array.from({ length: Math.max(0, 10 - movies.length) }).map((_, i) => (
          <div key={`filler-${i}`} className="w-2 h-64 bg-white/5 mx-1 rounded-sm opacity-20" />
        ))}
      </div>
      
      {/* Base de l'étagère */}
      <div className="h-6 w-full bg-[#151515] border-t border-white/10 shadow-[0_-5px_10px_rgba(0,0,0,0.5)] relative z-20"></div>
    </div>
  );
};
