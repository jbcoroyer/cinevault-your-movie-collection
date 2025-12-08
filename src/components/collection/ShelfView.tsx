import React, { useState, useRef } from "react";
import { PhysicalMovie, PhysicalFormat, formatLabels } from "@/services/physicalMovies";
import { MovieDetails, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Disc } from "lucide-react";

interface ShelfViewProps {
  movies: PhysicalMovie[];
  movieDetailsMap: Record<number, MovieDetails>;
  onMovieClick: (physicalMovie: PhysicalMovie, movieDetails: MovieDetails | null) => void;
}

// Configuration des dimensions (Tranche)
const SPINE_WIDTHS: Record<PhysicalFormat, string> = {
  dvd: "w-9 sm:w-11",
  bluray: "w-8 sm:w-9",
  "4k": "w-8 sm:w-9",
  steelbook: "w-8 sm:w-10",
  collector: "w-12 sm:w-16",
};

// Logos gravés
const FormatLogo = ({ format }: { format: PhysicalFormat }) => {
  const engravedStyle = "opacity-90 drop-shadow-[0_1px_1px_rgba(255,255,255,0.1)] text-white/90";

  if (format === "bluray")
    return (
      <div className="h-3 w-8 mx-auto mb-3 relative flex items-center justify-center overflow-hidden rounded-t-sm group-hover:brightness-125 transition-all">
        <div className="absolute inset-0 bg-blue-600/80 mix-blend-overlay z-0"></div>
        <div className="absolute top-0 inset-x-0 h-[1px] bg-blue-400/50 z-10"></div>
        <div className="h-[2px] w-5 bg-white/80 rounded-full relative z-20 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
      </div>
    );
  if (format === "4k")
    return (
      <div className={`mb-3 border border-white/20 px-1 rounded-sm bg-black/50 ${engravedStyle}`}>
        <div className="text-[7px] font-black leading-none tracking-tighter text-center">4K UHD</div>
      </div>
    );
  if (format === "steelbook")
    return (
      <div className="mb-3 opacity-70 tracking-[0.2em] text-[6px] font-bold uppercase text-white/80 border-b border-white/10 pb-0.5">
        Steelbook
      </div>
    );
  return <div className="h-[2px] w-6 bg-white/20 mb-3 rounded-full mx-auto opacity-50" />;
};

