import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { LandingHero } from "../components/LandingHero";
import { MovieSection } from "../components/MovieSection";
import { FollowingMoviesSection } from "../components/FollowingMoviesSection";
import { WelcomeSection } from "../components/home/WelcomeSection";
import { getPopularMovies, Movie, getImageUrl, MovieDetails, getMovieDetails } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeNotification } from "../contexts/BadgeNotificationContext";
import { getPhysicalMovies, PhysicalMovie } from "../services/physicalMovies";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight,
  Users,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { GlassCard } from "../components/ui/GlassCard";
import { ShelfView } from "../components/collection/ShelfView";
import { motion } from "framer-motion";

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { currentLevel, currentXp, progressPercent } = useBadgeNotification();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [fullCollection, setFullCollection] = useState<PhysicalMovie[]>([]);
  const [movieDetailsMap, setMovieDetailsMap] = useState<Record<number, MovieDetails>>({});
  const [fullMovieDetailsMap, setFullMovieDetailsMap] = useState<Record<number, MovieDetails>>({});
  const [topCollectors, setTopCollectors] = useState<any[]>([]);
  const [stats, setStats] = useState({ movies: 0, collectors: 0, reviews: 0 });
  const [listPosters, setListPosters] = useState<string[]>([]);
  const [userBadges, setUserBadges] = useState<{ icon: string; rarity: string; unlocked: boolean }[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les films populaires
      const popularMovies = await getPopularMovies();
      setPopular(popularMovies);

      // Charger ma collection si connecté
      if (user) {
        const collection = await getPhysicalMovies(user.id);
        
        // 4 premiers pour le bento preview
        const collectionPreview = collection.slice(0, 4);
        setMyCollection(collectionPreview);
        
        // 30 derniers pour la section collection complète
        const collectionFull = collection.slice(0, 30);
        setFullCollection(collectionFull);

        // Charger les détails des films pour le preview (4)
        const detailsMap: Record<number, MovieDetails> = {};
        await Promise.all(
          collectionPreview.map(async (pm) => {
            try {
              const details = await getMovieDetails(pm.tmdb_id);
              if (details) {
                detailsMap[pm.tmdb_id] = details;
              }
            } catch (error) {
              console.error(`Error loading details for movie ${pm.tmdb_id}:`, error);
            }
          }),
        );
        setMovieDetailsMap(detailsMap);

        // Charger les détails des 30 films pour le shelf
        const fullDetailsMap: Record<number, MovieDetails> = { ...detailsMap };
        await Promise.all(
          collectionFull.filter(pm => !fullDetailsMap[pm.tmdb_id]).map(async (pm) => {
            try {
              const details = await getMovieDetails(pm.tmdb_id);
              if (details) {
                fullDetailsMap[pm.tmdb_id] = details;
              }
            } catch (error) {
              console.error(`Error loading details for movie ${pm.tmdb_id}:`, error);
            }
          }),
        );
        setFullMovieDetailsMap(fullDetailsMap);

        // Charger les posters des listes
        const { data: listsData } = await supabase
          .from("lists")
          .select("id")
          .eq("user_id", user.id)
          .limit(3);

        if (listsData && listsData.length > 0) {
          const listIds = listsData.map(l => l.id);
          const { data: listItems } = await supabase
            .from("list_items")
            .select("poster_path")
            .in("list_id", listIds)
            .not("poster_path", "is", null)
            .limit(4);
          
          if (listItems) {
            setListPosters(listItems.map(item => item.poster_path!));
          }
        }

        // Charger les badges de l'utilisateur
        const { data: badgesData } = await supabase
          .from("user_badges")
          .select("badge_id, rarity")
          .eq("user_id", user.id)
          .limit(6);

        const { data: badgeDefs } = await supabase
          .from("badge_definitions")
          .select("id, icon_name, base_rarity")
          .limit(6);

        if (badgeDefs) {
          const unlockedIds = new Set(badgesData?.map(b => b.badge_id) || []);
          const badges = badgeDefs.map(def => ({
            icon: getBadgeEmoji(def.icon_name),
            rarity: def.base_rarity || "common",
            unlocked: unlockedIds.has(def.id)
          }));
          setUserBadges(badges);
        }
      }

      // Charger les stats globales
      const [moviesCount, collectorsCount] = await Promise.all([
        supabase.from("physical_movies").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        movies: moviesCount.count || 0,
        collectors: collectorsCount.count || 0,
        reviews: 0,
      });

      // Charger les top collectionneurs
      const { data: topData } = await supabase.from("profiles").select("id, username, avatar_url").limit(5);
      setTopCollectors(topData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert icon names to emojis
  const getBadgeEmoji = (iconName: string): string => {
    const emojiMap: Record<string, string> = {
      film: "🎬",
      star: "⭐",
      trophy: "🏆",
      gem: "💎",
      theater: "🎭",
      sparkles: "✨",
      heart: "❤️",
      fire: "🔥",
      crown: "👑",
      medal: "🥇",
      default: "🎖️"
    };
    return emojiMap[iconName.toLowerCase()] || emojiMap.default;
  };

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  // Si non connecté, afficher la landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="pt-14 md:pt-0">
          <LandingHero />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Contenu pour les utilisateurs connectés
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="pt-14 md:pt-0 container mx-auto px-4 py-8 space-y-8">
        {/* Section Bienvenue avec données réelles */}
        <WelcomeSection 
          username={profile?.username} 
          className="mt-2"
          collection={myCollection}
          movieDetailsMap={movieDetailsMap}
          trendingMovies={popular.slice(0, 6)}
          listPosters={listPosters}
          badges={userBadges}
        />

        {/* Ma Collection - 30 derniers films */}
        {fullCollection.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                <div>
                  <h2 className="font-display text-xl font-bold">Ma Collection</h2>
                  <p className="text-sm text-muted-foreground">
                    <span className="text-amber-500 font-semibold">{fullCollection.length}</span> films récemment ajoutés
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/collection")}
                className="group"
              >
                Voir tout
                <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <ShelfView
              movies={fullCollection}
              movieDetailsMap={fullMovieDetailsMap}
              onMovieClick={(movie) => navigate(`/movie/${movie.tmdb_id}`)}
              variant="light"
            />
          </motion.section>
        )}

        {/* Films des personnes suivies */}
        <FollowingMoviesSection />

        {/* Films Populaires */}
        <MovieSection
          title="Films Populaires"
          label="Tendances"
          movies={popular}
          loading={loading}
          seeMoreLink="/movies/popular"
        />

        {/* Statistiques Communauté */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassCard className="p-6 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">Communauté CineVault</h2>
                  <p className="text-sm text-muted-foreground">Statistiques en temps réel</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    {stats.movies.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Films collectionnés</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
                    {stats.collectors.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Collectionneurs</div>
                </motion.div>
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-500 bg-clip-text text-transparent">
                    {stats.reviews.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Avis partagés</div>
                </motion.div>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
}
