import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Library } from "lucide-react";

interface PreviewShelfProps {
  movies: Movie[];
  onMovieClick?: (movie: Movie) => void;
}

// Formats simulés pour la prévisualisation
const PREVIEW_FORMATS = ["bluray", "4k", "dvd", "steelbook", "collector"] as const;
type PreviewFormat = (typeof PREVIEW_FORMATS)[number];

const SPINE_WIDTHS: Record<PreviewFormat, string> = {
  dvd: "w-9 sm:w-11",
  bluray: "w-8 sm:w-9",
  "4k": "w-8 sm:w-9",
  steelbook: "w-8 sm:w-10",
  collector: "w-12 sm:w-16",
};

const FORMAT_LABELS: Record<PreviewFormat, string> = {
  dvd: "DVD",
  bluray: "Blu-ray",
  "4k": "4K UHD",
  steelbook: "Steelbook",
  collector: "Collector",
};

// Logo de format pour la tranche
const FormatLogo = ({ format }: { format: PreviewFormat }) => {
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
        Steel
      </div>
    );
  if (format === "collector")
    return (
      <div className="mb-3 opacity-70 tracking-[0.15em] text-[5px] font-bold uppercase text-amber-400/80 border-b border-amber-500/20 pb-0.5">
        Collector
      </div>
    );
  return <div className="h-[2px] w-6 bg-white/20 mb-3 rounded-full mx-auto opacity-50" />;
};

