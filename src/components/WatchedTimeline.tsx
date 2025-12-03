import { useEffect, useState } from 'react';
import { useUserMovies } from '@/hooks/useUserMovies';
import { getMovieDetails, getImageUrl, MovieDetails } from '@/services/tmdb';
import { MovieCard, MovieCardSkeleton } from '@/components/MovieCard';
import { StarRating } from '@/components/StarRating';
import { useNavigate } from 'react-router-dom';
import { Calendar, Star } from 'lucide-react';
import { UserMovie } from '@/lib/supabase';

interface WatchedMovieWithDetails {
  userMovie: UserMovie;
  details: MovieDetails;
}

export const WatchedTimeline: React.FC = () => {
  const { userMovies, loading: userMoviesLoading } = useUserMovies();
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovieWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const watchedUserMovies = userMovies
    .filter((m) => m.status === 'watched')
    .sort((a, b) => {
      const dateA = a.watched_at ? new Date(a.watched_at).getTime() : new Date(a.created_at).getTime();
      const dateB = b.watched_at ? new Date(b.watched_at).getTime() : new Date(b.created_at).getTime();
      return dateB - dateA;
    });

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (userMoviesLoading) return;
      
      setLoading(true);
      try {
        const moviesWithDetails = await Promise.all(
          watchedUserMovies.map(async (userMovie) => {
            const details = await getMovieDetails(userMovie.tmdb_id);
            return { userMovie, details };
          })
        );
        setWatchedMovies(moviesWithDetails);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [userMovies, userMoviesLoading]);

  if (userMoviesLoading || loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold px-4">Vos films vus</h2>
        <div className="space-y-3 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-3 bg-card rounded-card">
              <div className="skeleton-shimmer w-16 h-24 rounded-md" />
              <div className="flex-1 space-y-2">
                <div className="skeleton-shimmer h-5 w-3/4" />
                <div className="skeleton-shimmer h-4 w-1/2" />
                <div className="skeleton-shimmer h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (watchedMovies.length === 0) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold px-4 mb-4">Timeline des films vus</h2>
      <div className="relative px-4">
        {/* Timeline line */}
        <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {watchedMovies.map(({ userMovie, details }, index) => (
            <div key={userMovie.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 w-3 h-3 rounded-full bg-primary mt-5 flex-shrink-0" />

              {/* Movie card */}
              <div
                className="flex-1 flex gap-3 p-3 bg-card rounded-card cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => navigate(`/movie/${details.id}`)}
              >
                {/* Poster */}
                <div className="flex-shrink-0 w-16">
                  {details.poster_path ? (
                    <img
                      src={getImageUrl(details.poster_path, 'w200') || ''}
                      alt={details.title}
                      className="w-full rounded-md"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted rounded-md" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{details.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {details.release_date ? new Date(details.release_date).getFullYear() : ''}
                  </p>

                  {/* Watch date */}
                  {userMovie.watched_at && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      <span>Vu le {formatDate(userMovie.watched_at)}</span>
                    </div>
                  )}

                  {/* Rating */}
                  {userMovie.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span>{userMovie.rating}/10</span>
                    </div>
                  )}

                  {/* Review preview */}
                  {userMovie.review && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {userMovie.review}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
