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
import { getMovieDetails, Movie } from "../services/tmdb";
import { AuthPlaceholder } from "../components/AuthPlaceholder";
import { CreateListDialog, SpecialListCard, CustomListCard } from "../components/lists";
import { Plus, ListVideo, Clock, Eye, Heart, ArrowLeft, Sparkles } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../lib/utils";

type SpecialList = "watchlist" | "watched" | "favorites" | null;

interface CategoryCard {
  id: SpecialList;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  getMovies: () => Movie[];
  getPosters: () => string[]; // Nouveau champ pour récupérer les URLs des posters
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
              "Partagez vos listes avec vos amis",
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
            className="rounded-full gap-2 shadow-lg hover:shadow-xl transition-all h-12 px-6 bg-gradient-to-r from-primary to-amber-600 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Nouvelle liste</span>
          </Button>
        </div>

        {/* Special Lists - Bento Grid Style */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-display font-semibold">Collections Principales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialLists.map((category, index) => (
              <SpecialListCard
                key={category.id}
                title={category.title}
                count={category.getCount()}
                icon={category.icon}
                posters={category.getPosters()}
                onClick={() => setSelectedSpecial(category.id)}
                loading={isLoading}
                type={category.id as "watchlist" | "watched" | "favorites"}
                className={cn("animate-fade-in-up", `stagger-${index + 1}`)}
              />
            ))}
          </div>
        </section>

        {/* Custom Lists */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-muted">
                <ListVideo className="w-5 h-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-display font-semibold">Vos Listes</h2>
            </div>
            {lists.length > 0 && (
              <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                {lists.length} listes
              </span>
            )}
          </div>

          {listsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-24 rounded-3xl border border-dashed border-border/50 bg-card/30 animate-fade-in-up">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                <ListVideo className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">Aucune liste personnalisée</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Créez des listes thématiques pour organiser vos films préférés (ex: "Soirée Halloween", "Comédies 90s")
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                variant="outline"
                className="rounded-full gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5"
              >
                <Plus className="w-4 h-4" />
                Créer ma première liste
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {lists.map((list, index) => (
                <CustomListCard
                  key={list.id}
                  id={list.id}
                  title={list.title}
                  description={list.description}
                  isPublic={list.is_public}
                  updatedAt={list.updated_at}
                  itemCount={list.item_count}
                  posters={list.posters}
                  onEdit={() => openEditDialog(list)}
                  onDelete={() => handleDelete(list.id)}
                  className={cn("animate-fade-in-up", `stagger-${Math.min(index + 1, 6)}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create List Dialog */}
      <CreateListDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreateList={handleCreateList} />

      {/* Edit List Dialog */}
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
    <div className="text-center py-24 rounded-3xl border border-dashed border-border/50 bg-card/30 animate-fade-in-up">
      <div className="p-5 rounded-full bg-muted/50 w-fit mx-auto mb-6 ring-8 ring-muted/20">
        <Icon className="w-10 h-10 text-muted-foreground/50" />
      </div>
      <h3 className="font-display font-semibold text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">{description}</p>
    </div>
  );
}
