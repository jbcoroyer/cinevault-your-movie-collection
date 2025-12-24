/**
 * CineVault - Movie Detail Page - Radical Minimalist Design
 *
 * Page de détail film avec:
 * - MinimalHeader + FloatingDock (navigation cohérente)
 * - Hero image backdrop
 * - Actions (watchlist, vu, favori, listes)
 * - Infos réalisateur et casting
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, getImageUrl, formatRuntime, getYear, getDirector, MovieDetails } from "@/services/tmdb";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useActivities } from "@/hooks/useActivities";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { WatchedDialog } from "@/components/WatchedDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Check, Heart, Clock, ListPlus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchedDialogOpen, setWatchedDialogOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);

  const { getUserMovie, addToWatchlist, markAsWatchedWithDetails, toggleFavorite } = useUserMovies();
  const { createActivity } = useActivities();

  const userMovie = movie ? getUserMovie(movie.id) : undefined;
  const isInWatchlist = userMovie?.status === "watchlist";
  const isWatched = userMovie?.status === "watched";
  const isFavorite = userMovie?.is_favorite ?? false;

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      try {
        const data = await getMovieDetails(Number(id));
        setMovie(data);
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  const handleWatchlistClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    addToWatchlist(movie!.id);
  };

  const handleWatchedClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (isWatched) {
      markAsWatchedWithDetails(movie!.id, {});
    } else {
      setWatchedDialogOpen(true);
    }
  };

  const handleFavoriteClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    toggleFavorite(movie!.id);
  };

  const handleAddToListClick = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setAddToListOpen(true);
  };

  const handleWatchedSave = async (data: { watchedDate?: string; rating?: number; review?: string }) => {
    if (!movie) return;
    await markAsWatchedWithDetails(movie.id, data);
    await createActivity(
      "watched",
      { tmdb_id: movie.id, title: movie.title, poster_path: movie.poster_path },
      { rating: data.rating },
    );
  };

  const director = movie ? getDirector(movie) : undefined;
  const cast = movie?.credits?.cast.slice(0, 8) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <div className="h-[50vh] md:h-[60vh] bg-white/5 animate-pulse" />
        <div className="px-4 md:px-12 -mt-20 max-w-4xl mx-auto space-y-4">
          <div className="h-10 bg-white/5 animate-pulse w-3/4 rounded" />
          <div className="h-4 bg-white/5 animate-pulse w-1/2 rounded" />
        </div>
        <FloatingDock />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="pt-20 md:pt-24 px-4 md:px-12 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-white/50 mb-4">Film non trouvé</p>
            <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors">
              Retour
            </button>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  const backdropUrl = getImageUrl(movie.backdrop_path, "original");
  const posterUrl = getImageUrl(movie.poster_path, "w500");

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <MinimalHeader />

      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {backdropUrl ? (
          <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/5" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="absolute top-20 md:top-24 left-4 md:left-12 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Content */}
      <main className="px-4 md:px-12 -mt-32 md:-mt-40 relative z-10 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Title & Meta */}
          <h1 className="font-display text-display-sm md:text-display-md text-white mb-2">
            {movie.title.toUpperCase()}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/50 mb-6">
            {getYear(movie.release_date) && <span>{getYear(movie.release_date)}</span>}
            {movie.runtime && movie.runtime > 0 && (
              <>
                <span className="text-white/20">•</span>
                <span>{formatRuntime(movie.runtime)}</span>
              </>
            )}
            {movie.vote_average > 0 && (
              <>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  {movie.vote_average.toFixed(1)}
                </span>
              </>
            )}
            {movie.genres && movie.genres.length > 0 && (
              <>
                <span className="text-white/20">•</span>
                <span>{movie.genres.map((g) => g.name).join(", ")}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-12">
            <Button
              onClick={handleWatchlistClick}
              className={cn(
                "min-h-[44px]",
                isInWatchlist
                  ? "bg-white text-black"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black",
              )}
            >
              {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Watchlist
            </Button>
            <Button
              onClick={handleWatchedClick}
              className={cn(
                "min-h-[44px]",
                isWatched
                  ? "bg-white text-black"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black",
              )}
            >
              {isWatched ? <Check className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
              Vu
            </Button>
            <Button
              onClick={handleFavoriteClick}
              className={cn(
                "min-h-[44px] min-w-[44px]",
                isFavorite
                  ? "bg-white text-black"
                  : "bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black",
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
            <Button
              onClick={handleAddToListClick}
              className="min-h-[44px] min-w-[44px] bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black"
            >
              <ListPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Synopsis */}
          {movie.overview && (
            <section className="mb-12">
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Synopsis</h2>
              <p className="text-white/70 leading-relaxed">{movie.overview}</p>
            </section>
          )}

          {/* Director */}
          {director && (
            <section className="mb-12">
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Réalisateur</h2>
              <button
                onClick={() => navigate(`/person/${director.id}`)}
                className="flex items-center gap-4 hover:bg-white/5 p-3 -ml-3 rounded-lg transition-colors"
              >
                {director.profile_path ? (
                  <img
                    src={getImageUrl(director.profile_path, "w200") || ""}
                    alt={director.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-sm">
                    {director.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-white">{director.name}</span>
              </button>
            </section>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cast.map((actor) => (
                  <button
                    key={actor.id}
                    onClick={() => navigate(`/person/${actor.id}`)}
                    className="text-left hover:bg-white/5 p-3 -ml-3 rounded-lg transition-colors"
                  >
                    <p className="font-medium text-sm text-white truncate">{actor.name}</p>
                    <p className="text-xs text-white/50 truncate">{actor.character}</p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </main>

      {/* Dialogs */}
      {movie && (
        <>
          <WatchedDialog
            open={watchedDialogOpen}
            onOpenChange={setWatchedDialogOpen}
            movieTitle={movie.title}
            onSave={handleWatchedSave}
          />
          <AddToListDialog
            open={addToListOpen}
            onOpenChange={setAddToListOpen}
            movie={{
              tmdb_id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
            }}
          />
        </>
      )}

      <FloatingDock />
    </div>
  );
}
