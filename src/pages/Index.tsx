import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { MovieSection } from "../components/MovieSection";
import { FollowingMoviesSection } from "../components/FollowingMoviesSection";
import { MovieCardFeatured, MovieCard } from "../components/MovieCard";
import {
  BentoGrid,
  BentoItem,
  BentoContent,
  BentoIcon,
  BentoLabel,
  BentoTitle,
  BentoValue,
  BentoDescription,
} from "../components/bento/BentoGrid";
import { GlassCard } from "../components/ui/GlassCard";

// New home components
import {
  LiveActivityFeed,
  CommunityStats,
  MostOwnedMovies,
  TopCollectorsCarousel,
  RareEditionsSection,
} from "../components/home";

import { getPopularMovies, getNowAvailableMovies, Movie, getImageUrl } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeNotification } from "../contexts/BadgeNotificationContext";
import {
  ArrowRight,
  Film,
  Trophy,
  Star,
  PlayCircle,
  UserPlus,
  Zap,
  MonitorPlay,
  Library,
  Heart,
  Clock,
  Sparkles,
  TrendingUp,
  Eye,
  Disc,
  Users,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Index Page — Landing & Dashboard (Refonte v2)
 *
 * @description Page d'accueil repensée avec:
 * - Live Activity Feed (bandeau temps réel)
 * - Compteurs communautaires animés
 * - Collections populaires (carrousel profils)
 * - Films les plus possédés (classement)
 * - Raretés & Collectors (showcase)
 * - Hero cinematique glassmorphism (visiteurs)
 * - Dashboard Bento Grid personnalisé (utilisateurs connectés)
 */

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLevel, currentXp, nextLevelXp, progressPercent, unlockedBadges, userStats } = useBadgeNotification();
  const [nowAvailable, setNowAvailable] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [nowAvailableData, popularData] = await Promise.all([getNowAvailableMovies(), getPopularMovies()]);
        setNowAvailable(nowAvailableData);
        setPopular(popularData);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Featured movie for hero
  const featuredMovie = nowAvailable[0] || popular[0];

  // Extraire les stats correctement depuis userStats (FIXED: using correct property names)
  const physicalCount = userStats?.physicalCount ?? 0;
  const watchedCount = userStats?.watchedIds?.size ?? 0;
  const favoritesCount = userStats?.favoriteIds?.size ?? 0;
  const badgesCount = unlockedBadges?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-24 md:pb-8">
        {/* ========================================
            HERO SECTION — Non-connectés uniquement
            ======================================== */}
        {!user && (
          <section className="relative min-h-[80vh] flex items-center overflow-hidden">
            {/* Background Image with Ken Burns effect */}
            <div className="absolute inset-0 z-0">
              {featuredMovie?.backdrop_path && (
                <img
                  src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
                  alt=""
                  className="w-full h-full object-cover scale-105 animate-[kenburns_30s_ease-in-out_infinite_alternate]"
                />
              )}
              {/* Overlays - améliorés pour meilleur contraste */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/60" />
              <div className="absolute inset-0 bg-black/30" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full container mx-auto px-4 sm:px-6">
              <div className="max-w-3xl">
                {/* Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-2 mb-6",
                    "px-4 py-2 rounded-full",
                    "bg-black/40 backdrop-blur-md",
                    "border border-white/20",
                    "animate-fade-in-up",
                  )}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-white">La communauté des collectionneurs de films</span>
                </div>

                {/* Title */}
                <h1
                  className={cn(
                    "font-display text-4xl sm:text-5xl md:text-6xl",
                    "font-bold text-white leading-[1.1]",
                    "drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]",
                    "animate-fade-in-up stagger-1",
                  )}
                >
                  Votre vidéothèque
                  <br />
                  <span className="text-gradient-gold">mérite mieux</span>
                </h1>

                {/* Subtitle */}
                <p
                  className={cn(
                    "mt-6 text-lg sm:text-xl text-white/90",
                    "max-w-xl leading-relaxed",
                    "drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]",
                    "animate-fade-in-up stagger-2",
                  )}
                >
                  Cataloguez vos DVD et Blu-ray, découvrez les collections des autres passionnés, et trouvez vos
                  prochaines pépites grâce à la communauté.
                </p>

                {/* CTA Buttons */}
                <div className={cn("flex flex-col sm:flex-row gap-4 mt-8", "animate-fade-in-up stagger-3")}>
                  <Button
                    size="lg"
                    className={cn("btn-gold text-base px-8 h-12", "shadow-glow")}
                    onClick={() => navigate("/auth")}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Créer ma collection
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "bg-black/30 backdrop-blur-md border-white/30",
                      "text-white hover:bg-white/20",
                      "h-12 px-8",
                    )}
                    onClick={() => navigate("/search")}
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Explorer les films
                  </Button>
                </div>

                {/* Features Pills */}
                <div className={cn("flex flex-wrap gap-3 mt-10", "animate-fade-in-up stagger-4")}>
                  {[
                    { icon: Disc, label: "Collection physique" },
                    { icon: Users, label: "Communauté active" },
                    { icon: Trophy, label: "Gamification" },
                    { icon: TrendingUp, label: "Découvertes" },
                  ].map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className={cn(
                        "flex items-center gap-2",
                        "px-4 py-2 rounded-full",
                        "bg-black/30 backdrop-blur-sm",
                        "border border-white/20",
                        "text-sm text-white/90",
                      )}
                    >
                      <Icon className="w-4 h-4 text-primary" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ken Burns animation */}
            <style>{`
              @keyframes kenburns {
                0% { transform: scale(1.05) translate(0, 0); }
                100% { transform: scale(1.15) translate(-2%, -2%); }
              }
            `}</style>
          </section>
        )}

        {/* ========================================
            LIVE ACTIVITY FEED — Bandeau temps réel
            ======================================== */}
        <LiveActivityFeed className={user ? "mt-0" : ""} />

        {/* ========================================
            COMMUNITY STATS — Compteurs animés
            ======================================== */}
        <CommunityStats />

        {/* ========================================
            DASHBOARD BENTO — Utilisateurs connectés
            ======================================== */}
        {user && !loading && (
          <section className="relative px-4 sm:px-6 py-6 sm:py-10">
            <div className="container mx-auto">
              {/* Section Header */}
              <div className="mb-5 sm:mb-6">
                <span className="section-label">Tableau de bord</span>
                <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1">
                  Bienvenue, {user.email?.split("@")[0]}
                </h2>
              </div>

              {/* Bento Grid - Redesigned for better spacing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* Featured Movie - Reduced size with better contrast */}
                {featuredMovie && (
                  <div
                    onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                    className={cn(
                      "col-span-2 sm:col-span-4 lg:col-span-3 row-span-2",
                      "relative overflow-hidden rounded-2xl cursor-pointer",
                      "bg-card border border-border/50",
                      "transition-all duration-300 hover:shadow-xl hover:scale-[1.01]",
                      "group min-h-[200px] sm:min-h-[220px]",
                    )}
                  >
                    {/* Background image */}
                    <div className="absolute inset-0">
                      <img
                        src={`https://image.tmdb.org/t/p/w780${featuredMovie.backdrop_path}`}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Stronger gradient for better readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 self-start",
                          "px-2.5 py-1 rounded-full mb-2",
                          "bg-primary/90 text-primary-foreground",
                          "text-xs font-semibold",
                        )}
                      >
                        <Sparkles className="w-3 h-3" />À l'affiche
                      </span>
                      <h3 className="font-display text-base sm:text-lg font-bold text-white line-clamp-2 drop-shadow-lg">
                        {featuredMovie.title}
                      </h3>
                      <p className="text-white/80 text-xs sm:text-sm mt-1 line-clamp-2 max-w-sm">
                        {featuredMovie.overview}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-white">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-sm">{featuredMovie.vote_average.toFixed(1)}</span>
                        </span>
                        <span className="text-white/70 text-xs">{featuredMovie.release_date?.split("-")[0]}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* XP Progress Card */}
                <div
                  onClick={() => navigate("/badges")}
                  className={cn(
                    "col-span-2 sm:col-span-2 lg:col-span-3",
                    "relative overflow-hidden rounded-2xl cursor-pointer",
                    "bg-gradient-to-br from-amber-500/10 via-card to-orange-500/5",
                    "border border-amber-500/20",
                    "p-4 sm:p-5",
                    "transition-all duration-300 hover:shadow-lg hover:border-amber-500/40",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        Niveau {currentLevel}
                      </p>
                      <p className="font-stats text-2xl sm:text-3xl font-bold text-gradient-gold">{currentXp} XP</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <Progress value={progressPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {nextLevelXp - currentXp} XP pour le niveau {currentLevel + 1}
                    </p>
                  </div>
                </div>

                {/* Collection Stats */}
                <div
                  onClick={() => navigate("/collection")}
                  className={cn(
                    "col-span-1",
                    "relative overflow-hidden rounded-2xl cursor-pointer",
                    "bg-card/80 backdrop-blur-sm border border-border/50",
                    "p-4",
                    "transition-all duration-300 hover:shadow-lg hover:bg-card",
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center mb-2">
                      <Library className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="font-stats text-2xl sm:text-3xl font-bold">{physicalCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ma Collection</p>
                  </div>
                </div>

                {/* Watched Stats */}
                <div
                  className={cn(
                    "col-span-1",
                    "relative overflow-hidden rounded-2xl",
                    "bg-card/80 backdrop-blur-sm border border-border/50",
                    "p-4",
                    "transition-all duration-300 hover:shadow-lg hover:bg-card",
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-2">
                      <Eye className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="font-stats text-2xl sm:text-3xl font-bold">{watchedCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Films vus</p>
                  </div>
                </div>

                {/* Favorites Stats */}
                <div
                  className={cn(
                    "col-span-1",
                    "relative overflow-hidden rounded-2xl",
                    "bg-card/80 backdrop-blur-sm border border-border/50",
                    "p-4",
                    "transition-all duration-300 hover:shadow-lg hover:bg-card",
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center mb-2">
                      <Heart className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="font-stats text-2xl sm:text-3xl font-bold">{favoritesCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Favoris</p>
                  </div>
                </div>

                {/* Badges Stats */}
                <div
                  onClick={() => navigate("/badges")}
                  className={cn(
                    "col-span-1",
                    "relative overflow-hidden rounded-2xl cursor-pointer",
                    "bg-card/80 backdrop-blur-sm border border-border/50",
                    "p-4",
                    "transition-all duration-300 hover:shadow-lg hover:bg-card",
                  )}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center mb-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="font-stats text-2xl sm:text-3xl font-bold">{badgesCount}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Badges</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div
                  onClick={() => navigate("/search")}
                  className={cn(
                    "col-span-1",
                    "relative overflow-hidden rounded-2xl cursor-pointer",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "border border-primary/20",
                    "p-4",
                    "transition-all duration-300 hover:shadow-lg hover:border-primary/40",
                    "flex flex-col items-center justify-center text-center",
                  )}
                >
                  <TrendingUp className="w-6 h-6 text-primary mb-2" />
                  <span className="text-sm font-medium">Découvrir</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ========================================
            TOP COLLECTORS — Carrousel des profils
            ======================================== */}
        <TopCollectorsCarousel />

        {/* ========================================
            MOST OWNED MOVIES — Classement
            ======================================== */}
        <MostOwnedMovies limit={10} />

        {/* ========================================
            RARE EDITIONS — Showcase
            ======================================== */}
        <RareEditionsSection limit={8} />

        {/* ========================================
            FOLLOWING MOVIES — Activité abonnements
            ======================================== */}
        {user && <FollowingMoviesSection />}

        {/* ========================================
            NOW AVAILABLE — Films récents
            ======================================== */}
        <MovieSection
          title="Actuellement disponibles"
          subtitle="En salles et en streaming"
          movies={nowAvailable}
          loading={loading}
          seeMoreLink="/movies/now-available"
        />

        {/* ========================================
            POPULAR MOVIES — Films populaires
            ======================================== */}
        <MovieSection
          title="Films populaires"
          subtitle="Les plus appréciés du moment"
          movies={popular}
          loading={loading}
          seeMoreLink="/movies/popular"
        />

        {/* ========================================
            CTA SECTION — Non-connectés
            ======================================== */}
        {!user && (
          <section className="px-4 sm:px-6 py-12">
            <div className="container mx-auto">
              <GlassCard variant="gradient" hover="aurora" padding="lg" className="text-center max-w-2xl mx-auto">
                <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Disc className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold mb-3">
                  Prêt à cataloguer votre collection ?
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm sm:text-base">
                  Rejoignez des milliers de collectionneurs passionnés. Cataloguez vos films, découvrez de nouvelles
                  pépites et partagez votre passion.
                </p>
                <Button size="lg" className="btn-gold" onClick={() => navigate("/auth")}>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Créer mon compte gratuit
                </Button>
              </GlassCard>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
