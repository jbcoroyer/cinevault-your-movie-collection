import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getMovieDetails,
  getWatchProviders,
  getImageUrl,
  formatRuntime,
  getYear,
  getDirector,
  getCertification,
  getTrailers,
  getWriters,
  getComposer,
  formatMoney,
  MovieDetails,
  WatchProviders,
} from "@/services/tmdb";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useActivities } from "@/hooks/useActivities";
import { StarRating } from "@/components/StarRating";
import { WatchedDialog } from "@/components/WatchedDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Check, Heart, Star, Clock, Tv, ListPlus, Info, Video, Image as ImageIcon, ExternalLink } from "lucide-react";
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
    
    await createActivity("watched", {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
    }, { rating: data.rating });

    if (data.review) {
      setReview(data.review);
    }
  };

  const director = movie ? getDirector(movie) : undefined;
  const writers = movie ? getWriters(movie) : [];
  const composer = movie ? getComposer(movie) : undefined;
  const certification = movie ? getCertification(movie) : null;
  const usCertification = movie ? getCertification(movie, "US") : null;
  const finalCertification = certification || usCertification;
  const trailers = movie ? getTrailers(movie) : [];
  const cast = movie?.credits?.cast.slice(0, 12) || [];
  const recommendations = movie?.recommendations?.results.slice(0, 10) || [];
  const images = movie?.images;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="skeleton-shimmer h-[50vh] w-full" />
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

      {/* Hero Header with Backdrop */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {backdropUrl ? (
          <img src={backdropUrl} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Movie Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="container mx-auto flex flex-col md:flex-row gap-4 md:gap-8 items-end">
            {/* Poster (Desktop) */}
            <div className="hidden md:block w-48 lg:w-56 flex-shrink-0">
              {posterUrl && (
                <img src={posterUrl} alt={movie.title} className="w-full rounded-card shadow-elevated" />
              )}
            </div>

            {/* Title & Meta */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 text-white drop-shadow-lg">
                {movie.title}
              </h1>
              {movie.original_title !== movie.title && (
                <p className="text-white/70 mb-2">{movie.original_title}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
                <span className="text-white/80">{getYear(movie.release_date)}</span>
                {movie.runtime > 0 && (
                  <span className="text-white/80">{formatRuntime(movie.runtime)}</span>
                )}
                {finalCertification && (
                  <span className="px-2 py-0.5 bg-white/20 rounded text-sm text-white">{finalCertification}</span>
                )}
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1 bg-primary/90 px-2 py-1 rounded">
                    <Star className="w-4 h-4 fill-white text-white" />
                    <span className="font-semibold text-white">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres?.map((genre) => (
                  <span key={genre.id} className="px-3 py-1 text-sm bg-white/10 backdrop-blur-sm rounded-full text-white">
                    {genre.name}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={isInWatchlist ? "default" : "secondary"}
                  size="sm"
                  onClick={() => addToWatchlist(movie.id)}
                >
                  {isInWatchlist ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Watchlist
                </Button>
                <Button variant={isWatched ? "default" : "secondary"} size="sm" onClick={handleWatchedClick}>
                  {isWatched ? <Check className="w-4 h-4 mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                  Vu
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleFavorite(movie.id)}
                  className={cn(isFavorite && "text-primary")}
                >
                  <Heart className={cn("w-4 h-4", isFavorite && "fill-primary")} />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setAddToListOpen(true)}>
                  <ListPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
        {/* Tabs */}
        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-transparent gap-1">
            <TabsTrigger value="infos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Info className="w-4 h-4 mr-2" />
              Infos
            </TabsTrigger>
            <TabsTrigger value="photos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ImageIcon className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Video className="w-4 h-4 mr-2" />
              Vidéos
            </TabsTrigger>
          </TabsList>

          {/* Infos Tab */}
          <TabsContent value="infos" className="space-y-8">
            {/* Technical Credits */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Crew */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Équipe technique</h3>
                
                {director && (
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80"
                    onClick={() => navigate(`/person/${director.id}`)}
                  >
                    {director.profile_path ? (
                      <img
                        src={getImageUrl(director.profile_path, "w200") || ""}
                        alt={director.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
                        {director.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{director.name}</p>
                      <p className="text-xs text-muted-foreground">Réalisateur</p>
                    </div>
                  </div>
                )}

                {writers.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Scénaristes</p>
                    <div className="flex flex-wrap gap-2">
                      {writers.map((writer) => (
                        <span
                          key={`writer-${writer.id}`}
                          className="text-sm bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => navigate(`/person/${writer.id}`)}
                        >
                          {writer.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {composer && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Compositeur</p>
                    <span
                      className="text-sm bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80"
                      onClick={() => navigate(`/person/${composer.id}`)}
                    >
                      {composer.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Informations</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {movie.budget && movie.budget > 0 && (
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">{formatMoney(movie.budget)}</p>
                    </div>
                  )}
                  {movie.revenue && movie.revenue > 0 && (
                    <div>
                      <p className="text-muted-foreground">Box-office</p>
                      <p className="font-medium">{formatMoney(movie.revenue)}</p>
                    </div>
                  )}
                  {movie.production_countries && movie.production_countries.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">Pays</p>
                      <p className="font-medium">{movie.production_countries.map(c => c.name).join(", ")}</p>
                    </div>
                  )}
                  {movie.original_language && (
                    <div>
                      <p className="text-muted-foreground">Langue originale</p>
                      <p className="font-medium uppercase">{movie.original_language}</p>
                    </div>
                  )}
                  {finalCertification && (
                    <div>
                      <p className="text-muted-foreground">Classification</p>
                      <p className="font-medium">{finalCertification}</p>
                    </div>
                  )}
                </div>

                {/* External Links */}
                {movie.imdb_id && (
                  <div className="pt-2">
                    <a
                      href={`https://www.imdb.com/title/${movie.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded hover:bg-yellow-500/30 transition-colors"
                    >
                      IMDb
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Synopsis */}
        {movie.overview && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
          </div>
        )}

        {/* Casting - Always Visible */}
        {cast.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Casting principal</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {cast.map((actor) => (
                <div
                  key={`cast-${actor.id}-${actor.character}`}
                  className="flex-shrink-0 w-24 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/person/${actor.id}`)}
                >
                  {actor.profile_path ? (
                    <img
                      src={getImageUrl(actor.profile_path, "w200") || ""}
                      alt={actor.name}
                      className="w-full aspect-[2/3] rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                      {actor.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="font-medium text-xs mt-2 line-clamp-1">{actor.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

            {/* Streaming Availability */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Tv className="w-5 h-5" />
                Où regarder ?
              </h3>
              <WatchProvidersSection providers={watchProviders} loading={providersLoading} />
            </div>

            {/* User Rating */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Votre note</h3>
              <StarRating value={userMovie?.rating || 0} onChange={(rating) => updateRating(movie.id, rating)} />
              {userMovie?.rating && <p className="text-sm text-muted-foreground mt-1">{userMovie.rating}/10</p>}
            </div>

            {/* User Review */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Votre avis</h3>
              <Textarea
                placeholder="Écrivez votre avis sur ce film..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="mb-3 min-h-[100px]"
              />
              <Button onClick={handleSaveReview} disabled={savingReview}>
                {savingReview ? "Enregistrement..." : "Enregistrer l'avis"}
              </Button>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Films similaires</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {recommendations.map((rec) => (
                    <div
                      key={`rec-${rec.id}`}
                      className="flex-shrink-0 w-28 cursor-pointer hover:opacity-80"
                      onClick={() => navigate(`/movie/${rec.id}`)}
                    >
                      {rec.poster_path ? (
                        <img
                          src={getImageUrl(rec.poster_path, "w200") || ""}
                          alt={rec.title}
                          className="w-full aspect-[2/3] rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                          {rec.title}
                        </div>
                      )}
                      <p className="text-xs mt-1 line-clamp-2">{rec.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            {images && (images.backdrops?.length > 0 || images.posters?.length > 0) ? (
              <div className="space-y-6">
                {images.backdrops && images.backdrops.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Fonds ({images.backdrops.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {images.backdrops.slice(0, 9).map((img, idx) => (
                        <a
                          key={`backdrop-${idx}`}
                          href={getImageUrl(img.file_path, "original") || ""}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-video rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={getImageUrl(img.file_path, "w500") || ""}
                            alt={`Backdrop ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {images.posters && images.posters.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Affiches ({images.posters.length})</h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {images.posters.slice(0, 12).map((img, idx) => (
                        <a
                          key={`poster-${idx}`}
                          href={getImageUrl(img.file_path, "original") || ""}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-[2/3] rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={getImageUrl(img.file_path, "w300") || ""}
                            alt={`Poster ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune image disponible</p>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            {trailers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {trailers.map((video) => (
                  <div key={`video-${video.id}`} className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={`https://www.youtube.com/embed/${video.key}`}
                      title={video.name}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune vidéo disponible</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <WatchedDialog
        open={watchedDialogOpen}
        onOpenChange={setWatchedDialogOpen}
        movieTitle={movie.title}
        initialDate={userMovie?.watched_at?.split("T")[0]}
        initialRating={userMovie?.rating || undefined}
        initialReview={userMovie?.review || undefined}
        onSave={handleWatchedSave}
      />

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
    return <p className="text-muted-foreground">Aucune offre disponible pour le moment</p>;
  }

  return (
    <div className="space-y-4">
      {providers.flatrate && providers.flatrate.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Abonnement</p>
          <div className="flex flex-wrap gap-2">
            {providers.flatrate.map((p) => (
              <img
                key={p.provider_id}
                src={getImageUrl(p.logo_path, "w200") || ""}
                alt={p.provider_name}
                title={p.provider_name}
                className="w-12 h-12 rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {providers.rent && providers.rent.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Location</p>
          <div className="flex flex-wrap gap-2">
            {providers.rent.map((p) => (
              <img
                key={p.provider_id}
                src={getImageUrl(p.logo_path, "w200") || ""}
                alt={p.provider_name}
                title={p.provider_name}
                className="w-10 h-10 rounded-lg opacity-80"
              />
            ))}
          </div>
        </div>
      )}

      {providers.buy && providers.buy.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Achat</p>
          <div className="flex flex-wrap gap-2">
            {providers.buy.map((p) => (
              <img
                key={p.provider_id}
                src={getImageUrl(p.logo_path, "w200") || ""}
                alt={p.provider_name}
                title={p.provider_name}
                className="w-10 h-10 rounded-lg opacity-80"
              />
            ))}
          </div>
        </div>
      )}

      {providers.link && (
        <a
          href={providers.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs text-muted-foreground hover:underline mt-2"
        >
          Fourni par JustWatch
        </a>
      )}
    </div>
  );
}
