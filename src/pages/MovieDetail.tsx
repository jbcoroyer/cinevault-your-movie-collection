import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getMovieDetails,
  getWatchProviders,
  getImageUrl,
  getDirector,
  getTrailers,
  getWriters,
  getComposer,
  formatMoney,
  getCertification,
} from "@/services/tmdb";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useActivities } from "@/hooks/useActivities";
import { StarRating } from "@/components/StarRating";
import { WatchedDialog } from "@/components/WatchedDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieHero } from "@/components/movie-detail/MovieHero";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tv, Info, Video, Image as ImageIcon, ExternalLink } from "lucide-react";

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = Number(id);

  // --- Gestion des données avec React Query ---
  const { data: movie, isLoading: loadingMovie } = useQuery({
    queryKey: ["movie", movieId],
    queryFn: () => getMovieDetails(movieId),
    enabled: !!movieId,
  });

  const { data: watchProviders, isLoading: loadingProviders } = useQuery({
    queryKey: ["providers", movieId],
    queryFn: () => getWatchProviders(movieId),
    enabled: !!movieId,
  });

  // --- Gestion utilisateur ---
  const { getUserMovie, addToWatchlist, markAsWatchedWithDetails, toggleFavorite, updateRating, updateReview } =
    useUserMovies();
  const { createActivity } = useActivities();

  const userMovie = getUserMovie(movieId);
  const [review, setReview] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [watchedDialogOpen, setWatchedDialogOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);

  // Sync review from user data
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
    if (userMovie?.status === "watched") {
      markAsWatchedWithDetails(movieId, {});
    } else {
      setWatchedDialogOpen(true);
    }
  };

  const handleWatchedSave = async (data: { watchedDate?: string; rating?: number; review?: string }) => {
    if (!movie) return;
    await markAsWatchedWithDetails(movie.id, data);
    await createActivity(
      "watched",
      {
        tmdb_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
      },
      { rating: data.rating },
    );

    if (data.review) setReview(data.review);
  };

  if (loadingMovie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="skeleton-shimmer h-[50vh] w-full" />
      </div>
    );
  }

  if (!movie)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Film non trouvé</p>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );

  // Données dérivées
  const director = getDirector(movie);
  const writers = getWriters(movie);
  const composer = getComposer(movie);
  const cast = movie.credits?.cast.slice(0, 12) || [];
  const recommendations = movie.recommendations?.results.slice(0, 10) || [];
  const images = movie.images;
  const trailers = getTrailers(movie);
  const certification = getCertification(movie) || getCertification(movie, "US");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <MovieHero
        movie={movie}
        userMovie={userMovie ? { status: userMovie.status, is_favorite: userMovie.is_favorite } : undefined}
        onToggleWatchlist={() => addToWatchlist(movieId)}
        onToggleWatched={handleWatchedClick}
        onToggleFavorite={() => toggleFavorite(movieId)}
        onAddToList={() => setAddToListOpen(true)}
      />

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {movie.overview && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Synopsis</h2>
            <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
          </div>
        )}

        {/* Director */}
        {director && (
          <div
            className="mb-6 p-4 bg-card rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => navigate(`/person/${director.id}`)}
          >
            <div className="flex items-center gap-4">
              {director.profile_path ? (
                <img
                  src={getImageUrl(director.profile_path, "w200") || ""}
                  alt={director.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                  {director.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Réalisé par</p>
                <p className="text-lg font-semibold">{director.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Casting */}
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
                    <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center text-xs">
                      {actor.name.slice(0, 2)}
                    </div>
                  )}
                  <p className="font-medium text-xs mt-2 line-clamp-1">{actor.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="infos" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-transparent gap-1 overflow-x-auto hide-scrollbar">
            <TabsTrigger
              value="infos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Info className="w-4 h-4 mr-2" /> Infos
            </TabsTrigger>
            <TabsTrigger
              value="photos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Photos
            </TabsTrigger>
            <TabsTrigger
              value="videos"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Video className="w-4 h-4 mr-2" /> Vidéos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="infos" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Équipe technique</h3>
                {writers.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Scénaristes</p>
                    <div className="flex flex-wrap gap-2">
                      {writers.map((w) => (
                        <span
                          key={w.id}
                          className="text-sm bg-muted px-2 py-1 rounded cursor-pointer hover:bg-muted/80"
                          onClick={() => navigate(`/person/${w.id}`)}
                        >
                          {w.name}
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
                  {movie.original_language && (
                    <div>
                      <p className="text-muted-foreground">Langue originale</p>
                      <p className="font-medium uppercase">{movie.original_language}</p>
                    </div>
                  )}
                  {certification && (
                    <div>
                      <p className="text-muted-foreground">Classification</p>
                      <p className="font-medium">{certification}</p>
                    </div>
                  )}
                </div>

                {movie.imdb_id && (
                  <div className="pt-2">
                    <a
                      href={`https://www.imdb.com/title/${movie.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded hover:bg-yellow-500/20 transition-colors"
                    >
                      IMDb <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Tv className="w-5 h-5" /> Où regarder ?
              </h3>
              {loadingProviders ? (
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded-lg bg-muted animate-pulse"></div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {watchProviders?.flatrate?.length ? (
                    watchProviders.flatrate.map((p) => (
                      <img
                        key={p.provider_id}
                        src={getImageUrl(p.logo_path, "w200") || ""}
                        alt={p.provider_name}
                        className="w-12 h-12 rounded-lg"
                        title={p.provider_name}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">Non disponible en streaming dans votre région.</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Votre note</h3>
              <StarRating value={userMovie?.rating || 0} onChange={(r) => updateRating(movieId, r)} />
              {userMovie?.rating && <p className="text-sm text-muted-foreground mt-1">{userMovie.rating}/5</p>}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Votre avis</h3>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Écrivez votre avis..."
                className="mb-3 min-h-[100px]"
              />
              <Button onClick={handleSaveReview} disabled={savingReview}>
                {savingReview ? "Enregistrement..." : "Enregistrer l'avis"}
              </Button>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="mt-8">
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

          <TabsContent value="photos">
            {images && (images.backdrops?.length > 0 || images.posters?.length > 0) ? (
              <div className="space-y-6">
                {images.backdrops?.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.backdrops.slice(0, 9).map((img, i) => (
                      <a
                        key={`bd-${i}`}
                        href={getImageUrl(img.file_path, "original") || ""}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg overflow-hidden hover:opacity-90"
                      >
                        <img
                          src={getImageUrl(img.file_path, "w500") || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                )}
                {images.posters?.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {images.posters.slice(0, 12).map((img, i) => (
                      <a
                        key={`ps-${i}`}
                        href={getImageUrl(img.file_path, "original") || ""}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-[2/3] rounded-lg overflow-hidden hover:opacity-90"
                      >
                        <img
                          src={getImageUrl(img.file_path, "w300") || ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune image disponible</p>
            )}
          </TabsContent>

          <TabsContent value="videos">
            {trailers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {trailers.map((v) => (
                  <div key={v.id} className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <iframe
                      src={`https://www.youtube.com/embed/${v.key}`}
                      title={v.name}
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

      <WatchedDialog
        open={watchedDialogOpen}
        onOpenChange={setWatchedDialogOpen}
        movieTitle={movie.title}
        initialDate={userMovie?.watched_at?.split("T")[0]}
        initialRating={userMovie?.rating || undefined}
        initialReview={userMovie?.review || undefined}
        onSave={handleWatchedSave}
      />

      <AddToListDialog
        open={addToListOpen}
        onOpenChange={setAddToListOpen}
        movie={{ tmdb_id: movieId, title: movie.title, poster_path: movie.poster_path }}
      />

      <BottomNav />
    </div>
  );
}
