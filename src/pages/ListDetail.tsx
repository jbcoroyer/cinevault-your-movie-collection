import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { MovieCard, MovieCardSkeleton } from "@/components/MovieCard";
import { useUserLists, ListWithItems } from "@/hooks/useUserLists";
import { ArrowLeft, Globe, Lock, Trash2 } from "lucide-react";
import { getImageUrl } from "@/services/tmdb";

export default function ListDetail() {
  const { id: listId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getListWithItems, removeMovieFromList } = useUserLists();
  const [list, setList] = useState<ListWithItems | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      if (!listId) return;
      setLoading(true);
      const data = await getListWithItems(listId);
      setList(data);
      setLoading(false);
    };
    fetchList();
  }, [listId]);

  const handleRemoveMovie = async (tmdbId: number) => {
    if (!listId || !list) return;
    const success = await removeMovieFromList(listId, tmdbId);
    if (success) {
      setList({
        ...list,
        items: list.items.filter((item) => item.tmdb_id !== tmdbId),
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <div className="container mx-auto px-4 py-4">
          <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <MovieCardSkeleton key={i} size="lg" />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-8">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold mb-2">Liste introuvable</h2>
          <p className="text-muted-foreground mb-4">
            Cette liste n'existe pas ou vous n'y avez pas accès.
          </p>
          <Button onClick={() => navigate("/lists")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux listes
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <div className="container mx-auto px-4 py-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/lists")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Mes listes
        </Button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{list.title}</h1>
            {list.is_public ? (
              <Globe className="w-5 h-5 text-muted-foreground" />
            ) : (
              <Lock className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          {list.description && (
            <p className="text-muted-foreground">{list.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {list.items.length} film{list.items.length !== 1 ? "s" : ""}
          </p>
        </div>

        {list.items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              Cette liste est vide. Ajoutez des films depuis leurs pages de détails.
            </p>
            <Button asChild>
              <Link to="/search">Découvrir des films</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {list.items.map((item) => (
              <div key={item.id} className="relative group">
                <Link to={`/movie/${item.tmdb_id}`}>
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted">
                    {item.poster_path ? (
                      <img
                        src={getImageUrl(item.poster_path, "w300") || ""}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {item.title}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium line-clamp-2">{item.title}</p>
                </Link>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveMovie(item.tmdb_id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
