/**
 * CineVault — Radical Minimalist Home Page
 * 
 * Design principles:
 * - Mobile-first, fluid layout
 * - Monochrome aesthetic
 * - Movie posters as the heroes
 * - Swiss Design typography
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Plus, Play, TrendingUp, Clock, Star } from "lucide-react";
import { MinimalHeader } from "../components/MinimalHeader";
import { FloatingDock } from "../components/FloatingDock";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "../components/MinimalMovieCard";
import { getPopularMovies, getNowPlayingMovies, getUpcomingMovies, Movie, getImageUrl, MovieDetails, getMovieDetails } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { getPhysicalMovies, PhysicalMovie } from "../services/physicalMovies";
import { cn } from "../lib/utils";
import { Button } from "@/components/ui/button";

// Section Header Component
const SectionHeader = ({ 
  title, 
  subtitle,
  onSeeAll 
}: { 
  title: string; 
  subtitle?: string;
  onSeeAll?: () => void;
}) => (
  <div className="flex items-end justify-between mb-6">
    <div>
      <h2 className="font-display text-display-xs md:text-display-sm text-white tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/40 text-sm mt-1">{subtitle}</p>
      )}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
      >
        See all
        <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

// Movie Grid Component
const MovieGrid = ({ 
  movies, 
  loading,
  columns = "default"
}: { 
  movies: Movie[];
  loading?: boolean;
  columns?: "default" | "compact";
}) => {
  if (loading) {
    return (
      <div className={cn(
        "grid gap-3 md:gap-4",
        columns === "compact" 
          ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
      )}>
        {Array.from({ length: 12 }).map((_, i) => (
          <MinimalMovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-3 md:gap-4",
      columns === "compact" 
        ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    )}>
      {movies.map((movie, index) => (
        <MinimalMovieCard
          key={movie.id}
          movie={movie}
          index={index}
        />
      ))}
    </div>
  );
};

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<Record<number, MovieDetails>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [popularMovies, nowPlayingMovies, upcomingMovies] = await Promise.all([
        getPopularMovies(),
        getNowPlayingMovies(),
        getUpcomingMovies(),
      ]);
      
      setPopular(popularMovies);
      setNowPlaying(nowPlayingMovies);
      setUpcoming(upcomingMovies);

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
          }),
        );
        setCollectionDetails(detailsMap);
      }
    } catch (error) {
      console.error("Failed to load movies:", error);
    } finally {
      setLoading(false);
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
                      src={getImageUrl(movie.poster_path, "w342")}
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
              Track your physical movie collection. Discover new films. 
              Connect with fellow collectors.
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
          <SectionHeader 
            title="TRENDING NOW" 
            onSeeAll={() => navigate("/movies/popular")}
          />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        {/* Now Playing Section */}
        <section className="px-4 md:px-12 py-12 md:py-16">
          <SectionHeader 
            title="NOW PLAYING" 
            onSeeAll={() => navigate("/movies/now-playing")}
          />
          <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
        </section>

        <FloatingDock />
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <MinimalHeader />

      <main className="pt-20 md:pt-28">
        {/* Collection Section */}
        {myCollection.length > 0 && (
          <section className="px-4 md:px-12 py-8 md:py-12">
            <SectionHeader 
              title="YOUR COLLECTION" 
              subtitle={`${myCollection.length} films`}
              onSeeAll={() => navigate("/collection")}
            />
            
            <div className={cn(
              "grid gap-3 md:gap-4",
              "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
            )}>
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
          <section className="px-4 md:px-12 py-8 md:py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "border border-white/10 rounded-2xl",
                "p-8 md:p-12 text-center"
              )}
            >
              <h2 className="font-display text-display-sm text-white mb-4">
                START YOUR COLLECTION
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Add your first DVD, Blu-ray, or 4K disc to begin tracking your physical media collection.
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
        <section className="px-4 md:px-12 py-8 md:py-12">
          <SectionHeader 
            title="TRENDING" 
            onSeeAll={() => navigate("/movies/popular")}
          />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        {/* Now Playing Section */}
        <section className="px-4 md:px-12 py-8 md:py-12">
          <SectionHeader 
            title="NOW PLAYING" 
            onSeeAll={() => navigate("/movies/now-playing")}
          />
          <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
        </section>

        {/* Coming Soon Section */}
        <section className="px-4 md:px-12 py-8 md:py-12">
          <SectionHeader 
            title="COMING SOON" 
            onSeeAll={() => navigate("/movies/upcoming")}
          />
          <MovieGrid movies={upcoming.slice(0, 6)} loading={loading} />
        </section>
      </main>

      <FloatingDock />
    </div>
  );
}
