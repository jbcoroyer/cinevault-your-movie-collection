import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieSection } from "@/components/MovieSection";
import { FollowingMoviesSection } from "@/components/FollowingMoviesSection";
import { getPopularMovies, getNowAvailableMovies, Movie } from "@/services/tmdb";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { ArrowRight, Film, Trophy, Star, Users } from "lucide-react";

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
        {/* Hero Bento Section */}
        {featuredMovie && !loading && (
          <section className="relative px-4 sm:px-6 py-6 sm:py-10 mb-6 sm:mb-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {/* Featured Movie */}
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

                {/* Stats Cards - Logged in */}
                {user && (
                  <>
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
                  </>
                )}

                {/* Cards - Not logged in */}
                {!user && (
                  <>
                    <div className="bento-card bento-gold flex flex-col justify-between">
                      <Film className="w-5 h-5 opacity-70" />
                      <div>
                        <p className="font-serif text-2xl font-medium">CinéVault</p>
                        <p className="text-sm opacity-70">Votre collection</p>
                      </div>
                    </div>
                    <Link to="/auth" className="bento-card bento-cream flex flex-col justify-between group">
                      <span className="text-xs uppercase tracking-wider opacity-70">Nouveau ?</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Créer un compte</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  </>
                )}

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

        {/* Following Movies Section - Personalized */}
        {user && <FollowingMoviesSection />}

        {/* Movie Sections */}
        <MovieSection title="À l'affiche" movies={nowAvailable} loading={loading} seeMoreLink="/movies/now-available" />

        <MovieSection
          title="Les plus populaires"
          movies={popular.slice(2)}
          loading={loading}
          seeMoreLink="/movies/popular"
        />
      </main>

      <BottomNav />
    </div>
  );
}
