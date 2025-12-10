import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Movie, MovieDetails, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Play, Sparkles, Library, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    // Distribution réaliste des formats
    const distribution = [
      "bluray", "bluray", "bluray", // 30%
      "4k", "4k", // 20%
      "dvd", "dvd", // 20%
      "steelbook", // 10%
      "collector", // 10%
      "bluray" // 10%
    ];
    return distribution[index % distribution.length] as PreviewFormat;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const spine = target?.closest("[data-movie-id]");

    if (spine) {
      const id = spine.getAttribute("data-movie-id");
      if (id && Number(id) !== activeId) setActiveId(Number(id));
    } else {
      setActiveId(null);
    }
  };

  const handleTouchEnd = () => setActiveId(null);

  if (movies.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full bg-[#0a0a0a] rounded-xl overflow-hidden relative perspective-[2000px]",
        "border-[6px] border-[#151515] shadow-[0_0_50px_rgba(0,0,0,0.8)] touch-none",
        "min-h-[380px] md:min-h-[450px]"
      )}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Fond texturé bois très sombre */}
      <div className="absolute inset-0 opacity-15 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none z-0" />

      {/* Ombre portée du haut de l'étagère */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none opacity-80"></div>

      {/* Badge "Top 50" */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm">
        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span className="text-xs font-semibold text-amber-400">Top 50 TMDB</span>
      </div>

      <div className="relative z-10 flex flex-wrap items-end content-start gap-[1px] sm:gap-[2px] p-6 sm:p-8 min-h-[380px] md:min-h-[450px]">
        {movies.map((movie, index) => {
          const format = getFormat(index);
          const poster = movie.poster_path ? getImageUrl(movie.poster_path, "w500") : null;
          const randomHeight = (index % 3) * 1.5;
          const isActive = activeId === movie.id;
          const isSteelbook = format === "steelbook";
          const isCollector = format === "collector";

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
                      ? "scale-105 -translate-y-2 z-20 shadow-[0_10px_40px_rgba(0,0,0,0.9),inset_2px_0_8px_rgba(255,255,255,0.1)]"
                      : "hover:scale-[1.02] hover:-translate-y-1"
                  )}
                  style={{ height: `calc(12rem + ${randomHeight}px)` }}
                >
                  {/* Fond dégradé de la tranche */}
                  <div
                    className={cn(
                      "absolute inset-0 z-0",
                      isSteelbook
                        ? "bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600"
                        : isCollector
                        ? "bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900"
                        : format === "4k"
                        ? "bg-gradient-to-b from-neutral-800 via-neutral-900 to-black"
                        : format === "bluray"
                        ? "bg-gradient-to-b from-blue-900 via-blue-950 to-slate-900"
                        : "bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900"
                    )}
                  />

                  {/* Effet de lumière sur le bord gauche */}
                  <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-white/30 via-white/10 to-transparent z-10" />

                  {/* Contenu de la tranche */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-end py-3 px-1">
                    <FormatLogo format={format} />
                    <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                      <span
                        className={cn(
                          "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider",
                          "writing-vertical whitespace-nowrap overflow-hidden text-ellipsis max-h-[80%]",
                          "text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                        )}
                        style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
                      >
                        {movie.title}
                      </span>
                    </div>
                  </div>

                  {/* Effet de reflet steelbook */}
                  {isSteelbook && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5 pointer-events-none z-10 opacity-50" />
                  )}
                </div>
              </TooltipTrigger>

              {/* Tooltip au survol */}
              <TooltipContent
                side="top"
                align="center"
                sideOffset={8}
                className={cn(
                  "p-0 w-56 overflow-hidden rounded-xl",
                  "bg-black/95 border border-white/10 backdrop-blur-xl",
                  "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]"
                )}
              >
                <div className="relative">
                  {/* Poster ou placeholder */}
                  {poster ? (
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={poster}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
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
                      format === "dvd" && "bg-zinc-700/50 text-zinc-300 border-zinc-500/30"
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

        {/* Espaces vides pour l'effet réaliste */}
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
        
        // Récupérer les 3 premières pages (60 films) pour avoir le top 50
        const API_KEY = import.meta.env.VITE_TMDB_API_KEY || "2218a5f1d1ccce0122e4be6c67cc7a90";
        const BASE_URL = "https://api.themoviedb.org/3";
        
        const pages = await Promise.all([
          fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR&page=1`).then(r => r.json()),
          fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR&page=2`).then(r => r.json()),
          fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=fr-FR&page=3`).then(r => r.json()),
        ]);

        const allMovies = pages.flatMap(page => page.results as Movie[]);
        setMovies(allMovies.slice(0, 50));
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
    <section className={cn("py-16 md:py-24", className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Library className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Vue Étagère Premium
            </span>
          </div>
          
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-4 tracking-tight">
            Visualisez votre collection{" "}
            <span className="text-amber-500">comme jamais</span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Découvrez la vue étagère signature de CineVault. Vos films prennent vie avec cette représentation 
            réaliste qui reproduit l'expérience de votre bibliothèque physique.
          </p>
        </div>

        {/* Shelf Preview */}
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

        {/* CTA sous l'étagère */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 text-sm text-muted-foreground mb-6">
            <Lock className="w-4 h-4" />
            <span>Créez un compte gratuit pour commencer votre propre collection</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white text-base font-semibold px-8 py-6 rounded-full shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2 fill-white" />
              Créer ma collection
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate("/search")}
              className="w-full sm:w-auto text-base px-8 py-6 rounded-full hover:bg-amber-500/5"
            >
              Explorer les films
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { CollectionPreview as LandingHero };
export default CollectionPreview;
