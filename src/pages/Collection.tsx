import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// ============================================
// Sprint 2 Imports - Valorisation
// ============================================
import { ValuationDashboardPremium } from "@/components/collection/ValuationDashboardPremium";
import { PriceCard } from "@/components/collection/PriceCard";
import { ValueEvolutionChart } from "@/components/collection/ValueEvolutionChart";
import { useCollectionValuation } from "@/hooks/useCollectionValuation";

import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Plus, ArrowUpDown, Library, ChevronDown, Scan, DollarSign, RefreshCw, TrendingUp, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================
// Types
// ============================================

type SortBy = "title" | "year" | "price" | "genre" | "director" | "added" | "condition" | "market_value";
type SortOrder = "asc" | "desc";
type ViewMode = "collection" | "valuation";

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

const sortLabels: Record<SortBy, string> = {
  title: "Titre",
  year: "Année",
  price: "Prix d'achat",
  market_value: "Valeur marché",
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

  // View mode state (Collection vs Valuation)
  const [viewMode, setViewMode] = useState<ViewMode>("collection");

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

  // Selected movie for valuation detail
  const [selectedMovie, setSelectedMovie] = useState<PhysicalMovie | null>(null);

  // Selection mode for bulk delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  // Sprint 2: Valuation Hook
  // ============================================
  const {
    valuation,
    moviePrices,
    loading: valuationLoading,
    refreshing: valuationRefreshing,
    lastUpdated: valuationLastUpdated,
    coverage,
    refresh: refreshValuation,
    getMovieValuation,
    formatValue,
  } = useCollectionValuation({
    movies: physicalMovies,
    movieDetails: physicalMovieDetails,
    autoRefresh: false,
  });

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

  // Toggle movie selection
  const toggleMovieSelection = (movieId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(movieId)) {
        newSet.delete(movieId);
      } else {
        newSet.add(movieId);
      }
      return newSet;
    });
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        await deletePhysicalMovie(id);
        successCount++;
      } catch (error) {
        console.error(`Error deleting movie ${id}:`, error);
      }
    }

    if (successCount > 0) {
      toast({
        title: `${successCount} film${successCount > 1 ? "s" : ""} supprimé${successCount > 1 ? "s" : ""}`,
        description: "Votre collection a été mise à jour.",
      });
      fetchPhysicalMovies();
    }

    setSelectedIds(new Set());
    setSelectionMode(false);
    setDeleteConfirmOpen(false);
    setIsDeleting(false);
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
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
  // Sorting Logic (with market value support)
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
      case "market_value":
        // Sprint 2: Sort by market value
        const priceA = moviePrices.get(`${a.tmdb_id}-${a.format}`)?.median || 0;
        const priceB = moviePrices.get(`${b.tmdb_id}-${b.format}`)?.median || 0;
        compare = priceA - priceB;
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
        {/* Header Section with Tabs */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display">Ma Vidéothèque</h1>
              <p className="text-muted-foreground text-sm">
                {physicalMovies.length} film{physicalMovies.length > 1 ? "s" : ""} dans votre collection
                {viewMode === "collection" &&
                  hasActiveFilters &&
                  ` • ${filteredMovies.length} affiché${filteredMovies.length > 1 ? "s" : ""}`}
                {viewMode === "valuation" && valuation && (
                  <span className="ml-2 text-primary font-medium">
                    • Valeur estimée: {formatValue(valuation.totalValueMedian)}
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons based on view mode */}
            <div className="flex items-center gap-2 flex-wrap">
              {viewMode === "collection" && (
                <>
                  {/* Filters Drawer */}
                  <CollectionFiltersDrawer
                    filters={filters}
                    filterOptions={filterOptions}
                    activeFilterCount={activeFilterCount}
                    toggleFormat={toggleFormat}
                    toggleCondition={toggleCondition}
                    toggleGenre={toggleGenre}
                    toggleDecade={toggleDecade}
                    toggleDirector={toggleDirector}
                    setPriceRange={setPriceRange}
                    resetFilters={resetFilters}
                    hasActiveFilters={hasActiveFilters}
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

                  {/* Selection Mode Toggle */}
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50">
                    <Switch
                      id="selection-mode"
                      checked={selectionMode}
                      onCheckedChange={(checked) => {
                        setSelectionMode(checked);
                        if (!checked) setSelectedIds(new Set());
                      }}
                    />
                    <label htmlFor="selection-mode" className="text-xs text-muted-foreground cursor-pointer">
                      Sélection
                    </label>
                  </div>

                  {/* Delete Button (visible when selection mode is on and items selected) */}
                  {selectionMode && selectedIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="gap-2 animate-in fade-in slide-in-from-right-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer ({selectedIds.size})
                    </Button>
                  )}

                  {/* Add Button */}
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta hover:opacity-90"
                    disabled={selectionMode}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Ajouter</span>
                  </Button>
                </>
              )}

              {viewMode === "valuation" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshValuation}
                  disabled={valuationRefreshing || physicalMovies.length === 0}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", valuationRefreshing && "animate-spin")} />
                  {valuationRefreshing ? "Analyse..." : "Actualiser les prix"}
                </Button>
              )}
            </div>
          </div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="grid w-full max-w-[320px] grid-cols-2">
              <TabsTrigger value="collection" className="gap-2">
                <Library className="w-4 h-4" />
                Collection
              </TabsTrigger>
              <TabsTrigger value="valuation" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Valorisation
                {valuation && valuation.totalValueMedian > 0 && (
                  <span className="ml-1 text-[10px] font-bold text-green-500">
                    {formatValue(valuation.totalValueMedian)}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ============================================ */}
        {/* VIEW: COLLECTION */}
        {/* ============================================ */}
        {viewMode === "collection" && (
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
                onMovieClick={(movie) => {
                  if (selectionMode) {
                    toggleMovieSelection(movie.id);
                  } else {
                    navigate(`/movie/${movie.tmdb_id}`);
                  }
                }}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
              />
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* VIEW: VALUATION (Sprint 2) */}
        {/* ============================================ */}
        {viewMode === "valuation" && (
          <div className="mt-6 space-y-6">
            {/* Valuation Dashboard */}
            <ValuationDashboardPremium />

            {/* Selected Movie Price Evolution */}
            {selectedMovie && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Évolution du prix: {physicalMovieDetails[selectedMovie.tmdb_id]?.title}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMovie(null)}>
                    Fermer
                  </Button>
                </div>
                <ValueEvolutionChart
                  tmdbId={selectedMovie.tmdb_id}
                  format={selectedMovie.format}
                  title={physicalMovieDetails[selectedMovie.tmdb_id]?.title || ""}
                  purchasePrice={selectedMovie.price ? selectedMovie.price * 100 : undefined}
                />
              </div>
            )}

            {/* Quick Price List */}
            {physicalMovies.length > 0 && !selectedMovie && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  Cliquez sur un film pour voir l'évolution de son prix
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sortedMovies.slice(0, 12).map((movie) => {
                    const details = physicalMovieDetails[movie.tmdb_id];
                    const movieValuation = getMovieValuation(movie.tmdb_id, movie.format);

                    return (
                      <button
                        key={movie.id}
                        onClick={() => setSelectedMovie(movie)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                          "bg-card/50 border border-white/10 backdrop-blur-sm",
                          "hover:bg-card/80 hover:border-primary/30",
                          selectedMovie?.id === movie.id && "ring-2 ring-primary",
                        )}
                      >
                        {/* Poster */}
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {details?.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w92${details.poster_path}`}
                              alt={details.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Library className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{details?.title || `Film #${movie.tmdb_id}`}</p>
                          <p className="text-xs text-muted-foreground capitalize">{movie.format}</p>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          {movieValuation?.marketPrice ? (
                            <>
                              <p className="font-semibold text-sm">{formatValue(movieValuation.marketPrice.median)}</p>
                              {movieValuation.profitLossPercent !== undefined && (
                                <p
                                  className={cn(
                                    "text-xs font-medium",
                                    movieValuation.profitLossPercent > 0
                                      ? "text-green-500"
                                      : movieValuation.profitLossPercent < 0
                                        ? "text-red-500"
                                        : "text-muted-foreground",
                                  )}
                                >
                                  {movieValuation.profitLossPercent > 0 ? "+" : ""}
                                  {movieValuation.profitLossPercent}%
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">—</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {sortedMovies.length > 12 && (
                  <p className="text-center text-sm text-muted-foreground">
                    + {sortedMovies.length - 12} autres films dans votre collection
                  </p>
                )}
              </div>
            )}
          </div>
        )}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedIds.size} film{selectedIds.size > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les films sélectionnés seront définitivement supprimés de votre collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
