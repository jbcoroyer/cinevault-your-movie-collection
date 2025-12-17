/**
 * CineVault - Index Page (CORRIGÉ)
 *
 * CORRECTIONS:
 * - Ajout du StreakDisplay compact en haut pour les utilisateurs connectés
 * - L'utilisateur voit maintenant son streak de connexion sur l'accueil
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { LandingHero } from "../components/LandingHero";
import { MovieSection } from "../components/MovieSection";
import { FollowingMoviesSection } from "../components/FollowingMoviesSection";
import { WelcomeSection } from "../components/home/WelcomeSection";
import { StreakDisplay } from "../components/gamification/StreakDisplay";
import { getPopularMovies, Movie, getImageUrl, MovieDetails, getMovieDetails } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeNotification } from "../contexts/BadgeNotificationContext";
import { getPhysicalMovies, PhysicalMovie } from "../services/physicalMovies";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Users, Sparkles, Flame } from "lucide-react";
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

        // 20 derniers pour la section collection complète
        const collectionFull = collection.slice(0, 20);
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
            } catch (e) {
              console.error(`Failed to load details for ${pm.tmdb_id}`);
            }
          }),
        );
        setMovieDetailsMap(detailsMap);

        // Charger les détails pour la collection complète (20)
        const fullDetailsMap: Record<number, MovieDetails> = {};
        await Promise.all(
          collectionFull.map(async (pm) => {
            try {
              const details = await getMovieDetails(pm.tmdb_id);
              if (details) {
                fullDetailsMap[pm.tmdb_id] = details;
              }
            } catch (e) {
              console.error(`Failed to load details for ${pm.tmdb_id}`);
            }
          }),
        );
        setFullMovieDetailsMap(fullDetailsMap);

        // Charger les posters des listes
        const { data: lists } = await supabase.from("user_lists").select("id").eq("user_id", user.id).limit(3);

        if (lists && lists.length > 0) {
          const posters: string[] = [];
          for (const list of lists) {
            const { data: items } = await supabase.from("list_items").select("tmdb_id").eq("list_id", list.id).limit(1);
            if (items && items[0]) {
              const movieDetails = await getMovieDetails(items[0].tmdb_id);
              if (movieDetails?.poster_path) {
                posters.push(movieDetails.poster_path);
              }
            }
          }
          setListPosters(posters);
        }

        // Charger les badges de l'utilisateur (simplifiés pour le bento)
        const { data: badges } = await supabase
          .from("user_badges")
          .select("badge_id, rarity")
          .eq("user_id", user.id)
          .limit(4);

        const badgeIcons = ["🎬", "📀", "🏆", "⭐"];
        const mappedBadges = (badges || []).map((b, i) => ({
          icon: badgeIcons[i % badgeIcons.length],
          rarity: b.rarity || "common",
          unlocked: true,
        }));
        // Compléter avec des badges verrouillés
        while (mappedBadges.length < 4) {
          mappedBadges.push({ icon: "🔒", rarity: "common", unlocked: false });
        }
        setUserBadges(mappedBadges);
      }

      // Charger les stats globales (pour tout le monde)
      const { count: moviesCount } = await supabase.from("physical_movies").select("*", { count: "exact", head: true });

      const { count: collectorsCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });

      const { count: reviewsCount } = await supabase.from("reviews").select("*", { count: "exact", head: true });

      setStats({
        movies: moviesCount || 0,
        collectors: collectorsCount || 0,
        reviews: reviewsCount || 0,
      });

      // Top collectors
      const { data: collectors } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, total_xp")
        .order("total_xp", { ascending: false })
        .limit(5);
      setTopCollectors(collectors || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Loader pendant l'auth
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
        {/* CORRECTION: Section avec StreakDisplay compact */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Bienvenue, <span className="text-foreground font-medium">{profile?.username || "Collectionneur"}</span>
            </span>
          </div>
          {/* CORRECTION: Ajout du StreakDisplay compact */}
          <StreakDisplay compact className="ml-auto" />
        </motion.div>

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

        {/* Ma Collection - 20 derniers films */}
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
                    <span className="text-amber-500 font-semibold">{fullCollection.length}</span> films récemment
                    ajoutés
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/collection")}
                className="text-amber-500 hover:text-amber-400"
              >
                Voir tout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="relative -mx-4 px-4">
              <ShelfView
                movies={fullCollection}
                movieDetailsMap={fullMovieDetailsMap}
                showFormat
                showCondition
                showPrice={false}
              />
            </div>
          </motion.section>
        )}

        {/* Films populaires */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <MovieSection
            title="Films Populaires"
            subtitle="Les plus regardés en ce moment"
            movies={popular}
            loading={loading}
            seeMoreLink="/movies/popular"
          />
        </motion.section>

        {/* Activité des abonnements */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <FollowingMoviesSection />
        </motion.section>

        {/* Stats de la communauté */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Communauté CineVault</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{stats.collectors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Collectionneurs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{stats.movies.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Films collectés</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-500">{stats.reviews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Critiques</p>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
}
