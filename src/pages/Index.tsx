import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { LandingHero } from "../components/LandingHero";
import { MovieSection } from "../components/MovieSection";
import { FollowingMoviesSection } from "../components/FollowingMoviesSection";
import { getPopularMovies, Movie, getImageUrl, MovieDetails } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeNotification } from "../contexts/BadgeNotificationContext";
import { getPhysicalMovies, PhysicalMovie } from "../services/physicalMovies";
import { supabase } from "../lib/supabase";
import {
  ChevronRight,
  Trophy,
  UserPlus,
  Zap,
  Library,
  Heart,
  Eye,
  Disc,
  Users,
  ArrowRight,
  Activity,
  Coins,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { cn } from "../lib/utils";
import { GlassCard } from "../components/ui/GlassCard";
import { ShelfView } from "../components/collection/ShelfView";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentLevel, currentXp, progressPercent, unlockedBadges, userStats } = useBadgeNotification();

  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [myCollection, setMyCollection] = useState<PhysicalMovie[]>([]);
  const [movieDetails, setMovieDetails] = useState<Record<number, MovieDetails>>({});
  const [topCollectors, setTopCollectors] = useState<any[]>([]);
  const [mostOwned, setMostOwned] = useState<any[]>([]);
  const [stats, setStats] = useState({ movies: 0, collectors: 0, reviews: 0 });

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
        setMyCollection(collection.slice(0, 8));
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

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
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

      <main className="pt-14 md:pt-0 container mx-auto px-4 py-6 space-y-8">
        {/* Section Bienvenue */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-background to-background border border-amber-500/20 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Bienvenue sur CineVault 👋</h1>
              <p className="text-muted-foreground">
                Votre collection vous attend. Que souhaitez-vous faire aujourd'hui ?
              </p>
            </div>

            {/* XP Progress */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold">Niveau {currentLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progressPercent} className="w-32 h-2" />
                  <span className="text-xs text-muted-foreground">{currentXp} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-amber-500/50 hover:bg-amber-500/5"
              onClick={() => navigate("/search")}
            >
              <Disc className="w-5 h-5 text-amber-500" />
              <span className="text-sm">Ajouter un film</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-amber-500/50 hover:bg-amber-500/5"
              onClick={() => navigate("/collection")}
            >
              <Library className="w-5 h-5 text-amber-500" />
              <span className="text-sm">Ma collection</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-amber-500/50 hover:bg-amber-500/5"
              onClick={() => navigate("/lists")}
            >
              <Heart className="w-5 h-5 text-rose-500" />
              <span className="text-sm">Mes listes</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 hover:border-amber-500/50 hover:bg-amber-500/5"
              onClick={() => navigate("/badges")}
            >
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="text-sm">Mes badges</span>
            </Button>
          </div>
        </section>

        {/* Ma Collection */}
        {myCollection.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-bold">Ma Collection</h2>
                <p className="text-sm text-muted-foreground">{myCollection.length} films dans votre bibliothèque</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate("/collection")}>
                Voir tout
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <ShelfView movies={myCollection.slice(0, 8)} movieDetailsMap={{}} onMovieClick={(movie) => navigate(`/movie/${movie.tmdb_id}`)} />
          </section>
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
        <section>
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold">La Communauté CineVault</h2>
                <p className="text-sm text-muted-foreground">Rejoignez des passionnés de cinéma</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                  <Disc className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-2xl font-bold">{stats.movies.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground mt-1">Films catalogués</p>
              </div>

              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-2xl font-bold">{stats.collectors.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground mt-1">Collectionneurs</p>
              </div>

              <div className="text-center p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <span className="text-2xl font-bold">{stats.reviews.toLocaleString()}</span>
                <p className="text-xs text-muted-foreground mt-1">Avis & Critiques</p>
              </div>
            </div>
          </GlassCard>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
