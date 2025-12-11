import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "../components/MovieCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useUserLists } from "../hooks/useUserLists";
import { useUserMovies } from "../hooks/useUserMovies";
import { useAuth } from "../contexts/AuthContext";
import { getMovieDetails, getImageUrl, Movie } from "../services/tmdb";
import { AuthPlaceholder } from "../components/AuthPlaceholder";
import { CreateListDialog, SpecialListCard, CustomListCard } from "../components/lists";
import {
  Plus,
  ListVideo,
  Clock,
  Eye,
  Heart,
  ArrowLeft,
  Film,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../lib/utils";

type SpecialList = "watchlist" | "watched" | "favorites" | null;

interface CategoryCard {
  id: SpecialList;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  getMovies: () => Movie[];
  getCount: () => number;
}

export default function Lists() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
            const details = await getMovieDetails(um.tmdb_id);
            movieDetails[um.tmdb_id] = details;
          } catch (error) {
            console.error(`Error fetching movie ${um.tmdb_id}:`, error);
          }
        }),
      );

      setMovies(movieDetails);
      setLoadingMovies(false);
    };

    if (!moviesLoading) {
      fetchMovieDetails();
    }
  }, [userMovies, moviesLoading]);

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
      getCount: () => userMovies.filter((um) => um.status === "watchlist").length,
    },
    {
      id: "watched",
      title: "Films Vus",
      icon: Eye,
      getMovies: getWatchedMovies,
      getCount: () => userMovies.filter((um) => um.status === "watched").length,
    },
    {
      id: "favorites",
      title: "Favoris",
      icon: Heart,
      getMovies: getFavoriteMovies,
      getCount: () => userMovies.filter((um) => um.is_favorite).length,
    },
  ];

  const isLoading = moviesLoading || loadingMovies;

  const getCategoryBackdrop = (category: CategoryCard): string | null => {
    const categoryMovies = category.getMovies();
    if (categoryMovies.length > 0) {
      return categoryMovies[0]?.backdrop_path || categoryMovies[0]?.poster_path || null;
    }
    return null;
  };

  const handleCreateList = async (
    listTitle: string,
    listDescription: string,
    listIsPublic: boolean,
    selectedMovies: Array<{ tmdb_id: number; title: string; poster_path: string | null }>
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

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <main className="container mx-auto p-4">
          <AuthPlaceholder
            icon={ListVideo}
            title="Vos Listes Personnalisées"
            description="Créez et partagez des listes de films pour chaque occasion. Ne perdez plus jamais une recommandation."
            features={[
              "Gérez votre Watchlist",
              "Créez des listes à thèmes (ex: 'Soirée Frisson')",
              "Suivez les films que vous avez vus",
              "Partagez vos listes avec vos amis"
            ]}
          />
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

        <div className="container mx-auto px-4 py-6">
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

      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Mes Listes</h1>
            <p className="text-muted-foreground text-sm mt-1">Organisez vos films à votre façon</p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle liste</span>
          </Button>
        </div>

        {/* Special Lists - Bento Grid */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Collections
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {specialLists.map((category, index) => (
              <SpecialListCard
                key={category.id}
                title={category.title}
                count={category.getCount()}
                icon={category.icon}
                backdrop={getCategoryBackdrop(category)}
                onClick={() => setSelectedSpecial(category.id)}
                loading={isLoading}
                variant={index === 0 ? "featured" : "default"}
                className={cn(
                  "animate-fade-in-up",
                  index === 0 && "stagger-1",
                  index === 1 && "stagger-2",
                  index === 2 && "stagger-3"
                )}
              />
            ))}
          </div>
        </section>

        {/* Custom Lists */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Listes personnalisées
              </h2>
            </div>
            {lists.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                {lists.length} liste{lists.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {listsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-16 rounded-2xl glass-elevated animate-fade-in-up">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <ListVideo className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-display font-semibold mb-2">Aucune liste personnalisée</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Créez des listes thématiques pour organiser vos films préférés
              </p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                Créer ma première liste
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lists.map((list, index) => (
                <CustomListCard
                  key={list.id}
                  id={list.id}
                  title={list.title}
                  description={list.description}
                  isPublic={list.is_public}
                  updatedAt={list.updated_at}
                  onEdit={() => openEditDialog(list)}
                  onDelete={() => handleDelete(list.id)}
                  className={cn(
                    "animate-fade-in-up",
                    `stagger-${Math.min(index + 1, 6)}`
                  )}
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
        onCreateList={handleCreateList}
      />

      {/* Edit List Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent className="glass-elevated border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">Modifier la liste</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">Nom de la liste</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-background/50 resize-none"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div>
                  <Label htmlFor="edit-public" className="text-sm font-medium cursor-pointer">
                    Liste publique
                  </Label>
                  <p className="text-xs text-muted-foreground">Visible par tous</p>
                </div>
              </div>
              <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <Button
              onClick={() => editingList && handleEdit(editingList)}
              className="w-full rounded-xl"
              disabled={!title.trim()}
            >
              Enregistrer
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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4">
      {loading
        ? Array.from({ length: 16 }).map((_, i) => (
            <MovieCardSkeleton key={i} size="sm" />
          ))
        : movies.map((movie, index) => (
            <div
              key={movie.id}
              className={cn("animate-fade-in-up", `stagger-${Math.min(index + 1, 6)}`)}
            >
              <MovieCard movie={movie} size="sm" />
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
    <div className="text-center py-16 rounded-2xl glass-elevated animate-fade-in-up">
      <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
        <Icon className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
    </div>
  );
}
