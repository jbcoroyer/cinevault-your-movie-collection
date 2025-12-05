import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { PhysicalMovieCard, PhysicalMovieCardSkeleton } from "@/components/PhysicalMovieCard";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, Movie } from "@/services/tmdb";
import { getPhysicalMovies, getPhysicalMovieStats, PhysicalMovie, formatLabels } from "@/services/physicalMovies";
import { Clock, Eye, Heart, Disc, Plus, Euro, Package } from "lucide-react";

export default function Collection() {
  const { user } = useAuth();
  const { userMovies, loading } = useUserMovies();
  const [movies, setMovies] = useState<Record<number, Movie>>({});
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Physical movies state
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, Movie>>({});
  const [loadingPhysical, setLoadingPhysical] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch digital collection
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

  // Fetch physical collection
  const fetchPhysicalMovies = async () => {
    if (!user) return;

    setLoadingPhysical(true);
    const data = await getPhysicalMovies(user.id);
    setPhysicalMovies(data);

    // Fetch movie details for physical movies
    const details: Record<number, Movie> = {};
    await Promise.all(
      data.map(async (pm) => {
        try {
          if (!details[pm.tmdb_id]) {
            const movieDetail = await getMovieDetails(pm.tmdb_id);
            details[pm.tmdb_id] = movieDetail;
          }
        } catch (error) {
          console.error(`Error fetching movie ${pm.tmdb_id}:`, error);
        }
      }),
    );
    setPhysicalMovieDetails(details);
    setLoadingPhysical(false);
  };

  useEffect(() => {
    fetchPhysicalMovies();
  }, [user]);

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
  const physicalStats = getPhysicalMovieStats(physicalMovies);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-xl font-bold">Ma Collection</h1>
        </div>
      </header>

      <Tabs defaultValue="watchlist" className="w-full">
        <TabsList className="w-full justify-start px-4 pt-4 bg-transparent gap-2 overflow-x-auto hide-scrollbar">
          <TabsTrigger
            value="watchlist"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-button px-4"
          >
            <Clock className="w-4 h-4 mr-2" />À voir ({watchlistMovies.length})
          </TabsTrigger>
          <TabsTrigger
            value="watched"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-button px-4"
          >
            <Eye className="w-4 h-4 mr-2" />
            Vus ({watchedMovies.length})
          </TabsTrigger>
          <TabsTrigger
            value="favorites"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-button px-4"
          >
            <Heart className="w-4 h-4 mr-2" />
            Favoris ({favoriteMovies.length})
          </TabsTrigger>
          <TabsTrigger
            value="physical"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-button px-4"
          >
            <Disc className="w-4 h-4 mr-2" />
            Physique ({physicalMovies.length})
          </TabsTrigger>
        </TabsList>

        {/* Watchlist */}
        <TabsContent value="watchlist" className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : watchlistMovies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {watchlistMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Votre watchlist est vide</p>
            </div>
          )}
        </TabsContent>

        {/* Watched */}
        <TabsContent value="watched" className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : watchedMovies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {watchedMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Vous n'avez marqué aucun film comme vu</p>
            </div>
          )}
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites" className="p-4">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <MovieCardSkeleton key={i} />
              ))}
            </div>
          ) : favoriteMovies.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {favoriteMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Vous n'avez aucun film favori</p>
            </div>
          )}
        </TabsContent>

        {/* Physical Collection */}
        <TabsContent value="physical" className="p-4">
          {/* Stats */}
          {physicalMovies.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-card p-4 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold">{physicalStats.totalMovies}</p>
                <p className="text-xs text-muted-foreground">films physiques</p>
              </div>
              <div className="bg-card p-4 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Euro className="w-4 h-4" />
                  <span className="text-sm">Valeur</span>
                </div>
                <p className="text-2xl font-bold">{physicalStats.totalValue.toFixed(2)} €</p>
                <p className="text-xs text-muted-foreground">estimée</p>
              </div>
            </div>
          )}

          {/* Add button */}
          <Button onClick={() => setAddDialogOpen(true)} className="w-full mb-6" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un DVD/Blu-ray
          </Button>

          {/* Grid */}
          {loadingPhysical ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <PhysicalMovieCardSkeleton key={i} />
              ))}
            </div>
          ) : physicalMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {physicalMovies.map((pm) => (
                <PhysicalMovieCard
                  key={pm.id}
                  physicalMovie={pm}
                  movieDetails={physicalMovieDetails[pm.tmdb_id] || null}
                  onDeleted={fetchPhysicalMovies}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Disc className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-2">Votre bibliothèque physique est vide</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez vos DVD et Blu-ray pour garder une trace de votre collection
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AddPhysicalMovieDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onMovieAdded={fetchPhysicalMovies} />

      <BottomNav />
    </div>
  );
}
