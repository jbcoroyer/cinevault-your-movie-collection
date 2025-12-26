/**
 * CineVault - Collection Page
 *
 * Page de collection avec:
 * - Vue par défaut: Étagère (shelf)
 * - Ordre des onglets: Étagère → Grille → Valorisation → Wishlist
 * - Vue Posters supprimée
 * - MinimalHeader + FloatingDock
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { PhysicalMovie, PhysicalFormat, getPhysicalMovies, formatLabels } from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, getImageUrl } from "@/services/tmdb";
import { useCollectionFilters } from "@/hooks/useCollectionFilters";
import { useCollectionValuation } from "@/hooks/useCollectionValuation";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { ShelfView } from "@/components/collection/ShelfView";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { CollectionFiltersDrawer } from "@/components/collection/CollectionFilters";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { ValuationDashboardPremium } from "@/components/collection/ValuationDashboardPremium";
import { WishlistView } from "@/components/collection/WishlistView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { cn } from "@/lib/utils";
import {
  Plus,
  ArrowUpDown,
  Library,
  ChevronDown,
  TrendingUp,
  X,
  Search,
  Grid3X3,
  BookOpen,
  Heart,
  Share2,
} from "lucide-react";
import { Movie } from "@/services/tmdb";

// Types pour les onglets - ordre modifié, poster supprimé
type CollectionTab = "shelf" | "grid" | "valuation" | "wishlist";

// Ordre des onglets
const TAB_ORDER: CollectionTab[] = ["shelf", "grid", "valuation", "wishlist"];

export default function Collection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get tab from URL or default to shelf (nouvelle valeur par défaut)
  const initialTab = (searchParams.get("tab") as CollectionTab) || "shelf";

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
    filteredMovies: hookFilteredMovies,
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
  } = useCollectionFilters(movies, movieDetails);

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
      const physicalMovies = await getPhysicalMovies(user.id);
      setMovies(physicalMovies);

      // Load movie details
      const detailsPromises = physicalMovies.map((pm) => getMovieDetails(pm.tmdb_id).catch(() => null));
      const detailsResults = await Promise.all(detailsPromises);

      const detailsMap: Record<number, MovieDetails> = {};
      physicalMovies.forEach((pm, index) => {
        if (detailsResults[index]) {
          detailsMap[pm.tmdb_id] = detailsResults[index]!;
        }
      });
      setMovieDetails(detailsMap);
    } catch (error) {
      console.error("Error loading collection:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    const newTab = tab as CollectionTab;
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Filter movies by search query
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return hookFilteredMovies;

    const query = searchQuery.toLowerCase();
    return hookFilteredMovies.filter((pm) => {
      const details = movieDetails[pm.tmdb_id];
      if (!details) return false;
      return (
        details.title.toLowerCase().includes(query) || (details.original_title?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [hookFilteredMovies, searchQuery, movieDetails]);

  // Handle movie click
  const handleMovieClick = (movie: PhysicalMovie) => {
    setEditingMovie(movie);
  };

  // Handle movie updated
  const handleMovieUpdated = () => {
    loadCollection();
    setEditingMovie(null);
  };

  // Handle movie added
  const handleMovieAdded = () => {
    loadCollection();
    setShowAddDialog(false);
  };

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12">
          <div className="flex flex-col items-center justify-center py-20">
            <Library className="w-16 h-16 text-white/20 mb-4" />
            <h2 className="text-xl font-display text-white mb-2">Connectez-vous pour voir votre collection</h2>
            <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90">
              Se connecter
            </Button>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-12">
        {/* Header Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Ma Collection</h1>
              {movies.length > 0 && (
                <Badge variant="secondary" className="bg-white/10 text-white border-0">
                  {movies.length} film{movies.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "p-2 rounded-full transition-colors",
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
        </section>

        {/* Tabs Section - Nouvel ordre: Étagère → Grille → Valorisation → Wishlist */}
        <section>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full bg-white/5 border border-white/10 p-1 rounded-xl mb-6">
              <TabsTrigger
                value="shelf"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black gap-2 rounded-lg"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Étagère</span>
              </TabsTrigger>
              <TabsTrigger
                value="grid"
                className="flex-1 data-[state=active]:bg-white data-[state=active]:text-black gap-2 rounded-lg"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Grille</span>
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

            {/* Shelf Tab (Default) */}
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
          physicalMovie={editingMovie}
          movieDetails={movieDetails[editingMovie.tmdb_id] || null}
          open={!editingMovie}
          onOpenChange={(open) => !open && setEditingMovie(null)}
          onMovieUpdated={handleMovieUpdated}
        />
      )}

      <AddPhysicalMovieDialog open={showAddDialog} onOpenChange={setShowAddDialog} onMovieAdded={handleMovieAdded} />

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
