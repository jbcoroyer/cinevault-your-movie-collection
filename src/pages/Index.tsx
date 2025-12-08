import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieSection } from "@/components/MovieSection";
import { getPopularMovies, getNowAvailableMovies, Movie } from "@/services/tmdb";
import { WatchedTimeline } from "@/components/WatchedTimeline";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 overflow-x-hidden">
      <Header />

      <main className="py-4 sm:py-6 w-full max-w-full overflow-hidden">
        <MovieSection
          title="🎬 Actuellement à visionner"
          movies={nowAvailable}
          loading={loading}
          seeMoreLink="/movies/now-available"
        />
        <MovieSection title="🔥 Films populaires" movies={popular} loading={loading} seeMoreLink="/movies/popular" />
        {user && (
          <div className="overflow-hidden">
            <WatchedTimeline />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
