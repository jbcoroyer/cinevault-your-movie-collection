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
import { ChevronRight, Plus } from "lucide-react";
import { MinimalHeader } from "../components/MinimalHeader";
import { FloatingDock } from "../components/FloatingDock";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "../components/MinimalMovieCard";
import { getPopularMovies, Movie, getImageUrl, MovieDetails, getMovieDetails } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { getPhysicalMovies, PhysicalMovie } from "../services/physicalMovies";
import { cn } from "../lib/utils";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<Record<number, MovieDetails>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const popularMovies = await getPopularMovies();
      setPopular(popularMovies);

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
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loader
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Guest landing
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <MinimalHeader />
        
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col justify-center px-4 md:px-12 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-4xl"
          >
            <h1 className="font-display text-display-xl text-white mb-6">
              YOUR FILM
              <br />
              COLLECTION
            </h1>
            <p className="text-white/50 text-lg md:text-xl max-w-md mb-10">
              Catalog your physical media. Track values. Join collectors worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/auth")}
                className="btn-minimal-filled w-full sm:w-auto"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate("/search")}
                className="btn-minimal w-full sm:w-auto"
              >
                Browse Films
              </button>
            </div>
          </motion.div>

          {/* Background movie posters - decorative */}
          <div className="absolute inset-0 -z-10 overflow-hidden opacity-20">
            <div className="absolute top-0 right-0 w-1/2 h-full">
              {popular.slice(0, 3).map((movie, i) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.2, duration: 1 }}
                  className="absolute"
                  style={{
                    top: `${10 + i * 25}%`,
                    right: `${-5 + i * 15}%`,
                    width: `${30 - i * 5}%`,
                  }}
                >
                  {movie.poster_path && (
                    <img
                      src={getImageUrl(movie.poster_path, "w500")}
                      alt=""
                      className="w-full rounded-xl opacity-60"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Section */}
        <section className="px-4 md:px-12 py-16 md:py-24">
          <SectionHeader 
            title="TRENDING NOW" 
            onSeeAll={() => navigate("/movies/popular")}
          />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        <FloatingDock />
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <MinimalHeader />

      <main className="pt-4 md:pt-24">
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
                "border border-white/10 rounded-xl md:rounded-2xl",
                "p-6 md:p-12 text-center"
              )}
            >
              <h2 className="font-display text-display-md text-white mb-4">
                START YOUR COLLECTION
              </h2>
              <p className="text-white/50 mb-8 max-w-md mx-auto">
                Add your first DVD, Blu-ray, or 4K disc to begin tracking your physical media collection.
              </p>
              <button
                onClick={() => navigate("/collection")}
                className="btn-minimal-filled inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Film
              </button>
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
      </main>

      <FloatingDock />
    </div>
  );
}

/**
 * Section Header Component
 */
const SectionHeader = ({ 
  title, 
  subtitle,
  onSeeAll 
}: { 
  title: string; 
  subtitle?: string;
  onSeeAll?: () => void;
}) => (
  <div className="flex items-end justify-between mb-6 md:mb-8">
    <div>
      <h2 className="font-display text-display-sm md:text-display-md text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/40 text-sm mt-1">{subtitle}</p>
      )}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className={cn(
          "flex items-center gap-1 text-sm text-white/50",
          "hover:text-white transition-colors duration-300"
        )}
      >
        <span className="hidden sm:inline">See All</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    )}
  </div>
);

/**
 * Movie Grid Component
 */
const MovieGrid = ({ 
  movies, 
  loading 
}: { 
  movies: Movie[]; 
  loading: boolean;
}) => (
  <div className={cn(
    "grid gap-3 md:gap-4",
    "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
  )}>
    {loading ? (
      Array.from({ length: 8 }).map((_, i) => (
        <MinimalMovieCardSkeleton key={i} />
      ))
    ) : (
      movies.map((movie, index) => (
        <MinimalMovieCard key={movie.id} movie={movie} index={index} />
      ))
    )}
  </div>
);
