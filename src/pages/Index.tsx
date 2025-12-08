import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { MovieSection } from "../components/MovieSection";
import { FollowingMoviesSection } from "../components/FollowingMoviesSection";
import { getPopularMovies, getNowAvailableMovies, Movie } from "../services/tmdb";
import { useAuth } from "../contexts/AuthContext";
import { useBadgeNotification } from "../contexts/BadgeNotificationContext";
import { ArrowRight, Film, Trophy, Star, PlayCircle, UserPlus, Zap, MonitorPlay } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Index() {
  const { user } = useAuth();
  const { currentLevel, currentXp, unlockedBadges } = useBadgeNotification();
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

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 overflow-x-hidden">
      <div className="grain-overlay" />
      <Header />

      <main className="w-full max-w-full overflow-hidden">
        {/* --- LANDING HERO (Si non connecté) --- */}
        {!user && featuredMovie && (
          <section className="relative w-full h-[85vh] md:h-[70vh] flex items-end pb-12 sm:pb-24">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={`https://image.tmdb.org/t/p/original${featuredMovie.backdrop_path}`}
                alt={featuredMovie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 sm:px-6">
              <div className="max-w-2xl space-y-6 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <Zap className="w-3 h-3" /> La Référence Cinéma
                </div>

                <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-bold leading-[1.1] text-white">
                  Votre collection de films, <span className="text-primary">réinventée.</span>
                </h1>

                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-lg">
                  Organisez votre vidéothèque physique, suivez ce que vous regardez, gagnez des badges et découvrez vos
                  prochains coups de cœur.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-xl shadow-primary/20">
                    <Link to="/auth?mode=signup">
                      Commencer l'aventure
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base bg-white/5 border-white/20 hover:bg-white/10 text-white"
                  >
                    <Link to="/search">
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Explorer les films
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-6 pt-6 text-sm text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <MonitorPlay className="w-4 h-4 text-primary" />
                    <span>Gestion de collection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span>Gamification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    <span>Infos complètes</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* --- DASHBOARD (Si connecté) --- */}
        {user && featuredMovie && !loading && (
          <section className="relative px-4 sm:px-6 py-6 sm:py-10 mb-6 sm:mb-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* Featured Movie Card */}
                <Link
                  to={`/movie/${featuredMovie.id}`}
                  className="col-span-2 row-span-2 relative rounded-xl overflow-hidden group aspect-[4/3] md:aspect-auto"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w780${featuredMovie.backdrop_path}`}
                    alt={featuredMovie.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <p className="text-white/70 text-xs uppercase tracking-wider mb-1">À l'affiche</p>
                    <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white font-medium leading-tight">
                      {featuredMovie.title}
                    </h2>
                    <p className="text-white/80 text-sm mt-2 line-clamp-2 hidden sm:block">{featuredMovie.overview}</p>
                  </div>
                </Link>

                {/* Stats Cards */}
                <Link to="/badges" className="bento-card bento-gold flex flex-col justify-between">
                  <div>
                    <Trophy className="w-5 h-5 mb-2 opacity-70" />
                    <p className="text-xs uppercase tracking-wider opacity-70">Niveau</p>
                  </div>
                  <div>
                    <p className="font-serif text-4xl sm:text-5xl font-medium">{currentLevel}</p>
                    <p className="text-sm opacity-70">{currentXp} XP</p>
                  </div>
                </Link>

                <Link to="/badges" className="bento-card bento-cream flex flex-col justify-between">
                  <div>
                    <Star className="w-5 h-5 mb-2 opacity-70" />
                    <p className="text-xs uppercase tracking-wider opacity-70">Badges</p>
                  </div>
                  <div>
                    <p className="font-serif text-4xl sm:text-5xl font-medium">{unlockedBadges.length}</p>
                    <p className="text-sm opacity-70">débloqués</p>
                  </div>
                </Link>

                {/* Second Featured */}
                {popular[1] && (
                  <Link
                    to={`/movie/${popular[1].id}`}
                    className="col-span-2 relative rounded-xl overflow-hidden group aspect-video"
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w780${popular[1].backdrop_path}`}
                      alt={popular[1].title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white/70 text-xs uppercase tracking-wider mb-1">Populaire</p>
                      <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">{popular[1].title}</h3>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}

        {/* --- MOVIE LISTS (Pour tous) --- */}
        <div className="space-y-4">
          {/* Following Movies - Hidden if guest */}
          {user && <FollowingMoviesSection />}

          <MovieSection
            title="À l'affiche au cinéma"
            subtitle="Les films du moment en salle"
            movies={nowAvailable}
            loading={loading}
            seeMoreLink="/movies/now-available"
          />

          <MovieSection
            title="Les plus populaires"
            subtitle="Les films les plus regardés cette semaine"
            movies={popular.slice(2)}
            loading={loading}
            seeMoreLink="/movies/popular"
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
