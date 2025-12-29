/**
 * CineVault — Index Page
 *
 * Design ultra-épuré et premium
 * Typographie suisse, espacement généreux
 * Chiffres en display bold pour impact visuel
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { BottomNav } from "@/components/BottomNav";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { useAuth } from "@/contexts/AuthContext";
import { getPopularMovies, getNowPlayingMovies, Movie, getMovieDetails, MovieDetails } from "@/services/tmdb";
import { getPhysicalMovies, PhysicalMovie } from "@/services/physicalMovies";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, Users } from "lucide-react";
import { LandingHero } from "@/components/LandingHero";

// ============================================
// Utility
// ============================================

const getLevelFromXp = (xp: number): number => {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 2000) return 5;
  if (xp < 3500) return 6;
  if (xp < 5500) return 7;
  if (xp < 8000) return 8;
  if (xp < 11000) return 9;
  if (xp < 15000) return 10;
  return Math.floor(10 + (xp - 15000) / 5000);
};

// ============================================
// Components
// ============================================

const SectionHeader = ({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) => (
  <div className="flex items-end justify-between mb-4 sm:mb-6">
    <div>
      <h2 className="font-display text-xs sm:text-sm uppercase tracking-[0.15em] sm:tracking-[0.2em] text-white/40">{title}</h2>
      {subtitle && <p className="text-white/30 text-[10px] sm:text-xs mt-0.5 sm:mt-1">{subtitle}</p>}
    </div>
    {onSeeAll && (
      <button onClick={onSeeAll} className="text-[10px] sm:text-xs text-white/30 hover:text-white/60 transition-colors">
        Tout voir
      </button>
    )}
  </div>
);

const MovieGrid = ({ movies, loading }: { movies: Movie[]; loading?: boolean }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <MinimalMovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
      {movies.map((movie, index) => (
        <MinimalMovieCard key={movie.id} movie={movie} index={index} />
      ))}
    </div>
  );
};

// ============================================
// Main
// ============================================

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<Record<number, MovieDetails>>({});

  const [stats, setStats] = useState({
    collection: 0,
    value: 0,
    badges: 0,
    level: 1,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [popularMovies, nowPlayingMovies] = await Promise.all([getPopularMovies(), getNowPlayingMovies()]);

      setPopular(popularMovies);
      setNowPlaying(nowPlayingMovies);

      if (user) {
        const collection = await getPhysicalMovies(user.id);
        setMyCollection(collection.slice(0, 12));

        const estimatedValue = collection.reduce((acc, movie) => {
          const baseValue = movie.format === "4k" ? 25 : movie.format === "bluray" ? 15 : 8;
          return acc + baseValue;
        }, 0);

        const { count: badgeCount } = await supabase
          .from("user_badges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const totalXp = profile?.total_xp || 0;

        setStats({
          collection: collection.length,
          value: estimatedValue,
          badges: badgeCount || 0,
          level: getLevelFromXp(totalXp),
        });

        const detailsMap: Record<number, MovieDetails> = {};
        await Promise.all(
          collection.slice(0, 12).map(async (pm) => {
            try {
              const details = await getMovieDetails(pm.tmdb_id);
              if (details) detailsMap[pm.tmdb_id] = details;
            } catch (e) {}
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

  // ============================================
  // Guest View
  // ============================================
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-32">
        <MinimalHeader />
        <LandingHero />

        <section className="px-4 md:px-12 py-8 sm:py-12">
          <SectionHeader title="Populaires" onSeeAll={() => navigate("/movies")} />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        <section className="px-4 md:px-12 py-8 sm:py-12">
          <SectionHeader title="À l'affiche" onSeeAll={() => navigate("/movies/now-playing")} />
          <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
        </section>

        <FloatingDock />
      </div>
    );
  }

  // ============================================
  // Authenticated View
  // ============================================
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <MinimalHeader />

      <main className="pt-20 md:pt-24">
        {/* Header Section */}
        <section className="px-4 md:px-12 pt-4 pb-8 md:pt-6 md:pb-12">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 md:mb-10">
            <p className="text-white/40 text-xs uppercase tracking-[0.15em] mb-1">Bienvenue</p>
            <h1 className="font-display text-2xl md:text-3xl text-white font-medium">
              {profile?.username || "Collectionneur"}
            </h1>
          </motion.div>

          {/* Stats Row - Responsive sizing */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6 md:gap-8 mb-6 md:mb-10"
          >
            {[
              { value: stats.collection, label: "Collection", href: "/collection" },
              { value: `~${stats.value}€`, label: "Valeur", href: "/collection?tab=valuation" },
              { value: stats.badges, label: "Badges", href: "/badges" },
              { value: stats.level, label: "Niveau", href: "/badges" },
            ].map((stat, i) => (
              <button key={stat.label} onClick={() => navigate(stat.href)} className="text-left group">
                <div className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white group-hover:text-amber-500 transition-colors">
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs uppercase tracking-[0.1em] text-white/30 mt-0.5 sm:mt-1">{stat.label}</div>
              </button>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            <button
              onClick={() => navigate("/search")}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full",
                "bg-white text-black text-xs sm:text-sm font-medium",
                "hover:bg-white/90 transition-colors",
              )}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Chercher un film</span>
              <span className="xs:hidden">Chercher</span>
            </button>

            <button
              onClick={() => navigate("/collection")}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full",
                "border border-white/20 text-white/70 text-xs sm:text-sm",
                "hover:border-white/40 hover:text-white transition-colors",
              )}
            >
              <span className="hidden sm:inline">Ma collection</span>
              <span className="sm:hidden">Collection</span>
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>

            <button
              onClick={() => navigate("/badges")}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full",
                "border border-white/20 text-white/70 text-xs sm:text-sm",
                "hover:border-white/40 hover:text-white transition-colors",
              )}
            >
              Badges
              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>

            <button
              onClick={() => navigate("/feed")}
              className={cn(
                "hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full",
                "border border-white/20 text-white/70 text-sm",
                "hover:border-white/40 hover:text-white transition-colors",
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Communauté
            </button>
          </motion.div>
        </section>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Collection Section */}
        {myCollection.length > 0 && (
          <section className="px-4 md:px-12 py-8 sm:py-10 md:py-14">
            <SectionHeader
              title="Votre collection"
              subtitle={`${stats.collection} films`}
              onSeeAll={() => navigate("/collection")}
            />

            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
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

        {/* Empty State */}
        {myCollection.length === 0 && (
          <section className="px-4 md:px-12 py-12 sm:py-16 md:py-20">
            <div className="max-w-md mx-auto text-center">
              <h2 className="font-display text-lg sm:text-xl text-white mb-2 sm:mb-3">Commencez votre collection</h2>
              <p className="text-white/40 text-xs sm:text-sm mb-4 sm:mb-6">
                Ajoutez votre premier film pour commencer à suivre votre collection.
              </p>
              <button
                onClick={() => navigate("/search")}
                className={cn(
                  "inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full",
                  "bg-white text-black text-xs sm:text-sm font-medium",
                  "hover:bg-white/90 transition-colors",
                )}
              >
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Rechercher un film
              </button>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Popular Movies */}
        <section className="px-4 md:px-12 py-8 sm:py-10 md:py-14">
          <SectionHeader title="Populaires" onSeeAll={() => navigate("/movies")} />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Now Playing */}
        <section className="px-4 md:px-12 py-8 sm:py-10 md:py-14">
          <SectionHeader title="À l'affiche" onSeeAll={() => navigate("/movies/now-playing")} />
          <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
        </section>
      </main>

      <FloatingDock />
    </div>
  );
}
