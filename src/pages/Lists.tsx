import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserLists } from "@/hooks/useUserLists";
import { useUserMovies } from "@/hooks/useUserMovies";
import { getMovieDetails, getImageUrl, Movie } from "@/services/tmdb";
import {
  Plus,
  ListVideo,
  MoreVertical,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Clock,
  Eye,
  Heart,
  ArrowLeft,
  Film,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  const { lists, loading: listsLoading, createList, updateList, deleteList } = useUserLists();
  const { userMovies, loading: moviesLoading } = useUserMovies();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingList, setEditingList] = useState<string | null>(null);
  const [selectedSpecial, setSelectedSpecial] = useState<SpecialList>(null);

  // Movie details cache
  const [movies, setMovies] = useState<Record<number, Movie>>({});
  const [loadingMovies, setLoadingMovies] = useState(true);

  // Form state
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

  // Get backdrop for a special list (last added movie)
  const getCategoryBackdrop = (category: CategoryCard): string | null => {
    const categoryMovies = category.getMovies();
    if (categoryMovies.length > 0) {
      return categoryMovies[0]?.backdrop_path || categoryMovies[0]?.poster_path || null;
    }
    return null;
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIsPublic(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createList(title.trim(), description.trim(), isPublic);
    resetForm();
    setIsCreateOpen(false);
  };

  const handleEdit = async (listId: string) => {
    if (!title.trim()) return;
    await updateList(listId, {
      title: title.trim(),
      description: description.trim() || null,
      is_public: isPublic,
    });
    resetForm();
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

  // If a special list is selected, show the movie grid
  if (selectedSpecial) {
    const category = specialLists.find((c) => c.id === selectedSpecial)!;
    const categoryMovies = category.getMovies();

    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />

        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setSelectedSpecial(null)} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{category.title}</h1>
              <p className="text-muted-foreground">{categoryMovies.length} films</p>
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

      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mes Listes</h1>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle liste
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une liste</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="title">Nom de la liste</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Mes comfort movies"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optionnel)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez votre liste..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="public">Liste publique</Label>
                    <p className="text-sm text-muted-foreground">Visible par tous les utilisateurs</p>
                  </div>
                  <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!title.trim()}>
                  Créer la liste
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Special Lists (Watchlist, Watched, Favorites) */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {specialLists.map((category) => {
              const backdrop = getCategoryBackdrop(category);
              const count = category.getCount();
              const Icon = category.icon;

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedSpecial(category.id)}
                  className="group relative h-28 md:h-32 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary w-full"
                >
                  {/* Background Image */}
                  {backdrop ? (
                    <img
                      src={getImageUrl(backdrop, "w500") || ""}
                      alt={category.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-60 group-hover:opacity-40"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted flex items-center justify-center">
                      <Film className="w-16 h-16 text-muted-foreground/10" />
                    </div>
                  )}

                  {/* Dark Overlay/Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent group-hover:from-black/90 group-hover:via-black/70 transition-all duration-300" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-row items-center px-6 gap-4 text-white">
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-bold">{category.title}</h2>
                      <p className="text-white/70 text-sm font-medium">
                        {isLoading ? "..." : `${count} film${count !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Lists */}
        <h2 className="text-xl font-semibold mb-4">Listes personnalisées</h2>

        {listsLoading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
            <ListVideo className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-medium mb-1">Aucune liste personnalisée</h3>
            <p className="text-sm text-muted-foreground mb-4">Organisez vos films par thèmes</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Créer une liste
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Link key={list.id} to={`/lists/${list.id}`} className="block group">
                <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors text-base">
                          {list.title}
                        </h3>
                        {list.is_public && <Globe className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                        {!list.is_public && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                      </div>
                      {list.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{list.description}</p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 -mr-2 -mt-2 text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            openEditDialog(list);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(list.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Modifié le {new Date(list.updated_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la liste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-title">Nom de la liste</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="edit-public">Liste publique</Label>
                <p className="text-sm text-muted-foreground">Visible par tous</p>
              </div>
              <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <Button onClick={() => editingList && handleEdit(editingList)} className="w-full" disabled={!title.trim()}>
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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
      {loading
        ? Array.from({ length: 12 }).map((_, i) => <MovieCardSkeleton key={i} size="sm" />)
        : movies.map((movie) => <MovieCard key={movie.id} movie={movie} size="sm" />)}
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
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
      <h3 className="font-medium mb-1 md:text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground md:text-base">{description}</p>
    </div>
  );
}
