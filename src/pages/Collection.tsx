/**
 * CineVault - Collection Page CORRIGÉE
 *
 * FIX: Onglet Valorisation fonctionnel
 * - Utilisation correcte du hook useCollectionValuation
 * - Passage des props valuation et moviePrices au dashboard
 *
 * AMÉLIORATIONS PRÉCÉDENTES:
 * - CTA engageant en haut de page
 * - Navigation Collection/Valorisation/Wishlist
 * - Vue "Mur de posters" ajoutée
 * - Recherche locale dans la collection
 * - Fix padding mobile pour header
 * - Dialog d'édition au clic sur un film
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
  formatLabels,
} from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, Movie, getImageUrl } from "@/services/tmdb";
import { CollectionShowcase } from "@/components/guest/CollectionShowcase";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { BarcodeScannerDialog } from "@/components/barcode";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import { ShelfView } from "@/components/collection/ShelfView";
import { PosterWallView } from "@/components/collection/PosterWallView";
import { CollectionFiltersDrawer, ActiveFiltersBar } from "@/components/collection/CollectionFilters";
import { CollectionCTA } from "@/components/collection/CollectionCTA";

// Valuation & Wishlist imports
import { ValuationDashboardPremium } from "@/components/collection/ValuationDashboardPremium";
import { WishlistView } from "@/components/collection/WishlistView";
import { useCollectionValuation } from "@/hooks/useCollectionValuation";

import { AnimatedPage } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { showXPToast } from "@/components/gamification/XPToast";

import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  ArrowUpDown,
  Library,
  ChevronDown,
  Scan,
  TrendingUp,
  Trash2,
  X,
  Film,
  Star,
  Search,
  Grid3X3,
  LayoutGrid,
  Heart,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

// Types
type SortBy = "title" | "year" | "price" | "added" | "condition" | "format";
type SortOrder = "asc" | "desc";
type ViewMode = "collection" | "valuation" | "wishlist";
type DisplayMode = "shelf" | "grid" | "poster";

interface ExtendedMovieDetails extends MovieDetails {
  director?: string;
}

const sortLabels: Record<SortBy, string> = {
  title: "Titre",
  year: "Année",
  price: "Prix",
  added: "Récent",
  condition: "État",
  format: "Format",
};

const FORMAT_CONFIG: Record<PhysicalFormat, { label: string; color: string }> = {
  dvd: { label: "DVD", color: "bg-slate-500" },
  bluray: { label: "Blu-ray", color: "bg-blue-600" },
  "4k": { label: "4K UHD", color: "bg-purple-600" },
  steelbook: { label: "Steelbook", color: "bg-amber-600" },
  collector: { label: "Collector", color: "bg-red-600" },
};

// ============================================
// Navigation Tabs Component
// ============================================
const NavigationTabs = ({
  viewMode,
  onViewModeChange,
  collectionCount,
  wishlistCount,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  collectionCount: number;
  wishlistCount: number;
}) => {
  const tabs = [
    { id: "collection" as ViewMode, label: "Collection", icon: Library, count: collectionCount },
    { id: "valuation" as ViewMode, label: "Valorisation", icon: TrendingUp },
    { id: "wishlist" as ViewMode, label: "Wishlist", icon: Heart, count: wishlistCount },
  ];

  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-xl backdrop-blur-sm">
      {tabs.map((tab) => {
        const isActive = viewMode === tab.id;
        const Icon = tab.icon;

        return (
          <motion.button
            key={tab.id}
            onClick={() => onViewModeChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <Badge variant={isActive ? "secondary" : "outline"} className="ml-1 h-5 min-w-[20px] text-xs">
                {tab.count}
              </Badge>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// ============================================
// Display Mode Toggle Component
// ============================================
const DisplayModeToggle = ({
  displayMode,
  onDisplayModeChange,
}: {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}) => {
  const modes = [
    { id: "shelf" as DisplayMode, icon: LayoutGrid, label: "Étagère" },
    { id: "grid" as DisplayMode, icon: Grid3X3, label: "Grille" },
    { id: "poster" as DisplayMode, icon: ImageIcon, label: "Posters" },
  ];

  return (
    <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = displayMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onDisplayModeChange(mode.id)}
            className={cn(
              "p-2 rounded-md transition-all",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
            title={mode.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// Movie Grid Card Component
// ============================================
const MovieGridCard = ({
  movie,
  details,
  isSelected,
  selectionMode,
  onToggleSelect,
  onEdit,
}: {
  movie: PhysicalMovie;
  details: MovieDetails | null;
  isSelected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}) => {
  const formatConfig = FORMAT_CONFIG[movie.format] || { label: movie.format, color: "bg-gray-500" };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "relative group cursor-pointer rounded-xl overflow-hidden bg-card border border-border/50",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300",
        isSelected && "ring-2 ring-primary",
      )}
      onClick={selectionMode ? onToggleSelect : onEdit}
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative overflow-hidden">
        {details?.poster_path ? (
          <img
            src={getImageUrl(details.poster_path, "w342")}
            alt={details.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Film className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Format Badge */}
        <Badge className={cn("absolute top-2 right-2 text-xs font-medium", formatConfig.color)}>
          {formatConfig.label}
        </Badge>

        {/* Selection Indicator */}
        {selectionMode && (
          <div
            className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center",
              isSelected ? "bg-primary border-primary" : "bg-black/50 border-white/50",
            )}
          >
            {isSelected && <X className="w-4 h-4 text-white" />}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{details?.title || `Film #${movie.tmdb_id}`}</h3>
        {details?.release_date && (
          <p className="text-xs text-muted-foreground">{new Date(details.release_date).getFullYear()}</p>
        )}
        {movie.price && <p className="text-xs text-primary font-medium mt-1">{movie.price.toFixed(2)} €</p>}
      </div>
    </motion.div>
  );
};

