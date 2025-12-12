import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserLists } from "@/hooks/useUserLists";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useAuth } from "@/contexts/AuthContext";
import { getMovieDetails, Movie } from "@/services/tmdb";
import { ListsShowcase } from "@/components/guest/ListsShowcase";
import { CreateListDialog } from "@/components/lists/CreateListDialog";
import { SpecialListCard } from "@/components/lists/SpecialListCard";
import { AnimatedListCard } from "@/components/lists/AnimatedListCard";

import { Plus, ListVideo, Clock, Eye, Heart, ArrowLeft, Sparkles, FolderPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";

type SpecialList = "watchlist" | "watched" | "favorites" | null;

interface CategoryCard {
  id: SpecialList;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  getMovies: () => Movie[];
  getPosters: () => string[];
  getCount: () => number;
}

export default function Lists() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lists, loading: listsLoading, createList, updateList, deleteList, addMovieToList } = useUserLists();
  const { userMovies, loading: moviesLoading } = useUserMovies();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<string | null>(null);
  const [selectedSpecial, setSelectedSpecial] = useState<SpecialList>(null);

  // Movie details cache
  const [movies, setMovies] = useState<Record<number, Movie>>({});
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Form state for editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  // Fetch movie details for special lists
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
            // Check cache first (simple object cache for this session)
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

  // Helper pour extraire les posters (urls) d'une liste filtrée de userMovies
  const extractPosters = (filteredUserMovies: typeof userMovies) => {
    return filteredUserMovies
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10) // Top 10
      .map((um) => movies[um.tmdb_id]?.poster_path)
      .filter((path) => path !== undefined && path !== null) as string[];
  };

  const getWatchlistMovies = () =>
    userMovies
      .filter((um) => um.status === "watchlist")
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const getWatchedMovies = () =>
    userMovies
      .filter((um) => um.status === "watched")
      .sort(
        (a, b) =>
          new Date(b.watched_at || b.created_at || 0).getTime() - new Date(a.watched_at || a.created_at || 0).getTime(),
      )
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const getFavoriteMovies = () =>
    userMovies
      .filter((um) => um.is_favorite)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map((um) => movies[um.tmdb_id])
      .filter(Boolean);

  const specialLists: CategoryCard[] = [
    {
      id: "watchlist",
      title: "Watchlist",
      icon: Clock,
      getMovies: getWatchlistMovies,
      getPosters: () => extractPosters(userMovies.filter((um) => um.status === "watchlist")),
      getCount: () => userMovies.filter((um) => um.status === "watchlist").length,
    },
    {
      id: "watched",
      title: "Films Vus",
      icon: Eye,
      getMovies: getWatchedMovies,
      getPosters: () => extractPosters(userMovies.filter((um) => um.status === "watched")),
      getCount: () => userMovies.filter((um) => um.status === "watched").length,
    },
    {
      id: "favorites",
      title: "Favoris",
      icon: Heart,
      getMovies: getFavoriteMovies,
      getPosters: () => extractPosters(userMovies.filter((um) => um.is_favorite)),
      getCount: () => userMovies.filter((um) => um.is_favorite).length,
    },
  ];

  const isLoading = moviesLoading || loadingMovies;

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

  const handleEdit = async (listId: string) => {
    if (!title.trim()) return;
    await updateList(listId, {
      title: title.trim(),
      description: description.trim() || null,
      is_public: isPublic,
    });
    setEditingList(null);
  };

  const handleDelete = async (listId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette liste ?")) {
      await deleteList(listId);
    }
  };

  const openEditDialog = (list: (typeof lists)[0]) => {
    setTitle(list.title);
    setDescription(list.description || "");
    setIsPublic(list.is_public);
    setEditingList(list.id);
  };

  // Loader pendant le chargement de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Si non connecté, afficher le showcase
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="pt-14 md:pt-0">
          <ListsShowcase />
        </main>
        <BottomNav />
      </div>
    );
  }

  // Detail view for special lists
  if (selectedSpecial) {
    const category = specialLists.find((c) => c.id === selectedSpecial)!;
    const categoryMovies = category.getMovies();

    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedSpecial(null)}
              className="shrink-0 rounded-xl hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">{category.title}</h1>
              <p className="text-muted-foreground text-sm">
                {categoryMovies.length} film{categoryMovies.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {isLoading ? (
            <MovieGrid loading />
          ) : categoryMovies.length > 0 ? (
            <MovieGrid movies={categoryMovies} />
          ) : (
            <EmptyState
              icon={category.icon}
              title={`Aucun film dans ${category.title}`}
              description="Ajoutez des films pour les voir ici"
            />
          )}
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Mes Listes</h1>
            <p className="text-muted-foreground mt-2 text-lg">Organisez votre univers cinématographique</p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-full gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Nouvelle liste
          </Button>
        </div>

        {/* Special Lists */}
        <section className="mb-12">
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Listes automatiques
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {specialLists.map((list) => (
              <SpecialListCard
                key={list.id}
                title={list.title}
                icon={list.icon}
                count={list.getCount()}
                posters={list.getPosters()}
                loading={isLoading}
                onClick={() => setSelectedSpecial(list.id)}
              />
            ))}
          </div>
        </section>

        {/* Custom Lists */}
        <section>
          <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-500" />
            Mes listes personnalisées
          </h2>

          {listsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-12 bg-card/50 rounded-2xl border border-dashed border-border">
              <ListVideo className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">Aucune liste personnalisée</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Créez des listes thématiques pour organiser vos films
              </p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Créer ma première liste
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list) => (
                <AnimatedListCard
                  key={list.id}
                  list={list}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  onEdit={() => openEditDialog(list)}
                  onDelete={() => handleDelete(list.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create List Dialog */}
      <CreateListDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateList}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent className="glass-elevated border-border/50 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Modifier la liste</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Nom de la liste
              </Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50 resize-none min-h-[100px]"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-3">
                <div>
                  <Label htmlFor="edit-public" className="text-base font-medium cursor-pointer">
                    Liste publique
                  </Label>
                  <p className="text-xs text-muted-foreground">Visible sur votre profil public</p>
                </div>
              </div>
              <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <Button
              onClick={() => editingList && handleEdit(editingList)}
              className="w-full rounded-xl h-11 text-base"
              disabled={!title.trim()}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

function MovieGrid({ movies = [], loading = false }: { movies?: Movie[]; loading?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {loading
        ? Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} size="lg" />)
        : movies.map((movie, index) => (
            <div key={movie.id} className={cn("animate-fade-in-up", `stagger-${Math.min(index + 1, 6)}`)}>
              <MovieCard movie={movie} size="lg" />
            </div>
          ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
