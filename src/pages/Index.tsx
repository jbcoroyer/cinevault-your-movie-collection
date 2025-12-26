/**
 * CineVault - Index Page Refonte
 *
 * MODIFICATIONS:
 * - Header avec stats en typographie XXL premium
 * - Chiffres qui ressortent visuellement
 * - "Ajouter un film" redirige vers /search
 * - Design homogène et premium
 * - Glassmorphism cohérent
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { useAuth } from "@/contexts/AuthContext";
import { getPopularMovies, getNowPlayingMovies, Movie, getMovieDetails, MovieDetails } from "@/services/tmdb";
import { getPhysicalMovies, PhysicalMovie } from "@/services/physicalMovies";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Plus, Search, Library, Trophy, TrendingUp, Sparkles, Users, ChevronRight, Disc, Zap } from "lucide-react";
import { LandingHero } from "@/components/LandingHero";

// ============================================
// Types
// ============================================

interface UserStats {
  collectionCount: number;
  estimatedValue: number;
  badgeCount: number;
  level: number;
  totalXp: number;
}

// ============================================
// Utility Functions
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
// Sub Components
// ============================================

/**
 * Section Header Component
 */
const SectionHeader = ({ title, subtitle, onSeeAll }: { title: string; subtitle?: string; onSeeAll?: () => void }) => (
  <div className="flex items-center justify-between mb-4 md:mb-6">
    <div>
      <h2 className="font-display text-lg md:text-xl font-bold text-white tracking-wide">{title}</h2>
      {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
    </div>
    {onSeeAll && (
      <button
        onClick={onSeeAll}
        className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
      >
        Voir tout
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
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
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
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
      )}
    >
      {movies.map((movie, index) => (
        <MinimalMovieCard key={movie.id} movie={movie} index={index} />
      ))}
    </div>
  );
};

/**
 * Quick Stats Card - Design Premium avec typographie XXL
 */
const QuickStatsCard = ({
  icon: Icon,
  value,
  label,
  suffix,
  onClick,
  accentColor = "amber",
  delay = 0,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  suffix?: string;
  onClick?: () => void;
  accentColor?: "amber" | "green" | "purple" | "blue";
  delay?: number;
}) => {
  const colors = {
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: "text-amber-500",
      glow: "shadow-amber-500/10",
    },
    green: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-500",
      glow: "shadow-emerald-500/10",
    },
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      icon: "text-purple-500",
      glow: "shadow-purple-500/10",
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: "text-blue-500",
      glow: "shadow-blue-500/10",
    },
  };

  const colorSet = colors[accentColor];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl text-left transition-all duration-300",
        "bg-white/5 backdrop-blur-sm",
        "border border-white/10 hover:border-white/20",
        "shadow-lg hover:shadow-xl",
        colorSet.glow,
        "group cursor-pointer",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
          colorSet.bg,
          "group-hover:scale-110 transition-transform duration-300",
        )}
      >
        <Icon className={cn("w-5 h-5", colorSet.icon)} />
      </div>

      {/* Value - Typographie XXL */}
      <div className="flex items-baseline gap-1">
        <span className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">{value}</span>
        {suffix && <span className="text-lg text-white/60 font-medium">{suffix}</span>}
      </div>

      {/* Label */}
      <p className="text-sm text-white/50 mt-1 font-medium">{label}</p>

      {/* Hover Arrow */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="w-4 h-4 text-white/40" />
      </div>
    </motion.button>
  );
};

/**
 * Quick Action Button - Pour "Ajouter un film"
 */
const QuickActionButton = ({
  icon: Icon,
  label,
  sublabel,
  onClick,
  variant = "default",
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  variant?: "default" | "primary";
  delay?: number;
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl text-left transition-all duration-300",
        "flex items-center gap-4",
        "border group cursor-pointer",
        variant === "primary"
          ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-500/10"
          : "bg-white/5 backdrop-blur-sm border-white/10 hover:border-white/20",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          "group-hover:scale-110 transition-transform duration-300",
          variant === "primary" ? "bg-amber-500/20" : "bg-white/10",
        )}
      >
        <Icon className={cn("w-6 h-6", variant === "primary" ? "text-amber-500" : "text-white/70")} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{label}</p>
        {sublabel && <p className="text-sm text-white/50 truncate">{sublabel}</p>}
      </div>

      {/* Arrow */}
      <ChevronRight
        className={cn(
          "w-5 h-5 flex-shrink-0 transition-all duration-300",
          "group-hover:translate-x-1",
          variant === "primary" ? "text-amber-500/70" : "text-white/30",
        )}
      />
    </motion.button>
  );
};

