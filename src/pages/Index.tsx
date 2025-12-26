/**
 * CineVault — Index Page
 *
 * Two distinct experiences:
 * 1. Guest: Landing page with value props, demo shelf, stats, features, CTA
 * 2. Authenticated: Personalized dashboard with collection, activity, recommendations
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { LandingHero } from "@/components/LandingHero";
import { MinimalMovieCard, MinimalMovieCardSkeleton } from "@/components/MinimalMovieCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Movie,
  MovieDetails,
  getPopularMovies,
  getNowPlayingMovies,
  getMovieDetails,
  getImageUrl,
} from "@/services/tmdb";
import { getPhysicalMovies, PhysicalMovie } from "@/services/collection";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Library,
  TrendingUp,
  Sparkles,
  Trophy,
  Plus,
  Film,
  Clock,
  Heart,
  Users,
  ChevronRight,
  Zap,
  Star,
  Calendar,
  Play,
} from "lucide-react";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  onSeeAll?: () => void;
  seeAllText?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  onSeeAll,
  seeAllText = "Voir tout",
}) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-amber-500" />
        </div>
      )}
      <div>
        <h2 className="font-display text-lg md:text-xl font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-white/40">{subtitle}</p>}
      </div>
    </div>
    {onSeeAll && (
      <Button variant="ghost" size="sm" onClick={onSeeAll} className="text-white/50 hover:text-white hover:bg-white/10">
        {seeAllText}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    )}
  </div>
);

// ============================================
// QUICK ACTION CARD
// ============================================
interface QuickActionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ icon: Icon, title, description, onClick, gradient }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "relative p-5 rounded-2xl text-left w-full overflow-hidden",
      "bg-white/5 border border-white/10",
      "hover:border-white/20 transition-all duration-300",
    )}
  >
    <div className={cn("absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500", gradient)} />
    <div className="relative z-10">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-white/50">{description}</p>
    </div>
  </motion.button>
);

// ============================================
// COLLECTION PREVIEW CARD (for authenticated users)
// ============================================
interface CollectionCardProps {
  movie: PhysicalMovie;
  details: MovieDetails | null;
  index: number;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ movie, details, index }) => {
  const navigate = useNavigate();

  if (!details) return null;

  const formatColors: Record<string, string> = {
    dvd: "bg-gray-500",
    bluray: "bg-blue-500",
    "4k": "bg-amber-500",
    steelbook: "bg-gradient-to-r from-slate-400 to-slate-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/movie/${details.id}`)}
      className="cursor-pointer group"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-2">
        {details.poster_path ? (
          <img
            src={getImageUrl(details.poster_path, "w342")}
            alt={details.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <Film className="w-8 h-8 text-white/30" />
          </div>
        )}

        {/* Format badge */}
        <div
          className={cn(
            "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium text-white",
            formatColors[movie.format] || "bg-white/20",
          )}
        >
          {movie.format.toUpperCase()}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <h3 className="text-sm font-medium text-white truncate">{details.title}</h3>
      <p className="text-xs text-white/40">{details.release_date?.substring(0, 4)}</p>
    </motion.div>
  );
};

// ============================================
// ACTIVITY ITEM
// ============================================
interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    created_at: string;
    metadata: any;
    user?: {
      username: string;
      avatar_url: string | null;
    };
  };
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case "collection_add":
        return <Plus className="w-4 h-4" />;
      case "badge_earned":
        return <Trophy className="w-4 h-4" />;
      case "review_add":
        return <Star className="w-4 h-4" />;
      case "follow":
        return <Users className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getActivityText = () => {
    const meta = activity.metadata || {};
    switch (activity.type) {
      case "collection_add":
        return `a ajouté ${meta.movie_title || "un film"} à sa collection`;
      case "badge_earned":
        return `a débloqué le badge ${meta.badge_name || ""}`;
      case "review_add":
        return `a noté ${meta.movie_title || "un film"}`;
      case "follow":
        return `suit maintenant ${meta.target_username || "quelqu'un"}`;
      default:
        return "a effectué une action";
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "à l'instant";
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
    return `il y a ${Math.floor(seconds / 86400)}j`;
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-500">
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className="font-medium">{activity.user?.username || "Quelqu'un"}</span>{" "}
          <span className="text-white/60">{getActivityText()}</span>
        </p>
        <p className="text-xs text-white/40 mt-0.5">{timeAgo(activity.created_at)}</p>
      </div>
    </div>
  );
};

