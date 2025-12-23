/**
 * CineVault - Collection Page AMÉLIORÉE
 * 
 * AMÉLIORATIONS INTÉGRÉES:
 * - FAB (Floating Action Button) pour l'ajout
 * - Bottom Sheet au lieu de Dialog sur mobile
 * - Pull-to-refresh
 * - Skeleton loaders
 * - Page transitions fluides
 * - Tabs animés Collection/Valuation
 * - Sticky filters
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPhysicalMovies,
  PhysicalMovie,
  PhysicalFormat,
  deletePhysicalMovie,
} from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, Movie } from "@/services/tmdb";
import { CollectionShowcase } from "@/components/guest/CollectionShowcase";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { BarcodeScannerDialog } from "@/components/barcode";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";

// NEW IMPORTS - Améliorations
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { AddMovieSheet } from "@/components/AddMovieSheet";
import { AnimatedPage, ListStagger } from "@/components/ui/PageTransition";
import { 
  CollectionHeaderSkeleton, 
  MovieGridSkeleton,
  CollectionCardSkeleton 
} from "@/components/ui/Skeleton";
import { showXPToast } from "@/components/gamification/XPToast";

// Valuation imports
import { ValuationDashboardPremium } from "@/components/collection/ValuationDashboardPremium";
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
  Film,
  Star,
  Search,
  Sparkles,
  Filter,
  Grid3X3,
  LayoutList,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { getImageUrl } from "@/services/tmdb";

// Types
type SortBy = "title" | "year" | "price" | "genre" | "director" | "added" | "condition" | "market_value";
type SortOrder = "asc" | "desc";
type ViewMode = "collection" | "valuation";
type DisplayMode = "grid" | "list" | "poster";

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

const formatLabels: Record<PhysicalFormat, { label: string; color: string }> = {
  dvd: { label: "DVD", color: "bg-blue-500" },
  bluray: { label: "Blu-ray", color: "bg-indigo-500" },
  "4k": { label: "4K UHD", color: "bg-purple-500" },
  steelbook: { label: "Steelbook", color: "bg-amber-500" },
  collector: { label: "Collector", color: "bg-rose-500" },
  vhs: { label: "VHS", color: "bg-orange-500" },
  laserdisc: { label: "LaserDisc", color: "bg-cyan-500" },
};

// ============================================
// Sub-components
// ============================================

/**
 * Collection Movie Card with animations
 */
