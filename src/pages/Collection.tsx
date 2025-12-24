/**
 * CineVault — Radical Minimalist Collection Page
 * 
 * Design principles:
 * - Mobile-first grid (2 cols mobile, 6-8 cols desktop)
 * - Poster-only cards
 * - Sheet/Drawer for details on mobile
 * - Dialog/Modal for details on desktop
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  getPhysicalMovies,
  PhysicalMovie,
  PhysicalFormat,
  deletePhysicalMovie,
} from "@/services/physicalMovies";
import { getMovieDetails, MovieDetails, Movie } from "@/services/tmdb";
import { EditPhysicalMovieDialog } from "@/components/EditPhysicalMovieDialog";
import { AddPhysicalMovieDialog } from "@/components/AddPhysicalMovieDialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Plus, Search, X, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Collection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // State
  const [movies, setMovies] = useState<PhysicalMovie[]>([]);
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetails>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [editingMovie, setEditingMovie] = useState<PhysicalMovie | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Load collection
  const loadCollection = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getPhysicalMovies(user.id);
      setMovies(data);

      // Load movie details
      const detailsMap: Record<number, MovieDetails> = {};
      await Promise.all(
        data.map(async (movie) => {
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
      setMovieDetails(detailsMap);
    } catch (error) {
      console.error("Error loading collection:", error);
      toast({
        title: "Error",
        description: "Failed to load your collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Filter movies
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    
    const query = searchQuery.toLowerCase();
    return movies.filter((movie) => {
      const details = movieDetails[movie.tmdb_id];
      return details?.title?.toLowerCase().includes(query);
    });
  }, [movies, movieDetails, searchQuery]);

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
  };

  // Guest view
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-display text-display-md text-white mb-4">
            SIGN IN TO VIEW
          </h1>
          <p className="text-white/50 mb-8">
            Create an account to start your collection
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="btn-minimal-filled"
          >
            Sign In
          </button>
        </div>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <MinimalHeader />

      <main className="pt-4 md:pt-24">
        {/* Header Section */}
        <section className="px-4 md:px-12 py-8 md:py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="font-display text-display-md md:text-display-lg text-white">
                COLLECTION
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {movies.length} {movies.length === 1 ? 'film' : 'films'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search toggle */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center",
                  "border border-white/20 transition-all duration-300",
                  showSearch ? "bg-white text-black" : "text-white/50 hover:text-white"
                )}
              >
                {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Add button */}
              <button
                onClick={() => setShowAddDialog(true)}
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center",
                  "bg-white text-black",
                  "transition-all duration-300 hover:bg-white/90"
                )}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Search your collection..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="input-minimal w-full text-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          {loading ? (
            <div className={cn(
              "grid gap-3 md:gap-4",
              "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
            )}>
              {Array.from({ length: 12 }).map((_, i) => (
                <MinimalMovieCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredMovies.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "border border-white/10 rounded-xl md:rounded-2xl",
                "p-8 md:p-16 text-center"
              )}
            >
              {searchQuery ? (
                <>
                  <p className="text-white/50 mb-4">No results for "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="btn-minimal"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-display text-display-sm text-white mb-4">
                    START COLLECTING
                  </h2>
                  <p className="text-white/50 mb-8 max-w-md mx-auto">
                    Add your first film to begin tracking your physical media collection.
                  </p>
                  <button
                    onClick={() => setShowAddDialog(true)}
                    className="btn-minimal-filled inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Film
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            /* Movie grid */
            <div className={cn(
              "grid gap-3 md:gap-4",
              "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
            )}>
              {filteredMovies.map((movie, index) => {
                const details = movieDetails[movie.tmdb_id];
                if (!details) return null;

                return (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleMovieClick(movie)}
                    className="cursor-pointer"
                  >
                    <MinimalMovieCard
                      movie={details as unknown as Movie}
                      index={index}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Dialogs */}
      <AddPhysicalMovieDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onMovieAdded={handleMovieAdded}
      />

      {editingMovie && (
        <EditPhysicalMovieDialog
          open={!!editingMovie}
          onOpenChange={(open) => !open && setEditingMovie(null)}
          physicalMovie={editingMovie}
          movieDetails={movieDetails[editingMovie.tmdb_id]}
          onMovieUpdated={handleMovieUpdated}
        />
      )}

      <FloatingDock />
    </div>
  );
}
