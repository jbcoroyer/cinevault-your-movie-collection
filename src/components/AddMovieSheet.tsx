/**
 * CineVault - AddMovieSheet (CORRIGÉ)
 *
 * Bottom Sheet pour l'ajout de films (remplace Dialog sur mobile)
 * Avec Quick Add inline et animations fluides
 *
 * CORRECTION: Ajout des appels à updateChallengeProgress après l'ajout de films
 * pour que les défis hebdomadaires se mettent à jour correctement.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Search, X, Plus, Check, Disc, Film, Loader2, ChevronUp, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { searchMovies, Movie, getImageUrl } from "@/services/tmdb";
import {
  addPhysicalMovie,
  PhysicalFormat,
  PhysicalCondition,
  formatLabels,
  conditionLabels,
} from "@/services/physicalMovies";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
// ✅ CORRECTION: Import du service de gamification
import { updateChallengeProgress } from "@/services/gamificationService";

// Format icons mapping
const FORMAT_CONFIG: Record<PhysicalFormat, { color: string; label: string }> = {
  dvd: { color: "bg-blue-500", label: "DVD" },
  bluray: { color: "bg-indigo-500", label: "Blu-ray" },
  "4k": { color: "bg-purple-500", label: "4K UHD" },
  steelbook: { color: "bg-amber-500", label: "Steelbook" },
  collector: { color: "bg-rose-500", label: "Collector" },
};

interface AddMovieSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieAdded: () => void;
  defaultFormat?: PhysicalFormat;
}

interface SelectedMovie {
  movie: Movie;
  format: PhysicalFormat;
  condition: PhysicalCondition;
}

export const AddMovieSheet = ({ isOpen, onClose, onMovieAdded, defaultFormat = "bluray" }: AddMovieSheetProps) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Selection state
  const [selectedMovies, setSelectedMovies] = useState<SelectedMovie[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Sheet state
  const [sheetHeight, setSheetHeight] = useState<"compact" | "expanded">("compact");
  const dragY = useMotionValue(0);
  const sheetOpacity = useTransform(dragY, [0, 200], [1, 0.5]);

  // Auto-search on query change
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      const results = await searchMovies(debouncedQuery);
      setSearchResults(results.slice(0, 10));
      setIsSearching(false);
    };

    search();
  }, [debouncedQuery]);

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      // Reset state on close
      setQuery("");
      setSearchResults([]);
      setSelectedMovies([]);
      setSheetHeight("compact");
    }
  }, [isOpen]);

  // Quick add - ajoute directement avec le format par défaut
  const handleQuickAdd = useCallback(
    async (movie: Movie) => {
      if (!user) return;

      try {
        await addPhysicalMovie(user.id, {
          tmdb_id: movie.id,
          format: defaultFormat,
          condition: "good",
        });

        // ✅ CORRECTION: Mettre à jour les défis hebdomadaires
        console.log("[AddMovieSheet] Updating challenge progress for quick add");
        await updateChallengeProgress(user.id, "add_movies");
        await updateChallengeProgress(user.id, "format_specific", defaultFormat);

        toast({
          title: "Film ajouté !",
          description: (
            <div className="flex items-center gap-2">
              <span>{movie.title}</span>
              <Badge className={cn("text-xs", FORMAT_CONFIG[defaultFormat].color)}>
                {FORMAT_CONFIG[defaultFormat].label}
              </Badge>
            </div>
          ),
        });

        // Remove from results
        setSearchResults((prev) => prev.filter((m) => m.id !== movie.id));
        onMovieAdded();
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter le film",
          variant: "destructive",
        });
      }
    },
    [user, defaultFormat, onMovieAdded],
  );

  // Add to queue for batch add
  const handleAddToQueue = useCallback(
    (movie: Movie) => {
      if (selectedMovies.some((m) => m.movie.id === movie.id)) {
        // Remove from queue
        setSelectedMovies((prev) => prev.filter((m) => m.movie.id !== movie.id));
      } else {
        // Add to queue
        setSelectedMovies((prev) => [
          ...prev,
          {
            movie,
            format: defaultFormat,
            condition: "good" as PhysicalCondition,
          },
        ]);
      }
    },
    [selectedMovies, defaultFormat],
  );

  // Add all selected movies
  const handleAddAll = async () => {
    if (!user || selectedMovies.length === 0) return;

    setIsAdding(true);
    let successCount = 0;
    const formatsAdded: PhysicalFormat[] = [];

    for (const item of selectedMovies) {
      try {
        await addPhysicalMovie(user.id, {
          tmdb_id: item.movie.id,
          format: item.format,
          condition: item.condition,
        });
        successCount++;
        formatsAdded.push(item.format);
      } catch (error) {
        console.error("Error adding movie:", error);
      }
    }

    // ✅ CORRECTION: Mettre à jour les défis hebdomadaires pour tous les films ajoutés
    if (successCount > 0) {
      console.log(`[AddMovieSheet] Updating challenge progress for ${successCount} movies`);

      // Mettre à jour le défi "add_movies" pour chaque film ajouté
      for (let i = 0; i < successCount; i++) {
        await updateChallengeProgress(user.id, "add_movies");
      }

      // Mettre à jour les défis format-spécifiques
      for (const fmt of formatsAdded) {
        await updateChallengeProgress(user.id, "format_specific", fmt);
      }

      toast({
        title: `${successCount} film${successCount > 1 ? "s" : ""} ajouté${successCount > 1 ? "s" : ""} !`,
        description: "Votre collection a été mise à jour",
      });
      onMovieAdded();
      onClose();
    }

    setIsAdding(false);
  };

  // Handle drag to close
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose();
    } else if (info.offset.y < -50) {
      setSheetHeight("expanded");
    } else {
      dragY.set(0);
    }
  };

  const isInQueue = (movieId: number) => selectedMovies.some((m) => m.movie.id === movieId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{
              y: 0,
              height: sheetHeight === "expanded" ? "85vh" : "60vh",
            }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ y: dragY, opacity: sheetOpacity }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-background rounded-t-3xl",
              "shadow-2xl border-t border-border",
              "flex flex-col",
            )}
          >
            {/* Drag Handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="px-4 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Ajouter un film</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Rechercher un film..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl bg-muted border-0"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-background"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Selected count badge */}
              {selectedMovies.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">
                    {selectedMovies.length} sélectionné{selectedMovies.length > 1 ? "s" : ""}
                  </Badge>
                  <button
                    onClick={() => setSelectedMovies([])}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Effacer
                  </button>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((movie, index) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-xl border transition-all",
                        isInQueue(movie.id) ? "bg-amber-500/10 border-amber-500/30" : "hover:bg-muted",
                      )}
                    >
                      {/* Poster */}
                      <div className="relative w-12 h-18 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {movie.poster_path ? (
                          <img
                            src={getImageUrl(movie.poster_path, "w92") || ""}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}

                        {/* Selection indicator */}
                        {isInQueue(movie.id) && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{movie.title}</p>
                        <p className="text-sm text-muted-foreground">{movie.release_date?.substring(0, 4) || "—"}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {/* Quick Add Button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleQuickAdd(movie)}
                          className={cn(
                            "p-2 rounded-full",
                            "bg-amber-500 text-white",
                            "hover:bg-amber-600",
                            "transition-colors",
                          )}
                        >
                          <Sparkles className="w-4 h-4" />
                        </motion.button>

                        {/* Add to Queue Button */}
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleAddToQueue(movie)}
                          className={cn(
                            "p-2 rounded-full border",
                            isInQueue(movie.id)
                              ? "bg-amber-500/20 border-amber-500 text-amber-500"
                              : "border-muted-foreground/30 text-muted-foreground hover:border-amber-500 hover:text-amber-500",
                          )}
                        >
                          {isInQueue(movie.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : query.length >= 2 ? (
                <div className="text-center py-8">
                  <Film className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Aucun résultat</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Recherchez un film pour l'ajouter</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Tapez au moins 2 caractères</p>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {selectedMovies.length > 0 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border"
              >
                <Button
                  onClick={handleAddAll}
                  disabled={isAdding}
                  className={cn(
                    "w-full h-12 rounded-xl",
                    "bg-gradient-to-r from-amber-500 to-orange-500",
                    "hover:from-amber-600 hover:to-orange-600",
                    "text-white font-semibold",
                  )}
                >
                  {isAdding ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Ajouter {selectedMovies.length} film{selectedMovies.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Expand hint */}
            {sheetHeight === "compact" && searchResults.length > 5 && (
              <div className="text-center py-2">
                <button
                  onClick={() => setSheetHeight("expanded")}
                  className="text-xs text-muted-foreground flex items-center gap-1 mx-auto"
                >
                  <ChevronUp className="w-4 h-4" />
                  Glissez vers le haut pour voir plus
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddMovieSheet;
