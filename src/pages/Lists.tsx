/**
 * CineVault - Lists Page - Visual Poster-Style Design
 *
 * Page de listes avec:
 * - Cartes visuelles grandes style poster de film
 * - Collage de posters pour chaque liste
 * - Animations fluides
 * - MinimalHeader + FloatingDock
 * - Timeline chronologique pour les films vus
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { useUserLists } from "@/hooks/useUserLists";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, getImageUrl, Movie, getYear } from "@/services/tmdb";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { MinimalMovieCard } from "@/components/MinimalMovieCard";
import { WatchedTimeline } from "@/components/profile/WatchedTimeline";
import { Plus, ArrowLeft, Clock, Eye, Heart, Lock, Globe, ChevronRight, Film, ListVideo, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type SpecialList = "watchlist" | "watched" | "favorites" | null;

// Poster collage component for list cards
const PosterCollage = ({
  posters,
  size = "large",
}: {
  posters: (string | null)[];
  size?: "small" | "medium" | "large";
}) => {
  const validPosters = posters.filter(Boolean).slice(0, 4);
  const sizeClasses = {
    small: "h-32",
    medium: "h-48",
    large: "h-64 md:h-80",
  };

  if (validPosters.length === 0) {
    return (
      <div
        className={cn(
          "w-full rounded-xl bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center",
          sizeClasses[size],
        )}
      >
        <Film className="w-12 h-12 text-white/20" />
      </div>
    );
  }

  if (validPosters.length === 1) {
    return (
      <div className={cn("w-full rounded-xl overflow-hidden", sizeClasses[size])}>
        <img src={getImageUrl(validPosters[0]!, "w500")!} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  if (validPosters.length === 2) {
    return (
      <div className={cn("w-full rounded-xl overflow-hidden grid grid-cols-2 gap-0.5", sizeClasses[size])}>
        {validPosters.map((poster, i) => (
          <img key={i} src={getImageUrl(poster!, "w342")!} alt="" className="w-full h-full object-cover" />
        ))}
      </div>
    );
  }

  if (validPosters.length === 3) {
    return (
      <div className={cn("w-full rounded-xl overflow-hidden grid grid-cols-2 gap-0.5", sizeClasses[size])}>
        <img src={getImageUrl(validPosters[0]!, "w342")!} alt="" className="w-full h-full object-cover row-span-2" />
        <div className="grid grid-rows-2 gap-0.5">
          {validPosters.slice(1).map((poster, i) => (
            <img key={i} src={getImageUrl(poster!, "w342")!} alt="" className="w-full h-full object-cover" />
          ))}
        </div>
      </div>
    );
  }

  // 4 posters
  return (
    <div className={cn("w-full rounded-xl overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5", sizeClasses[size])}>
      {validPosters.map((poster, i) => (
        <img key={i} src={getImageUrl(poster!, "w342")!} alt="" className="w-full h-full object-cover" />
      ))}
    </div>
  );
};

// Visual list card component
const VisualListCard = ({
  title,
  description,
  movieCount,
  posters,
  isPublic,
  icon: Icon,
  gradient,
  onClick,
  index,
}: {
  title: string;
  description?: string | null;
  movieCount: number;
  posters: (string | null)[];
  isPublic?: boolean;
  icon?: typeof Clock;
  gradient?: string;
  onClick: () => void;
  index: number;
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group relative w-full text-left overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300"
    >
      {/* Poster collage background */}
      <div className="relative">
        <PosterCollage posters={posters} size="large" />

        {/* Gradient overlay */}
        <div
          className={cn("absolute inset-0 bg-gradient-to-t", gradient || "from-black via-black/60 to-transparent")}
        />

        {/* Icon badge (for special lists) */}
        {Icon && (
          <div
            className={cn(
              "absolute top-3 left-3 p-2 rounded-xl backdrop-blur-sm",
              gradient ? "bg-white/20" : "bg-white/10",
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Privacy badge */}
        <div className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 backdrop-blur-sm">
          {isPublic ? <Globe className="w-4 h-4 text-white/70" /> : <Lock className="w-4 h-4 text-white/70" />}
        </div>

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
          <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
            {title}
          </h3>
          {description && <p className="text-white/60 text-sm line-clamp-1 mb-2">{description}</p>}
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-sm">
              {movieCount} film{movieCount !== 1 ? "s" : ""}
            </span>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default function Lists() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lists, loading: listsLoading, createList, deleteList, addMovieToList } = useUserLists();
  const { userMovies, loading: moviesLoading } = useUserMovies();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSpecial, setSelectedSpecial] = useState<SpecialList>(null);
  const [movies, setMovies] = useState<Record<number, Movie>>({});
  const [loadingMovies, setLoadingMovies] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (userMovies.length === 0) {
        setLoadingMovies(false);
        return;
      }

      setLoadingMovies(true);
      const movieDetails: Record<number, Movie> = {};

      await Promise.all(
        userMovies.map(async (um) => {
          try {
            if (!movies[um.tmdb_id]) {
              const details = await getMovieDetails(um.tmdb_id);
              movieDetails[um.tmdb_id] = details;
            }
          } catch (error) {
            console.error(`Error fetching movie ${um.tmdb_id}:`, error);
          }
        }),
      );

      setMovies((prev) => ({ ...prev, ...movieDetails }));
      setLoadingMovies(false);
    };

    if (!moviesLoading) {
      fetchMovieDetails();
    }
  }, [userMovies, moviesLoading]);

  const getWatchlistMovies = () =>
    userMovies
      .filter((um) => um.status === "watchlist")
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const getWatchedMovies = () =>
    userMovies
      .filter((um) => um.status === "watched")
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const getFavoriteMovies = () =>
    userMovies
      .filter((um) => um.is_favorite)
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const specialLists = [
    {
      id: "watchlist" as const,
      title: "À voir",
      icon: Clock,
      getMovies: getWatchlistMovies,
      gradient: "from-blue-900 via-blue-900/80 to-transparent",
    },
    {
      id: "watched" as const,
      title: "Vus",
      icon: Eye,
      getMovies: getWatchedMovies,
      gradient: "from-emerald-900 via-emerald-900/80 to-transparent",
    },
    {
      id: "favorites" as const,
      title: "Favoris",
      icon: Heart,
      getMovies: getFavoriteMovies,
      gradient: "from-rose-900 via-rose-900/80 to-transparent",
    },
  ];

  const handleCreateList = async (
    title: string,
    description: string,
    isPublic: boolean,
    moviesList: Array<{
      tmdb_id: number;
      title: string;
      poster_path: string | null;
    }>,
  ) => {
    const newList = await createList(title, description, isPublic);
    if (newList && moviesList.length > 0) {
      for (const movie of moviesList) {
        await addMovieToList(newList.id, {
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          poster_path: movie.poster_path || "",
        });
      }
    }
    setIsCreateOpen(false);
  };

  // Guest view
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center px-4">
            <ListVideo className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h1 className="font-display text-2xl text-white mb-4">Connectez-vous pour voir vos listes</h1>
            <p className="text-white/50 mb-8">Créez un compte pour organiser vos films</p>
            <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90 rounded-full">
              Se connecter
            </Button>
          </div>
        </div>
        <FloatingDock />
      </div>
    );
  }

  // Build movie metadata for WatchedTimeline
  const movieMetadata = useMemo(() => {
    const metadata: Record<number, { title: string; poster_path: string | null; release_year?: number }> = {};
    Object.entries(movies).forEach(([tmdbId, movie]) => {
      if (movie) {
        metadata[parseInt(tmdbId)] = {
          title: movie.title,
          poster_path: movie.poster_path,
          release_year: movie.release_date ? parseInt(getYear(movie.release_date)) : undefined,
        };
      }
    });
    return metadata;
  }, [movies]);

  // Special list detail view
  if (selectedSpecial) {
    const specialList = specialLists.find((l) => l.id === selectedSpecial);
    const specialMovies = specialList?.getMovies() || [];

    // For "watched" list, use Timeline view
    const isWatchedList = selectedSpecial === "watched";

    return (
      <div className="min-h-screen bg-background pb-32">
        <MinimalHeader />

        <main className="px-4 md:px-12 pt-20 md:pt-24 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Back button */}
            <button
              onClick={() => setSelectedSpecial(null)}
              className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">{specialList?.title}</h1>
            <p className="text-white/40 mb-8">
              {specialMovies.length} film{specialMovies.length !== 1 ? "s" : ""}
            </p>

            {isWatchedList ? (
              // Use WatchedTimeline for watched movies
              <WatchedTimeline 
                userMovies={userMovies} 
                movieMetadata={movieMetadata}
                isLoading={loadingMovies}
              />
            ) : specialMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {specialMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    className="cursor-pointer"
                  >
                    <MinimalMovieCard movie={movie} index={index} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Cette liste est vide</p>
              </div>
            )}
          </motion.div>
        </main>

        <FloatingDock />
      </div>
    );
  }

  // Loading state
  if (listsLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <MinimalHeader />
        <main className="px-4 md:px-12 pt-20 md:pt-24 max-w-7xl mx-auto">
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </main>
        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MinimalHeader />

      <main className="px-4 md:px-12 pt-20 md:pt-24 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-1">Mes Listes</h1>
              <p className="text-white/40">Organisez vos films par thème ou envie</p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-white text-black hover:bg-white/90 gap-2 rounded-full"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle liste</span>
            </Button>
          </div>

          {/* Special Lists Section */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white/70 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Listes automatiques
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {specialLists.map((list, index) => {
                const listMovies = list.getMovies();
                return (
                  <VisualListCard
                    key={list.id}
                    title={list.title}
                    movieCount={listMovies.length}
                    posters={listMovies.slice(0, 4).map((m) => m.poster_path)}
                    icon={list.icon}
                    gradient={list.gradient}
                    onClick={() => setSelectedSpecial(list.id)}
                    index={index}
                  />
                );
              })}
            </div>
          </section>

          {/* Custom Lists Section */}
          <section>
            <h2 className="text-lg font-semibold text-white/70 mb-4 flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-amber-500" />
              Mes listes personnalisées
            </h2>

            {lists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((list, index) => (
                  <VisualListCard
                    key={list.id}
                    title={list.title}
                    description={list.description}
                    movieCount={list.item_count || 0}
                    posters={list.posters || []}
                    isPublic={list.is_public}
                    onClick={() => navigate(`/lists/${list.id}`)}
                    index={index}
                  />
                ))}

                {/* Create new list card */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: lists.length * 0.05 }}
                  onClick={() => setIsCreateOpen(true)}
                  className="group relative w-full h-64 md:h-80 rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-500/50 bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-white/10 group-hover:bg-amber-500/20 flex items-center justify-center transition-colors">
                    <Plus className="w-7 h-7 text-white/50 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <span className="text-white/50 group-hover:text-white font-medium transition-colors">
                    Créer une liste
                  </span>
                </motion.button>
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                <ListVideo className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-4">Aucune liste personnalisée</p>
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 gap-2 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                  Créer votre première liste
                </Button>
              </div>
            )}
          </section>
        </motion.div>
      </main>

      <CreateListDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreateList={handleCreateList} />

      <FloatingDock />
    </div>
  );
}
