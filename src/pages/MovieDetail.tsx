import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMovieDetails,
  getWatchProviders,
  getImageUrl,
  formatRuntime,
  getYear,
  MovieDetails,
  WatchProviders,
} from "@/services/tmdb";
import { useUserMovies } from "@/hooks/useUserMovies";
import { StarRating } from "@/components/StarRating";
import { WatchedDialog } from "@/components/WatchedDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Check, Heart, Star, Clock, Calendar, Tv, ListPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [watchProviders, setWatchProviders] = useState<WatchProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [review, setReview] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [watchedDialogOpen, setWatchedDialogOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);

  const { getUserMovie, addToWatchlist, markAsWatchedWithDetails, toggleFavorite, updateRating, updateReview } =
    useUserMovies();

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

        const userMovieData = getUserMovie(Number(id));
        if (userMovieData?.review) {
          setReview(userMovieData.review);
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
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
        console.error("Error fetching watch providers:", error);
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
      markAsWatchedWithDetails(movie!.id, {});
    } else {
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

  const directors = movie?.credits?.crew.filter((c) => c.job === "Director") || [];
  const cast = movie?.credits?.cast.slice(0, 10) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="skeleton-shimmer h-64 md:h-80 w-full" />
        <div className="container mx-auto p-4 space-y-4">
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

  const backdropUrl = getImageUrl(movie.backdrop_path, "original");
  const posterUrl = getImageUrl(movie.poster_path, "w500");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      {/* Backdrop */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        {backdropUrl ? (
          <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-20 md:-mt-32 relative">
        {/* Desktop: Two columns / Mobile: Single column */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-10">
          {/* Left Column - Poster & Actions (sticky on desktop) */}
          <div className="flex gap-4 md:flex-col md:w-64 lg:w-72 md:sticky md:top-20 md:self-start">
            {/* Poster */}
            <div className="flex-shrink-0 w-28 md:w-full">
              {posterUrl ? (
                <img src={posterUrl} alt={movie.title} className="w-full rounded-card shadow-elevated" />
              ) : (
                <div className="w-full aspect-[2/3] bg-card rounded-card" />
              )}
            </div>

            {/* Info on mobile / Actions on desktop */}
            <div className="flex-1 pt-16 md:pt-0 md:space-y-4">
              {/* Mobile: Title & basic info */}
              <div className="md:hidden">
                <h1 className="text-xl font-bold mb-1">{movie.title}</h1>
                {movie.original_title !== movie.title && (
                  <p className="text-sm text-muted-foreground mb-2">{movie.original_title}</p>
                )}
                <MovieMeta movie={movie} />
              </div>

              {/* Desktop: Actions */}
              <div className="hidden md:block space-y-3">
                <Button
                  variant={isInWatchlist ? "default" : "outline"}
                  onClick={() => addToWatchlist(movie.id)}
                  className="w-full"
                >
                  {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Watchlist
                </Button>
                <Button variant={isWatched ? "default" : "outline"} onClick={handleWatchedClick} className="w-full">
                  {isWatched ? <Check className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                  Vu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(movie.id)}
                  className={cn("w-full", isFavorite && "text-primary border-primary")}
                >
                  <Heart className={cn("w-4 h-4 mr-2", isFavorite && "fill-primary")} />
                  Favoris
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddToListOpen(true)}
                  className="w-full"
                >
                  <ListPlus className="w-4 h-4 mr-2" />
                  Ajouter à une liste
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Main content */}
          <div className="flex-1 md:pt-12 lg:pt-16">
            {/* Desktop: Title */}
            <div className="hidden md:block mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="text-muted-foreground mb-4">{movie.original_title}</p>
              )}
              <MovieMeta movie={movie} />

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres?.map((genre) => (
                  <span key={genre.id} className="px-3 py-1 text-sm bg-card rounded-full text-muted-foreground">
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Mobile: Genres */}
            <div className="flex flex-wrap gap-2 mb-6 md:hidden">
              {movie.genres?.map((genre) => (
                <span key={genre.id} className="px-3 py-1 text-xs bg-card rounded-full text-muted-foreground">
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Mobile: Actions */}
            <div className="flex gap-2 mb-6 md:hidden flex-wrap">
              <Button
                variant={isInWatchlist ? "default" : "outline"}
                size="sm"
                onClick={() => addToWatchlist(movie.id)}
                className="flex-1 min-w-[100px]"
              >
                {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Watchlist
              </Button>
              <Button
                variant={isWatched ? "default" : "outline"}
                size="sm"
                onClick={handleWatchedClick}
                className="flex-1 min-w-[80px]"
              >
                {isWatched ? <Check className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                Vu
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleFavorite(movie.id)}
                className={cn(isFavorite && "text-primary border-primary")}
              >
                <Heart className={cn("w-4 h-4", isFavorite && "fill-primary")} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddToListOpen(true)}
              >
                <ListPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* Watch Providers */}
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-3 flex items-center gap-2">
                <Tv className="w-5 h-5" />
                Où regarder ?
              </h2>
              <WatchProvidersSection providers={watchProviders} loading={providersLoading} />
            </div>

            {/* Synopsis */}
            {movie.overview && (
              <div className="mb-6">
                <h2 className="text-lg md:text-xl font-semibold mb-2">Synopsis</h2>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{movie.overview}</p>
              </div>
            )}

            {/* Directors */}
            {directors.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg md:text-xl font-semibold mb-3">
                  {directors.length > 1 ? "Réalisateurs" : "Réalisateur"}
                </h2>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                  {directors.map((director) => (
                    <PersonCard
                      key={director.id}
                      person={director}
                      subtitle="Réalisateur"
                      onClick={() => navigate(`/person/${director.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg md:text-xl font-semibold mb-3">Casting</h2>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 md:flex-wrap md:overflow-visible">
                  {cast.map((actor) => (
                    <PersonCard
                      key={actor.id}
                      person={actor}
                      subtitle={actor.character}
                      onClick={() => navigate(`/person/${actor.id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* User Rating */}
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-3">Votre note</h2>
              <StarRating value={userMovie?.rating || 0} onChange={(rating) => updateRating(movie.id, rating)} />
              {userMovie?.rating && <p className="text-sm text-muted-foreground mt-1">{userMovie.rating}/10</p>}
            </div>

            {/* User Review */}
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-semibold mb-3">Votre avis</h2>
              <Textarea
                placeholder="Écrivez votre avis sur ce film..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="mb-3 min-h-[100px] md:text-base"
              />
              <Button onClick={handleSaveReview} disabled={savingReview}>
                {savingReview ? "Enregistrement..." : "Enregistrer l'avis"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Watched Dialog */}
      <WatchedDialog
        open={watchedDialogOpen}
        onOpenChange={setWatchedDialogOpen}
        movieTitle={movie.title}
        initialDate={userMovie?.watched_at?.split("T")[0]}
        initialRating={userMovie?.rating || undefined}
        initialReview={userMovie?.review || undefined}
        onSave={handleWatchedSave}
      />

      {/* Add to List Dialog */}
      {movie && (
        <AddToListDialog
          open={addToListOpen}
          onOpenChange={setAddToListOpen}
          movie={{
            tmdb_id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

function MovieMeta({ movie }: { movie: MovieDetails }) {
  return (
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
      {movie.vote_average > 0 && (
        <div className="flex items-center gap-1 bg-card px-2 py-1 rounded-md">
          <Star className="w-4 h-4 fill-primary text-primary" />
          <span className="font-semibold text-foreground">{movie.vote_average.toFixed(1)}</span>
          <span className="text-xs">/10</span>
        </div>
      )}
    </div>
  );
}

function WatchProvidersSection({ providers, loading }: { providers: WatchProviders | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-shimmer w-12 h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!providers || (!providers.flatrate && !providers.rent && !providers.buy)) {
    return <p className="text-sm text-muted-foreground md:text-base">Aucune offre disponible pour le moment</p>;
  }

  return (
    <div className="space-y-4">
      {providers.flatrate && providers.flatrate.length > 0 && (
        <ProviderRow label="Streaming" providers={providers.flatrate} />
      )}
      <a
        href={providers.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Données fournies par JustWatch
      </a>
    </div>
  );
}

function ProviderRow({
  label,
  providers,
}: {
  label: string;
  providers: Array<{ provider_id: number; provider_name: string; logo_path: string }>;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {providers.map((provider) => (
          <img
            key={provider.provider_id}
            src={getImageUrl(provider.logo_path, "w200") || ""}
            alt={provider.provider_name}
            title={provider.provider_name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ))}
      </div>
    </div>
  );
}

function PersonCard({
  person,
  subtitle,
  onClick,
}: {
  person: { id: number; name: string; profile_path: string | null };
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <div
      className="flex-shrink-0 w-20 md:w-24 text-center cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      {person.profile_path ? (
        <img
          src={getImageUrl(person.profile_path, "w200") || ""}
          alt={person.name}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover mx-auto mb-2"
        />
      ) : (
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-card mx-auto mb-2 flex items-center justify-center text-muted-foreground text-xs">
          {person.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <p className="text-xs md:text-sm font-medium truncate">{person.name}</p>
      <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
    </div>
  );
}
