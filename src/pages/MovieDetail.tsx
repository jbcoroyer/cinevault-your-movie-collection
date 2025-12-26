/**
 * CineVault - Movie Detail Page
 *
 * Design minimaliste et premium avec:
 * - Streaming providers en premier (avant synopsis)
 * - Cast avec photos et rôles
 * - Budget, Studios, Pays
 * - Films recommandés
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
  getWatchProviders,
  formatMoney,
  MovieDetails,
  WatchProviders,
  CastMember,
  Movie,
} from "@/services/tmdb";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useActivities } from "@/hooks/useActivities";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { WatchedDialog } from "@/components/WatchedDialog";
import { AddToListDialog } from "@/components/AddToListDialog";
import { MinimalMovieCard } from "@/components/MinimalMovieCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Check, Heart, Clock, ListPlus, Star, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Sub Components
// ============================================

/**
 * Watch Providers Section - Minimaliste (sans liens externes)
 */
const StreamingSection = ({ providers }: { providers: WatchProviders | null }) => {
  if (!providers?.flatrate?.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3">
        <Play className="w-4 h-4 text-white/40" />
        <span className="text-xs text-white/40 uppercase tracking-wider">Disponible sur</span>
      </div>
      <div className="flex items-center gap-3 mt-3">
        {providers.flatrate.slice(0, 5).map((provider) => (
          <div key={provider.provider_id} className="group relative">
            <img
              src={getImageUrl(provider.logo_path, "w92") || ""}
              alt={provider.provider_name}
              className="w-10 h-10 rounded-lg object-cover"
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              <span className="text-[10px] text-white/60 bg-black/80 px-2 py-1 rounded">{provider.provider_name}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

/**
 * Photo Gallery - Horizontal scroll
 */
const PhotoGallery = ({ images, title }: { images: { file_path: string }[]; title: string }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images?.length) return null;

  return (
    <>
      <section className="mb-10">
        <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Photos</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {images.slice(0, 10).map((image, index) => (
            <button
              key={image.file_path}
              onClick={() => setSelectedImage(getImageUrl(image.file_path, "original"))}
              className="flex-shrink-0 group"
            >
              <img
                src={getImageUrl(image.file_path, "w500") || ""}
                alt={`${title} - Photo ${index + 1}`}
                className="h-32 md:h-40 w-auto rounded-lg object-cover transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={selectedImage}
            alt={title}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

/**
 * Cast Member Card avec photo
 */
const CastCard = ({ actor, onClick }: { actor: CastMember; onClick: () => void }) => {
  const imageUrl = getImageUrl(actor.profile_path, "w185");

  return (
    <button onClick={onClick} className="flex-shrink-0 w-24 text-center group">
      <div className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden bg-white/5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={actor.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-lg font-medium">
            {actor.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-white truncate group-hover:text-amber-500 transition-colors">
        {actor.name}
      </p>
      <p className="text-[10px] text-white/40 truncate mt-0.5">{actor.character}</p>
    </button>
  );
};

/**
 * Production Company avec logo
 */
const StudioLogo = ({ company }: { company: { id: number; name: string; logo_path: string | null } }) => {
  const logoUrl = getImageUrl(company.logo_path, "w200");

  if (!logoUrl) {
    return <span className="text-sm text-white/60">{company.name}</span>;
  }

  return (
    <div className="h-6 opacity-60 hover:opacity-100 transition-opacity" title={company.name}>
      <img src={logoUrl} alt={company.name} className="h-full w-auto object-contain brightness-0 invert" />
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [providers, setProviders] = useState<WatchProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchedDialogOpen, setWatchedDialogOpen] = useState(false);
  const [addToListOpen, setAddToListOpen] = useState(false);

  const { getUserMovie, addToWatchlist, markAsWatchedWithDetails, toggleFavorite } = useUserMovies();
  const { createActivity } = useActivities();

  const userMovie = movie ? getUserMovie(movie.id) : undefined;
  const isInWatchlist = userMovie?.status === "watchlist";
  const isWatched = userMovie?.status === "watched";
  const isFavorite = userMovie?.is_favorite ?? false;

  // Fetch movie data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [movieData, providersData] = await Promise.all([
          getMovieDetails(Number(id)),
          getWatchProviders(Number(id), "FR"),
        ]);
        setMovie(movieData);
        setProviders(providersData);
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Handlers
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

  // Derived data
  const director = movie ? getDirector(movie) : undefined;
  const cast = movie?.credits?.cast.slice(0, 12) || [];
  const recommendations = movie?.recommendations?.results.slice(0, 6) || [];
  const studios = movie?.production_companies?.filter((c) => c.logo_path).slice(0, 4) || [];
  const countries = movie?.production_countries?.map((c) => c.name).join(", ") || "";

  // Loading state
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

  // Not found
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-8 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 md:gap-8 items-end">
            {/* Poster - desktop */}
            {posterUrl && (
              <div className="hidden md:block w-48 lg:w-56 flex-shrink-0">
                <img src={posterUrl} alt={movie.title} className="w-full rounded-xl shadow-2xl" />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="text-white/60 text-sm mb-2">{movie.original_title}</p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70 mb-4">
                <span>{getYear(movie.release_date)}</span>
                {movie.runtime > 0 && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </>
                )}
                {movie.vote_average > 0 && (
                  <>
                    <span className="text-white/30">•</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      <span className="font-medium">{movie.vote_average.toFixed(1)}</span>
                      <span className="text-white/40">({movie.vote_count.toLocaleString()})</span>
                    </div>
                  </>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.genres?.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 text-xs bg-white/10 backdrop-blur-sm rounded-full text-white/80"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 md:px-12 pt-6 md:pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
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

          {/* Streaming Providers - FIRST */}
          <StreamingSection providers={providers} />

          {/* Synopsis */}
          {movie.overview && (
            <section className="mb-10">
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Synopsis</h2>
              <p className="text-white/70 leading-relaxed">{movie.overview}</p>
            </section>
          )}

          {/* Director */}
          {director && (
            <section className="mb-10">
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-3">Réalisateur</h2>
              <button
                onClick={() => navigate(`/person/${director.id}`)}
                className="flex items-center gap-4 hover:bg-white/5 p-3 -ml-3 rounded-xl transition-colors"
              >
                {director.profile_path ? (
                  <img
                    src={getImageUrl(director.profile_path, "w185") || ""}
                    alt={director.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white/50">
                    {director.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-white">{director.name}</span>
              </button>
            </section>
          )}

          {/* Cast - Horizontal scroll avec photos */}
          {cast.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Distribution</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                {cast.map((actor) => (
                  <CastCard key={actor.id} actor={actor} onClick={() => navigate(`/person/${actor.id}`)} />
                ))}
              </div>
            </section>
          )}

          {/* Photo Gallery */}
          <PhotoGallery images={movie.images?.backdrops || []} title={movie.title} />

          {/* Budget & Production */}
          {(movie.budget > 0 || studios.length > 0 || countries) && (
            <section className="mb-10 py-6 border-t border-white/5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Budget */}
                {movie.budget > 0 && (
                  <div>
                    <h3 className="text-xs text-white/40 uppercase tracking-wider mb-2">Budget</h3>
                    <p className="text-white font-medium">{formatMoney(movie.budget)}</p>
                  </div>
                )}

                {/* Countries */}
                {countries && (
                  <div>
                    <h3 className="text-xs text-white/40 uppercase tracking-wider mb-2">Pays</h3>
                    <p className="text-white/70 text-sm">{countries}</p>
                  </div>
                )}

                {/* Studios */}
                {studios.length > 0 && (
                  <div>
                    <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">Production</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      {studios.map((company) => (
                        <StudioLogo key={company.id} company={company} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <section className="mb-10 pt-6 border-t border-white/5">
              <h2 className="text-xs text-white/40 uppercase tracking-wider mb-4">Films similaires</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {recommendations.map((rec, index) => (
                  <MinimalMovieCard key={rec.id} movie={rec} index={index} />
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
