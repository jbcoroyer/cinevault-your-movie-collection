import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieSection } from "@/components/MovieSection";
import { getTrendingMovies, getPopularMovies, Movie } from "@/services/tmdb";
import { WatchedTimeline } from "@/components/WatchedTimeline";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [trendingData, popularData] = await Promise.all([getTrendingMovies(), getPopularMovies()]);
        setTrending(trendingData);
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
        <MovieSection title="Films populaires" movies={popular} loading={loading} />
        {/* Timeline of watched movies (only for logged in users) */}
        {user && <WatchedTimeline />}
      </main>

      <BottomNav />
    </div>
  );
}