// ============================================
// Main Collection Page
// ============================================
const Collection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // States
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, MovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("collection");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("shelf");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("added");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PhysicalMovie | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<PhysicalMovie | null>(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Wishlist count (placeholder - à remplacer par le vrai hook)
  const [wishlistCount, setWishlistCount] = useState(0);

  // Filters hook
  const { filters, setFilters, resetFilters, hasActiveFilters, activeFilterCount } = useCollectionFilters();

  // ============================================
  // VALUATION HOOK - LA CLÉ DU FIX
  // ============================================
  const {
    valuation,
    moviePrices,
    loading: valuationLoading,
    refreshing: valuationRefreshing,
    lastUpdated: valuationLastUpdated,
    refresh: refreshValuation,
  } = useCollectionValuation({
    movies: physicalMovies,
    movieDetails: physicalMovieDetails,
    autoRefresh: false,
  });

  // Load collection
  const loadCollection = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const movies = await getPhysicalMovies(user.id);
      setPhysicalMovies(movies);

      // Load movie details
      const detailsMap: Record<number, MovieDetails> = {};
      await Promise.all(
        movies.map(async (movie) => {
          try {
            const details = await getMovieDetails(movie.tmdb_id);
            if (details) {
              detailsMap[movie.tmdb_id] = details;
            }
          } catch (error) {
            console.error(`Error loading details for ${movie.tmdb_id}:`, error);
          }
        }),
      );
      setPhysicalMovieDetails(detailsMap);
    } catch (error) {
      console.error("Error loading collection:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...physicalMovies];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((movie) => {
        const details = physicalMovieDetails[movie.tmdb_id];
        return details?.title?.toLowerCase().includes(query);
      });
    }

    // Apply format filter
    if (filters.formats.length > 0) {
      result = result.filter((movie) => filters.formats.includes(movie.format));
    }

    // Apply condition filter
    if (filters.conditions.length > 0) {
      result = result.filter((movie) => movie.condition && filters.conditions.includes(movie.condition));
    }

    // Sort
    result.sort((a, b) => {
      const detailsA = physicalMovieDetails[a.tmdb_id];
      const detailsB = physicalMovieDetails[b.tmdb_id];

      let comparison = 0;

      switch (sortBy) {
        case "title":
          comparison = (detailsA?.title || "").localeCompare(detailsB?.title || "");
          break;
        case "year":
          const yearA = detailsA?.release_date ? new Date(detailsA.release_date).getFullYear() : 0;
          const yearB = detailsB?.release_date ? new Date(detailsB.release_date).getFullYear() : 0;
          comparison = yearA - yearB;
          break;
        case "price":
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case "added":
          comparison = new Date(a.added_at || 0).getTime() - new Date(b.added_at || 0).getTime();
          break;
        case "format":
          comparison = a.format.localeCompare(b.format);
          break;
        default:
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [physicalMovies, physicalMovieDetails, searchQuery, filters, sortBy, sortOrder]);

  // Handlers
  const handleEditMovie = (movie: PhysicalMovie) => {
    setEditingMovie(movie);
  };

  const handleDeleteMovie = async (movie: PhysicalMovie) => {
    if (!user) return;

    try {
      await deletePhysicalMovie(movie.id);
      setPhysicalMovies((prev) => prev.filter((m) => m.id !== movie.id));
      setMovieToDelete(null);
      toast({
        title: "Film supprimé",
        description: "Le film a été retiré de votre collection",
      });
    } catch (error) {
      console.error("Error deleting movie:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le film",
        variant: "destructive",
      });
    }
  };

  const handleMovieAdded = (movie: PhysicalMovie) => {
    setPhysicalMovies((prev) => [movie, ...prev]);
    loadCollection(); // Reload to get details
    showXPToast(10, "Film ajouté !");
  };

  const handleMovieUpdated = (updatedMovie: PhysicalMovie) => {
    setPhysicalMovies((prev) => prev.map((m) => (m.id === updatedMovie.id ? updatedMovie : m)));
    setEditingMovie(null);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      await Promise.all(Array.from(selectedIds).map((id) => deletePhysicalMovie(id)));
      setPhysicalMovies((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
      toast({
        title: "Films supprimés",
        description: `${selectedIds.size} film(s) supprimé(s) de votre collection`,
      });
    } catch (error) {
      console.error("Error bulk deleting:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les films",
        variant: "destructive",
      });
    }
  };

  // Prepare movies data for valuation dashboard
  const valuationMovies = useMemo(() => {
    return filteredAndSortedMovies.map((m) => {
      const details = physicalMovieDetails[m.tmdb_id];
      return {
        tmdbId: m.tmdb_id,
        title: details?.title || `Film #${m.tmdb_id}`,
        format: m.format,
        posterPath: details?.poster_path,
        purchasePrice: m.price ? Math.round(m.price * 100) : undefined, // Convert to cents
        releaseYear: details?.release_date ? new Date(details.release_date).getFullYear() : undefined,
      };
    });
  }, [filteredAndSortedMovies, physicalMovieDetails]);

  // Guest view
  if (!user) {
    return <CollectionShowcase />;
  }

  // Loading state
  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex flex-col bg-background">
          <Header />
          <main className="flex-1 container mx-auto px-4 pt-20 pb-24">
            <div className="space-y-6">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-10 w-full max-w-md" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
                ))}
              </div>
            </div>
          </main>
          <BottomNav />
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 pt-20 pb-24">
          {/* CTA Section */}
          <CollectionCTA
            movieCount={physicalMovies.length}
            onAddClick={() => setShowAddDialog(true)}
            onScanClick={() => setShowBarcodeScanner(true)}
          />

          {/* Navigation Tabs */}
          <div className="mt-6 mb-6">
            <NavigationTabs
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              collectionCount={physicalMovies.length}
              wishlistCount={wishlistCount}
            />
          </div>

          {/* Content based on view mode */}
          <AnimatePresence mode="wait">
            {viewMode === "collection" ? (
              <motion.div
                key="collection"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Collection Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  {/* Search */}
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher dans ma collection..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2">
                    <DisplayModeToggle displayMode={displayMode} onDisplayModeChange={setDisplayMode} />

                    {/* Sort Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ArrowUpDown className="w-4 h-4 mr-2" />
                          {sortLabels[sortBy]}
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {Object.entries(sortLabels).map(([key, label]) => (
                          <DropdownMenuItem
                            key={key}
                            onClick={() => {
                              if (sortBy === key) {
                                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                              } else {
                                setSortBy(key as SortBy);
                                setSortOrder("desc");
                              }
                            }}
                          >
                            {label}
                            {sortBy === key && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({sortOrder === "asc" ? "↑" : "↓"})
                              </span>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Add Button */}
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <ActiveFiltersBar
                    filters={filters}
                    onRemoveFilter={(type, value) => {
                      if (type === "format") {
                        setFilters({
                          ...filters,
                          formats: filters.formats.filter((f) => f !== value),
                        });
                      } else if (type === "condition") {
                        setFilters({
                          ...filters,
                          conditions: filters.conditions.filter((c) => c !== value),
                        });
                      }
                    }}
                    onResetFilters={resetFilters}
                  />
                )}

                {/* Results Count */}
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {filteredAndSortedMovies.length} résultat{filteredAndSortedMovies.length !== 1 ? "s" : ""} pour "
                    {searchQuery}"
                  </p>
                )}

                {/* Movies Display */}
                <div className="mt-4">
                  {displayMode === "shelf" ? (
                    <ShelfView
                      movies={filteredAndSortedMovies}
                      movieDetailsMap={physicalMovieDetails}
                      onMovieClick={(pm) => handleEditMovie(pm)}
                      selectionMode={selectionMode}
                      selectedIds={selectedIds}
                    />
                  ) : displayMode === "poster" ? (
                    <PosterWallView
                      movies={filteredAndSortedMovies}
                      movieDetailsMap={physicalMovieDetails}
                      onMovieClick={(pm) => handleEditMovie(pm)}
                    />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <AnimatePresence>
                        {filteredAndSortedMovies.map((movie) => (
                          <MovieGridCard
                            key={movie.id}
                            movie={movie}
                            details={physicalMovieDetails[movie.tmdb_id] || null}
                            isSelected={selectedIds.has(movie.id)}
                            selectionMode={selectionMode}
                            onToggleSelect={() => toggleSelection(movie.id)}
                            onEdit={() => handleEditMovie(movie)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {filteredAndSortedMovies.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Film className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {searchQuery ? "Aucun résultat" : "Votre collection est vide"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery
                        ? "Essayez avec d'autres termes de recherche"
                        : "Commencez par ajouter vos premiers films"}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un film
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            ) : viewMode === "valuation" ? (
              <motion.div
                key="valuation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* ============================================
                    FIX: Passage correct des props au ValuationDashboard
                    ============================================ */}
                <ValuationDashboardPremium
                  valuation={valuation}
                  movies={valuationMovies}
                  moviePrices={moviePrices}
                  loading={valuationLoading}
                  refreshing={valuationRefreshing}
                  lastUpdated={valuationLastUpdated}
                  onRefresh={refreshValuation}
                  onMovieClick={(tmdbId) => {
                    const movie = physicalMovies.find((m) => m.tmdb_id === tmdbId);
                    if (movie) {
                      handleEditMovie(movie);
                    }
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <WishlistView />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selection Mode Bar */}
          {selectionMode && selectedIds.size > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-20 left-0 right-0 px-4 z-50"
            >
              <div className="container mx-auto">
                <div className="bg-destructive/90 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between shadow-lg">
                  <span className="text-white font-medium">
                    {selectedIds.size} film{selectedIds.size > 1 ? "s" : ""} sélectionné
                    {selectedIds.size > 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectionMode(false);
                        setSelectedIds(new Set());
                      }}
                      className="text-white hover:bg-white/20"
                    >
                      Annuler
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleBulkDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>

        <BottomNav />

        {/* Dialogs */}
        <AddPhysicalMovieDialog open={showAddDialog} onOpenChange={setShowAddDialog} onMovieAdded={handleMovieAdded} />

        <BarcodeScannerDialog
          open={showBarcodeScanner}
          onOpenChange={setShowBarcodeScanner}
          onMovieFound={(movie) => {
            setShowBarcodeScanner(false);
            // Handle barcode found movie
          }}
        />

        {editingMovie && (
          <EditPhysicalMovieDialog
            open={!!editingMovie}
            onOpenChange={(open) => !open && setEditingMovie(null)}
            movie={editingMovie}
            movieDetails={physicalMovieDetails[editingMovie.tmdb_id]}
            onMovieUpdated={handleMovieUpdated}
            onDelete={() => setMovieToDelete(editingMovie)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!movieToDelete} onOpenChange={(open) => !open && setMovieToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce film ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le film sera définitivement retiré de votre collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => movieToDelete && handleDeleteMovie(movieToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AnimatedPage>
  );
};

export default Collection;