export const ShelfView: React.FC<ShelfViewProps> = ({ movies, movieDetailsMap, onMovieClick }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Gestion Tactile
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const spine = target?.closest("[data-movie-id]");
    if (spine) {
      const id = spine.getAttribute("data-movie-id");
      if (id !== activeId) setActiveId(id);
    } else {
      setActiveId(null);
    }
  };

  const handleTouchEnd = () => setActiveId(null);

  if (movies.length === 0) return null;

  return (
    <div className="relative w-full my-8 select-none">
      {/* 1. Structure de l'étagère (Le décor) */}
      <div className="absolute inset-0 bg-[#0a0a0a] border-[12px] border-[#151515] rounded-xl shadow-2xl overflow-hidden pointer-events-none">
        {/* Fond texturé */}
        <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />
        {/* Ombre portée du haut */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/90 to-transparent z-10" />
      </div>

      {/* 2. Conteneur des items (La scène 3D) */}
      <div
        className="relative z-20 flex flex-wrap items-end content-start p-6 sm:p-10 gap-[2px] min-h-[450px] touch-none perspective-[1200px]"
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {movies.map((pm, index) => {
          const details = movieDetailsMap[pm.tmdb_id];
          const title = details?.title || "Titre inconnu";
          const poster = details?.poster_path ? getImageUrl(details.poster_path, "w500") : null;

          // Paramètres aléatoires pour le réalisme (calculés une fois basés sur l'ID)
          const randomHeight = (pm.tmdb_id % 3) * 2;
          const randomTilt = ((pm.tmdb_id % 2 === 0 ? 0.5 : -0.5) + (pm.tmdb_id % 10) / 20).toFixed(2);

          const isActive = activeId === pm.id;
          const isSteelbook = pm.format === "steelbook";

          return (
            <Tooltip key={pm.id} open={isActive} delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  data-movie-id={pm.id}
                  onMouseEnter={() => setActiveId(pm.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => onMovieClick(pm, details || null)}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-left", // Bouncing effect
                    SPINE_WIDTHS[pm.format],
                    "h-48 sm:h-64",
                    // Profondeur :
                    "transform-style-3d", // Essentiel pour la 3D
                    isActive ? "z-50" : "z-10",
                  )}
                  style={{
                    height: `${16 + (pm.format === "dvd" ? 0.8 : 0)}rem`,
                    transform: isActive
                      ? `translateZ(60px) rotateY(-35deg) translateX(10px)` // L'effet "Sortie"
                      : `rotate(${randomTilt}deg) translateY(${randomHeight}px) translateZ(0px)`,
                    marginBottom: isActive ? "10px" : "0px",
                  }}
                >
                  {/* === FACE 1 : LA TRANCHE (SPINE) === */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-[2px] overflow-hidden backface-hidden",
                      "border-l border-white/10 shadow-[-1px_0_2px_rgba(0,0,0,0.5)]", // Ombre de contact
                    )}
                  >
                    {/* Fond coloré (Affiche floutée) */}
                    <div
                      className={cn(
                        "absolute inset-0 bg-cover bg-center transition-all duration-500",
                        isActive ? "brightness-125 saturate-150 blur-[0.5px]" : "blur-[2px] brightness-75 opacity-60",
                      )}
                      style={{
                        backgroundImage: poster ? `url(${poster})` : undefined,
                        backgroundColor: "#2a2a2a",
                      }}
                    />

                    {/* Matériau & Reflet Plastique */}
                    <div
                      className={cn(
                        "absolute inset-0 z-10 pointer-events-none bg-gradient-to-r",
                        isSteelbook
                          ? "from-transparent via-white/30 to-transparent bg-[length:200%_100%] bg-right group-hover:bg-left transition-[background-position] duration-700 ease-in-out mix-blend-overlay"
                          : "from-white/30 via-white/5 to-black/80",
                      )}
                    />

                    {/* Contenu de la tranche */}
                    <div className="relative z-20 w-full h-full flex flex-col py-3">
                      <div className="flex-shrink-0 flex justify-center w-full px-1">
                        <FormatLogo format={pm.format} />
                      </div>

                      {/* Titre (Centrage Absolu) */}
                      <div className="flex-grow relative w-full overflow-hidden">
                        <h3
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans font-bold text-white text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-center whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                          style={{
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            maxWidth: "90%",
                            textShadow: "0 0 10px rgba(0,0,0,0.5)",
                          }}
                        >
                          {title}
                        </h3>
                      </div>

                      <div className="flex-shrink-0 w-full flex flex-col items-center gap-2 opacity-80 pb-1">
                        {pm.condition === "mint" && (
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)] animate-pulse" />
                        )}
                        <div className="w-5 h-3 border border-white/30 rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* === FACE 2 : LA COUVERTURE (SIDE) - L'EFFET WAOUH === */}
                  <div
                    className="absolute top-0 left-full h-full w-[160px] origin-left bg-[#111] border-y border-r border-white/5 brightness-90 backface-hidden"
                    style={{
                      transform: "rotateY(90deg)", // Pliée à 90°
                    }}
                  >
                    {/* Image de la couverture */}
                    {poster && (
                      <img
                        src={poster}
                        alt=""
                        className="w-full h-full object-cover opacity-90"
                        style={{ transform: "scaleX(-1)" }} // Miroir car vu de "derrière" le pli
                      />
                    )}

                    {/* Ombre de profondeur sur la couverture */}
                    <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-transparent to-black/20 pointer-events-none" />

                    {/* Reflet brillant sur le bord */}
                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                  </div>
                </div>
              </TooltipTrigger>

              {/* Tooltip d'information (Désactivé visuellement pour laisser la place à la 3D, mais présent pour l'accessibilité ou les infos supp) */}
              {/* Pour cette version "Full 3D", le tooltip est redondant visuellement mais utile pour le prix/info */}
              <TooltipContent
                side="bottom"
                className="bg-black/90 border-white/10 text-white backdrop-blur-xl"
                sideOffset={10}
              >
                <p className="font-bold">{title}</p>
                <p className="text-xs text-gray-400">
                  {formatLabels[pm.format]} • {new Date(details?.release_date || "").getFullYear()}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Espaces vides de remplissage */}
        {Array.from({ length: Math.max(0, 8 - movies.length) }).map((_, i) => (
          <div
            key={`filler-${i}`}
            className="w-2 h-60 bg-gradient-to-b from-white/5 to-transparent mx-1 rounded-[2px] opacity-10"
          />
        ))}
      </div>

      {/* Base de l'étagère */}
      <div className="absolute bottom-0 w-full h-8 bg-[#1a1a1a] border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,1)] z-30" />
    </div>
  );
};
