/**
 * CineVault — Index Page with Tabs (Découvrir / Communauté)
 *
 * Phase 1: Restructuration Navigation
 * - Onglets "Découvrir" et "Communauté" pour les utilisateurs connectés
 * - Intégration du Feed dans la page d'accueil
 * - FAB global pour scan/ajout rapide
 */

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Compass, Users, Scan, Search as SearchIcon, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { Button } from "@/components/ui/button";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { ReviewCard } from "@/components/ReviewCard";
import { EditReviewDialog } from "@/components/EditReviewDialog";
import { LiveActivityFeed } from "@/components/home/LiveActivityFeed";
import { BarcodeScannerDialog } from "@/components/barcode/BarcodeScannerDialog";
import { useReviews, Review } from "@/hooks/useReviews";
import { cn } from "@/lib/utils";
import {
  Movie,
  MovieDetails,
  getPopularMovies,
  getNowPlayingMovies,
  getImageUrl,
  getMovieDetails,
} from "@/services/tmdb";
import { PhysicalMovie, getPhysicalMovies, addPhysicalMovie } from "@/services/physicalMovies";
import { toast } from "@/hooks/use-toast";

// ============================================
// Types
// ============================================

type HomeTab = "discover" | "community";

// ============================================
// Section Header Component
// ============================================

const SectionHeader = ({
  title,
  subtitle,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}) => (
  <div className="flex items-end justify-between mb-4 md:mb-6">
    <div>
      <h2 className="font-display text-lg md:text-xl text-white tracking-wide">{title}</h2>
      {subtitle && <p className="text-sm text-white/40 mt-1">{subtitle}</p>}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="text-sm text-white/50 hover:text-white transition-colors"
      >
        See all →
      </button>
    )}
  </div>
);

// ============================================
// Movie Grid Component
// ============================================

const MovieGrid = ({
  movies,
  loading,
  columns = "default",
}: {
  movies: Movie[];
  loading: boolean;
  columns?: "default" | "compact";
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          "grid gap-3 md:gap-4",
          columns === "compact"
            ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        )}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <MinimalMovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-3 md:gap-4",
        columns === "compact"
          ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      )}
    >
      {movies.map((movie, index) => (
        <MinimalMovieCard key={movie.id} movie={movie} index={index} />
      ))}
    </div>
  );
};

// ============================================
// Tab Switcher Component
// ============================================

const TabSwitcher = ({
  activeTab,
  onTabChange,
}: {
  activeTab: HomeTab;
  onTabChange: (tab: HomeTab) => void;
}) => (
  <div className="flex p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 relative">
    {/* Active indicator */}
    <motion.div
      layoutId="activeTabIndicator"
      className="absolute inset-y-1 bg-white rounded-lg"
      initial={false}
      animate={{
        left: activeTab === "discover" ? 4 : "50%",
        right: activeTab === "discover" ? "50%" : 4,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />

    <button
      onClick={() => onTabChange("discover")}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors z-10",
        activeTab === "discover" ? "text-black" : "text-white/60 hover:text-white"
      )}
    >
      <Compass className="w-4 h-4" />
      <span>Découvrir</span>
    </button>

    <button
      onClick={() => onTabChange("community")}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors z-10",
        activeTab === "community" ? "text-black" : "text-white/60 hover:text-white"
      )}
    >
      <Users className="w-4 h-4" />
      <span>Communauté</span>
    </button>
  </div>
);

// ============================================
// Floating Action Button Component
// ============================================

const FloatingActionButton = ({ onScan, onSearch }: { onScan: () => void; onSearch: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Sub-actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.05 }}
              className="absolute bottom-16 right-0 flex flex-col gap-3 items-end"
            >
              <button
                onClick={() => {
                  setIsOpen(false);
                  onScan();
                }}
                className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white"
              >
                <span className="text-sm font-medium">Scanner</span>
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                  <Scan className="w-5 h-5 text-white" />
                </div>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onSearch();
                }}
                className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white"
              >
                <span className="text-sm font-medium">Rechercher</span>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <SearchIcon className="w-5 h-5 text-white" />
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30",
          "bg-gradient-to-br from-amber-500 to-orange-600",
          "transition-transform duration-200",
          isOpen && "rotate-45"
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </div>
  );
};

// ============================================
// Community Tab Content
// ============================================

const CommunityTabContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, fetchAllReviews, fetchFollowingReviews, updateReview, deleteReview } = useReviews();

  const [feedType, setFeedType] = useState<"following" | "global">("following");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
  }, [feedType, user]);

  const loadReviews = async () => {
    let data: Review[] = [];
    if (feedType === "following" && user) {
      data = await fetchFollowingReviews();
    } else {
      data = await fetchAllReviews();
    }
    setReviews(data);
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditDialogOpen(true);
  };

  const handleEditSave = async (data: {
    rating?: number;
    content: string;
    contains_spoilers: boolean;
  }): Promise<boolean> => {
    if (!editingReview) return false;

    const success = await updateReview(editingReview.id, data);
    if (success) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id
            ? {
                ...r,
                rating: data.rating ?? null,
                content: data.content,
                contains_spoilers: data.contains_spoilers,
                updated_at: new Date().toISOString(),
              }
            : r
        )
      );
      setEditingReview(null);
    }
    return success;
  };

  const handleDelete = async (reviewId: string) => {
    const success = await deleteReview(reviewId);
    if (success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Activity Ticker */}
      <LiveActivityFeed speed="normal" className="mx-[-1rem] md:mx-[-3rem]" />

      {/* Feed Type Tabs */}
      {user && (
        <div className="flex p-1 bg-white/5 rounded-xl">
          <button
            onClick={() => setFeedType("following")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
              feedType === "following"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white"
            )}
          >
            <Users className="w-4 h-4" />
            Abonnements
          </button>
          <button
            onClick={() => setFeedType("global")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
              feedType === "global"
                ? "bg-white/10 text-white"
                : "text-white/50 hover:text-white"
            )}
          >
            <Compass className="w-4 h-4" />
            Tous les avis
          </button>
        </div>
      )}

      {/* Reviews List */}
      {loading && reviews.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-white/20 mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">Aucun avis pour le moment</h2>
          <p className="text-white/50 text-sm max-w-sm mx-auto">
            {feedType === "following"
              ? "Les avis des personnes que vous suivez apparaîtront ici."
              : "Soyez le premier à partager votre avis sur un film !"}
          </p>
          {feedType === "following" && (
            <Button
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/10"
              onClick={() => setFeedType("global")}
            >
              Voir tous les avis
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ReviewCard
                review={review}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showMovie={true}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <EditReviewDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingReview(null);
        }}
        existingReview={editingReview}
        onSave={handleEditSave}
      />
    </div>
  );
};

// ============================================
// Discover Tab Content
// ============================================

