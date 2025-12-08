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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Index Page — Landing & Dashboard
 *
 * @description Page d'accueil avec:
 * - Hero cinematique glassmorphism (visiteurs)
 * - Dashboard Bento Grid personnalisé (utilisateurs connectés)
 * - Sections de films avec animations stagger
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

  const featuredMovie = popular[0];
  const secondaryMovies = popular.slice(1, 4);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 overflow-x-hidden">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 mesh-gradient opacity-50 pointer-events-none" />

      <Header />

      <main className="relative w-full max-w-full">
        {/* ========================================
            LANDING HERO — Visiteurs non connectés
            ======================================== */}
        {!user && featuredMovie && (
          <section className="relative w-full min-h-[90vh] sm:min-h-[85vh] flex items-end pb-16 sm:pb-24">
            {/* Background Image avec parallax subtle */}
            <div className="absolute inset-0 z-0">
              <img
                src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
                alt={featuredMovie.title}
                className="w-full h-full object-cover scale-105"
              />

              {/* Multiple gradient overlays pour profondeur */}
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
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
                  <span className="text-sm font-medium text-white">Votre cinémathèque personnelle</span>
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
                  Organisez votre
                  <br />
                  <span className="text-gradient-gold">passion cinéma</span>
                </h1>

                {/* Subtitle */}
                <p
                  className={cn(
                    "mt-6 text-lg sm:text-xl text-white/80",
                    "max-w-xl leading-relaxed",
                    "animate-fade-in-up stagger-2",
                  )}
                >
                  Créez votre collection, suivez vos films vus, découvrez des pépites et gagnez des badges. Tout votre
                  univers cinéma en un seul endroit.
                </p>

                {/* CTA Buttons */}
                <div className={cn("flex flex-col sm:flex-row gap-4 mt-8", "animate-fade-in-up stagger-3")}>
                  <Button
                    size="lg"
                    className={cn("btn-gold text-base px-8 h-12", "shadow-glow")}
                    onClick={() => navigate("/auth")}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Commencer gratuitement
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
                    { icon: Library, label: "Collection physique" },
                    { icon: Trophy, label: "Gamification" },
                    { icon: Film, label: "Infos TMDB" },
                    { icon: MonitorPlay, label: "Streaming" },
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
          </section>
        )}

        {/* ========================================
            DASHBOARD BENTO — Utilisateurs connectés
            ======================================== */}
        {user && !loading && (
          <section className="relative px-4 sm:px-6 py-8 sm:py-12 mb-8">
            <div className="container mx-auto">
              {/* Section Header */}
              <div className="mb-6 sm:mb-8">
                <span className="section-label">Tableau de bord</span>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">Bienvenue</h2>
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
                  className="lg:col-span-2 lg:row-span-2"
                >
                  <BentoContent>
                    <BentoIcon color="primary">
                      <Zap className="w-5 h-5" />
                    </BentoIcon>
                    <div className="mt-auto">
                      <BentoLabel>Niveau</BentoLabel>
                      <BentoValue className="text-gradient-gold">{currentLevel}</BentoValue>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>{currentXp} XP</span>
                          <span>{nextLevelXp} XP</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Badges Count */}
                <BentoItem
                  size="sm"
                  variant="glass"
                  interactive
                  animationDelay={150}
                  onClick={() => navigate("/badges")}
                  className="lg:col-span-2"
                >
                  <BentoContent padding="sm">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <BentoValue>{unlockedBadges.length}</BentoValue>
                        <BentoDescription>Badges débloqués</BentoDescription>
                      </div>
                      <BentoIcon color="primary">
                        <Trophy className="w-5 h-5" />
                      </BentoIcon>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Films Vus */}
                <BentoItem
                  size="sm"
                  variant="glass"
                  interactive
                  animationDelay={200}
                  onClick={() => navigate("/profile")}
                  className="lg:col-span-2"
                >
                  <BentoContent padding="sm">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <BentoValue>{userStats.watchedIds.size}</BentoValue>
                        <BentoDescription>Films vus</BentoDescription>
                      </div>
                      <BentoIcon color="muted">
                        <Eye className="w-5 h-5" />
                      </BentoIcon>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Quick Access - Collection */}
                <BentoItem
                  size="md"
                  variant="gradient"
                  interactive
                  animationDelay={250}
                  onClick={() => navigate("/collection")}
                  className="lg:col-span-2 lg:row-span-2"
                >
                  <BentoContent>
                    <BentoIcon color="primary">
                      <Library className="w-5 h-5" />
                    </BentoIcon>
                    <div className="mt-auto">
                      <BentoLabel>Ma collection</BentoLabel>
                      <BentoValue>{userStats.physicalCount}</BentoValue>
                      <BentoDescription>Films physiques</BentoDescription>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Favoris */}
                <BentoItem size="sm" variant="default" interactive animationDelay={300} className="lg:col-span-2">
                  <BentoContent padding="sm">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <BentoValue>{userStats.favoriteIds.size}</BentoValue>
                        <BentoDescription>Favoris</BentoDescription>
                      </div>
                      <BentoIcon color="muted">
                        <Heart className="w-5 h-5" />
                      </BentoIcon>
                    </div>
                  </BentoContent>
                </BentoItem>

                {/* Critiques */}
                <BentoItem size="sm" variant="default" interactive animationDelay={350} className="lg:col-span-2">
                  <BentoContent padding="sm">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <BentoValue>{userStats.reviewCount}</BentoValue>
                        <BentoDescription>Critiques</BentoDescription>
                      </div>
                      <BentoIcon color="muted">
                        <Star className="w-5 h-5" />
                      </BentoIcon>
                    </div>
                  </BentoContent>
                </BentoItem>
              </BentoGrid>
            </div>
          </section>
        )}

        {/* ========================================
            MOVIE SECTIONS
            ======================================== */}

        {/* Following Section - Only for logged users */}
        {user && <FollowingMoviesSection />}

        {/* Popular Movies */}
        <MovieSection
          title="Films populaires"
          label="Tendances"
          subtitle="Les films qui font parler d'eux"
          movies={popular}
          loading={loading}
          seeMoreLink="/movies/popular"
          cardSize="lg"
        />

        {/* Now Available */}
        <MovieSection
          title="Disponibles maintenant"
          label="Sorties récentes"
          subtitle="À découvrir en streaming ou en salle"
          movies={nowAvailable}
          loading={loading}
          seeMoreLink="/movies/now-available"
          cardSize="md"
        />

        {/* Discover More - CTA Section for non-logged users */}
        {!user && (
          <section className="px-4 sm:px-6 py-12 sm:py-16">
            <div className="container mx-auto">
              <GlassCard variant="gradient" padding="lg" className="text-center">
                <div className="max-w-2xl mx-auto">
                  <span className="section-label">Rejoignez-nous</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-2">
                    Prêt à organiser votre cinémathèque ?
                  </h2>
                  <p className="text-muted-foreground mt-4">
                    Créez votre compte gratuit et commencez à explorer, collecter et partager votre passion pour le
                    cinéma.
                  </p>
                  <Button size="lg" className="btn-gold mt-6" onClick={() => navigate("/auth")}>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Créer mon compte
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
