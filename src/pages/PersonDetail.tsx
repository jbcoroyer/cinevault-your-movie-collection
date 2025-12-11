import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPersonDetails, getImageUrl, PersonDetails } from '@/services/tmdb';
import { MovieCard, MovieCardSkeleton } from '@/components/MovieCard';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';

export default function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerson = async () => {
      if (!id) return;
      try {
        const data = await getPersonDetails(Number(id));
        setPerson(data);
      } catch (error) {
        console.error('Error fetching person:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="skeleton-shimmer w-32 md:w-64 h-48 md:h-96 rounded-card" />
            <div className="flex-1 space-y-3">
              <div className="skeleton-shimmer h-8 w-3/4" />
              <div className="skeleton-shimmer h-4 w-1/2" />
              <div className="skeleton-shimmer h-32 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} size="sm" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Personne non trouvée</p>
      </div>
    );
  }

  const profileUrl = getImageUrl(person.profile_path, 'w500');
  const movies = person.movie_credits?.cast
    ?.filter((m) => m.poster_path)
    .sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    }) || [];

  const directedMovies = person.movie_credits?.crew
    ?.filter((m) => m.job === 'Director' && m.poster_path)
    .sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
      return dateB - dateA;
    }) || [];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />
      
      <div className="container mx-auto p-4">
        {/* Back button - mobile only */}
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-foreground hover:bg-card/80 transition-colors mb-4 md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Two column layout on desktop */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-10 mb-8">
          {/* Left column - Photo (sticky on desktop) */}
          <div className="flex gap-4 md:flex-col md:w-64 lg:w-72 md:sticky md:top-20 md:self-start">
            <div className="flex-shrink-0 w-32 md:w-full">
              {profileUrl ? (
                <img
                  src={profileUrl}
                  alt={person.name}
                  className="w-full rounded-card shadow-elevated"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-card rounded-card flex items-center justify-center text-muted-foreground text-2xl">
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Mobile: Info next to photo */}
            <div className="flex-1 md:hidden">
              <h1 className="text-2xl font-bold mb-2">{person.name}</h1>
              {person.known_for_department && (
                <p className="text-sm text-primary mb-2">{person.known_for_department}</p>
              )}
              <PersonMeta person={person} />
            </div>
          </div>

          {/* Right column - Main content */}
          <div className="flex-1">
            {/* Desktop: Name & Info */}
            <div className="hidden md:block mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{person.name}</h1>
              {person.known_for_department && (
                <p className="text-lg text-primary mb-4">{person.known_for_department}</p>
              )}
              <PersonMeta person={person} />
            </div>

            {/* Biography */}
            {person.biography && (
              <div className="mb-6">
                <h2 className="text-lg md:text-xl font-semibold mb-2">Biographie</h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {person.biography}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Directed Movies */}
        {directedMovies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg md:text-xl font-semibold mb-4">En tant que réalisateur</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {directedMovies.map((movie) => (
                <MovieCard
                  key={`dir-${movie.id}`}
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    original_title: movie.original_title || movie.title,
                    poster_path: movie.poster_path,
                    backdrop_path: null,
                    overview: '',
                    release_date: movie.release_date || '',
                    vote_average: movie.vote_average || 0,
                    vote_count: 0,
                    genre_ids: [],
                    popularity: 0,
                    adult: false,
                    original_language: '',
                  }}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Filmography */}
        {movies.length > 0 && (
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-4">Filmographie ({movies.length} films)</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {movies.map((movie) => (
                <MovieCard
                  key={`cast-${movie.id}-${movie.character}`}
                  movie={{
                    id: movie.id,
                    title: movie.title,
                    original_title: movie.original_title || movie.title,
                    poster_path: movie.poster_path,
                    backdrop_path: null,
                    overview: '',
                    release_date: movie.release_date || '',
                    vote_average: movie.vote_average || 0,
                    vote_count: 0,
                    genre_ids: [],
                    popularity: 0,
                    adult: false,
                    original_language: '',
                  }}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function PersonMeta({ person }: { person: PersonDetails }) {
  return (
    <div className="space-y-1 text-sm text-muted-foreground md:text-base">
      {person.birthday && (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(person.birthday).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            {person.deathday && ` - ${new Date(person.deathday).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}`}
          </span>
        </div>
      )}
      {person.place_of_birth && (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-2">{person.place_of_birth}</span>
        </div>
      )}
    </div>
  );
}