// Composant de prévisualisation étagère
const PreviewShelf: React.FC<PreviewShelfProps> = ({ movies, onMovieClick }) => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Assigner des formats aléatoires mais cohérents aux films
  const getFormat = (index: number): PreviewFormat => {
    const distribution = ["bluray", "bluray", "bluray", "4k", "4k", "dvd", "dvd", "steelbook", "collector", "bluray"];
    return distribution[index % distribution.length] as PreviewFormat;
  };

  // --- DÉTECTION INTELLIGENTE DU GESTE ---
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  const hoverEnabledRef = useRef<boolean>(false);

  // Seuils de détection
  const SCROLL_THRESHOLD = 10;
  const HORIZONTAL_RATIO = 1.5;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    isScrollingRef.current = false;
    hoverEnabledRef.current = false;
    setActiveId(null);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Si on a déjà détecté un scroll, ne rien faire
      if (isScrollingRef.current) {
        setActiveId(null);
        return;
      }

      // Mouvement vertical significatif → c'est un scroll
      if (deltaY > SCROLL_THRESHOLD) {
        isScrollingRef.current = true;
        hoverEnabledRef.current = false;
        setActiveId(null);
        return;
      }

      // Mouvement horizontal dominant ou stationnaire → activer l'effet hover
      if (deltaX > deltaY * HORIZONTAL_RATIO || (deltaX < 5 && deltaY < 5)) {
        hoverEnabledRef.current = true;

        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const spine = target?.closest("[data-movie-id]");

        if (spine) {
          const id = spine.getAttribute("data-movie-id");
          if (id && Number(id) !== activeId) setActiveId(Number(id));
        } else {
          setActiveId(null);
        }
      }
    },
    [activeId],
  );

  const handleTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    isScrollingRef.current = false;
    hoverEnabledRef.current = false;
    setActiveId(null);
  }, []);

  if (movies.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full bg-[#0a0a0a] rounded-xl overflow-hidden relative perspective-[2000px]",
        "border-[6px] border-[#151515] shadow-[0_0_50px_rgba(0,0,0,0.8)]",
        "min-h-[380px] md:min-h-[450px]",
        // touch-pan-y permet le scroll vertical natif
        "touch-pan-y",
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fond texturé bois très sombre */}
      <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

      {/* Ombre portée du haut de l'étagère */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none opacity-80"></div>

      <div className="relative z-10 flex flex-wrap items-end content-start gap-[1px] sm:gap-[2px] p-6 sm:p-8 min-h-[380px] md:min-h-[450px]">
        {movies.map((movie, index) => {
          const format = getFormat(index);
          const poster = movie.poster_path ? getImageUrl(movie.poster_path, "w500") : null;
          const randomHeight = (index % 3) * 1.5;
          const isActive = activeId === movie.id;
          const isSteelbook = format === "steelbook";

          return (
            <Tooltip key={movie.id} open={isActive} delayDuration={0}>
              <TooltipTrigger asChild>
                <div
                  data-movie-id={movie.id}
                  onMouseEnter={() => setActiveId(movie.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onClick={() => onMovieClick?.(movie)}
                  className={cn(
                    "relative group cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] origin-bottom",
                    SPINE_WIDTHS[format],
                    "h-48 sm:h-64 rounded-[2px] overflow-hidden",
                    "border-l border-white/5 border-r border-black/50",
                    "shadow-[inset_2px_0_5px_rgba(255,255,255,0.05),inset_-2px_0_10px_rgba(0,0,0,0.8)]",
                    isActive
                      ? [
                          "z-50 scale-110 -translate-y-4 brightness-110",
                          "shadow-[4px_0_0_#080808,8px_20px_30px_rgba(0,0,0,0.8)]",
                        ]
                      : [
                          "hover:z-50 hover:scale-110 hover:-translate-y-4 hover:brightness-110",
                          "hover:shadow-[4px_0_0_#080808,8px_20px_30px_rgba(0,0,0,0.8)]",
                        ],
                  )}
                  style={{
                    height: `${16 + (format === "dvd" ? 0.8 : 0)}rem`,
                    transform: `translateY(${randomHeight}px) ${isActive ? "scale(1.1) translateY(-24px)" : ""}`,
                    marginBottom: isActive ? "12px" : "0px",
                  }}
                >
                  {/* Fond visuel */}
                  <div
                    className={cn(
                      "absolute inset-0 z-0 bg-cover bg-center transition-all duration-500 saturate-[0.8]",
                      isActive
                        ? "blur-[0.5px] opacity-50"
                        : "blur-[2px] opacity-30 group-hover:blur-[0.5px] group-hover:opacity-50",
                    )}
                    style={{
                      backgroundImage: poster ? `url(${poster})` : undefined,
                      backgroundColor: "#2a2a2a",
                    }}
                  />

                  {/* Reflet spéculaire */}
                  <div
                    className={cn(
                      "absolute inset-0 z-10 pointer-events-none bg-gradient-to-r",
                      isSteelbook
                        ? "from-transparent via-white/30 to-transparent bg-[length:200%_100%] bg-left group-hover:bg-right transition-[background-position] duration-700 ease-in-out mix-blend-overlay opacity-70"
                        : "from-white/20 via-transparent to-black/60 opacity-80",
                    )}
                  />

                  {/* Arête brillante */}
                  <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/30 z-20 pointer-events-none mix-blend-overlay"></div>

                  {/* Ombre interne */}
                  <div className="absolute inset-0 z-10 shadow-[inset_0_2px_5px_rgba(255,255,255,0.1),inset_0_-2px_5px_rgba(0,0,0,0.5)] pointer-events-none"></div>

                  {/* Contenu */}
                  <div className="relative z-30 w-full h-full flex flex-col py-4 pointer-events-none">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-full px-1 drop-shadow-md">
                      <FormatLogo format={format} />
                    </div>

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
                        {movie.title}
                      </h3>
                    </div>

                    <div className="flex-shrink-0 w-full flex flex-col items-center justify-end gap-2 opacity-80 pb-1">
                      {movie.vote_average >= 8 && (
                        <div
                          className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]"
                          title="Note élevée"
                        />
                      )}
                      <div className="w-6 h-4 border-[1.5px] border-white/20 rounded-[2px] flex items-center justify-center bg-black/40 shadow-sm">
                        <div className="w-3 h-[1.5px] bg-white/40"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TooltipTrigger>

              {/* Tooltip avec affiche */}
              <TooltipContent
                side="right"
                sideOffset={30}
                className="p-0 border-none shadow-2xl pointer-events-none overflow-visible bg-zinc-900 rounded-lg"
              >
                <div className="relative w-56 sm:w-64 rounded-lg overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] border border-zinc-700 animate-in fade-in slide-in-from-left-4 duration-300 ease-out">
                  {poster ? (
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img src={poster} alt={movie.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-[2/3] bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                      <Library className="w-12 h-12 text-neutral-600" />
                    </div>
                  )}

                  {/* Badge format */}
                  <div
                    className={cn(
                      "absolute top-3 right-3 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide",
                      "border backdrop-blur-sm",
                      format === "4k" && "bg-black/60 text-white border-white/20",
                      format === "bluray" && "bg-blue-500/30 text-blue-300 border-blue-400/30",
                      format === "steelbook" && "bg-slate-500/30 text-slate-200 border-slate-400/30",
                      format === "collector" && "bg-amber-500/30 text-amber-300 border-amber-400/30",
                      format === "dvd" && "bg-zinc-700/50 text-zinc-300 border-zinc-500/30",
                    )}
                  >
                    {FORMAT_LABELS[format]}
                  </div>

                  {/* Infos en bas */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/95 to-black/80 p-4 pt-16 text-left">
                    <h4 className="text-white font-sans font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-white/70 text-xs font-medium">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}
                      </span>
                      {movie.vote_average > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {movie.vote_average.toFixed(1)}
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
        {Array.from({ length: Math.max(0, 6 - (movies.length % 10)) }).map((_, i) => (
          <div
            key={`filler-${i}`}
            className="w-2 h-60 bg-gradient-to-b from-white/5 to-transparent mx-1 rounded-[2px] opacity-10"
          />
        ))}
      </div>

      {/* Base de l'étagère */}
      <div className="h-10 w-full bg-[#111] border-t-[4px] border-[#1a1a1a] relative z-30 shadow-[0_-15px_40px_rgba(0,0,0,1)]">
        <div className="w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-overlay"></div>
        <div className="absolute top-0 inset-x-0 h-[1px] bg-white/10"></div>
      </div>
    </div>
  );
};

// Composant principal de prévisualisation de collection
interface CollectionPreviewProps {
  className?: string;
}

export const CollectionPreview: React.FC<CollectionPreviewProps> = ({ className }) => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopRatedMovies = async () => {
      try {
        setLoading(true);

        // Récupérer 2 pages (40 films)
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "2218a5f1d1ccce0122e4be6c67cc7a90";
        const BASE_URL = "https://api.themoviedb.org/3";

        const pages = await Promise.all([
          fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR&page=1`).then((r) => r.json()),
          fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR&page=2`).then((r) => r.json()),
        ]);

        const allMovies = pages.flatMap((page) => page.results as Movie[]);
        setMovies(allMovies.slice(0, 40));
      } catch (err) {
        console.error("Error fetching top rated movies:", err);
        setError("Impossible de charger les films");
      } finally {
        setLoading(false);
      }
    };

    fetchTopRatedMovies();
  }, []);

  const handleMovieClick = (movie: Movie) => {
    navigate(`/movie/${movie.id}`);
  };

  if (error) return null;

  return (
    <section className={cn("py-12 md:py-16", className)}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="w-full h-[380px] md:h-[450px] bg-[#0a0a0a] rounded-xl border-[6px] border-[#151515] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
                <span className="text-sm text-muted-foreground">Chargement de la collection...</span>
              </div>
            </div>
          ) : (
            <PreviewShelf movies={movies} onMovieClick={handleMovieClick} />
          )}
        </div>
      </div>
    </section>
  );
};

export default CollectionPreview;
