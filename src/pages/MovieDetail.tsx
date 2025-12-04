import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMovieDetails,
  getWatchProviders,
  getImageUrl,
  formatRuntime,
  getYear,
  MovieDetails,
  WatchProviders,
} from '@/services/tmdb';
import { useUserMovies } from '@/hooks/useUserMovies';
import { StarRating } from '@/components/StarRating';
import { WatchedDialog } from '@/components/WatchedDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Check,
  Heart,
  Star,
  Clock,
  Calendar,
  Tv,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [review, setReview] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [watchedDialogOpen, setWatchedDialogOpen] = useState(false);

  const {
    getUserMovie,
    addToWatchlist,
    markAsWatchedWithDetails,
    toggleFavorite,
    updateRating,
    updateReview,
  } = useUserMovies();

  const userMovie = movie ? getUserMovie(movie.id) : undefined;
  const isInWatchlist = userMovie?.status === 'watchlist';
  const isWatched = userMovie?.status === 'watched';
  const isFavorite = userMovie?.is_favorite ?? false;

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      try {
        const data = await getMovieDetails(Number(id));
        setMovie(data);
        
        const userMovieData = getUserMovie(Number(id));
        if (userMovieData?.review) {
          setReview(userMovieData.review);
        }
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProviders = async () => {
      if (!id) return;
      setProvidersLoading(true);
      try {
        const providers = await getWatchProviders(Number(id));
        setWatchProviders(providers);
      } catch (error) {
        console.error('Error fetching watch providers:', error);
      } finally {
        setProvidersLoading(false);
      }
    };

    fetchMovie();
    fetchProviders();
  }, [id]);

  useEffect(() => {
    if (userMovie?.review && !review) {
      setReview(userMovie.review);
    }
  }, [userMovie]);

  const handleSaveReview = async () => {
    if (!movie) return;
    setSavingReview(true);
    await updateReview(movie.id, review);
    setSavingReview(false);
  };

  const handleWatchedClick = () => {
    if (isWatched) {
      // If already watched, clicking will remove it
      markAsWatchedWithDetails(movie!.id, {});
    } else {
      // Open dialog for new watch
      setWatchedDialogOpen(true);
    }
  };

  const handleWatchedSave = async (data: { watchedDate?: string; rating?: number; review?: string }) => {
    if (!movie) return;
    await markAsWatchedWithDetails(movie.id, data);
    if (data.review) {
      setReview(data.review);
    }
  };

  const directors = movie?.credits?.crew.filter((c) => c.job === 'Director') || [];
  const cast = movie?.credits?.cast.slice(0, 6) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="skeleton-shimmer h-64 w-full" />
        <div className="p-4 space-y-4">
          <div className="skeleton-shimmer h-8 w-3/4" />
          <div className="skeleton-shimmer h-4 w-1/2" />
          <div className="skeleton-shimmer h-24 w-full" />
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

  const backdropUrl = getImageUrl(movie.backdrop_path, 'original');
  const posterUrl = getImageUrl(movie.poster_path, 'w500');

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Backdrop */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-20 relative">
        <div className="flex gap-4 mb-6">
          {/* Poster */}
          <div className="flex-shrink-0 w-28 md:w-36">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full rounded-card shadow-elevated"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-card rounded-card" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 pt-16 md:pt-20">
            <h1 className="text-xl md:text-2xl font-bold mb-1">{movie.title}</h1>
            {movie.original_title !== movie.title && (
              <p className="text-sm text-muted-foreground mb-2">
                {movie.original_title}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              {movie.release_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {getYear(movie.release_date)}
                </div>
              )}
              {movie.runtime > 0 && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatRuntime(movie.runtime)}
                </div>
              )}
            </div>

            {/* TMDB Rating */}
            {movie.vote_average > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1 bg-card px-2 py-1 rounded-md">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
                <span className="text-xs text-muted-foreground">TMDB</span>
              </div>
            )}

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 text-xs bg-card rounded-full text-muted-foreground"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={isInWatchlist ? 'default' : 'outline'}
            size="sm"
            onClick={() => addToWatchlist(movie.id)}
            className="flex-1"
          >
            {isInWatchlist ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Watchlist
          </Button>
          <Button
            variant={isWatched ? 'default' : 'outline'}
            size="sm"
            onClick={handleWatchedClick}
            className="flex-1"
          >
            {isWatched ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Clock className="w-4 h-4 mr-2" />
            )}
            Vu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toggleFavorite(movie.id)}
            className={cn(isFavorite && 'text-primary border-primary')}
          >
            <Heart
              className={cn('w-4 h-4', isFavorite && 'fill-primary')}
            />
          </Button>
        </div>

        {/* Watch Providers */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Tv className="w-5 h-5" />
            Où regarder ?
          </h2>
          {providersLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-shimmer w-12 h-12 rounded-lg" />
              ))}
            </div>
          ) : watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) ? (
            <div className="space-y-4">
              {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Streaming</p>
                  <div className="flex gap-2 flex-wrap">
                    {watchProviders.flatrate.map((provider) => (
                      <img
                        key={provider.provider_id}
                        src={getImageUrl(provider.logo_path, 'w200') || ''}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              {watchProviders.rent && watchProviders.rent.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Location</p>
                  <div className="flex gap-2 flex-wrap">
                    {watchProviders.rent.map((provider) => (
                      <img
                        key={provider.provider_id}
                        src={getImageUrl(provider.logo_path, 'w200') || ''}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              {watchProviders.buy && watchProviders.buy.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Achat</p>
                  <div className="flex gap-2 flex-wrap">
                    {watchProviders.buy.map((provider) => (
                      <img
                        key={provider.provider_id}
                        src={getImageUrl(provider.logo_path, 'w200') || ''}
                        alt={provider.provider_name}
                        title={provider.provider_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              <a
                href={watchProviders.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Données fournies par JustWatch
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune offre disponible pour le moment
            </p>
          )}
        </div>

        {/* Synopsis */}
        {movie.overview && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Synopsis</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {movie.overview}
            </p>
          </div>
        )}

        {/* Directors */}
        {directors.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">
              {directors.length > 1 ? 'Réalisateurs' : 'Réalisateur'}
            </h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {directors.map((director) => (
                <div
                  key={director.id}
                  className="flex-shrink-0 w-20 text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/person/${director.id}`)}
                >
                  {director.profile_path ? (
                    <img
                      src={getImageUrl(director.profile_path, 'w200') || ''}
                      alt={director.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-card mx-auto mb-2 flex items-center justify-center text-muted-foreground text-xs">
                      {director.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="text-xs font-medium truncate">{director.name}</p>
                  <p className="text-xs text-muted-foreground">Réalisateur</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Casting</h2>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
              {cast.map((actor) => (
                <div
                  key={actor.id}
                  className="flex-shrink-0 w-20 text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/person/${actor.id}`)}
                >
                  {actor.profile_path ? (
                    <img
                      src={getImageUrl(actor.profile_path, 'w200') || ''}
                      alt={actor.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-card mx-auto mb-2 flex items-center justify-center text-muted-foreground text-xs">
                      {actor.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="text-xs font-medium truncate">{actor.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {actor.character}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Rating */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Votre note</h2>
          <StarRating
            value={userMovie?.rating || 0}
            onChange={(rating) => updateRating(movie.id, rating)}
          />
          {userMovie?.rating && (
            <p className="text-sm text-muted-foreground mt-1">{userMovie.rating}/10</p>
          )}
        </div>

        {/* User Review */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Votre avis</h2>
          <Textarea
            placeholder="Écrivez votre avis sur ce film..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            className="mb-3 min-h-[100px]"
          />
          <Button
            onClick={handleSaveReview}
            disabled={savingReview}
            size="sm"
          >
            {savingReview ? 'Enregistrement...' : 'Enregistrer l\'avis'}
          </Button>
        </div>
      </div>

      {/* Watched Dialog */}
      <WatchedDialog
        open={watchedDialogOpen}
        onOpenChange={setWatchedDialogOpen}
        movieTitle={movie.title}
        initialDate={userMovie?.watched_at?.split('T')[0]}
        initialRating={userMovie?.rating || undefined}
        initialReview={userMovie?.review || undefined}
        onSave={handleWatchedSave}
      />
    </div>
  );
}
