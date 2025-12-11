import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { Button } from "../components/ui/button";
import { useUserLists } from "../hooks/useUserLists";
import { ArrowLeft, Plus, Calendar, Globe, Lock, Share2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { MovieCard } from "../components/MovieCard";
import { MovieSearchDialog } from "../components/MovieSearchDialog";
import { getMovieDetails, Movie } from "../services/tmdb";
import { toast } from "../components/ui/use-toast";
import { cn } from "../lib/utils";
import { Layers } from "lucide-react";

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
        setListMovies(movies);
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
          setListMovies(movies);
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
    event.preventDefault(); // Empêcher la navigation si on clique sur le bouton supprimer
    event.stopPropagation();

    if (!currentList) return;

    if (window.confirm("Retirer ce film de la liste ?")) {
      await removeMovieFromList(currentList.id, tmdbId);
      setListMovies((prev) => prev.filter((m) => m.id !== tmdbId));
    }
  };

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

      {/* Hero Header de la Liste */}
      <div className="relative w-full bg-muted/20 border-b border-white/5 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="ghost"
            className="mb-6 pl-0 hover:bg-transparent hover:text-primary gap-2"
            onClick={() => navigate("/lists")}
          >
            <ArrowLeft className="w-5 h-5" />
            Retour aux listes
          </Button>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1 rounded-full border border-white/10">
                  {currentList.is_public ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  <span>{currentList.is_public ? "Publique" : "Privée"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>Créée le {new Date(currentList.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                {currentList.title}
              </h1>

              {currentList.description && (
                <p className="text-lg text-muted-foreground leading-relaxed">{currentList.description}</p>
              )}
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Button
                size="lg"
                className="rounded-full gap-2 shadow-lg shadow-primary/20 flex-1 md:flex-none"
                onClick={() => setIsSearchOpen(true)}
              >
                <Plus className="w-5 h-5" />
                Ajouter un film
              </Button>
              <Button size="icon" variant="outline" className="rounded-full border-white/10 bg-background/50">
                <Share2 className="w-5 h-5" />
              </Button>
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
              {currentList.item_count || 0}
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
              <div key={movie.id} className="group relative">
                <MovieCard movie={movie} />
                {/* Bouton de suppression rapide au survol */}
                <button
                  onClick={(e) => handleRemoveMovie(movie.id, e)}
                  className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-white border border-white/20 z-10"
                  title="Retirer de la liste"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Carte "Ajouter" à la fin de la grille */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="aspect-[2/3] rounded-xl border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
            >
              <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Ajouter</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-white/10">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Cette liste est vide</h3>
            <p className="text-muted-foreground mb-6">Commencez par ajouter quelques films à votre collection.</p>
            <Button onClick={() => setIsSearchOpen(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter le premier film
            </Button>
          </div>
        )}
      </div>

      {/* Dialog de recherche */}
      <MovieSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} onSelectMovie={handleAddMovie} />

      <BottomNav />
    </div>
  );
}
