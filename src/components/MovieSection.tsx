import { Movie } from "@/services/tmdb";
import { MovieCard, MovieCardSkeleton } from "./MovieCard";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

/**
 * MovieSection — Section de films avec scroll horizontal premium
 *
 * @description Section avec en-tête stylisé, contrôles de navigation
 * et animations stagger sur les cartes.
 */

interface MovieSectionProps {
  title: string;
  subtitle?: string;
  label?: string;
  movies: Movie[];
  loading?: boolean;
  seeMoreLink?: string;
  /** Affiche les rangs sur les cartes */
  showRanks?: boolean;
  /** Taille des cartes */
  cardSize?: "sm" | "md" | "lg";
}

export const MovieSection: React.FC<MovieSectionProps> = ({
  title,
  subtitle,
  label = "À découvrir",
  movies,
  loading = false,
  seeMoreLink,
  showRanks = false,
  cardSize = "md",
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", updateScrollButtons, { passive: true });
      return () => container.removeEventListener("scroll", updateScrollButtons);
    }
  }, [movies]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="relative mb-10 sm:mb-14 w-full overflow-hidden group/section">
      {/* Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 mb-5 sm:mb-6">
        <div className="space-y-1">
          {/* Label */}
          <span className="section-label">{label}</span>

          {/* Title */}
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>

          {/* Subtitle */}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        {/* See More Link */}
        {seeMoreLink && (
          <Link
            to={seeMoreLink}
            className={cn(
              "flex items-center gap-1.5",
              "text-sm font-medium text-primary",
              "transition-all duration-300",
              "hover:gap-2.5",
              "group/link",
            )}
          >
            <span>Voir tout</span>
            <ArrowRight
              className={cn("w-4 h-4", "transition-transform duration-300", "group-hover/link:translate-x-1")}
            />
          </Link>
        )}
      </div>

      {/* Scroll Container */}
      <div className="relative">
        {/* Navigation Buttons - Desktop only */}
        {!loading && movies.length > 4 && (
          <>
            {/* Left Button */}
            <button
              onClick={() => scroll("left")}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-20",
                "hidden sm:flex items-center justify-center",
                "w-10 h-10 rounded-full",
                "bg-card/90 backdrop-blur-md",
                "border border-white/10",
                "shadow-[0_4px_20px_rgba(0,0,0,0.1)]",
                "transition-all duration-300",
                canScrollLeft
                  ? "opacity-0 group-hover/section:opacity-100 hover:bg-primary hover:text-primary-foreground hover:scale-110"
                  : "opacity-0 pointer-events-none",
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Button */}
            <button
              onClick={() => scroll("right")}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-20",
                "hidden sm:flex items-center justify-center",
                "w-10 h-10 rounded-full",
                "bg-card/90 backdrop-blur-md",
                "border border-white/10",
                "shadow-[0_4px_20px_rgba(0,0,0,0.1)]",
                "transition-all duration-300",
                canScrollRight
                  ? "opacity-0 group-hover/section:opacity-100 hover:bg-primary hover:text-primary-foreground hover:scale-110"
                  : "opacity-0 pointer-events-none",
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Fade Edges */}
        <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-4 sm:w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Movies Scroll */}
        <div
          ref={scrollContainerRef}
          className={cn(
            "flex gap-3 sm:gap-4 overflow-x-auto",
            "px-4 sm:px-6 pb-4",
            "scrollbar-hide scroll-smooth",
            "snap-x snap-mandatory",
          )}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <MovieCardSkeleton key={i} size={cardSize} />)
            : movies.slice(0, 20).map((movie, index) => (
                <div key={movie.id} className="snap-start">
                  <MovieCard
                    movie={movie}
                    size={cardSize}
                    showInfo
                    rank={showRanks ? index + 1 : undefined}
                    delay={index * 50}
                  />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

/* --- Compact Section Variant --- */

interface CompactMovieSectionProps {
  title: string;
  movies: Movie[];
  loading?: boolean;
}

export const CompactMovieSection: React.FC<CompactMovieSectionProps> = ({ title, movies, loading = false }) => {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold mb-3 px-4">{title}</h3>
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} size="sm" />)
          : movies
              .slice(0, 10)
              .map((movie, index) => <MovieCard key={movie.id} movie={movie} size="sm" delay={index * 30} />)}
      </div>
    </section>
  );
};
