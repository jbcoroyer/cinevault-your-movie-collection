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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-24 md:pb-8">
        {/* ========================================
            HERO SECTION — Non-connectés uniquement
            ======================================== */}
        {!user && (
          <section className="relative min-h-[85vh] flex items-center overflow-hidden">
            {/* Background Image with Ken Burns effect */}
            <div className="absolute inset-0 z-0">
              {featuredMovie?.backdrop_path && (
                <img
                  src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
                  alt=""
                  className="w-full h-full object-cover scale-105 animate-[kenburns_30s_ease-in-out_infinite_alternate]"
                />
              )}
              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full container mx-auto px-4 sm:px-6">
              <div className="max-w-3xl">
                {/* Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-2 mb-6",
                    "px-4 py-2 rounded-full",
                    "bg-white/10 backdrop-blur-md",
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
                    "font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
                    "font-bold text-white leading-[1.1]",
                    "text-shadow-hero",
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
                    "mt-6 text-lg sm:text-xl text-white/80",
                    "max-w-xl leading-relaxed",
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
                      "bg-white/10 backdrop-blur-md border-white/20",
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
                        "bg-white/5 backdrop-blur-sm",
                        "border border-white/10",
                        "text-sm text-white/70",
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
        <LiveActivityFeed className="mt-0" />

        {/* ========================================
            COMMUNITY STATS — Compteurs animés
            ======================================== */}
        <CommunityStats />

        {/* ========================================
            DASHBOARD BENTO — Utilisateurs connectés
            ======================================== */}
        {user && !loading && (
          <section className="relative px-4 sm:px-6 py-8 sm:py-12">
            <div className="container mx-auto">
              {/* Section Header */}
              <div className="mb-6 sm:mb-8">
                <span className="section-label">Tableau de bord</span>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">
                  Bienvenue, {user.email?.split("@")[0]}
                </h2>
              </div>

              {/* Bento Grid */}
              <BentoGrid cols={12} gap="md">
                {/* Featured Movie - Large */}
                {featuredMovie && (
                  <BentoItem
                    size="hero"
                    variant="image"
                    backgroundImage={`https://image.tmdb.org/t/p/w1280${featuredMovie.backdrop_path}`}
                    interactive
                    animationDelay={0}
                    onClick={() => navigate(`/movie/${featuredMovie.id}`)}
                  >
                    <BentoContent padding="lg">
                      <BentoLabel>À l'affiche</BentoLabel>
                      <BentoTitle className="text-white text-2xl sm:text-3xl md:text-4xl mt-2 text-shadow-hero">
                        {featuredMovie.title}
                      </BentoTitle>
                      <p className="text-white/70 text-sm mt-2 line-clamp-2 max-w-md">{featuredMovie.overview}</p>
                      <div className="flex items-center gap-4 mt-4">
                        <span className="flex items-center gap-1 text-white/80">
                          <Star className="w-4 h-4 text-primary fill-primary" />
                          {featuredMovie.vote_average.toFixed(1)}
                        </span>
                        <span className="text-white/60 text-sm">{featuredMovie.release_date?.split("-")[0]}</span>
                      </div>
                    </BentoContent>
                  </BentoItem>
                )}

                {/* XP Progress Card */}
                <BentoItem
                  size="md"
                  variant="gold"
                  interactive
                  animationDelay={100}
                  onClick={() => navigate("/badges")}
                >
                  <BentoContent>
                    <BentoIcon color="primary">
                      <Zap className="w-5 h-5" />
                    </BentoIcon>
                    <BentoLabel className="mt-3">Niveau {currentLevel}</BentoLabel>
                    <BentoValue className="text-gradient-gold">{currentXp} XP</BentoValue>
                    <div className="mt-3 space-y-1.5">
                      <Progress value={progressPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {nextLevelXp - currentXp} XP pour le niveau {currentLevel + 1}
                      </p>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Collection Stats */}
                <BentoItem
                  size="md"
                  variant="glass"
                  interactive
                  animationDelay={200}
                  onClick={() => navigate("/collection")}
                >
                <BentoContent>
                    <BentoIcon color="primary">
                      <Library className="w-5 h-5" />
                    </BentoIcon>
                    <BentoLabel className="mt-3">Ma Collection</BentoLabel>
                    <BentoValue>{userStats?.physicalCount || 0}</BentoValue>
                    <BentoDescription>DVD & Blu-ray</BentoDescription>
                  </BentoContent>
                </BentoItem>

                {/* Watched Stats */}
                <BentoItem size="sm" variant="glass" interactive animationDelay={300}>
                  <BentoContent padding="sm">
                    <div className="flex items-center gap-3">
                      <BentoIcon color="primary">
                        <Eye className="w-4 h-4" />
                      </BentoIcon>
                      <div>
                        <BentoValue className="text-2xl">{userStats?.watchedIds.size || 0}</BentoValue>
                        <p className="text-xs text-muted-foreground">Films vus</p>
                      </div>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Favorites Stats */}
                <BentoItem size="sm" variant="glass" interactive animationDelay={400}>
                  <BentoContent padding="sm">
                    <div className="flex items-center gap-3">
                      <BentoIcon color="primary">
                        <Heart className="w-4 h-4" />
                      </BentoIcon>
                      <div>
                        <BentoValue className="text-2xl">{userStats?.favoriteIds.size || 0}</BentoValue>
                        <p className="text-xs text-muted-foreground">Favoris</p>
                      </div>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Badges Stats */}
                <BentoItem
                  size="sm"
                  variant="glass"
                  interactive
                  animationDelay={500}
                  onClick={() => navigate("/badges")}
                >
                  <BentoContent padding="sm">
                    <div className="flex items-center gap-3">
                      <BentoIcon color="primary">
                        <Trophy className="w-4 h-4" />
                      </BentoIcon>
                      <div>
                        <BentoValue className="text-2xl">{unlockedBadges?.length || 0}</BentoValue>
                        <p className="text-xs text-muted-foreground">Badges</p>
                      </div>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Quick Action - Search */}
                <BentoItem
                  size="sm"
                  variant="gradient"
                  interactive
                  animationDelay={600}
                  onClick={() => navigate("/search")}
                >
                  <BentoContent padding="sm" className="items-center justify-center text-center">
                    <TrendingUp className="w-6 h-6 text-primary mb-2" />
                    <span className="text-sm font-medium">Découvrir</span>
                  </BentoContent>
                </BentoItem>
              </BentoGrid>
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
          <section className="px-4 sm:px-6 py-16">
            <div className="container mx-auto">
              <GlassCard variant="gradient" hover="aurora" padding="lg" className="text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Disc className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-4">
                  Prêt à cataloguer votre collection ?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Rejoignez des milliers de collectionneurs passionnés. Cataloguez vos films, découvrez de nouvelles
                  pépites et partagez votre passion.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="btn-gold" onClick={() => navigate("/auth")}>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Créer mon compte gratuit
                  </Button>
                </div>
              </GlassCard>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
