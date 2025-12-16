/**
 * CineVault - Collection Page (CORRIGÉ)
 *
 * Page principale de gestion de la collection physique
 * Avec valorisation basée sur les vrais prix eBay
 *
 * CORRECTIONS:
 * - ValuationDashboardPremium reçoit maintenant les vraies données
 * - Préparation correcte des données pour les widgets
 * - Intégration complète avec useCollectionValuation
 */

import { useState, useEffect, useMemo } from "react";
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
import {
  Plus,
  ArrowUpDown,
  Library,
  ChevronDown,
  Scan,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Trash2,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  // CORRECTION: Préparer les données pour le dashboard
  // ============================================
  const moviesForDashboard = useMemo(() => {
    return physicalMovies.map((movie) => {
      const details = physicalMovieDetails[movie.tmdb_id];
      return {
        tmdbId: movie.tmdb_id,
        title: details?.title || `Film #${movie.tmdb_id}`,
        format: movie.format,
        posterPath: details?.poster_path,
        // IMPORTANT: Convertir en centimes pour le dashboard
        purchasePrice: movie.price ? Math.round(movie.price * 100) : undefined,
        releaseYear: details?.release_date ? new Date(details.release_date).getFullYear() : undefined,
      };
    });
  }, [physicalMovies, physicalMovieDetails]);

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

    let addedCount = 0;
    for (const { movie, format, ean } of scannedMovies) {
      try {
        await addPhysicalMovie(user.id, {
          tmdb_id: movie.id,
          format,
          condition: "good",
          ean_code: ean,
        });
        addedCount++;
      } catch (error) {
        console.error(`Error adding scanned movie ${movie.title}:`, error);
      }
    }

    if (addedCount > 0) {
      toast({
        title: `${addedCount} film${addedCount > 1 ? "s" : ""} ajouté${addedCount > 1 ? "s" : ""}`,
        description: "Votre collection a été mise à jour.",
      });
      fetchPhysicalMovies();
    }
  };

  // Handle movie click in valuation mode
  const handleValuationMovieClick = (tmdbId: number) => {
    const movie = physicalMovies.find((m) => m.tmdb_id === tmdbId);
    if (movie) {
      setSelectedMovie(movie);
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
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {viewMode === "collection" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)} className="gap-2">
                    <Scan className="w-4 h-4" />
                    <span className="hidden sm:inline">Scanner</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAddDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta"
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
                  disabled={valuationRefreshing}
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
            {/* Collection Controls */}
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Filters */}
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
                        onClick={() => setSortBy(key as SortBy)}
                        className={cn(sortBy === key && "bg-accent")}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Order Toggle */}
                <Button variant="ghost" size="sm" onClick={toggleSortOrder}>
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>

              {/* Selection Mode Toggle */}
              <div className="flex items-center gap-2">
                {selectionMode ? (
                  <>
                    <Badge variant="secondary">
                      {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      disabled={selectedIds.size === 0}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sélection</span>
                    <Switch checked={selectionMode} onCheckedChange={setSelectionMode} />
                  </div>
                )}
              </div>
            </div>

            {/* Collection Grid */}
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
        {/* VIEW: VALUATION (Sprint 2 - CORRIGÉ) */}
        {/* ============================================ */}
        {viewMode === "valuation" && (
          <div className="mt-6 space-y-6">
            {/* 
              CORRECTION MAJEURE: 
              On passe maintenant les vraies données au dashboard
              au lieu de laisser le composant utiliser des données mockées
            */}
            <ValuationDashboardPremium
              valuation={valuation}
              movies={moviesForDashboard}
              moviePrices={moviePrices}
              loading={valuationLoading}
              refreshing={valuationRefreshing}
              lastUpdated={valuationLastUpdated}
              onRefresh={refreshValuation}
              onMovieClick={handleValuationMovieClick}
            />

            {/* Selected Movie Price Evolution */}
            {selectedMovie && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Évolution du prix: {physicalMovieDetails[selectedMovie.tmdb_id]?.title}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMovie(null)}>
                    <X className="w-4 h-4 mr-1" />
                    Fermer
                  </Button>
                </div>
                <ValueEvolutionChart
                  tmdbId={selectedMovie.tmdb_id}
                  format={selectedMovie.format}
                  title={physicalMovieDetails[selectedMovie.tmdb_id]?.title || ""}
                  purchasePrice={selectedMovie.price || undefined}
                />
              </div>
            )}

            {/* Films de la collection avec prix */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Library className="w-5 h-5 text-primary" />
                Films de votre collection
              </h3>
              <p className="text-sm text-muted-foreground">Cliquez sur un film pour voir l'évolution de son prix</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {physicalMovies.map((movie) => {
                  const details = physicalMovieDetails[movie.tmdb_id];
                  const priceData = moviePrices.get(`${movie.tmdb_id}-${movie.format}`);
                  const isSelected = selectedMovie?.id === movie.id;

                  return (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie)}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        "rounded-lg overflow-hidden border-2",
                        isSelected
                          ? "border-primary shadow-lg shadow-primary/20 scale-105"
                          : "border-transparent hover:border-primary/50",
                      )}
                    >
                      <div className="relative aspect-[2/3] bg-muted">
                        {details?.poster_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${details.poster_path}`}
                            alt={details.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Library className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}

                        {/* Format Badge */}
                        <div className="absolute top-1 left-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-black/70 text-white border-0"
                          >
                            {movie.format.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Price Overlay */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                          <p className="text-white text-xs font-medium truncate">
                            {details?.title || `Film #${movie.tmdb_id}`}
                          </p>
                          {priceData ? (
                            <p className="text-green-400 text-sm font-bold">{(priceData.median / 100).toFixed(2)} €</p>
                          ) : (
                            <p className="text-zinc-500 text-xs">Prix inconnu</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* Dialogs */}
      {/* ============================================ */}

      {/* Add Movie Dialog */}
      <AddPhysicalMovieDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onMovieAdded={fetchPhysicalMovies} />

      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onMoviesScanned={handleScannedMovies} />

      {/* Edit Movie Dialog */}
      <EditPhysicalMovieDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        physicalMovie={editingMovie}
        movieDetails={editingMovieDetails}
        onMovieUpdated={fetchPhysicalMovies}
      />

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
              className="bg-destructive hover:bg-destructive/90"
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
