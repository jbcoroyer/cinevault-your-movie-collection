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

// --- CONFIGURATION DES MATÉRIAUX ---

// Styles de base de la forme (largeur selon format)
const SPINE_WIDTHS: Record<PhysicalFormat, string> = {
  dvd: "w-9 sm:w-11",
  bluray: "w-8 sm:w-9",
  "4k": "w-8 sm:w-9",
  steelbook: "w-8 sm:w-10",
  collector: "w-12 sm:w-16",
};

// Logos de format repensés pour un look plus "gravé" ou intégré
const FormatLogo = ({ format }: { format: PhysicalFormat }) => {
  // Style commun pour l'effet "gravé" dans le plastique
  const engravedStyle = "opacity-90 drop-shadow-[0_1px_1px_rgba(255,255,255,0.1)] text-white/90";

  if (format === "bluray")
    return (
      // Logo Blu-ray stylisé
      <div className="h-3 w-8 mx-auto mb-3 relative flex items-center justify-center overflow-hidden rounded-t-sm">
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
  // DVD / Collector par défaut
  return <div className="h-[2px] w-6 bg-white/20 mb-3 rounded-full mx-auto opacity-50" />;
};

export const ShelfView: React.FC<ShelfViewProps> = ({ movies, movieDetailsMap, onMovieClick }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- GESTION TACTILE (inchangée) ---
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
    // Conteneur principal de l'étagère : Plus sombre, plus profond
    <div
      ref={containerRef}
      className="w-full bg-[#0a0a0a] border-[12px] border-[#151515] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative touch-none perspective-[2000px]"
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fond texturé bois très sombre + vignette pour la profondeur */}
      <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

      {/* Ombre portée "physique" en haut de l'étagère */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none opacity-80"></div>

      <div className="relative z-10 flex flex-wrap items-end content-start p-6 sm:p-10 gap-[1px] sm:gap-[2px] min-h-[450px]">
        {movies.map((pm, index) => {
          const details = movieDetailsMap[pm.tmdb_id];
          const title = details?.title || "Titre inconnu";
          const poster = details?.poster_path ? getImageUrl(details.poster_path, "w500") : null;

          // Randomisation subtile pour le réalisme
          // On utilise l'index pour que ce soit stable mais varié
          const randomHeight = (index % 3) * 2;
          const randomTilt = ((index % 2 === 0 ? 0.5 : -0.5) + Math.random() * 0.2).toFixed(2);

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
                    // Base de la tranche
                    "relative group cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] origin-bottom",
                    // Largeur selon format
                    SPINE_WIDTHS[pm.format],
                    "h-48 sm:h-64 rounded-[3px] overflow-hidden",
                    // Ombres portées entre les DVD pour la profondeur (très important)
                    "shadow-[-2px_0_5px_rgba(0,0,0,0.5),2px_0_5px_rgba(0,0,0,0.5)] z-0",
                    // État actif (Hover/Touch) : "Sort" de l'étagère vers la lumière
                    isActive
                      ? "z-50 scale-110 -translate-y-6 shadow-[0_20px_40px_rgba(0,0,0,0.8)] brightness-110"
                      : "hover:z-50 hover:scale-110 hover:-translate-y-6 hover:shadow-[0_20px_40px_rgba(0,0,0,0.8)] hover:brightness-110",
                  )}
                  style={{
                    // Hauteur ajustée selon le format (DVD plus grands)
                    height: `${16 + (pm.format === "dvd" ? 0.8 : 0)}rem`,
                    // Inclinaison et décalage vertical aléatoires
                    transform: `rotate(${randomTilt}deg) translateY(${randomHeight}px) ${isActive ? "scale(1.1) translateY(-24px)" : ""}`,
                  }}
                >
                  {/* === COUCHE 1 : FOND VISUEL (Affiche floutée) === */}
                  <div
                    className={cn(
                      "absolute inset-0 z-0 bg-cover bg-center transition-all duration-500 saturate-[0.8]",
                      // Flou artistique : plus net si actif
                      isActive
                        ? "blur-[1px] opacity-40"
                        : "blur-[3px] opacity-30 group-hover:blur-[1px] group-hover:opacity-40",
                    )}
                    style={{
                      backgroundImage: poster ? `url(${poster})` : undefined,
                      backgroundColor: "#2a2a2a",
                    }}
                  />

                  {/* === COUCHE 2 : MATÉRIAU & LUMIÈRE (Le secret du rendu pro) === */}
                  <div
                    className={cn(
                      "absolute inset-0 z-10 pointer-events-none bg-gradient-to-r",
                      isSteelbook
                        ? // Effet Métal Brossé (Steelbook) : Reflet qui bouge au survol
                          "from-transparent via-white/20 to-transparent bg-[length:200%_100%] bg-left group-hover:bg-right transition-all duration-700 ease-in-out opacity-50 mix-blend-overlay"
                        : // Effet Plastique Standard : Reflet net sur l'arête gauche (rim light)
                          "from-white/25 via-white/5 to-black/60",
                    )}
                  />

                  {/* Reflet supplémentaire sur l'arête pour le plastique */}
                  {!isSteelbook && (
                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/40 z-20 pointer-events-none mix-blend-overlay"></div>
                  )}

                  {/* === COUCHE 3 : CONTENU TEXTUEL (Centrage corrigé) === */}
                  <div className="relative z-30 w-full h-full flex flex-col py-4 pointer-events-none">
                    {/* Haut */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-full px-1">
                      <FormatLogo format={pm.format} />
                    </div>

                    {/* Centre : Titre (CORRECTION DU CENTRAGE) */}
                    {/* On retire tout padding latéral sur le conteneur parent pour éviter le décalage */}
                    <div className="flex-grow relative w-full overflow-hidden">
                      {/* Le titre est positionné absolument et centré via translate pour un alignement parfait */}
                      <h3
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans font-bold text-[#e0e0e0] text-xs sm:text-[13px] uppercase tracking-[0.1em] text-center whitespace-nowrap drop-shadow-md"
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          maxWidth: "85%", // Empêche de toucher les bords haut/bas
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {title}
                      </h3>
                    </div>

                    {/* Bas */}
                    <div className="flex-shrink-0 w-full flex flex-col items-center justify-end gap-2 opacity-70 pb-1">
                      {pm.condition === "mint" && (
                        // Indicateur d'état premium
                        <div
                          className="w-2 h-2 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-200 shadow-[0_0_8px_rgba(250,204,21,1)]"
                          title="État Neuf"
                        />
                      )}
                      {/* Faux logo studio stylisé */}
                      <div className="w-6 h-4 border-[1.5px] border-white/20 rounded-[2px] flex items-center justify-center bg-black/30">
                        <div className="w-3 h-[1.5px] bg-white/40"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>

              {/* Preview Poster au survol (Tooltip Premium) */}
              <TooltipContent
                side="right"
                sideOffset={30}
                className="p-0 border-none bg-transparent shadow-none pointer-events-none overflow-visible"
              >
                {/* Effet de "lueur" derrière le poster */}
                <div className="absolute inset-0 bg-black/80 blur-[30px] scale-110 z-[-1] rounded-[20px]"></div>

                <div className="relative w-56 sm:w-64 rounded-[12px] overflow-hidden shadow-[0_30px_70px_-10px_rgba(0,0,0,0.9)] border border-white/10 animate-in fade-in slide-in-from-left-6 duration-300 ease-out">
                  {poster ? (
                    <img src={poster} alt={title} className="w-full h-auto object-cover aspect-[2/3]" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <Disc className="w-16 h-16 opacity-20" />
                    </div>
                  )}

                  {/* Badge de format premium */}
                  <div
                    className={cn(
                      "absolute top-3 right-3 px-2.5 py-1.5 backdrop-blur-md rounded-md text-[10px] font-black uppercase tracking-wider text-white border shadow-lg",
                      isSteelbook ? "bg-slate-700/60 border-slate-400/30" : "bg-black/60 border-white/10",
                    )}
                  >
                    {formatLabels[pm.format]}
                  </div>

                  {/* Informations en bas du poster avec dégradé profond */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-16 text-left">
                    <h4 className="text-white font-sans font-bold text-xl leading-tight line-clamp-2 drop-shadow-sm">
                      {title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-white/60 text-xs">
                        {new Date(details?.release_date || "").getFullYear() || "N/A"}
                      </span>
                      {pm.price && (
                        <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded-full">
                          {pm.price} €
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Espaces vides plus subtils */}
        {Array.from({ length: Math.max(0, 6 - movies.length) }).map((_, i) => (
          <div
            key={`filler-${i}`}
            className="w-2 h-60 bg-gradient-to-b from-white/5 to-transparent mx-1 rounded-[2px] opacity-10"
          />
        ))}
      </div>

      {/* Base de l'étagère plus massive et réaliste */}
      <div className="h-12 w-full bg-[#0f0f0f] border-t-[3px] border-[#1a1a1a] relative z-30 shadow-[0_-15px_30px_rgba(0,0,0,1)]">
        <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
        {/* Reflet subtil sur le bord de l'étagère */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10"></div>
      </div>
    </div>
  );
};
