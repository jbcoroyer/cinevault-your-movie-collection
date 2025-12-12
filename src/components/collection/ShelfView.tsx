import React, { useState, useRef, useCallback } from "react";
import { PhysicalMovie, PhysicalFormat, formatLabels } from "../../services/physicalMovies";
import { MovieDetails, getImageUrl } from "../../services/tmdb";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Disc } from "lucide-react";

interface ShelfViewProps {
  movies: PhysicalMovie[];
  movieDetailsMap: Record<number, MovieDetails>;
  onMovieClick: (physicalMovie: PhysicalMovie, movieDetails: MovieDetails | null) => void;
  variant?: "default" | "light";
}

// Configuration des dimensions
const SPINE_WIDTHS: Record<PhysicalFormat, string> = {
  dvd: "w-9 sm:w-11",
  bluray: "w-8 sm:w-9",
  "4k": "w-8 sm:w-9",
  steelbook: "w-8 sm:w-10",
  collector: "w-12 sm:w-16",
};

// Logos de format "gravés" avec effet de profondeur
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

export const ShelfView: React.FC<ShelfViewProps> = ({ movies, movieDetailsMap, onMovieClick, variant = "default" }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLight = variant === "light";

  // --- SOLUTION LONG PRESS ---
  // Le scroll fonctionne normalement. L'effet hover ne s'active qu'après 400ms d'appui maintenu.
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressActiveRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const LONG_PRESS_DELAY = 400; // ms
  const MOVE_THRESHOLD = 10; // pixels - si on bouge plus que ça, on annule le long press

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    longPressActiveRef.current = false;

    // Trouver l'élément sous le doigt
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const spine = target?.closest("[data-movie-id]");
    const movieId = spine?.getAttribute("data-movie-id") || null;

    // Démarrer le timer pour le long press
    longPressTimerRef.current = setTimeout(() => {
      longPressActiveRef.current = true;
      if (movieId) {
        setActiveId(movieId);
        // Vibration haptique si disponible (feedback utilisateur)
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, LONG_PRESS_DELAY);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];

      // Si on a bougé significativement, annuler le long press (c'est un scroll)
      if (touchStartPosRef.current) {
        const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);

        if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
          // C'est un scroll, annuler le long press
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
          longPressActiveRef.current = false;
          setActiveId(null);
          return;
        }
      }

      // Si le long press est actif, suivre le doigt pour changer de film
      if (longPressActiveRef.current) {
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const spine = target?.closest("[data-movie-id]");

        if (spine) {
          const id = spine.getAttribute("data-movie-id");
          if (id !== activeId) setActiveId(id);
        } else {
          setActiveId(null);
        }
      }
    },
    [activeId],
  );

  const handleTouchEnd = useCallback(() => {
    // Nettoyer le timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressActiveRef.current = false;
    touchStartPosRef.current = null;
    setActiveId(null);
  }, []);

  if (movies.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full bg-[#0a0a0a] rounded-xl overflow-hidden relative perspective-[2000px]",
        isLight
          ? "border-[4px] border-[#151515] max-h-[290px] md:max-h-none h-auto"
          : "border-[12px] border-[#151515] shadow-[0_0_50px_rgba(0,0,0,0.8)] min-h-[450px]",
        // touch-pan-y permet le scroll vertical natif par défaut
        "touch-pan-y",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Fond texturé bois très sombre */}
      <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

      {/* Ombre portée du haut de l'étagère */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none opacity-80"></div>

      <div
        className={cn(
          "relative z-10 flex flex-wrap items-end content-start gap-[1px] sm:gap-[2px]",
          isLight ? "p-4 sm:p-6" : "p-6 sm:p-10 min-h-[450px]",
        )}
      >
        {movies.map((pm, index) => {
          const details = movieDetailsMap[pm.tmdb_id];
          const title = details?.title || "Titre inconnu";
          const poster = details?.poster_path ? getImageUrl(details.poster_path, "w500") : null;

          // Variation subtile de hauteur pour casser la monotonie
          const randomHeight = (index % 3) * 1.5;

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
                    // Base de la tranche - GPU accelerated
                    "relative group cursor-pointer origin-bottom",
                    "transition-transform duration-150 ease-out",
                    SPINE_WIDTHS[pm.format],
                    "h-48 sm:h-64 rounded-[2px] overflow-hidden",
                    // Bordures subtiles pour définir l'objet
                    "border-l border-white/5 border-r border-black/50",
                    // Effet de profondeur au repos
                    "shadow-[inset_2px_0_5px_rgba(255,255,255,0.05),inset_-2px_0_10px_rgba(0,0,0,0.8)]",
                    // État actif
                    isActive && "z-50",
                  )}
                  style={{
                    height: `${16 + (pm.format === "dvd" ? 0.8 : 0)}rem`,
                    transform: isActive 
                      ? `translateY(${randomHeight - 16}px) scale(1.08) translateZ(0)` 
                      : `translateY(${randomHeight}px) scale(1) translateZ(0)`,
                    willChange: 'transform',
                  }}
                >
                  {/* === COUCHE 1 : FOND VISUEL (Affiche) - No blur transitions === */}
                  <div
                    className={cn(
                      "absolute inset-0 z-0 bg-cover bg-center saturate-[0.8]",
                      isActive ? "opacity-50" : "opacity-30",
                    )}
                    style={{
                      backgroundImage: poster ? `url(${poster})` : undefined,
                      backgroundColor: "#2a2a2a",
                      filter: isActive ? 'blur(0.5px)' : 'blur(2px)',
                    }}
                  />

                  {/* === COUCHE 2 : VOLUME & LUMIÈRE (Le Relief 2D) === */}
                  {/* Reflet spéculaire (plastique) - Simplified for performance */}
                  <div
                    className={cn(
                      "absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-white/20 via-transparent to-black/60 opacity-80",
                    )}
                  />

                  {/* Arête brillante gauche (Rim Light) */}
                  <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/30 z-20 pointer-events-none mix-blend-overlay"></div>

                  {/* Ombre interne pour l'effet "jaquette sous plastique" */}
                  <div className="absolute inset-0 z-10 shadow-[inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.5)] pointer-events-none"></div>

                  {/* === COUCHE 3 : CONTENU TEXTUEL === */}
                  <div className="relative z-30 w-full h-full flex flex-col py-4 pointer-events-none">
                    {/* Haut : Logo */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-full px-1 drop-shadow-md">
                      <FormatLogo format={pm.format} />
                    </div>

                    {/* Centre : Titre parfaitement centré */}
                    <div className="flex-grow relative w-full overflow-hidden">
                      <h3
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans font-bold text-[#e8e8e8] text-xs sm:text-[13px] uppercase tracking-[0.1em] text-center whitespace-nowrap"
                        style={{
                          writingMode: "vertical-rl",
                          textOrientation: "mixed",
                          maxWidth: "85%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                        }}
                      >
                        {title}
                      </h3>
                    </div>

                    {/* Bas : Indicateurs */}
                    <div className="flex-shrink-0 w-full flex flex-col items-center justify-end gap-2 opacity-80 pb-1">
                      {pm.condition === "mint" && (
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]"
                          title="État Neuf"
                        />
                      )}
                      <div className="w-6 h-4 border-[1.5px] border-white/20 rounded-[2px] flex items-center justify-center bg-black/40 shadow-sm">
                        <div className="w-3 h-[1.5px] bg-white/40"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>

              {/* Preview Poster au survol */}
              <TooltipContent
                side="right"
                sideOffset={30}
                className="p-0 border-none shadow-2xl pointer-events-none overflow-visible bg-zinc-900 rounded-lg"
              >
                <div className="relative w-56 sm:w-64 rounded-lg overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] border border-zinc-700 animate-in fade-in slide-in-from-left-4 duration-300 ease-out">
                  {poster ? (
                    <img src={poster} alt={title} className="w-full h-auto object-cover aspect-[2/3]" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-zinc-800 flex items-center justify-center text-zinc-500">
                      <Disc className="w-16 h-16 opacity-40" />
                    </div>
                  )}

                  {/* Badge format */}
                  <div
                    className={cn(
                      "absolute top-3 right-3 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white border shadow-lg",
                      isSteelbook ? "bg-slate-700 border-slate-500" : "bg-zinc-800 border-zinc-600",
                    )}
                  >
                    {formatLabels[pm.format]}
                  </div>

                  {/* Infos en bas */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/95 to-black/80 p-5 pt-20 text-left">
                    <h4 className="text-white font-sans font-bold text-xl leading-tight line-clamp-2 drop-shadow-sm">
                      {title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-white/70 text-xs font-medium">
                        {details?.release_date ? new Date(details.release_date).getFullYear() : "N/A"}
                      </span>
                      {pm.price && (
                        <span className="text-primary font-bold text-sm bg-primary/20 px-2 py-0.5 rounded-sm">
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

        {/* Espaces vides */}
        {Array.from({ length: Math.max(0, 6 - movies.length) }).map((_, i) => (
          <div
            key={`filler-${i}`}
            className="w-2 h-60 bg-gradient-to-b from-white/5 to-transparent mx-1 rounded-[2px] opacity-10"
          />
        ))}
      </div>

      {/* Base de l'étagère */}
      <div className="h-12 w-full bg-[#111] border-t-[4px] border-[#1a1a1a] relative z-30 shadow-[0_-15px_40px_rgba(0,0,0,1)]">
        <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
        <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10"></div>
      </div>
    </div>
  );
};
