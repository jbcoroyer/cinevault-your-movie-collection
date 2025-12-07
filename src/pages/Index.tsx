import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieSection } from "@/components/MovieSection";
import { getPopularMovies, getNowAvailableMovies, Movie } from "@/services/tmdb";
import { WatchedTimeline } from "@/components/WatchedTimeline";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

export default function Index() {
  const { user } = useAuth();
  const { triggerTestBadge } = useBadgeNotification();
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
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="py-6">
        {/* Test button for badge popup */}
        <div className="container mx-auto px-4 mb-4">
          <Button onClick={triggerTestBadge} variant="outline" size="sm" className="gap-2">
            <Trophy className="w-4 h-4" />
            Tester un badge
          </Button>
        </div>

        <MovieSection
          title="🎬 Actuellement à visionner"
          movies={nowAvailable}
          loading={loading}
          seeMoreLink="/movies/now-available"
        />
        <MovieSection title="🔥 Films populaires" movies={popular} loading={loading} seeMoreLink="/movies/popular" />
        {user && <WatchedTimeline />}
      </main>

      <BottomNav />
    </div>
  );
}
