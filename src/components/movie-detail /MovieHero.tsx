import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Check, Plus, Clock, Heart, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl, formatRuntime, getYear, MovieDetails } from "@/services/tmdb";
import { cn } from "@/lib/utils";

interface MovieHeroProps {
  movie: MovieDetails;
  userMovie?: { status: string; is_favorite: boolean | null };
  onToggleWatchlist: () => void;
  onToggleWatched: () => void;
  onToggleFavorite: () => void;
  onAddToList: () => void;
}

export const MovieHero = ({ 
  movie, 
  userMovie, 
  onToggleWatchlist, 
  onToggleWatched, 
  onToggleFavorite,
  onAddToList 
}: MovieHeroProps) => {
  const navigate = useNavigate();
  const backdropUrl = getImageUrl(movie.backdrop_path, "original");
  const posterUrl = getImageUrl(movie.poster_path, "w500");
  
  const isInWatchlist = userMovie?.status === "watchlist";
  const isWatched = userMovie?.status === "watched";
  const isFavorite = userMovie?.is_favorite ?? false;

  return (
    <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
      {backdropUrl ? (
        <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-card" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
        <div className="container mx-auto flex flex-col md:flex-row gap-4 md:gap-8 items-end">
          <div className="hidden md:block w-48 lg:w-56 flex-shrink-0">
            {posterUrl && (
              <img src={posterUrl} alt={movie.title} className="w-full rounded-card shadow-elevated" />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 text-white drop-shadow-lg">
              {movie.title}
            </h1>
            {movie.original_title !== movie.title && (
              <p className="text-white/70 mb-2">{movie.original_title}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
              <span className="text-white/80">{getYear(movie.release_date)}</span>
              {movie.runtime && movie.runtime > 0 && (
                <span className="text-white/80">{formatRuntime(movie.runtime)}</span>
              )}
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-1 bg-primary/90 px-2 py-1 rounded">
                  <Star className="w-4 h-4 fill-white text-white" />
                  <span className="font-semibold text-white">{movie.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {movie.genres?.map((genre) => (
                <span key={genre.id} className="px-3 py-1 text-sm bg-white/10 backdrop-blur-sm rounded-full text-white">
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={isInWatchlist ? "default" : "secondary"}
                size="sm"
                onClick={onToggleWatchlist}
              >
                {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Watchlist
              </Button>
              <Button variant={isWatched ? "default" : "secondary"} size="sm" onClick={onToggleWatched}>
                {isWatched ? <Check className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                Vu
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onToggleFavorite}
                className={cn(isFavorite && "text-primary")}
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-primary")} />
              </Button>
              <Button variant="secondary" size="sm" onClick={onAddToList}>
                <ListPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
