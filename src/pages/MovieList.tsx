import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { FloatingDock } from "@/components/FloatingDock";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { 
  Movie, 
  getNowAvailableMoviesPaginated, 
  getPopularMoviesPaginated 
} from "@/services/tmdb";

type ListType = "now-available" | "popular" | "now-playing";

const listConfig: Record<ListType, { title: string; fetchFn: (page: number) => Promise<{ movies: Movie[]; totalPages: number }> }> = {
  "now-available": {
    title: "🎬 Actuellement à visionner",
    fetchFn: getNowAvailableMoviesPaginated,
  },
  "popular": {
    title: "🔥 Films populaires",
    fetchFn: getPopularMoviesPaginated,
  },
  "now-playing": {
    title: "🎬 À l'affiche",
    fetchFn: getNowAvailableMoviesPaginated,
  },
};

export default function MovieList() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const config = listConfig[category as ListType];

  const fetchMovies = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!config) return;
    
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const { movies: newMovies, totalPages: total } = await config.fetchFn(pageNum);
      
      setMovies(prev => {
        if (append) {
          // Éviter les doublons
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMovies = newMovies.filter(m => !existingIds.has(m.id));
          return [...prev, ...uniqueNewMovies];
        }
        return newMovies;
      });
      setTotalPages(total);
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [config]);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    fetchMovies(1, false);
  }, [category, fetchMovies]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchMovies(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [page, totalPages, loadingMore, fetchMovies]);

  useEffect(() => {
    if (!config) {
      navigate("/");
    }
  }, [config, navigate]);

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">{config.title}</h1>
        </div>
      </header>

      {/* Movie Grid */}
      <main className="p-4">
        {loading ? (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <MovieCardSkeleton key={i} size="sm" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} size="sm" />
              ))}
            </div>
            
            {/* Load more trigger */}
            {page < totalPages && (
              <div ref={loadMoreRef} className="py-8">
                {loadingMore && (
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <MovieCardSkeleton key={`loading-${i}`} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <FloatingDock />
    </div>
  );
}
