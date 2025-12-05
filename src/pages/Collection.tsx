import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { PhysicalMovieCard, PhysicalMovieCardSkeleton } from "@/components/PhysicalMovieCard";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, Movie } from "@/services/tmdb";
import { getPhysicalMovies, getPhysicalMovieStats, PhysicalMovie } from "@/services/physicalMovies";
import { Disc, Plus, Euro, Package } from "lucide-react";

export default function Collection() {
  const { user } = useAuth();
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, Movie>>({});
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchPhysicalMovies = async () => {
    if (!user) return;

    setLoading(true);
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
    setLoading(false);
  };

  useEffect(() => {
    fetchPhysicalMovies();
  }, [user]);

  const physicalStats = getPhysicalMovieStats(physicalMovies);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold">Ma Collection</h1>
          </div>
          {physicalMovies.length > 0 && (
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
      </header>

      <main className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PhysicalMovieCardSkeleton key={i} />
            ))}
          </div>
        ) : physicalMovies.length > 0 ? (
          <>
            {/* Stats */}
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

            {/* Grid */}
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
          </>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Disc className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center">Votre collection est vide</h2>
            <p className="text-muted-foreground text-center mb-8 max-w-sm">
              Commencez à ajouter vos DVD et Blu-ray pour garder une trace de tous les films que vous possédez.
            </p>
            <Button size="lg" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Ajouter mon premier film
            </Button>
          </div>
        )}
      </main>

      <AddPhysicalMovieDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onMovieAdded={fetchPhysicalMovies} />

      <BottomNav />
    </div>
  );
}