// ============================================
// Main Component
// ============================================

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<Record<number, MovieDetails>>({});
  const [userStats, setUserStats] = useState<UserStats>({
    collectionCount: 0,
    estimatedValue: 0,
    badgeCount: 0,
    level: 1,
    totalXp: 0,
  });

  // Load data
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
        // Load collection
        const collection = await getPhysicalMovies(user.id);
        setMyCollection(collection.slice(0, 12));

        // Calculate estimated value (simple estimation)
        const estimatedValue = collection.reduce((acc, movie) => {
          const baseValue = movie.format === "4k" ? 25 : movie.format === "bluray" ? 15 : 8;
          return acc + baseValue;
        }, 0);

        // Load badge count
        const { count: badgeCount } = await supabase
          .from("user_badges")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Get XP from profile
        const totalXp = profile?.total_xp || 0;
        const level = getLevelFromXp(totalXp);

        setUserStats({
          collectionCount: collection.length,
          estimatedValue,
          badgeCount: badgeCount || 0,
          level,
          totalXp,
        });

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

  // ============================================
  // Guest View (non connecté)
  // ============================================
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-32">
        <MinimalHeader />
        <LandingHero />

        {/* Popular Movies */}
        <section className="px-4 md:px-12 py-12 md:py-16">
          <SectionHeader title="FILMS POPULAIRES" onSeeAll={() => navigate("/movies")} />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        {/* Now Playing Section */}
        <section className="px-4 md:px-12 py-12 md:py-16">
          <SectionHeader title="À L'AFFICHE" onSeeAll={() => navigate("/movies/now-playing")} />
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

      <main className="pt-20 md:pt-28">
        {/* Welcome Header + Quick Stats */}
        <section className="px-4 md:px-12 py-6 md:py-8">
          {/* Welcome Message */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">En ligne</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
              Bonjour{profile?.username ? `, ${profile.username}` : ""} 👋
            </h1>
            <p className="text-white/50 mt-1">Continuez à enrichir votre collection</p>
          </motion.div>

          {/* Stats Grid - 4 columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <QuickStatsCard
              icon={Library}
              value={userStats.collectionCount}
              label="Collection"
              onClick={() => navigate("/collection")}
              accentColor="amber"
              delay={0.1}
            />
            <QuickStatsCard
              icon={TrendingUp}
              value={`~${userStats.estimatedValue}`}
              suffix="€"
              label="Valeur"
              onClick={() => navigate("/collection?tab=valuation")}
              accentColor="green"
              delay={0.15}
            />
            <QuickStatsCard
              icon={Trophy}
              value={userStats.badgeCount}
              label="Badges"
              onClick={() => navigate("/badges")}
              accentColor="purple"
              delay={0.2}
            />
            <QuickStatsCard
              icon={Zap}
              value={userStats.level}
              label="Niveau"
              onClick={() => navigate("/badges")}
              accentColor="blue"
              delay={0.25}
            />
          </div>

          {/* Quick Actions - 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <QuickActionButton
              icon={Plus}
              label="Ajouter un film"
              sublabel="Scanner ou rechercher"
              onClick={() => navigate("/search")}
              variant="primary"
              delay={0.3}
            />
            <QuickActionButton
              icon={Disc}
              label="Ma collection"
              sublabel={`${userStats.collectionCount} films`}
              onClick={() => navigate("/collection")}
              delay={0.35}
            />
            <QuickActionButton
              icon={Trophy}
              label="Mes badges"
              sublabel="Voir mes succès"
              onClick={() => navigate("/badges")}
              delay={0.4}
            />
          </div>

          {/* Community Link */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate("/feed")}
            className={cn(
              "w-full mt-3 p-4 rounded-2xl",
              "bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent",
              "border border-purple-500/20 hover:border-purple-500/30",
              "flex items-center justify-between",
              "transition-all duration-300 group",
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-white">Communauté</p>
                <p className="text-sm text-white/50">Explorer les profils</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400/50 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </section>

        {/* Collection Section */}
        {myCollection.length > 0 && (
          <section className="px-4 md:px-12 py-8 md:py-12">
            <SectionHeader
              title="VOTRE COLLECTION"
              subtitle={`${myCollection.length} films`}
              onSeeAll={() => navigate("/collection")}
            />

            <div className={cn("grid gap-3 md:gap-4", "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6")}>
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
                "p-8 md:p-12 text-center",
                "bg-gradient-to-br from-amber-500/5 to-transparent",
              )}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Library className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-white mb-2">Commencez votre collection</h2>
              <p className="text-white/50 mb-6 max-w-md mx-auto">
                Ajoutez votre premier DVD, Blu-ray ou 4K pour commencer à suivre votre collection physique.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/search")}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-full",
                  "bg-amber-500 hover:bg-amber-600 text-black font-semibold",
                  "transition-colors duration-300",
                )}
              >
                <Plus className="w-5 h-5" />
                Ajouter un film
              </motion.button>
            </motion.div>
          </section>
        )}

        {/* Popular Movies */}
        <section className="px-4 md:px-12 py-8 md:py-12">
          <SectionHeader title="FILMS POPULAIRES" onSeeAll={() => navigate("/movies")} />
          <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
        </section>

        {/* Now Playing */}
        <section className="px-4 md:px-12 py-8 md:py-12">
          <SectionHeader title="À L'AFFICHE" onSeeAll={() => navigate("/movies/now-playing")} />
          <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
        </section>
      </main>

      <FloatingDock />
    </div>
  );
}