const DiscoverTabContent = ({
  popular,
  nowPlaying,
  loading,
  myCollection,
  collectionDetails,
}: {
  popular: Movie[];
  nowPlaying: Movie[];
  loading: boolean;
  myCollection: PhysicalMovie[];
  collectionDetails: Record<number, MovieDetails>;
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Live Activity Ticker */}
      <LiveActivityFeed speed="normal" className="mx-[-1rem] md:mx-[-3rem] mb-8" />

      {/* Collection Section */}
      {myCollection.length > 0 && (
        <section className="py-6">
          <SectionHeader
            title="YOUR COLLECTION"
            subtitle={`${myCollection.length} films`}
            onSeeAll={() => navigate("/collection")}
          />

          <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {myCollection.map((pm, index) => {
              const details = collectionDetails[pm.tmdb_id];
              if (!details) return null;

              return (
                <MinimalMovieCard
                  key={pm.id}
                  movie={details as unknown as Movie}
                  index={index}
                  showFormat
                  format={pm.format}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Empty collection CTA */}
      {myCollection.length === 0 && (
        <section className="py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-white/10 rounded-2xl p-8 md:p-12 text-center"
          >
            <h2 className="font-display text-display-sm text-white mb-4">START YOUR COLLECTION</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              Add your first DVD, Blu-ray, or 4K disc to begin tracking your physical media
              collection.
            </p>
            <Button
              onClick={() => navigate("/search")}
              className="bg-white text-black hover:bg-white/90 rounded-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Film
            </Button>
          </motion.div>
        </section>
      )}

      {/* Trending Section */}
      <section className="py-6 md:py-8">
        <SectionHeader title="TRENDING" onSeeAll={() => navigate("/movies/popular")} />
        <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
      </section>

      {/* Now Playing Section */}
      <section className="py-6 md:py-8">
        <SectionHeader title="NOW PLAYING" onSeeAll={() => navigate("/movies/now-playing")} />
        <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
      </section>
    </>
  );
};

// ============================================
// Main Index Component
// ============================================

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<Record<number, MovieDetails>>({});

  // Tab state
  const [activeTab, setActiveTab] = useState<HomeTab>("discover");

  // Scanner dialog state
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [popularMovies, nowPlayingMovies] = await Promise.all([
        getPopularMovies(),
        getNowPlayingMovies(),
      ]);

      setPopular(popularMovies);
      setNowPlaying(nowPlayingMovies);

      if (user) {
        const collection = await getPhysicalMovies(user.id);
        setMyCollection(collection.slice(0, 12));

        // Load details for collection
        const detailsMap: Record<number, MovieDetails> = {};
        await Promise.all(
          collection.slice(0, 12).map(async (pm) => {
            try {
              const details = await getMovieDetails(pm.tmdb_id);
              if (details) {
                detailsMap[pm.tmdb_id] = details;
              }
            } catch (e) {
              console.error(`Failed to load details for ${pm.tmdb_id}`);
            }
          })
        );
        setCollectionDetails(detailsMap);
      }
    } catch (error) {
      console.error("Failed to load movies:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle scanner results
  const handleMoviesSelected = async (
    movies: Array<{ movie: Movie; format: string; ean?: string }>
  ) => {
    if (!user) return;

    let successCount = 0;
    for (const { movie, format } of movies) {
      try {
        await addPhysicalMovie(
          user.id,
          movie.id,
          format as "dvd" | "bluray" | "4k" | "steelbook" | "collector"
        );
        successCount++;
      } catch (error) {
        console.error("Failed to add movie:", error);
      }
    }

    if (successCount > 0) {
      toast({
        title: `${successCount} film${successCount > 1 ? "s" : ""} ajouté${successCount > 1 ? "s" : ""}`,
        description: "Votre collection a été mise à jour.",
      });
      loadData(); // Refresh collection
    }
  };

  // Guest/Unauthenticated view
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-32">
        <MinimalHeader />

        {/* Hero Section */}
        <section className="relative pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-12 overflow-hidden">
          {/* Background poster grid */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-6 md:grid-cols-8 gap-2 transform -rotate-6 scale-110">
              {popular.slice(0, 24).map((movie, i) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-[2/3]"
                >
                  {movie.poster_path && (
                    <img
                      src={getImageUrl(movie.poster_path, "w342") || ""}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Hero content */}
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-display-lg md:text-display-xl text-white mb-6"
            >
              YOUR MOVIES.
              <br />
              <span className="text-white/40">YOUR COLLECTION.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-white/50 mb-8 max-w-2xl mx-auto"
            >
              Track your physical movie collection. Discover new films. Connect with fellow
              collectors.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-white text-black hover:bg-white/90 rounded-full px-8"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/search")}
                className="border-white/20 text-white hover:bg-white/10 rounded-full px-8"
              >
                Explore Movies
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Trending Section */}
        <section className="px-4 md:px-12 py-12 md:py-16">
          <SectionHeader title="TRENDING NOW" onSeeAll={() => navigate("/movies/popular")} />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        {/* Now Playing Section */}
        <section className="px-4 md:px-12 py-12 md:py-16">
          <SectionHeader title="NOW PLAYING" onSeeAll={() => navigate("/movies/now-playing")} />
          <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
        </section>

        <FloatingDock />
      </div>
    );
  }

  // Authenticated user view with tabs
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <MinimalHeader />

      <main className="pt-20 md:pt-24 px-4 md:px-12">
        {/* Tab Switcher */}
        <div className="max-w-md mx-auto mb-6">
          <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "discover" ? (
              <DiscoverTabContent
                popular={popular}
                nowPlaying={nowPlaying}
                loading={loading}
                myCollection={myCollection}
                collectionDetails={collectionDetails}
              />
            ) : (
              <CommunityTabContent />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button (Mobile only) */}
      <FloatingActionButton
        onScan={() => setScannerOpen(true)}
        onSearch={() => navigate("/search")}
      />

      {/* Barcode Scanner Dialog */}
      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onMoviesSelected={handleMoviesSelected}
      />

      <FloatingDock />
    </div>
  );
}
