/**
 * CineVault - Movie Detail Page - Radical Minimalist Design
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMovieDetails,
  getImageUrl,
  formatRuntime,
  getYear,
  getDirector,
  MovieDetails,
} from "@/services/tmdb";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useActivities } from "@/hooks/useActivities";
import { WatchedDialog } from "@/components/WatchedDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Check,
  Heart,
  Clock,
  ListPlus,
} from "lucide-react";
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
      <div className="min-h-screen bg-background">
        <div className="h-[60vh] bg-card animate-pulse" />
        <div className="px-4 md:px-12 -mt-20 max-w-4xl mx-auto space-y-4">
          <div className="h-10 bg-card animate-pulse w-3/4" />
          <div className="h-4 bg-card animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Film non trouvé</p>
      </div>
    );
  }

  const backdropUrl = getImageUrl(movie.backdrop_path, "original");
  const posterUrl = getImageUrl(movie.poster_path, "w500");

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {backdropUrl ? (
          <img 
            src={backdropUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-11 h-11 flex items-center justify-center bg-background/80 backdrop-blur-sm text-foreground hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <main className="px-4 md:px-12 -mt-32 relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Title & Meta */}
          <h1 className="text-heading-mobile md:text-heading-desktop font-bold text-foreground mb-2">
            {movie.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span>{getYear(movie.release_date)}</span>
            {movie.runtime > 0 && <span>{formatRuntime(movie.runtime)}</span>}
            {movie.vote_average > 0 && (
              <span>{movie.vote_average.toFixed(1)}/10</span>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 mb-8">
            {movie.genres?.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 text-xs border border-border"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-12">
            <Button
              onClick={handleWatchlistClick}
              className={cn(
                "min-h-[44px]",
                isInWatchlist 
                  ? "bg-foreground text-background" 
                  : "bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background"
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
                  ? "bg-foreground text-background" 
                  : "bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background"
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
                  ? "bg-foreground text-background" 
                  : "bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background"
              )}
            >
              <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            </Button>
            <Button
              onClick={handleAddToListClick}
              className="min-h-[44px] min-w-[44px] bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background"
            >
              <ListPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Synopsis */}
          {movie.overview && (
            <section className="mb-12">
              <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Synopsis</h2>
              <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
            </section>
          )}

          {/* Director */}
          {director && (
            <section className="mb-12">
              <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Réalisateur</h2>
              <button
                onClick={() => navigate(`/person/${director.id}`)}
                className="flex items-center gap-4 hover:bg-card p-3 -ml-3 transition-colors"
              >
                {director.profile_path ? (
                  <img
                    src={getImageUrl(director.profile_path, "w200") || ""}
                    alt={director.name}
                    className="w-12 h-12 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-card flex items-center justify-center text-muted-foreground text-sm">
                    {director.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{director.name}</span>
              </button>
            </section>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cast.map((actor) => (
                  <button
                    key={actor.id}
                    onClick={() => navigate(`/person/${actor.id}`)}
                    className="text-left hover:bg-card p-3 -ml-3 transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{actor.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{actor.character}</p>
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
    </div>
  );
}