// ============================================
// MOVIE GRID COMPONENT
// ============================================
const MovieGrid = ({ movies, loading }: { movies: Movie[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <MinimalMovieCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
      {movies.map((movie, index) => (
        <MinimalMovieCard key={movie.id} movie={movie} index={index} />
      ))}
    </div>
  );
};

// ============================================
// MAIN INDEX COMPONENT
// ============================================
export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [collectionDetails, setCollectionDetails] = useState<Record<number, MovieDetails>>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    collectionCount: 0,
    totalValue: 0,
    badgesCount: 0,
    level: 1,
    xp: 0,
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
        // Load user's collection
        const collection = await getPhysicalMovies(user.id);
        setMyCollection(collection.slice(0, 8));

        // Load movie details for collection
        const detailsMap: Record<number, MovieDetails> = {};
        await Promise.all(
          collection.slice(0, 8).map(async (pm) => {
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

        // Load user stats
        const [{ count: collectionCount }, { count: badgesCount }, { data: profileData }] = await Promise.all([
          supabase.from("physical_movies").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("user_badges").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("profiles").select("level, xp").eq("id", user.id).single(),
        ]);

        setUserStats({
          collectionCount: collectionCount || 0,
          totalValue: (collectionCount || 0) * 15, // Estimation
          badgesCount: badgesCount || 0,
          level: profileData?.level || 1,
          xp: profileData?.xp || 0,
        });

        // Load recent activity from followed users
        const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);

        if (follows && follows.length > 0) {
          const followingIds = follows.map((f) => f.following_id);
          const { data: activities } = await supabase
            .from("activities")
            .select(
              `
              id,
              type,
              created_at,
              metadata,
              profiles!activities_user_id_fkey (
                username,
                avatar_url
              )
            `,
            )
            .in("user_id", followingIds)
            .order("created_at", { ascending: false })
            .limit(5);

          if (activities) {
            setRecentActivity(
              activities.map((a) => ({
                ...a,
                user: a.profiles,
              })),
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to load movies:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GUEST VIEW - Landing Page
  // ============================================
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-32">
        <MinimalHeader />
        <main className="pt-20 md:pt-24">
          <LandingHero />
        </main>
        <FloatingDock />
      </div>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ============================================
  // AUTHENTICATED VIEW - Dashboard
  // ============================================
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <MinimalHeader />

      <main className="pt-20 md:pt-28">
        {/* Welcome Section with Quick Stats */}
        <section className="px-4 md:px-12 py-6 md:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Greeting */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-1">Bonjour ! 👋</h1>
              <p className="text-white/50">Continuez à enrichir votre collection</p>
            </motion.div>

            {/* Quick Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Library className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm text-white/50">Collection</span>
                </div>
                <p className="font-display text-2xl font-bold text-white">{userStats.collectionCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-sm text-white/50">Valeur</span>
                </div>
                <p className="font-display text-2xl font-bold text-white">~{userStats.totalValue}€</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-sm text-white/50">Badges</span>
                </div>
                <p className="font-display text-2xl font-bold text-white">{userStats.badgesCount}</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm text-white/50">Niveau</span>
                </div>
                <p className="font-display text-2xl font-bold text-white">{userStats.level}</p>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <QuickActionCard
                icon={Plus}
                title="Ajouter un film"
                description="Scanner ou rechercher"
                onClick={() => navigate("/search")}
                gradient="bg-gradient-to-br from-amber-500/10 to-orange-600/10"
              />
              <QuickActionCard
                icon={Library}
                title="Ma collection"
                description={`${userStats.collectionCount} films`}
                onClick={() => navigate("/collection")}
                gradient="bg-gradient-to-br from-blue-500/10 to-cyan-600/10"
              />
              <QuickActionCard
                icon={Trophy}
                title="Mes badges"
                description="Voir mes succès"
                onClick={() => navigate("/badges")}
                gradient="bg-gradient-to-br from-purple-500/10 to-violet-600/10"
              />
              <QuickActionCard
                icon={Users}
                title="Communauté"
                description="Explorer les profils"
                onClick={() => navigate("/search?tab=users")}
                gradient="bg-gradient-to-br from-emerald-500/10 to-green-600/10"
              />
            </motion.div>
          </div>
        </section>

        {/* My Collection Section */}
        {myCollection.length > 0 && (
          <section className="px-4 md:px-12 py-8 md:py-12">
            <div className="max-w-7xl mx-auto">
              <SectionHeader
                title="Ma collection"
                subtitle={`${userStats.collectionCount} films • ~${userStats.totalValue}€`}
                icon={Library}
                onSeeAll={() => navigate("/collection")}
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
                {myCollection.map((pm, index) => (
                  <CollectionCard
                    key={pm.id}
                    movie={pm}
                    details={collectionDetails[pm.tmdb_id] || null}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty Collection CTA */}
        {myCollection.length === 0 && (
          <section className="px-4 md:px-12 py-8 md:py-12">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative p-8 md:p-12 rounded-3xl text-center overflow-hidden",
                  "bg-gradient-to-br from-amber-500/10 to-orange-600/10",
                  "border border-amber-500/20",
                )}
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <Library className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Commencez votre collection</h2>
                <p className="text-white/50 mb-8 max-w-md mx-auto">
                  Ajoutez votre premier DVD, Blu-ray ou 4K pour démarrer votre aventure de collectionneur.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/search")}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8 rounded-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter mon premier film
                </Button>
              </motion.div>
            </div>
          </section>
        )}

        {/* Activity Feed (if user follows people) */}
        {recentActivity.length > 0 && (
          <section className="px-4 md:px-12 py-8 md:py-12">
            <div className="max-w-7xl mx-auto">
              <SectionHeader title="Activité récente" subtitle="De vos abonnements" icon={Sparkles} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trending Movies */}
        <section className="px-4 md:px-12 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="Tendances"
              subtitle="Films populaires du moment"
              icon={TrendingUp}
              onSeeAll={() => navigate("/movies/popular")}
            />
            <MovieGrid movies={popular.slice(0, 12)} loading={loading} />
          </div>
        </section>

        {/* Now Playing */}
        <section className="px-4 md:px-12 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <SectionHeader
              title="À l'affiche"
              subtitle="Actuellement au cinéma"
              icon={Play}
              onSeeAll={() => navigate("/movies/now-playing")}
            />
            <MovieGrid movies={nowPlaying.slice(0, 6)} loading={loading} />
          </div>
        </section>
      </main>

      <FloatingDock />
    </div>
  );
}
