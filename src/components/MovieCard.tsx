import { Movie, getImageUrl, getYear } from '@/services/tmdb';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
interface MovieCardProps {
  movie: Movie;
  size?: 'sm' | 'md' | 'lg';
}
export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  size = 'md'
}) => {
  const navigate = useNavigate();
  const posterUrl = getImageUrl(movie.poster_path, size === 'sm' ? 'w200' : 'w500');
  const sizeClasses = {
    sm: 'w-28 min-w-[7rem]',
    md: 'w-36 min-w-[9rem]',
    lg: 'w-44 min-w-[11rem]'
  };
  return <div className={`${sizeClasses[size]} cursor-pointer group animate-fade-in`} onClick={() => navigate(`/movie/${movie.id}`)}>
      <div className="relative overflow-hidden rounded-card aspect-[2/3] bg-muted mb-3 mx-0 border-primary border-solid border-2">
        {posterUrl ? <img src={posterUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center bg-card">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
        {movie.title}
      </h3>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{getYear(movie.release_date)}</span>
        {movie.vote_average > 0 && <>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-primary text-primary" />
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
          </>}
      </div>
    </div>;
};
export const MovieCardSkeleton: React.FC<{
  size?: 'sm' | 'md' | 'lg';
}> = ({
  size = 'md'
}) => {
 const sizeClasses = {
  // Mobile : w-24 (96px) | Desktop : w-28 (112px)
  sm: 'w-24 min-w-[6rem] md:w-28 md:min-w-[7rem]',
  
  // Mobile : w-28 (112px) | Desktop : w-36 (144px)
  md: 'w-28 min-w-[7rem] md:w-36 md:min-w-[9rem]',
  
  // Mobile : w-36 (144px) | Desktop : w-44 (176px)
  lg: 'w-36 min-w-[9rem] md:w-44 md:min-w-[11rem]'
};
  };
  return <div className={sizeClasses[size]}>
      <div className="skeleton-shimmer aspect-[2/3] mb-3" />
      <div className="skeleton-shimmer h-4 w-full mb-2" />
      <div className="skeleton-shimmer h-3 w-2/3" />
    </div>;
};