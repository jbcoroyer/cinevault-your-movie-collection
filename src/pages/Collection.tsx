import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { useUserMovies } from "@/hooks/useUserMovies";
import { getMovieDetails, getImageUrl, Movie } from "@/services/tmdb";
import { Clock, Eye, Heart, ArrowLeft, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CollectionCategory = "watchlist" | "watched" | "favorites" | null;

interface CategoryCard {
  id: CollectionCategory;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  getMovies: () => Movie[];
  getCount: () => number;
}

export default function Collection() {
  const navigate = useNavigate();
  const { userMovies, loading } = useUserMovies();
  const [movies, setMovies] = useState<Record<number, Movie>>({});
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<CollectionCategory>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (userMovies.length === 0) {
        setLoadingMovies(false);
        return;
      }

      setLoadingMovies(true);
      const movieDetails: Record<number, Movie> = {};

      await Promise.all(
        userMovies.map(async (um) => {
          try {
            const details = await getMovieDetails(um.tmdb_id);
            movieDetails[um.tmdb_id] = details;
          } catch (error) {
            console.error(`Error fetching movie ${um.tmdb_id}:`, error);
          }
        }),
      );

      setMovies(movieDetails);
      setLoadingMovies(false);
    };

    if (!loading) {
      fetchMovieDetails();
    }
  }, [userMovies, loading]);

  const getWatchlistMovies = () =>
    userMovies
      .filter((um) => um.status === "watchlist")
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const getWatchedMovies = () =>
    userMovies
      .filter((um) => um.status === "watched")
      .sort((a, b) => new Date(b.watched_at || b.created_at || 0).getTime() - new Date(a.watched_at || a.created_at || 0).getTime())
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const getFavoriteMovies = () =>
    userMovies
      .filter((um) => um.is_favorite)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const categories: CategoryCard[] = [
    {
      id: "watchlist",
      title: "Watchlist",
      icon: Clock,
      getMovies: getWatchlistMovies,
      getCount: () => userMovies.filter((um) => um.status === "watchlist").length,
    },
    {
      id: "watched",
      title: "Films Vus",
      icon: Eye,
      getMovies: getWatchedMovies,
      getCount: () => userMovies.filter((um) => um.status === "watched").length,
    },
    {
      id: "favorites",
      title: "Favoris",
      icon: Heart,
      getMovies: getFavoriteMovies,
      getCount: () => userMovies.filter((um) => um.is_favorite).length,
    },
  ];

  const isLoading = loading || loadingMovies;

  // Get backdrop for a category (last added movie)
  const getCategoryBackdrop = (category: CategoryCard): string | null => {
    const categoryMovies = category.getMovies();
    if (categoryMovies.length > 0) {
      return categoryMovies[0]?.backdrop_path || categoryMovies[0]?.poster_path || null;
    }
    return null;
  };

  // If a category is selected, show the movie grid
  if (selectedCategory) {
    const category = categories.find((c) => c.id === selectedCategory)!;
    const categoryMovies = category.getMovies();

    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />

        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedCategory(null)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{category.title}</h1>
              <p className="text-muted-foreground">{categoryMovies.length} films</p>
            </div>
          </div>

          {isLoading ? (
            <MovieGrid loading />
          ) : categoryMovies.length > 0 ? (
            <MovieGrid movies={categoryMovies} />
          ) : (
            <EmptyState
              icon={category.icon}
              title={`Aucun film dans ${category.title}`}
              description="Ajoutez des films pour les voir ici"
            />
          )}
        </div>

        <BottomNav />
      </div>
    );
  }

  // Main view with 3 category cards
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Ma Collection</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category) => {
            const backdrop = getCategoryBackdrop(category);
            const count = category.getCount();
            const Icon = category.icon;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="group relative aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {/* Background Image */}
                {backdrop ? (
                  <img
                    src={getImageUrl(backdrop, "w500") || ""}
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <Film className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/90 group-hover:via-black/50 transition-all duration-300" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Icon className="w-10 h-10 mb-3 opacity-90" />
                  <h2 className="text-xl md:text-2xl font-bold mb-1">{category.title}</h2>
                  <p className="text-white/70 text-sm">
                    {isLoading ? "..." : `${count} film${count !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function MovieGrid({ movies = [], loading = false }: { movies?: Movie[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {loading
        ? Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} size="lg" />)
        : movies.map((movie) => <MovieCard key={movie.id} movie={movie} size="lg" />)}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
      <h3 className="font-medium mb-1 md:text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground md:text-base">{description}</p>
    </div>
  );
}
