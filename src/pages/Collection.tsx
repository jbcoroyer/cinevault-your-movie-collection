import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPhysicalMovies,
  PhysicalMovie,
  PhysicalFormat,
  deletePhysicalMovie,
  addPhysicalMovie,
} from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, Movie } from "@/services/tmdb";
import { CollectionShowcase } from "@/components/guest/CollectionShowcase";
import { ShelfView } from "@/components/collection/ShelfView";
import { CollectionFiltersDrawer } from "@/components/collection/CollectionFilters";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { BarcodeScannerDialog } from "@/components/barcode";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Plus, ArrowUpDown, Library, ChevronDown, Scan } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// Types
// ============================================

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

// ============================================
// Component
// ============================================

export default function Collection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Collection state
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, ExtendedMovieDetails>>({});
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

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

  // ============================================
  // Data Fetching
  // ============================================

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

  // ============================================
  // Handlers
  // ============================================

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  // Handle scanned movies from barcode scanner
  const handleScannedMovies = async (
    scannedMovies: Array<{
      movie: Movie;
      format: PhysicalFormat;
      ean?: string;
    }>,
  ) => {
    if (!user || scannedMovies.length === 0) return;

    let successCount = 0;
    let duplicateCount = 0;

    for (const item of scannedMovies) {
      try {
        await addPhysicalMovie(user.id, {
          tmdb_id: item.movie.id,
          format: item.format,
          condition: "good",
        });
        successCount++;
      } catch (error: any) {
        if (error.code === "23505") {
          // Duplicate entry - film already exists
          duplicateCount++;
        } else {
          console.error("Erreur ajout film scanné:", error);
        }
      }
    }

    if (successCount > 0) {
      toast({
        title: `${successCount} film${successCount > 1 ? "s" : ""} ajouté${successCount > 1 ? "s" : ""} !`,
        description:
          duplicateCount > 0
            ? `${duplicateCount} film${duplicateCount > 1 ? "s" : ""} déjà présent${duplicateCount > 1 ? "s" : ""} dans votre collection.`
            : "Votre vidéothèque a été mise à jour.",
      });
      fetchPhysicalMovies();
    } else if (duplicateCount > 0) {
      toast({
        title: "Films déjà présents",
        description: `${duplicateCount} film${duplicateCount > 1 ? "s" : ""} ${duplicateCount > 1 ? "sont" : "est"} déjà dans votre collection.`,
        variant: "destructive",
      });
    }
  };

  // ============================================
  // Sorting Logic
  // ============================================

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
      case "genre":
        const genreA = detailsA?.genres?.[0]?.name || "";
        const genreB = detailsB?.genres?.[0]?.name || "";
        compare = genreA.localeCompare(genreB);
        break;
      case "director":
        compare = (detailsA?.director || "").localeCompare(detailsB?.director || "");
        break;
      case "added":
        compare = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "condition":
        const condA = conditionOrder[a.condition as keyof typeof conditionOrder] || 99;
        const condB = conditionOrder[b.condition as keyof typeof conditionOrder] || 99;
        compare = condA - condB;
        break;
    }

    return sortOrder === "asc" ? compare : -compare;
  });

  // ============================================
  // Loading & Guest States
  // ============================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show showcase for non-authenticated users
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

  // ============================================
  // Main Render
  // ============================================

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-6 pt-16 md:pt-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">Ma Vidéothèque</h1>
            <p className="text-muted-foreground text-sm">
              {physicalMovies.length} film{physicalMovies.length > 1 ? "s" : ""} dans votre collection
              {hasActiveFilters && ` • ${filteredMovies.length} affiché${filteredMovies.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filters Drawer */}
            <CollectionFiltersDrawer
              filters={filters}
              filterOptions={filterOptions}
              activeFilterCount={activeFilterCount}
              onToggleFormat={toggleFormat}
              onToggleCondition={toggleCondition}
              onToggleGenre={toggleGenre}
              onToggleDecade={toggleDecade}
              onToggleDirector={toggleDirector}
              onSetPriceRange={setPriceRange}
              onResetFilters={resetFilters}
            />

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => {
                      if (sortBy === key) {
                        toggleSortOrder();
                      } else {
                        setSortBy(key as SortBy);
                        setSortOrder("asc");
                      }
                    }}
                    className={cn(sortBy === key && "bg-accent")}
                  >
                    {label}
                    {sortBy === key && (
                      <span className="ml-auto text-xs opacity-50">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Scanner Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScannerOpen(true)}
              className="gap-2 border-videoclub-cyan/30 hover:bg-videoclub-cyan/10 hover:text-videoclub-cyan hover:border-videoclub-cyan/50 transition-colors"
            >
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Scanner</span>
            </Button>

            {/* Add Button */}
            <Button
              onClick={() => setAddDialogOpen(true)}
              size="sm"
              className="gap-2 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </Button>
          </div>
        </div>

        {/* Collection Content */}
        <div className="mt-6">
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
              <p className="text-muted-foreground mb-4 max-w-md">
                {hasActiveFilters
                  ? "Essayez de modifier vos filtres"
                  : "Commencez à ajouter des films à votre collection en scannant vos DVD/Blu-ray ou en recherchant manuellement"}
              </p>
              {!hasActiveFilters && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setScannerOpen(true)}
                    className="gap-2 border-videoclub-cyan/30 hover:bg-videoclub-cyan/10"
                  >
                    <Scan className="w-4 h-4" />
                    Scanner un code-barres
                  </Button>
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter manuellement
                  </Button>
                </div>
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
      <AddPhysicalMovieDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onMovieAdded={fetchPhysicalMovies} />

      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onMoviesSelected={handleScannedMovies} />

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
