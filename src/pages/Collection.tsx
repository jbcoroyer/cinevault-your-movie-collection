import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getPhysicalMovies, PhysicalMovie, deletePhysicalMovie, updatePhysicalMovie } from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, Movie } from "@/services/tmdb";
import { CollectionShowcase } from "@/components/guest/CollectionShowcase";
import { ShelfView } from "@/components/collection/ShelfView";
import { GridView } from "@/components/collection/GridView";
import { ListView } from "@/components/collection/ListView";
import { CollectionFilters } from "@/components/collection/CollectionFilters";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import { cn } from "@/lib/utils";
import {
  Plus,
  Grid3X3,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  Library,
  ChevronDown,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type ViewMode = "shelf" | "grid" | "list";
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

  // View & Sort state - "shelf" par défaut
  const [viewMode, setViewMode] = useState<ViewMode>("shelf");
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Use collection filters hook
  const {
    filters,
    filteredMovies,
    filterOptions,
    setSearch,
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

  // Handle edit
  const handleEdit = (physicalMovie: PhysicalMovie, movieDetails: Movie | null) => {
    setEditingMovie(physicalMovie);
    setEditingMovieDetails(movieDetails);
    setEditDialogOpen(true);
  };

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
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("shelf")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "shelf" ? "bg-background shadow text-amber-500" : "text-muted-foreground hover:text-foreground"
              )}
              title="Vue étagère"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "grid" ? "bg-background shadow text-amber-500" : "text-muted-foreground hover:text-foreground"
              )}
              title="Vue grille"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === "list" ? "bg-background shadow text-amber-500" : "text-muted-foreground hover:text-foreground"
              )}
              title="Vue liste"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

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

          {/* Filters Sheet (Mobile) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 md:hidden">
                <SlidersHorizontal className="w-4 h-4" />
                Filtres
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <CollectionFilters
                  filters={filters}
                  filterOptions={filterOptions}
                  onSearchChange={setSearch}
                  onToggleFormat={toggleFormat}
                  onToggleCondition={toggleCondition}
                  onToggleGenre={toggleGenre}
                  onToggleDecade={toggleDecade}
                  onToggleDirector={toggleDirector}
                  onPriceRangeChange={setPriceRange}
                  onReset={resetFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-20">
              <CollectionFilters
                filters={filters}
                filterOptions={filterOptions}
                onSearchChange={setSearch}
                onToggleFormat={toggleFormat}
                onToggleCondition={toggleCondition}
                onToggleGenre={toggleGenre}
                onToggleDecade={toggleDecade}
                onToggleDirector={toggleDirector}
                onPriceRangeChange={setPriceRange}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

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
              <>
                {viewMode === "shelf" && (
                  <ShelfView
                    movies={sortedMovies}
                    movieDetailsMap={physicalMovieDetails}
                    onMovieClick={(movie) => navigate(`/movie/${movie.tmdb_id}`)}
                    onEdit={handleEdit}
                  />
                )}
                {viewMode === "grid" && (
                  <GridView
                    movies={sortedMovies}
                    movieDetailsMap={physicalMovieDetails}
                    onMovieClick={(movie) => navigate(`/movie/${movie.tmdb_id}`)}
                    onEdit={handleEdit}
                  />
                )}
                {viewMode === "list" && (
                  <ListView
                    movies={sortedMovies}
                    movieDetailsMap={physicalMovieDetails}
                    onMovieClick={(movie) => navigate(`/movie/${movie.tmdb_id}`)}
                    onEdit={handleEdit}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AddPhysicalMovieDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchPhysicalMovies}
      />

      {editingMovie && (
        <EditPhysicalMovieDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          physicalMovie={editingMovie}
          movieDetails={editingMovieDetails}
          onSuccess={() => {
            setEditDialogOpen(false);
            setEditingMovie(null);
            fetchPhysicalMovies();
          }}
          onDelete={async () => {
            if (editingMovie) {
              await deletePhysicalMovie(editingMovie.id);
              setEditDialogOpen(false);
              setEditingMovie(null);
              fetchPhysicalMovies();
            }
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