const CollectionMovieCard = ({
  movie,
  details,
  isSelected,
  selectionMode,
  onSelect,
  onEdit,
  onClick,
}: {
  movie: PhysicalMovie;
  details?: ExtendedMovieDetails;
  isSelected: boolean;
  selectionMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onClick: () => void;
}) => {
  const posterUrl = details?.poster_path 
    ? getImageUrl(details.poster_path, "w342") 
    : null;

  const formatConfig = formatLabels[movie.format];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={selectionMode ? onSelect : onClick}
      className={cn(
        "group relative bg-card rounded-xl overflow-hidden",
        "border border-border/50 transition-all duration-300",
        "hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10",
        isSelected && "ring-2 ring-amber-500 border-amber-500",
        "cursor-pointer"
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className={cn(
          "absolute top-2 left-2 z-10 w-6 h-6 rounded-full",
          "flex items-center justify-center",
          "transition-all duration-200",
          isSelected 
            ? "bg-amber-500 text-white" 
            : "bg-background/80 border border-border"
        )}>
          {isSelected && <span className="text-xs font-bold">✓</span>}
        </div>
      )}

      {/* Format Badge */}
      <div className="absolute top-2 right-2 z-10">
        <Badge className={cn("text-xs text-white", formatConfig.color)}>
          {formatConfig.label}
        </Badge>
      </div>

      {/* Poster */}
      <div className="aspect-[2/3] bg-muted overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={details?.title || "Movie"}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Film className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex items-end p-3"
        )}>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-full"
          >
            Modifier
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-1">
          {details?.title || "Chargement..."}
        </h3>
        <p className="text-xs text-muted-foreground">
          {details?.release_date?.substring(0, 4) || "—"}
        </p>
        
        {/* Rating */}
        {details?.vote_average && details.vote_average > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="text-xs text-amber-500 font-medium">
              {details.vote_average.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Empty State Component
 */
const EmptyCollection = ({ onAddMovie }: { onAddMovie: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
        <Library className="w-10 h-10 text-amber-500" />
      </div>
      <h3 className="text-xl font-display font-bold mb-2">
        Votre collection est vide
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Commencez à ajouter vos DVD, Blu-ray et éditions collector pour voir votre collection prendre vie.
      </p>
      <Button
        onClick={onAddMovie}
        className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter mon premier film
      </Button>
    </motion.div>
  );
};

/**
 * Sticky Filter Bar
 */
const StickyFilterBar = ({
  activeFilterCount,
  sortBy,
  sortOrder,
  onSortChange,
  onFilterClick,
  displayMode,
  onDisplayModeChange,
}: {
  activeFilterCount: number;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sort: SortBy) => void;
  onFilterClick: () => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-14 md:top-0 z-30 py-3 -mx-4 px-4",
        "bg-background/80 backdrop-blur-xl border-b border-border/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Filter button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onFilterClick}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres
          {activeFilterCount > 0 && (
            <Badge className="ml-1 bg-amber-500 text-white text-xs px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(sortLabels).map(([key, label]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onSortChange(key as SortBy)}
                className={cn(sortBy === key && "bg-accent")}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Display mode toggle */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-lg">
          {[
            { mode: "grid" as DisplayMode, icon: Grid3X3 },
            { mode: "list" as DisplayMode, icon: LayoutList },
            { mode: "poster" as DisplayMode, icon: Image },
          ].map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => onDisplayModeChange(mode)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                displayMode === mode 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export default function Collection() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("collection");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("grid");

  // Collection state
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, ExtendedMovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sheet/Dialog states
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PhysicalMovie | null>(null);
  const [editingMovieDetails, setEditingMovieDetails] = useState<Movie | null>(null);

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

  // Valuation hook
  const { 
    valuationData, 
    isLoading: valuationLoading, 
    refreshValuation 
  } = useCollectionValuation(physicalMovies);

  // Fetch collection data
  const fetchPhysicalMovies = useCallback(async () => {
    if (!user) return;

    try {
      const movies = await getPhysicalMovies(user.id);
      setPhysicalMovies(movies);

      // Fetch movie details in parallel
      const detailsMap: Record<number, ExtendedMovieDetails> = {};
      await Promise.all(
        movies.map(async (movie) => {
          try {
            const details = await getMovieDetails(movie.tmdb_id);
            if (details) {
              detailsMap[movie.tmdb_id] = details;
            }
          } catch (error) {
            console.error(`Error fetching details for ${movie.tmdb_id}:`, error);
          }
        })
      );
      setPhysicalMovieDetails(detailsMap);
    } catch (error) {
      console.error("Error fetching collection:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchPhysicalMovies();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, fetchPhysicalMovies]);

  // Pull to refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPhysicalMovies();
    showXPToast(5, "Collection actualisée", "bonus");
  };

  // Handle movie added
  const handleMovieAdded = () => {
    fetchPhysicalMovies();
    showXPToast(25, "Film ajouté !", "xp");
  };

  // Edit handlers
  const handleEditMovie = (movie: PhysicalMovie) => {
    setEditingMovie(movie);
    setEditingMovieDetails(physicalMovieDetails[movie.tmdb_id] as Movie || null);
    setEditDialogOpen(true);
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    let successCount = 0;

    for (const id of selectedIds) {
      try {
        await deletePhysicalMovie(id);
        successCount++;
      } catch (error) {
        console.error("Error deleting movie:", error);
      }
    }

    if (successCount > 0) {
      toast({
        title: `${successCount} film${successCount > 1 ? 's' : ''} supprimé${successCount > 1 ? 's' : ''}`,
      });
      fetchPhysicalMovies();
    }

    setSelectedIds(new Set());
    setSelectionMode(false);
    setDeleteConfirmOpen(false);
    setIsDeleting(false);
  };

  // Sort filtered movies
  const sortedMovies = useMemo(() => {
    const sorted = [...filteredMovies].sort((a, b) => {
      const detailsA = physicalMovieDetails[a.tmdb_id];
      const detailsB = physicalMovieDetails[b.tmdb_id];

      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = (detailsA?.title || "").localeCompare(detailsB?.title || "");
          break;
        case "year":
          comparison = (detailsA?.release_date || "").localeCompare(detailsB?.release_date || "");
          break;
        case "added":
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case "price":
          comparison = (a.purchase_price || 0) - (b.purchase_price || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredMovies, physicalMovieDetails, sortBy, sortOrder]);

  // Show guest view if not logged in
  if (!authLoading && !user) {
    return <CollectionShowcase />;
  }

  return (
    <AnimatedPage className="min-h-screen bg-background pb-24">
      <Header />

      <main className="container mx-auto px-4 pt-4">
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4"
        >
          <div>
            <h1 className="text-2xl font-display font-bold">Ma Collection</h1>
            <p className="text-sm text-muted-foreground">
              {physicalMovies.length} film{physicalMovies.length !== 1 ? 's' : ''} • {" "}
              {Object.keys(formatLabels).map(format => {
                const count = physicalMovies.filter(m => m.format === format).length;
                return count > 0 ? `${count} ${formatLabels[format as PhysicalFormat].label}` : null;
              }).filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Selection mode toggle */}
          {physicalMovies.length > 0 && (
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedIds(new Set());
              }}
            >
              {selectionMode ? (
                <>
                  <X className="w-4 h-4 mr-1" />
                  Annuler
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Sélectionner
                </>
              )}
            </Button>
          )}
        </motion.div>

        {/* View Mode Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="w-full max-w-sm mb-4">
              <TabsTrigger value="collection" className="flex-1 gap-2">
                <Library className="w-4 h-4" />
                Collection
              </TabsTrigger>
              <TabsTrigger value="valuation" className="flex-1 gap-2">
                <TrendingUp className="w-4 h-4" />
                Valorisation
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Content based on view mode */}
        <AnimatePresence mode="wait">
          {viewMode === "collection" ? (
            <motion.div
              key="collection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {loading ? (
                <div className="space-y-6">
                  <CollectionHeaderSkeleton />
                  <MovieGridSkeleton count={8} columns={4} />
                </div>
              ) : physicalMovies.length === 0 ? (
                <EmptyCollection onAddMovie={() => setAddSheetOpen(true)} />
              ) : (
                <>
                  {/* Sticky Filter Bar */}
                  <StickyFilterBar
                    activeFilterCount={activeFilterCount}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={setSortBy}
                    onFilterClick={() => setFiltersOpen(true)}
                    displayMode={displayMode}
                    onDisplayModeChange={setDisplayMode}
                  />

                  {/* Selection action bar */}
                  {selectionMode && selectedIds.size > 0 && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="fixed bottom-20 left-4 right-4 z-40 p-4 bg-card border border-border rounded-2xl shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirmOpen(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Movies Grid */}
                  <div className={cn(
                    "grid gap-4 mt-4",
                    displayMode === "grid" && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
                    displayMode === "poster" && "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
                    displayMode === "list" && "grid-cols-1"
                  )}>
                    <AnimatePresence>
                      {sortedMovies.map((movie, index) => (
                        <CollectionMovieCard
                          key={movie.id}
                          movie={movie}
                          details={physicalMovieDetails[movie.tmdb_id]}
                          isSelected={selectedIds.has(movie.id)}
                          selectionMode={selectionMode}
                          onSelect={() => toggleSelection(movie.id)}
                          onEdit={() => handleEditMovie(movie)}
                          onClick={() => navigate(`/movie/${movie.tmdb_id}`)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="valuation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ValuationDashboardPremium
                movies={physicalMovies}
                movieDetails={physicalMovieDetails}
                valuationData={valuationData}
                isLoading={valuationLoading}
                onRefresh={refreshValuation}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB - Only show when not in selection mode */}
      {!selectionMode && viewMode === "collection" && (
        <FloatingActionButton
          actions={[
            {
              icon: Search,
              label: "Rechercher un film",
              onClick: () => setAddSheetOpen(true),
              color: "bg-blue-500/20",
            },
            {
              icon: Scan,
              label: "Scanner un code-barres",
              onClick: () => setScannerOpen(true),
              color: "bg-green-500/20",
            },
          ]}
        />
      )}

      {/* Add Movie Bottom Sheet */}
      <AddMovieSheet
        isOpen={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onMovieAdded={handleMovieAdded}
      />

      {/* Barcode Scanner */}
      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onMoviesSelected={handleMovieAdded}
      />

      {/* Edit Dialog */}
      <EditPhysicalMovieDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        physicalMovie={editingMovie}
        movieDetails={editingMovieDetails}
        onMovieUpdated={fetchPhysicalMovies}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedIds.size} film{selectedIds.size > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les films sélectionnés seront définitivement supprimés.
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
    </AnimatedPage>
  );
}
