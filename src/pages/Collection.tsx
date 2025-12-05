import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BottomNav } from "@/components/BottomNav";
import { PhysicalMovieCard, PhysicalMovieCardSkeleton } from "@/components/PhysicalMovieCard";
import { PhysicalMovieListItem, PhysicalMovieListItemSkeleton } from "@/components/PhysicalMovieListItem";
import { PhysicalMoviePoster, PhysicalMoviePosterSkeleton } from "@/components/PhysicalMoviePoster";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, Movie, MovieDetails } from "@/services/tmdb";
import { getPhysicalMovies, getPhysicalMovieStats, PhysicalMovie } from "@/services/physicalMovies";
import { Disc, Plus, Euro, Package, LayoutGrid, List, Image, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

type ViewMode = "cards" | "list" | "posters";
type SortBy = "title" | "year" | "price" | "genre" | "director" | "added";
type SortOrder = "asc" | "desc";

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

export default function Collection() {
  const { user } = useAuth();
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, ExtendedMovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PhysicalMovie | null>(null);
  const [editingMovieDetails, setEditingMovieDetails] = useState<Movie | null>(null);

  // View & Sort state
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchPhysicalMovies = async () => {
    if (!user) return;

    setLoading(true);
    const data = await getPhysicalMovies(user.id);
    setPhysicalMovies(data);

    const details: Record<number, ExtendedMovieDetails> = {};
    await Promise.all(
      data.map(async (pm) => {
        try {
          if (!details[pm.tmdb_id]) {
            const movieDetail = await getMovieDetails(pm.tmdb_id);
            const director = movieDetail.credits?.crew.find((c) => c.job === "Director")?.name;
            details[pm.tmdb_id] = { ...movieDetail, director };
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

  // Handle edit
  const handleEdit = (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => {
    setEditingMovie(physicalMovie);
    setEditingMovieDetails(movieDetails);
    setEditDialogOpen(true);
  };

  // Sorted movies
  const sortedMovies = useMemo(() => {
    const movies = [...physicalMovies];

    movies.sort((a, b) => {
      const detailsA = physicalMovieDetails[a.tmdb_id];
      const detailsB = physicalMovieDetails[b.tmdb_id];

      let comparison = 0;

      switch (sortBy) {
        case "title":
          const titleA = detailsA?.title || "";
          const titleB = detailsB?.title || "";
          comparison = titleA.localeCompare(titleB, "fr");
          break;

        case "year":
          const yearA = detailsA?.release_date ? new Date(detailsA.release_date).getFullYear() : 0;
          const yearB = detailsB?.release_date ? new Date(detailsB.release_date).getFullYear() : 0;
          comparison = yearA - yearB;
          break;

        case "price":
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          comparison = priceA - priceB;
          break;

        case "genre":
          const genreA = detailsA?.genres?.[0]?.name || "";
          const genreB = detailsB?.genres?.[0]?.name || "";
          comparison = genreA.localeCompare(genreB, "fr");
          break;

        case "director":
          const directorA = detailsA?.director || "";
          const directorB = detailsB?.director || "";
          comparison = directorA.localeCompare(directorB, "fr");
          break;

        case "added":
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return movies;
  }, [physicalMovies, physicalMovieDetails, sortBy, sortOrder]);

  const physicalStats = getPhysicalMovieStats(physicalMovies);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const sortLabels: Record<SortBy, string> = {
    title: "Titre",
    year: "Année",
    price: "Prix",
    genre: "Genre",
    director: "Réalisateur",
    added: "Date d'ajout",
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="p-4">
        {/* CTA Button */}
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="lg"
          className="w-full mb-6 h-14 text-base font-semibold gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
          Ajouter un DVD / Blu-ray
        </Button>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PhysicalMovieCardSkeleton key={i} />
            ))}
          </div>
        ) : physicalMovies.length > 0 ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Total</span>
                </div>
                <p className="text-2xl font-bold">{physicalStats.totalMovies}</p>
                <p className="text-xs text-muted-foreground">films physiques</p>
              </div>
              <div className="bg-card p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Euro className="w-4 h-4" />
                  <span className="text-sm">Valeur</span>
                </div>
                <p className="text-2xl font-bold">{physicalStats.totalValue.toFixed(2)} €</p>
                <p className="text-xs text-muted-foreground">estimée</p>
              </div>
            </div>

            {/* Filters & View Toggle */}
            <div className="flex items-center gap-2 mb-4">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger className="w-[140px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sortLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={toggleSortOrder} className="flex-shrink-0">
                {sortOrder === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </Button>

              <div className="flex-1" />

              <div className="flex items-center bg-card rounded-lg p-1 border border-border">
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "p-2 rounded transition-colors",
                    viewMode === "cards"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Vue cartes"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded transition-colors",
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("posters")}
                  className={cn(
                    "p-2 rounded transition-colors",
                    viewMode === "posters"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  title="Vue affiches"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Movies display */}
            {viewMode === "cards" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sortedMovies.map((pm) => (
                  <PhysicalMovieCard
                    key={pm.id}
                    physicalMovie={pm}
                    movieDetails={physicalMovieDetails[pm.tmdb_id] || null}
                    onDeleted={fetchPhysicalMovies}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}

            {viewMode === "list" && (
              <div className="space-y-3">
                {sortedMovies.map((pm) => (
                  <PhysicalMovieListItem
                    key={pm.id}
                    physicalMovie={pm}
                    movieDetails={physicalMovieDetails[pm.tmdb_id] || null}
                    director={physicalMovieDetails[pm.tmdb_id]?.director}
                    onDeleted={fetchPhysicalMovies}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}

            {viewMode === "posters" && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                {sortedMovies.map((pm) => (
                  <PhysicalMoviePoster
                    key={pm.id}
                    physicalMovie={pm}
                    movieDetails={physicalMovieDetails[pm.tmdb_id] || null}
                    onDeleted={fetchPhysicalMovies}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Disc className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-center">Votre collection est vide</h2>
            <p className="text-muted-foreground text-center max-w-sm">
              Commencez à ajouter vos DVD et Blu-ray pour garder une trace de tous les films que vous possédez.
            </p>
          </div>
        )}
      </main>

      {/* Add Dialog */}
      <AddPhysicalMovieDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onMovieAdded={fetchPhysicalMovies} />

      {/* Edit Dialog */}
      <EditPhysicalMovieDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        physicalMovie={editingMovie}
        movieDetails={editingMovieDetails}
        onMovieUpdated={fetchPhysicalMovies}
      />

      <BottomNav />
    </div>
  );
}
