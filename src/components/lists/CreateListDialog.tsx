import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchMovies, Movie, getImageUrl } from "@/services/tmdb";
import { Search, Film, X, Plus, Globe, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateList: (
    title: string,
    description: string,
    isPublic: boolean,
    movies: Array<{ tmdb_id: number; title: string; poster_path: string | null }>
  ) => Promise<void>;
}

export function CreateListDialog({
  open,
  onOpenChange,
  onCreateList,
}: CreateListDialogProps) {
  const [step, setStep] = useState<"info" | "movies">("info");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setStep("info");
    setTitle("");
    setDescription("");
    setIsPublic(false);
    setSelectedMovies([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      setSearching(true);
      const results = await searchMovies(query);
      setSearchResults(results.filter(m => !selectedMovies.find(s => s.id === m.id)));
      setSearching(false);
    } else {
      setSearchResults([]);
    }
  };

  const addMovie = (movie: Movie) => {
    setSelectedMovies(prev => [...prev, movie]);
    setSearchResults(prev => prev.filter(m => m.id !== movie.id));
    setSearchQuery("");
  };

  const removeMovie = (movieId: number) => {
    setSelectedMovies(prev => prev.filter(m => m.id !== movieId));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await onCreateList(
        title.trim(),
        description.trim(),
        isPublic,
        selectedMovies.map(m => ({
          tmdb_id: m.id,
          title: m.title,
          poster_path: m.poster_path,
        }))
      );
      resetForm();
      onOpenChange(false);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg glass-elevated border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles className="w-5 h-5 text-primary" />
            {step === "info" ? "Nouvelle liste" : "Ajouter des films"}
          </DialogTitle>
        </DialogHeader>

        {step === "info" ? (
          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Nom de la liste
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Mes comfort movies"
                className="bg-background/50"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
                <span className="text-muted-foreground ml-1">(optionnel)</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre liste..."
                className="bg-background/50 resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-4 h-4 text-primary" />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <Label htmlFor="public" className="text-sm font-medium cursor-pointer">
                    Liste publique
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? "Visible par tous" : "Seulement vous"}
                  </p>
                </div>
              </div>
              <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => setStep("movies")}
                disabled={!title.trim()}
                className="flex-1"
              >
                Continuer
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Selected movies */}
            {selectedMovies.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Films sélectionnés ({selectedMovies.length})
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="group flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-primary/10 border border-primary/20"
                    >
                      {movie.poster_path ? (
                        <img
                          src={getImageUrl(movie.poster_path, "w92") || ""}
                          alt={movie.title}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <Film className="w-3 h-3" />
                        </div>
                      )}
                      <span className="text-xs font-medium max-w-[120px] truncate">
                        {movie.title}
                      </span>
                      <button
                        onClick={() => removeMovie(movie.id)}
                        className="p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rechercher des films</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un film..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>

            {/* Search results */}
            <ScrollArea className="h-[200px]">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => addMovie(movie)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    >
                      {movie.poster_path ? (
                        <img
                          src={getImageUrl(movie.poster_path, "w92") || ""}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                          <Film className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{movie.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {movie.release_date?.split("-")[0] || "N/A"}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim().length > 1 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Aucun résultat trouvé
                </p>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Film className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Recherchez des films à ajouter</p>
                  <p className="text-xs mt-1">ou créez la liste vide</p>
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("info")} className="flex-1">
                Retour
              </Button>
              <Button onClick={handleCreate} disabled={creating} className="flex-1">
                {creating ? "Création..." : `Créer${selectedMovies.length > 0 ? ` (${selectedMovies.length} films)` : ""}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
