/**
 * CineVault — Collection Page Complète
 *
 * Page de collection avec tous les onglets:
 * - Grille (vue par défaut)
 * - Étagère (shelf view)
 * - Valorisation (valuation dashboard)
 * - Wishlist
 *
 * Design: Radical Minimalist + Premium
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { ShelfView } from "@/components/collection/ShelfView";
import { ValuationDashboardPremium } from "@/components/collection/ValuationDashboardPremium";
import { WishlistView } from "@/components/collection/WishlistView";
import { CollectionFiltersDrawer, ActiveFiltersBar } from "@/components/collection/CollectionFilters";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import { useCollectionValuation } from "@/hooks/useCollectionValuation";
import { useAuth } from "@/contexts/AuthContext";
import { getPhysicalMovies, PhysicalMovie, PhysicalFormat, deletePhysicalMovie } from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, Movie, getImageUrl } from "@/services/tmdb";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  X,
  SlidersHorizontal,
  Grid3X3,
  BookOpen,
  TrendingUp,
  Heart,
  RefreshCw,
  Share2,
  MoreVertical,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

// Types pour les onglets
type CollectionTab = "grid" | "shelf" | "valuation" | "wishlist";

export default function Collection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to grid
  const initialTab = (searchParams.get("tab") as CollectionTab) || "grid";

  // State
  const [activeTab, setActiveTab] = useState<CollectionTab>(initialTab);
  const [movies, setMovies] = useState<PhysicalMovie[]>([]);
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PhysicalMovie | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Filter hooks
  const {
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
    setFilterOptions,
  } = useCollectionFilters();

  // Valuation hook
  const {
    valuation,
    moviePrices,
    loading: valuationLoading,
    refreshing,
    lastUpdated,
    refresh: refreshValuation,
  } = useCollectionValuation({
    movies,
    movieDetails,
    autoRefresh: false,
  });

  // Load collection
  const loadCollection = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const collection = await getPhysicalMovies(user.id);
      setMovies(collection);

      // Load movie details
      const detailsMap: Record<number, MovieDetails> = {};
      const genres = new Set<string>();
      const decades = new Set<string>();
      const directors = new Set<string>();
      let minPrice = Infinity;
      let maxPrice = 0;

      await Promise.all(
        collection.map(async (pm) => {
          try {
            const details = await getMovieDetails(pm.tmdb_id);
            if (details) {
              detailsMap[pm.tmdb_id] = details;

              // Collect filter options
              details.genres?.forEach((g) => genres.add(g.name));

              if (details.release_date) {
                const year = new Date(details.release_date).getFullYear();
                const decade = `${Math.floor(year / 10) * 10}s`;
                decades.add(decade);
              }

              // Get director from credits
              const director = details.credits?.crew?.find((c) => c.job === "Director");
              if (director) {
                directors.add(director.name);
              }
            }

            // Track price range
            if (pm.price) {
              minPrice = Math.min(minPrice, pm.price);
              maxPrice = Math.max(maxPrice, pm.price);
            }
          } catch (e) {
            console.error(`Failed to load details for ${pm.tmdb_id}`);
          }
        }),
      );

      setMovieDetails(detailsMap);

      // Update filter options
      setFilterOptions({
        genres: Array.from(genres).sort(),
        decades: Array.from(decades).sort().reverse(),
        directors: Array.from(directors).sort(),
        priceRange: {
          min: minPrice === Infinity ? 0 : minPrice,
          max: maxPrice === 0 ? 100 : maxPrice,
        },
      });
    } catch (error) {
      console.error("Failed to load collection:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, setFilterOptions]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== "grid") {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  // Filter and search movies
  const filteredMovies = useMemo(() => {
    let result = movies;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((movie) => {
        const details = movieDetails[movie.tmdb_id];
        return details?.title?.toLowerCase().includes(query);
      });
    }

    // Apply format filter
    if (filters.formats.length > 0) {
      result = result.filter((m) => filters.formats.includes(m.format));
    }

    // Apply condition filter
    if (filters.conditions.length > 0) {
      result = result.filter((m) => m.condition && filters.conditions.includes(m.condition));
    }

    // Apply genre filter
    if (filters.genres.length > 0) {
      result = result.filter((m) => {
        const details = movieDetails[m.tmdb_id];
        return details?.genres?.some((g) => filters.genres.includes(g.name));
      });
    }

    // Apply decade filter
    if (filters.decades.length > 0) {
      result = result.filter((m) => {
        const details = movieDetails[m.tmdb_id];
        if (!details?.release_date) return false;
        const year = new Date(details.release_date).getFullYear();
        const decade = `${Math.floor(year / 10) * 10}s`;
        return filters.decades.includes(decade);
      });
    }

    // Apply director filter
    if (filters.directors.length > 0) {
      result = result.filter((m) => {
        const details = movieDetails[m.tmdb_id];
        const director = details?.credits?.crew?.find((c) => c.job === "Director");
        return director && filters.directors.includes(director.name);
      });
    }

    // Apply price range
    if (filters.priceMin !== null || filters.priceMax !== null) {
      result = result.filter((m) => {
        if (!m.price) return filters.priceMin === null;
        if (filters.priceMin !== null && m.price < filters.priceMin) return false;
        if (filters.priceMax !== null && m.price > filters.priceMax) return false;
        return true;
      });
    }

    return result;
  }, [movies, movieDetails, searchQuery, filters]);

  // Handlers
  const handleMovieClick = (movie: PhysicalMovie) => {
    setEditingMovie(movie);
  };

  const handleMovieUpdated = () => {
    loadCollection();
    setEditingMovie(null);
  };

  const handleMovieAdded = () => {
    loadCollection();
    setShowAddDialog(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as CollectionTab);
  };

  // Guest view
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-display text-display-md text-white mb-4">SIGN IN TO VIEW</h1>
          <p className="text-white/50 mb-8">Create an account to start your collection</p>
          <button onClick={() => navigate("/auth")} className="btn-minimal-filled">
            Sign In
          </button>
        </div>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      <main className="pt-4 md:pt-24">
        {/* Header Section */}
        <section className="px-4 md:px-12 py-4 md:py-8">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-display-sm md:text-display-md text-white">COLLECTION</h1>
              <p className="text-white/40 text-sm mt-1">
                {movies.length} {movies.length === 1 ? "film" : "films"}
                {valuation && valuation.totalValueMedian > 0 && (
                  <span className="ml-2 text-green-400">
                    • {(valuation.totalValueMedian / 100).toLocaleString("fr-FR")} €
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  "border border-white/20 transition-all duration-300",
                  showSearch ? "bg-white text-black" : "text-white/50 hover:text-white",
                )}
              >
                {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>

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

              {/* More options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 text-white/50 hover:text-white transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile?tab=sharing")}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager ma collection
                  </DropdownMenuItem>
                  {activeTab === "valuation" && (
                    <DropdownMenuItem onClick={refreshValuation} disabled={refreshing}>
                      <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                      Actualiser les prix
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add button */}
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-white text-black hover:bg-white/90 gap-2 rounded-full"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            </div>
          </div>

          {/* Search input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <Input
                  type="text"
                  placeholder="Rechercher dans ma collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filters bar */}
          {hasActiveFilters && (
            <div className="mb-4">
              <ActiveFiltersBar
                filters={filters}
                toggleFormat={toggleFormat}
                toggleCondition={toggleCondition}
                toggleGenre={toggleGenre}
                toggleDecade={toggleDecade}
                toggleDirector={toggleDirector}
                setPriceRange={setPriceRange}
                resetFilters={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full bg-white/5 border border-white/10 p-1 rounded-xl">
              <TabsTrigger
                value="grid"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black gap-2 rounded-lg"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grille</span>
              </TabsTrigger>
              <TabsTrigger
                value="shelf"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black gap-2 rounded-lg"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Étagère</span>
              </TabsTrigger>
              <TabsTrigger
                value="valuation"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black gap-2 rounded-lg"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Valorisation</span>
              </TabsTrigger>
              <TabsTrigger
                value="wishlist"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black gap-2 rounded-lg relative"
              >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Wishlist</span>
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center bg-red-500 text-[10px]">
                    {wishlistCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Grid Tab */}
            <TabsContent value="grid" className="mt-6">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <MinimalMovieCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredMovies.length === 0 ? (
                <EmptyCollectionState
                  hasFilters={hasActiveFilters || !!searchQuery}
                  onReset={() => {
                    resetFilters();
                    setSearchQuery("");
                  }}
                  onAdd={() => setShowAddDialog(true)}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {filteredMovies.map((pm, index) => {
                    const details = movieDetails[pm.tmdb_id];
                    if (!details) return null;

                    return (
                      <motion.div
                        key={pm.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => handleMovieClick(pm)}
                        className="cursor-pointer"
                      >
                        <MinimalMovieCard
                          movie={details as unknown as Movie}
                          index={index}
                          showFormat
                          format={pm.format}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Shelf Tab */}
            <TabsContent value="shelf" className="mt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : filteredMovies.length === 0 ? (
                <EmptyCollectionState
                  hasFilters={hasActiveFilters || !!searchQuery}
                  onReset={() => {
                    resetFilters();
                    setSearchQuery("");
                  }}
                  onAdd={() => setShowAddDialog(true)}
                />
              ) : (
                <ShelfView
                  movies={filteredMovies}
                  movieDetailsMap={movieDetails}
                  onMovieClick={(pm, details) => handleMovieClick(pm)}
                />
              )}
            </TabsContent>

            {/* Valuation Tab */}
            <TabsContent value="valuation" className="mt-6">
              <ValuationDashboardPremium
                valuation={valuation}
                movies={movies.map((m) => ({
                  tmdbId: m.tmdb_id,
                  title: movieDetails[m.tmdb_id]?.title || `Film #${m.tmdb_id}`,
                  format: m.format,
                  posterPath: movieDetails[m.tmdb_id]?.poster_path,
                  purchasePrice: m.price || undefined,
                  releaseYear: movieDetails[m.tmdb_id]?.release_date
                    ? new Date(movieDetails[m.tmdb_id].release_date).getFullYear()
                    : undefined,
                }))}
                moviePrices={moviePrices}
                loading={valuationLoading}
                refreshing={refreshing}
                lastUpdated={lastUpdated}
                onRefresh={refreshValuation}
                onMovieClick={(tmdbId) => {
                  const movie = movies.find((m) => m.tmdb_id === tmdbId);
                  if (movie) handleMovieClick(movie);
                }}
              />
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="mt-6">
              <WishlistView onCountChange={setWishlistCount} />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {/* Dialogs */}
      {editingMovie && (
        <EditPhysicalMovieDialog
          movie={editingMovie}
          movieDetails={movieDetails[editingMovie.tmdb_id] || null}
          open={!!editingMovie}
          onOpenChange={(open) => !open && setEditingMovie(null)}
          onUpdated={handleMovieUpdated}
          onDeleted={handleMovieUpdated}
        />
      )}

      <AddPhysicalMovieDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdded={handleMovieAdded} />

      <FloatingDock />
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================
const EmptyCollectionState = ({
  hasFilters,
  onReset,
  onAdd,
}: {
  hasFilters: boolean;
  onReset: () => void;
  onAdd: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
      <Grid3X3 className="w-10 h-10 text-white/20" />
    </div>

    {hasFilters ? (
      <>
        <h3 className="text-xl font-display font-bold text-white mb-2">Aucun résultat</h3>
        <p className="text-white/50 mb-6 max-w-sm">Aucun film ne correspond à vos critères de recherche.</p>
        <Button onClick={onReset} variant="outline" className="border-white/20 text-white">
          Réinitialiser les filtres
        </Button>
      </>
    ) : (
      <>
        <h3 className="text-xl font-display font-bold text-white mb-2">Commencez votre collection</h3>
        <p className="text-white/50 mb-6 max-w-sm">
          Ajoutez votre premier DVD, Blu-ray ou 4K pour commencer à suivre votre collection.
        </p>
        <Button onClick={onAdd} className="bg-white text-black hover:bg-white/90 gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un film
        </Button>
      </>
    )}
  </div>
);
