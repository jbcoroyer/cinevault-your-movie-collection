import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUserLists } from "@/hooks/useUserLists";
import { Plus, ListVideo } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AddToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie: {
    tmdb_id: number;
    title: string;
    poster_path: string | null;
  };
}

export function AddToListDialog({ open, onOpenChange, movie }: AddToListDialogProps) {
  const { lists, loading, createList, addMovieToList, removeMovieFromList, getListsForMovie } = useUserLists();
  const [movieLists, setMovieLists] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    const fetchMovieLists = async () => {
      if (open) {
        setLoadingLists(true);
        const listsWithMovie = await getListsForMovie(movie.tmdb_id);
        setMovieLists(listsWithMovie);
        setLoadingLists(false);
      }
    };
    fetchMovieLists();
  }, [open, movie.tmdb_id]);

  const handleToggleList = async (listId: string, isInList: boolean) => {
    if (isInList) {
      const success = await removeMovieFromList(listId, movie.tmdb_id);
      if (success) {
        setMovieLists((prev) => prev.filter((id) => id !== listId));
      }
    } else {
      const success = await addMovieToList(listId, movie);
      if (success) {
        setMovieLists((prev) => [...prev, listId]);
      }
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    const newList = await createList(newListTitle.trim());
    if (newList) {
      await addMovieToList(newList.id, movie);
      setMovieLists((prev) => [...prev, newList.id]);
      setNewListTitle("");
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter à une liste</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {loading || loadingLists ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : lists.length === 0 && !isCreating ? (
            <div className="text-center py-6">
              <ListVideo className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm mb-4">
                Vous n'avez pas encore de liste
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une liste
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lists.map((list) => {
                  const isInList = movieLists.includes(list.id);
                  return (
                    <div
                      key={list.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleToggleList(list.id, isInList)}
                    >
                      <Checkbox checked={isInList} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{list.title}</p>
                        {list.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {list.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isCreating ? (
                <div className="flex gap-2">
                  <Input
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="Nom de la nouvelle liste"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                  />
                  <Button onClick={handleCreateList} disabled={!newListTitle.trim()}>
                    Créer
                  </Button>
                  <Button variant="ghost" onClick={() => setIsCreating(false)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle liste
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
