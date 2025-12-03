import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { useUserMovies } from "@/hooks/useUserMovies";
import { getMovieDetails, Movie } from "@/services/tmdb";
import { Clock, Eye, Heart } from "lucide-react";

export default function Collection() {
  const { userMovies, loading } = useUserMovies();
  const [movies, setMovies] = useState<Record<number, Movie>>({});
  const [loadingMovies, setLoadingMovies] = useState(true);

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

  const watchedMovies = userMovies
    .filter((um) => um.status === "watched")
    .map((um) => movies[um.tmdb_id])
    .filter(Boolean);

  const watchlistMovies = userMovies
    .filter((um) => um.status === "watchlist")
    .map((um) => movies[um.tmdb_id])
    .filter(Boolean);

  const favoriteMovies = userMovies
    .filter((um) => um.is_favorite)
    .map((um) => movies[um.tmdb_id])
    .filter(Boolean);

  const isLoading = loading || loadingMovies;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-xl font-bold">Ma Collection</h1>
        </div>
      </header>

      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="w-full justify-start px-4 pt-4 bg-transparent gap-2">
          <TabsTrigger
            value="watchlist"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Clock className="w-4 h-4" />
            Watchlist
            <span className="text-xs opacity-70">({watchlistMovies.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="watched"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Eye className="w-4 h-4" />
            Vus
            <span className="text-xs opacity-70">({watchedMovies.length})</span>
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Heart className="w-4 h-4" />
            Favoris
            <span className="text-xs opacity-70">({favoriteMovies.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="p-4">
          {isLoading ? (
            <MovieGrid loading />
          ) : watchlistMovies.length > 0 ? (
            <MovieGrid movies={watchlistMovies} />
          ) : (
            <EmptyState
              icon={Clock}
              title="Watchlist vide"
              description="Les films que vous voulez voir apparaîtront ici"
            />
          )}
        </TabsContent>

        <TabsContent value="watched" className="p-4">
          {isLoading ? (
            <MovieGrid loading />
          ) : watchedMovies.length > 0 ? (
            <MovieGrid movies={watchedMovies} />
          ) : (
            <EmptyState icon={Eye} title="Aucun film vu" description="Marquez vos films comme vus pour les voir ici" />
          )}
        </TabsContent>

        <TabsContent value="favorites" className="p-4">
          {isLoading ? (
            <MovieGrid loading />
          ) : favoriteMovies.length > 0 ? (
            <MovieGrid movies={favoriteMovies} />
          ) : (
            <EmptyState icon={Heart} title="Pas de favoris" description="Vos films préférés apparaîtront ici" />
          )}
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  );
}

function MovieGrid({ movies = [], loading = false }: { movies?: Movie[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => <MovieCardSkeleton key={i} size="lg" />)
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
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
