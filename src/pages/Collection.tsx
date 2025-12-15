import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getPhysicalMovies, PhysicalMovie, deletePhysicalMovie } from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, Movie } from "@/services/tmdb";
import { CollectionShowcase } from "@/components/guest/CollectionShowcase";
import { ShelfView } from "@/components/collection/ShelfView";
import { CollectionFiltersDrawer } from "@/components/collection/CollectionFilters";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import { cn } from "@/lib/utils";
import { BarcodeScannerDialog } from "@/components/barcode";
import { Scan } from "lucide-react";
import {
  Plus,
  ArrowUpDown,
  Library,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SortBy = "title" | "year" | "price" | "genre" | "director" | "added" | "condition";
type SortOrder = "asc" | "desc";

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

const sortLabels: Record<SortBy, string> = {
  title: "Titre",
  year: "Année",
  price: "Prix",
  genre: "Genre",
  director: "Réalisateur",
  added: "Date d'ajout",
  condition: "État",
};

const conditionOrder = { mint: 1, very_good: 2, good: 3, acceptable: 4 };

export default function Collection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, ExtendedMovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PhysicalMovie | null>(null);
  const [editingMovieDetails, setEditingMovieDetails] = useState<Movie | null>(null);

  // Sort state
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Use collection filters hook
  const {
    filters,
    filteredMovies,
    filterOptions,
    toggleFormat,
    toggleCondition,
    toggleGenre,
    toggleDecade,
    toggleDirector,
    setPriceRange,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
  } = useCollectionFilters(physicalMovies, physicalMovieDetails);

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
    if (user) {
      fetchPhysicalMovies();
    }
  }, [user]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Sort movies
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    const detailsA = physicalMovieDetails[a.tmdb_id];
    const detailsB = physicalMovieDetails[b.tmdb_id];
    let compare = 0;

    switch (sortBy) {
      case "title":
        compare = (detailsA?.title || "").localeCompare(detailsB?.title || "");
        break;
      case "year":
        const yearA = detailsA?.release_date ? new Date(detailsA.release_date).getFullYear() : 0;
        const yearB = detailsB?.release_date ? new Date(detailsB.release_date).getFullYear() : 0;
        compare = yearA - yearB;
        break;
      case "price":
        compare = (a.price || 0) - (b.price || 0);
        break;
      case "added":
        compare = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "condition":
        const condA = conditionOrder[a.condition as keyof typeof conditionOrder] || 99;
        const condB = conditionOrder[b.condition as keyof typeof conditionOrder] || 99;
        compare = condA - condB;
        break;
      default:
        compare = 0;
    }

    return sortOrder === "asc" ? compare : -compare;
  });

  // Loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Si non connecté, afficher le showcase
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="pt-14 md:pt-0">
          <CollectionShowcase />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Contenu pour les utilisateurs connectés
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold flex items-center gap-3">
              <Library className="w-8 h-8 text-amber-500" />
              Ma Collection
            </h1>
            <p className="text-muted-foreground mt-1">
              {physicalMovies.length} film{physicalMovies.length !== 1 ? "s" : ""} dans votre vidéothèque
            </p>
          </div>

          <Button onClick={() => setAddDialogOpen(true)} className="gap-2 rounded-full">
            <Plus className="w-4 h-4" />
            Ajouter un film
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="w-4 h-4" />
                {sortLabels[sortBy]}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {Object.entries(sortLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => {
                    if (sortBy === key) {
                      toggleSortOrder();
                    } else {
                      setSortBy(key as SortBy);
                    }
                  }}
                  className={cn(sortBy === key && "bg-accent")}
                >
                  {label}
                  {sortBy === key && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filters Drawer */}
          <CollectionFiltersDrawer
            filters={filters}
            filterOptions={filterOptions}
            toggleFormat={toggleFormat}
            toggleCondition={toggleCondition}
            toggleGenre={toggleGenre}
            toggleDecade={toggleDecade}
            toggleDirector={toggleDirector}
            setPriceRange={setPriceRange}
            resetFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
            activeFilterCount={activeFilterCount}
          />

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Collection Content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : sortedMovies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Library className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {hasActiveFilters ? "Aucun résultat" : "Votre collection est vide"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Essayez de modifier vos filtres"
                  : "Commencez à ajouter des films à votre collection"}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter un film
                </Button>
              )}
            </div>
          ) : (
            <ShelfView
              movies={sortedMovies}
              movieDetailsMap={physicalMovieDetails}
              onMovieClick={(movie) => navigate(`/movie/${movie.tmdb_id}`)}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddPhysicalMovieDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onMovieAdded={fetchPhysicalMovies}
      />

      {editingMovie && (
        <EditPhysicalMovieDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          physicalMovie={editingMovie}
          movieDetails={editingMovieDetails}
          onMovieUpdated={() => {
            setEditDialogOpen(false);
            setEditingMovie(null);
            fetchPhysicalMovies();
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
