/**
 * CineVault - Lists Page - Radical Minimalist Design
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { useUserLists } from "@/hooks/useUserLists";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, getImageUrl, Movie } from "@/services/tmdb";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { MinimalMovieCard } from "@/components/MinimalMovieCard";
import { Plus, ArrowLeft, Clock, Eye, Heart, Lock, Globe, ChevronRight, Film, ListVideo } from "lucide-react";
import { cn } from "@/lib/utils";

type SpecialList = "watchlist" | "watched" | "favorites" | null;

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
    { id: "watchlist" as const, title: "À voir", icon: Clock, getMovies: getWatchlistMovies },
    { id: "watched" as const, title: "Vus", icon: Eye, getMovies: getWatchedMovies },
    { id: "favorites" as const, title: "Favoris", icon: Heart, getMovies: getFavoriteMovies },
  ];

  const handleCreateList = async (
    title: string,
    description: string,
    isPublic: boolean,
    moviesList: Array<{ tmdb_id: number; title: string; poster_path: string | null }>,
  ) => {
    const newList = await createList(title, description, isPublic);
    if (newList && moviesList.length > 0) {
      for (const movie of moviesList) {
        await addMovieToList(newList.id, movie.tmdb_id);
      }
    }
    setIsCreateOpen(false);
  };

  // Guest view
  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MinimalHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center px-4">
            <ListVideo className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h1 className="font-display text-display-sm text-white mb-4">SIGN IN TO VIEW</h1>
            <p className="text-white/50 mb-8">Create an account to manage your lists</p>
            <Button onClick={() => navigate("/auth")} className="bg-white text-black hover:bg-white/90 rounded-full">
              Sign In
            </Button>
          </div>
        </div>
        <FloatingDock />
      </div>
    );
  }

  // Special list detail view
  if (selectedSpecial) {
    const specialList = specialLists.find((l) => l.id === selectedSpecial);
    const specialMovies = specialList?.getMovies() || [];

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
              <span>Back</span>
            </button>

            <h1 className="font-display text-display-xs md:text-display-sm text-white mb-2">
              {specialList?.title.toUpperCase()}
            </h1>
            <p className="text-white/40 mb-8">
              {specialMovies.length} {specialMovies.length === 1 ? "film" : "films"}
            </p>

            {specialMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {specialMovies.map((movie, index) => (
                  <MinimalMovieCard key={movie.id} movie={movie} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Film className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">No movies yet</p>
              </div>
            )}
          </motion.div>
        </main>

        <FloatingDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <MinimalHeader />

      <main className="px-4 md:px-12 pt-20 md:pt-24 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <h1 className="font-display text-display-xs md:text-display-sm text-white">LISTS</h1>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-white text-black hover:bg-white/90 gap-2 rounded-full"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New List</span>
          </Button>
        </motion.div>

        {/* Special Lists */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-sm text-white/40 mb-4">SMART LISTS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {specialLists.map((list) => {
              const Icon = list.icon;
              const count = list.getMovies().length;

              return (
                <motion.button
                  key={list.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSpecial(list.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-white/5 border border-white/10",
                    "hover:bg-white/10 hover:border-white/20",
                    "transition-all duration-300 text-left",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{list.title}</p>
                      <p className="text-sm text-white/40">{count} films</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/30" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Custom Lists */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm text-white/40 mb-4">MY LISTS</h2>

          {listsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : lists.length > 0 ? (
            <div className="space-y-3">
              {lists.map((list, index) => (
                <motion.button
                  key={list.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl",
                    "bg-white/5 border border-white/10",
                    "hover:bg-white/10 hover:border-white/20",
                    "transition-all duration-300 text-left",
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Poster preview */}
                    <div className="w-12 h-16 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                      <Film className="w-full h-full p-3 text-white/20" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{list.title}</p>
                        {list.is_public ? (
                          <Globe className="w-3 h-3 text-white/30" />
                        ) : (
                          <Lock className="w-3 h-3 text-white/30" />
                        )}
                      </div>
                      {list.description && (
                        <p className="text-sm text-white/40 line-clamp-1 mt-0.5">{list.description}</p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <ListVideo className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-4">No custom lists yet</p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 gap-2 rounded-full"
              >
                <Plus className="w-4 h-4" />
                Create your first list
              </Button>
            </div>
          )}
        </motion.div>
      </main>

      <CreateListDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreateList={handleCreateList} />

      <FloatingDock />
    </div>
  );
}
