import { Movie } from "@/services/tmdb";
import { MovieCard, MovieCardSkeleton } from "./MovieCard";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * MovieSection - Section de films avec scroll horizontal premium
 *
 * Features:
 * - Header avec label + titre + lien
 * - Scroll horizontal avec fade edges
 * - Boutons de navigation au hover
 * - Animation stagger sur les cards
 * - Padding suffisant pour les hover effects
 */

interface MovieSectionProps {
  title: string;
  subtitle?: string;
  label?: string;
  movies: Movie[];
  loading?: boolean;
  seeMoreLink?: string;
  cardSize?: "sm" | "md" | "lg";
  showQuickActions?: boolean;
}

export const MovieSection: React.FC<MovieSectionProps> = ({
  title,
  subtitle,
  label = "À découvrir",
  movies,
  loading = false,
  seeMoreLink,
  cardSize = "md",
  showQuickActions = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScroll);
      return () => scrollEl.removeEventListener("scroll", checkScroll);
    }
  }, [movies]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section
      className="mb-8 sm:mb-10 w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header */}
      <div className="flex items-end justify-between px-4 sm:px-6 mb-4 sm:mb-5">
        <div>
          <p className="section-label mb-1">{label}</p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        {seeMoreLink && (
          <Link
            to={seeMoreLink}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full",
              "text-sm font-medium",
              "glass hover:bg-primary/10 hover:text-primary",
              "transition-all duration-300",
            )}
          >
            Voir tout
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Scroll Container */}
      <div className="relative group">
        {/* Left fade + button */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-16 z-10",
            "bg-gradient-to-r from-background to-transparent",
            "pointer-events-none transition-opacity duration-300",
            canScrollLeft ? "opacity-100" : "opacity-0",
          )}
        />
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-20",
              "w-10 h-10 rounded-full glass",
              "flex items-center justify-center",
              "text-foreground hover:bg-primary/10 hover:text-primary",
              "transition-all duration-300",
              "opacity-0 group-hover:opacity-100",
              "shadow-lg",
            )}
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right fade + button */}
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 w-16 z-10",
            "bg-gradient-to-l from-background to-transparent",
            "pointer-events-none transition-opacity duration-300",
            canScrollRight ? "opacity-100" : "opacity-0",
          )}
        />
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-20",
              "w-10 h-10 rounded-full glass",
              "flex items-center justify-center",
              "text-foreground hover:bg-primary/10 hover:text-primary",
              "transition-all duration-300",
              "opacity-0 group-hover:opacity-100",
              "shadow-lg",
            )}
            aria-label="Défiler vers la droite"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Movies scroll - FIXED: Added pt-2 and pb-6 for hover effects space */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto px-4 sm:px-6 pt-2 pb-6 scrollbar-hide scroll-smooth"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <MovieCardSkeleton key={i} size={cardSize} />)
            : movies.slice(0, 20).map((movie, index) => (
                <div
                  key={movie.id}
                  className="animate-fade-in-up opacity-0"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <MovieCard movie={movie} size={cardSize} showInfo showQuickActions={showQuickActions} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
};

/**
 * MovieSectionSkeleton - Placeholder pour la section
 */
export const MovieSectionSkeleton: React.FC<{ cardSize?: "sm" | "md" | "lg" }> = ({ cardSize = "md" }) => (
  <section className="mb-8 sm:mb-10 w-full">
    <div className="px-4 sm:px-6 mb-4 sm:mb-5">
      <div className="h-3 w-20 rounded animate-shimmer mb-2" />
      <div className="h-8 w-48 rounded animate-shimmer" />
    </div>
    <div className="flex gap-4 sm:gap-5 overflow-hidden px-4 sm:px-6 pt-2 pb-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <MovieCardSkeleton key={i} size={cardSize} />
      ))}
    </div>
  </section>
);

export default MovieSection;
