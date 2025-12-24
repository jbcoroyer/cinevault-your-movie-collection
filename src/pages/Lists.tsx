/**
 * CineVault - Lists Page - Radical Minimalist Design
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUserLists } from "@/hooks/useUserLists";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, getImageUrl, Movie } from "@/services/tmdb";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { MinimalMovieCard } from "@/components/MinimalMovieCard";
import { Plus, ArrowLeft, Clock, Eye, Heart, Lock, Globe } from "lucide-react";
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
    listTitle: string,
    listDescription: string,
    listIsPublic: boolean,
    selectedMovies: Array<{ tmdb_id: number; title: string; poster_path: string | null }>,
  ) => {
    const newList = await createList(listTitle, listDescription, listIsPublic);
    if (newList && selectedMovies.length > 0) {
      for (const movie of selectedMovies) {
        await addMovieToList(newList.id, movie);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-4xl mx-auto text-center py-20">
          <p className="text-muted-foreground mb-6">Connectez-vous pour voir vos listes</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background"
          >
            Se connecter
          </Button>
        </main>
      </div>
    );
  }

  // Detail view
  if (selectedSpecial) {
    const category = specialLists.find((c) => c.id === selectedSpecial)!;
    const categoryMovies = category.getMovies();

    return (
      <div className="min-h-screen bg-background pb-32">
        <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setSelectedSpecial(null)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-card rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-heading-mobile md:text-heading-desktop font-bold">{category.title}</h1>
              <p className="text-muted-foreground text-sm">
                {categoryMovies.length} film{categoryMovies.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {loadingMovies ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-card animate-pulse rounded-lg md:rounded-xl" />
              ))}
            </div>
          ) : categoryMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
              {categoryMovies.map((movie) => (
                <MinimalMovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <category.icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Aucun film</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <main className="px-4 md:px-12 pt-8 md:pt-16 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <h1 className="text-heading-mobile md:text-heading-desktop font-bold">Listes</h1>
            <p className="text-muted-foreground text-sm mt-1">Organisez vos films</p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-transparent border border-border text-foreground hover:bg-foreground hover:text-background min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle liste
          </Button>
        </motion.div>

        {/* Special Lists */}
        <section className="mb-12">
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-6">
            Automatiques
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {specialLists.map((list) => {
              const count = list.id === "watchlist" 
                ? userMovies.filter(m => m.status === "watchlist").length
                : list.id === "watched"
                ? userMovies.filter(m => m.status === "watched").length
                : userMovies.filter(m => m.is_favorite).length;

              const listMovies = list.getMovies().slice(0, 4);

              return (
                <motion.button
                  key={list.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setSelectedSpecial(list.id)}
                  className="bg-background p-6 text-left hover:bg-card transition-colors min-h-[120px]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <list.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium">{list.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                  
                  {/* Poster preview */}
                  <div className="flex -space-x-3">
                    {listMovies.map((movie, i) => (
                      <div
                        key={movie.id}
                        className="w-10 h-14 rounded bg-card border border-border overflow-hidden"
                        style={{ zIndex: listMovies.length - i }}
                      >
                        {movie.poster_path && (
                          <img
                            src={getImageUrl(movie.poster_path, "w92") || ""}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                    {count > 4 && (
                      <div className="w-10 h-14 rounded bg-card border border-border flex items-center justify-center text-xs text-muted-foreground">
                        +{count - 4}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Custom Lists */}
        <section>
          <h2 className="text-xs text-muted-foreground uppercase tracking-wider mb-6">
            Personnalisées
          </h2>

          {listsLoading ? (
            <div className="space-y-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-card animate-pulse" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border">
              <p className="text-muted-foreground text-sm mb-4">Aucune liste personnalisée</p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                variant="outline"
                className="border-border min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer une liste
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {lists.map((list) => (
                <motion.button
                  key={list.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="w-full p-4 text-left hover:bg-card transition-colors flex items-center justify-between min-h-[72px]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{list.title}</span>
                      {list.is_public ? (
                        <Globe className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    {list.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{list.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{list.item_count || 0}</span>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </main>

      <CreateListDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreateList={handleCreateList}
      />
    </div>
  );
}
