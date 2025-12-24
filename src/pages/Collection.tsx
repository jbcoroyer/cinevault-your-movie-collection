/**
 * CineVault - Collection Page REFAITE
 * 
 * AMÉLIORATIONS:
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
type DisplayMode = "shelf" | "grid";

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
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs px-1.5 py-0",
                  isActive ? "bg-primary/10 text-primary" : "bg-muted"
                )}
              >
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
// Display Mode Switcher
// ============================================
const DisplayModeSwitcher = ({
  displayMode,
  onDisplayModeChange,
}: {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}) => {
  const modes = [
    { id: "shelf" as DisplayMode, icon: Library, label: "Étagère" },
    { id: "grid" as DisplayMode, icon: Grid3X3, label: "Grille" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onDisplayModeChange(id)}
          className={cn(
            "p-1.5 rounded-md transition-colors flex items-center gap-1.5",
            displayMode === id 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
          title={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

// ============================================
// Movie Grid Card
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
  details: ExtendedMovieDetails | null;
  isSelected: boolean;
  selectionMode: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}) => {
  const formatConfig = FORMAT_CONFIG[movie.format] || FORMAT_CONFIG.dvd;
  const posterUrl = details?.poster_path ? getImageUrl(details.poster_path, "w342") : null;

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect();
    } else {
      onEdit();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer",
        "bg-card border border-border/50",
        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        "transition-all duration-300",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={handleClick}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className={cn(
          "absolute top-2 left-2 z-20 w-6 h-6 rounded-full flex items-center justify-center",
          isSelected 
            ? "bg-primary text-primary-foreground" 
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

// ============================================
// Empty State Component
// ============================================
const EmptyCollection = ({ onAddMovie }: { onAddMovie: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
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
        size="lg"
        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
      >
        <Plus className="w-5 h-5" />
        Ajouter mon premier film
      </Button>
    </motion.div>
  );
};

// ============================================
// Sticky Filter Bar
// ============================================
const StickyFilterBar = ({
  sortBy,
  onSortChange,
  displayMode,
  onDisplayModeChange,
  searchQuery,
  onSearchChange,
  filterProps,
}: {
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterProps: any;
}) => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-16 md:top-0 z-30 py-3 -mx-4 px-4",
        "bg-background/80 backdrop-blur-xl border-b border-border/50"
      )}
    >
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher dans ma collection..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-muted/50 border-0"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        {/* Filter drawer */}
        <CollectionFiltersDrawer {...filterProps} />

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
        <DisplayModeSwitcher
          displayMode={displayMode}
          onDisplayModeChange={onDisplayModeChange}
        />
      </div>

      {/* Active filters bar */}
      {filterProps.hasActiveFilters && (
        <div className="mt-3">
          <ActiveFiltersBar {...filterProps} />
        </div>
      )}
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
  const [displayMode, setDisplayMode] = useState<DisplayMode>("shelf");

  // Collection state
  const [physicalMovies, setPhysicalMovies] = useState<PhysicalMovie[]>([]);
  const [physicalMovieDetails, setPhysicalMovieDetails] = useState<Record<number, ExtendedMovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

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

  // Wishlist count (mock for now)
  const [wishlistCount, setWishlistCount] = useState(0);

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
  const valuationHook = useCollectionValuation({
    movies: physicalMovies,
    movieDetails: physicalMovieDetails,
  });
  const { valuation: valuationData, loading: valuationLoading, refresh: refreshValuation, moviePrices } = valuationHook;

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

  // Filter by search query
  const searchFilteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return filteredMovies;
    
    const query = searchQuery.toLowerCase();
    return filteredMovies.filter(movie => {
      const details = physicalMovieDetails[movie.tmdb_id];
      if (!details) return false;
      
      return (
        details.title?.toLowerCase().includes(query) ||
        details.original_title?.toLowerCase().includes(query) ||
        movie.format.toLowerCase().includes(query)
      );
    });
  }, [filteredMovies, physicalMovieDetails, searchQuery]);

  // Sort filtered movies
  const sortedMovies = useMemo(() => {
    const sorted = [...searchFilteredMovies].sort((a, b) => {
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
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case "format":
          comparison = a.format.localeCompare(b.format);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [searchFilteredMovies, physicalMovieDetails, sortBy, sortOrder]);

  // Show guest view if not logged in
  if (!authLoading && !user) {
    return <CollectionShowcase />;
  }

  return (
    <AnimatedPage className="min-h-screen bg-background pb-24">
      <Header />

      {/* Main content with mobile padding fix */}
      <main className="container mx-auto px-4 pt-20 md:pt-4">
        
        {/* CTA Section - Always visible at top */}
        <CollectionCTA
          onAddToCollection={() => setAddDialogOpen(true)}
          onScanBarcode={() => setScannerOpen(true)}
          totalMovies={physicalMovies.length}
        />

        {/* Stats summary */}
        {physicalMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4 mt-6"
          >
            <div>
              <h1 className="text-2xl font-display font-bold">Ma Collection</h1>
              <p className="text-sm text-muted-foreground">
                {physicalMovies.length} film{physicalMovies.length !== 1 ? 's' : ''} • {" "}
                {Object.entries(FORMAT_CONFIG).map(([format, config]) => {
                  const count = physicalMovies.filter(m => m.format === format).length;
                  return count > 0 ? `${count} ${config.label}` : null;
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
        )}

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <NavigationTabs
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            collectionCount={physicalMovies.length}
            wishlistCount={wishlistCount}
          />
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
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
                    ))}
                  </div>
                </div>
              ) : physicalMovies.length === 0 ? (
                <EmptyCollection onAddMovie={() => setAddDialogOpen(true)} />
              ) : (
                <>
                  {/* Sticky Filter Bar */}
                  <StickyFilterBar
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    displayMode={displayMode}
                    onDisplayModeChange={setDisplayMode}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterProps={{
                      filters,
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
                    }}
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

                  {/* Search results info */}
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {sortedMovies.length} résultat{sortedMovies.length !== 1 ? 's' : ''} pour "{searchQuery}"
                    </p>
                  )}

                  {/* Movies Display */}
                  <div className="mt-4">
                    {displayMode === "shelf" ? (
                      <ShelfView
                        movies={sortedMovies}
                        movieDetailsMap={physicalMovieDetails}
                        onMovieClick={(pm, details) => handleEditMovie(pm)}
                        selectionMode={selectionMode}
                        selectedIds={selectedIds}
                      />
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <AnimatePresence>
                          {sortedMovies.map((movie) => (
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
                </>
              )}
            </motion.div>
          ) : viewMode === "valuation" ? (
            <motion.div
              key="valuation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ValuationDashboardPremium
                valuation={null}
                movies={sortedMovies.map(m => ({
                  tmdbId: m.tmdb_id,
                  title: physicalMovieDetails[m.tmdb_id]?.title || "Film",
                  format: m.format,
                  posterPath: physicalMovieDetails[m.tmdb_id]?.poster_path,
                  purchasePrice: m.price ? m.price * 100 : undefined,
                  releaseYear: physicalMovieDetails[m.tmdb_id]?.release_date 
                    ? new Date(physicalMovieDetails[m.tmdb_id].release_date!).getFullYear()
                    : undefined,
                }))}
                moviePrices={moviePrices}
                loading={valuationLoading}
                onRefresh={refreshValuation}
              />
            </motion.div>
          ) : (
            <motion.div
              key="wishlist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <WishlistView onCountChange={setWishlistCount} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Movie Dialog */}
      <AddPhysicalMovieDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
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
