import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieSection } from "@/components/MovieSection";
import { getPopularMovies, getNowPlayingMovies, getStreamingMovies, Movie } from "@/services/tmdb";
import { WatchedTimeline } from "@/components/WatchedTimeline";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [streaming, setStreaming] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [nowPlayingData, streamingData, popularData] = await Promise.all([
          getNowPlayingMovies(),
          getStreamingMovies(),
          getPopularMovies(),
        ]);
        setNowPlaying(nowPlayingData);
        setStreaming(streamingData);
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
        <MovieSection title="🎬 Actuellement au cinéma" movies={nowPlaying} loading={loading} />
        <MovieSection title="📺 Nouveautés streaming" movies={streaming} loading={loading} />
        <MovieSection title="🔥 Films populaires" movies={popular} loading={loading} />
        {/* Timeline of watched movies (only for logged in users) */}
        {user && <WatchedTimeline />}
      </main>

      <BottomNav />
    </div>
  );
}
