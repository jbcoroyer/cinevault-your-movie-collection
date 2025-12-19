import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { useUserLists } from "../hooks/useUserLists";
import { ArrowLeft, Plus, Calendar, Globe, Lock, Share2, Trash2, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { MovieCard } from "../components/MovieCard";
import { MovieSearchDialog } from "../components/MovieSearchDialog";
import { getMovieDetails, Movie, MovieDetails } from "../services/tmdb";
import { toast } from "../hooks/use-toast";
import { cn } from "../lib/utils";

import { ListItem } from "../hooks/useUserLists";

export default function ListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lists, getListWithItems, addMovieToList, removeMovieFromList, loading: listsLoading } = useUserLists();

  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [listMovies, setListMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Trouver la liste actuelle
  const currentList = lists.find((l) => l.id === id);

  // Charger les détails des films de la liste
  useEffect(() => {
    const fetchMovies = async () => {
      if (!id) return;

      setLoadingMovies(true);
      try {
        const listWithItems = await getListWithItems(id);
        if (!listWithItems || listWithItems.items.length === 0) {
          setListItems([]);
          setListMovies([]);
          setLoadingMovies(false);
          return;
        }

        setListItems(listWithItems.items);
        const moviePromises = listWithItems.items.map((m) => getMovieDetails(m.tmdb_id));
        const movies = await Promise.all(moviePromises);
        // Filtrer les films null en cas d'erreur
        setListMovies(movies.filter((m): m is MovieDetails => m !== null && m !== undefined));
      } catch (error) {
        console.error("Erreur lors du chargement des films:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les détails des films.",
        });
      } finally {
        setLoadingMovies(false);
      }
    };

    fetchMovies();
  }, [id]);

  const handleAddMovie = async (movie: Movie) => {
    if (!currentList) return;

    try {
      // Vérifier si le film est déjà dans la liste
      if (listItems.some((m) => m.tmdb_id === movie.id)) {
        toast({
          title: "Déjà ajouté",
          description: `${movie.title} est déjà dans cette liste.`,
        });
        return;
      }

      const success = await addMovieToList(currentList.id, {
        tmdb_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
      });

      if (success) {
        // Re-fetch to update local state
        const listWithItems = await getListWithItems(currentList.id);
        if (listWithItems) {
          setListItems(listWithItems.items);
          const moviePromises = listWithItems.items.map((m) => getMovieDetails(m.tmdb_id));
          const movies = await Promise.all(moviePromises);
          setListMovies(movies.filter((m): m is MovieDetails => m !== null && m !== undefined));
        }
        setIsSearchOpen(false);
      }
    } catch (error) {
      console.error("Erreur ajout film:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'ajouter le film à la liste.",
      });
    }
  };

  const handleRemoveMovie = async (tmdbId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentList) return;

    if (window.confirm("Retirer ce film de la liste ?")) {
      await removeMovieFromList(currentList.id, tmdbId);
      setListMovies((prev) => prev.filter((m) => m.id !== tmdbId));
      setListItems((prev) => prev.filter((m) => m.tmdb_id !== tmdbId));
    }
  };

  // Obtenir l'image de couverture (backdrop du premier film, ou poster si pas de backdrop)
  const getCoverImage = () => {
    if (listMovies.length === 0) return null;

    // Chercher un film avec un backdrop
    const movieWithBackdrop = listMovies.find((m) => m.backdrop_path);
    if (movieWithBackdrop?.backdrop_path) {
      return `https://image.tmdb.org/t/p/w1280${movieWithBackdrop.backdrop_path}`;
    }

    // Sinon utiliser le poster du premier film
    const firstMovieWithPoster = listMovies.find((m) => m.poster_path);
    if (firstMovieWithPoster?.poster_path) {
      return `https://image.tmdb.org/t/p/w780${firstMovieWithPoster.poster_path}`;
    }

    return null;
  };

  const coverImage = getCoverImage();

  if (listsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 pt-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!currentList) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto p-4 pt-20 text-center">
          <h2 className="text-xl font-bold mb-4">Liste introuvable</h2>
          <Button onClick={() => navigate("/lists")}>Retour aux listes</Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Hero Header de la Liste avec image de couverture */}
      <div className="relative w-full overflow-hidden">
        {/* Image de fond */}
        {coverImage ? (
          <>
            <div className="absolute inset-0">
              <img src={coverImage} alt="" className="w-full h-full object-cover object-center" />
            </div>
            {/* Overlay gradient pour le contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-background/60" />
          </>
        ) : (
          /* Fond par défaut si pas d'image */
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-background" />
        )}

        {/* Contenu du header */}
        <div className="relative z-10 py-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <Button
              variant="ghost"
              className={cn(
                "mb-6 pl-0 gap-2",
                coverImage
                  ? "hover:bg-white/10 hover:text-white text-white/90"
                  : "hover:bg-transparent hover:text-primary",
              )}
              onClick={() => navigate("/lists")}
            >
              <ArrowLeft className="w-5 h-5" />
              Retour aux listes
            </Button>

            <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full border",
                      coverImage
                        ? "bg-black/40 backdrop-blur-sm border-white/20 text-white/90"
                        : "bg-background/50 border-white/10 text-muted-foreground",
                    )}
                  >
                    {currentList.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{currentList.is_public ? "Publique" : "Privée"}</span>
                  </div>
                  <div
                    className={cn("flex items-center gap-1.5", coverImage ? "text-white/70" : "text-muted-foreground")}
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Créée le {new Date(currentList.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <h1
                  className={cn(
                    "text-4xl md:text-5xl font-display font-bold",
                    coverImage
                      ? "text-white drop-shadow-lg"
                      : "bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60",
                  )}
                >
                  {currentList.title}
                </h1>

                {currentList.description && (
                  <p
                    className={cn(
                      "text-lg leading-relaxed",
                      coverImage ? "text-white/80 drop-shadow" : "text-muted-foreground",
                    )}
                  >
                    {currentList.description}
                  </p>
                )}

                {/* Badge nombre de films */}
                <div className={cn("flex items-center gap-2", coverImage ? "text-white/70" : "text-muted-foreground")}>
                  <Layers className="w-4 h-4" />
                  <span>
                    {currentList.item_count || listMovies.length} film
                    {(currentList.item_count || listMovies.length) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <Button
                  size="lg"
                  className="rounded-full gap-2 shadow-lg shadow-primary/20 flex-1 md:flex-none bg-primary hover:bg-primary/90"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Plus className="w-5 h-5" />
                  Ajouter un film
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className={cn(
                    "rounded-full",
                    coverImage
                      ? "border-white/20 bg-black/30 backdrop-blur-sm hover:bg-white/20 text-white"
                      : "border-white/10 bg-background/50",
                  )}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu de la liste */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Films
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {listMovies.length}
            </span>
          </h2>
        </div>

        {loadingMovies ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : listMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {listMovies.map((movie) => (
              <div key={movie.id} className="relative group">
                <MovieCard movie={movie} />
                <button
                  onClick={(e) => handleRemoveMovie(movie.id, e)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm text-white/80 hover:text-white hover:bg-red-500/80 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
              <Layers className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Cette liste est vide</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Commencez à ajouter des films pour créer votre collection personnalisée.
            </p>
            <Button onClick={() => setIsSearchOpen(true)} className="rounded-full gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un premier film
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de recherche de films */}
      <MovieSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectMovie={handleAddMovie}
        excludeIds={listMovies.map((m) => m.id)}
      />

      <BottomNav />
    </div>
  );
}
