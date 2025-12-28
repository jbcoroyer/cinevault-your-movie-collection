/**
 * CineVault - AddMovieSheet (UNIFIÉ)
 *
 * Bottom Sheet centralisé pour ajouter un film:
 * - À la collection physique (DVD, Blu-ray, etc.)
 * - À la wishlist d'achat
 * - Comme film vu (avec date, note, commentaire)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { 
  Search, X, Film, Loader2, ChevronUp, 
  Disc, Heart, Eye, Calendar, Star, MessageSquare,
  Check, ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/StarRating";
import { cn } from "@/lib/utils";
import { searchMovies, Movie, getImageUrl } from "@/services/tmdb";
import {
  addPhysicalMovie,
  PhysicalFormat,
  PhysicalCondition,
  formatLabels,
} from "@/services/physicalMovies";
import { addToWishlist } from "@/services/wishlistService";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMovies } from "@/hooks/useUserMovies";
import { updateChallengeProgress } from "@/services/gamificationService";

// Types d'ajout possibles
type AddMode = "collection" | "wishlist" | "watched";

// Format icons mapping
const FORMAT_CONFIG: Record<PhysicalFormat, { color: string; label: string }> = {
  dvd: { color: "bg-blue-500", label: "DVD" },
  bluray: { color: "bg-indigo-500", label: "Blu-ray" },
  "4k": { color: "bg-purple-500", label: "4K UHD" },
  steelbook: { color: "bg-amber-500", label: "Steelbook" },
  collector: { color: "bg-rose-500", label: "Collector" },
};

const ADD_MODES = [
  { 
    id: "collection" as AddMode, 
    label: "Collection", 
    description: "Ajouter à ma collection physique",
    icon: Disc,
    color: "from-amber-500 to-orange-500"
  },
  { 
    id: "wishlist" as AddMode, 
    label: "Wishlist", 
    description: "Ajouter à ma liste d'envies",
    icon: Heart,
    color: "from-pink-500 to-rose-500"
  },
  { 
    id: "watched" as AddMode, 
    label: "Film vu", 
    description: "Marquer comme visionné",
    icon: Eye,
    color: "from-emerald-500 to-teal-500"
  },
];

interface AddMovieSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieAdded: () => void;
  defaultFormat?: PhysicalFormat;
}

export const AddMovieSheet = ({ isOpen, onClose, onMovieAdded, defaultFormat = "bluray" }: AddMovieSheetProps) => {
  const { user } = useAuth();
  const { markAsWatchedWithDetails } = useUserMovies();
  const inputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Selection state
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedMode, setSelectedMode] = useState<AddMode | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Collection specific
  const [selectedFormat, setSelectedFormat] = useState<PhysicalFormat>(defaultFormat);
  const [selectedCondition, setSelectedCondition] = useState<PhysicalCondition>("good");

  // Watched specific
  const [watchedDate, setWatchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  // Sheet state
  const [sheetHeight, setSheetHeight] = useState<"compact" | "expanded">("compact");
  const dragY = useMotionValue(0);
  const sheetOpacity = useTransform(dragY, [0, 200], [1, 0.5]);

  // Step: "search" | "mode" | "details"
  const currentStep = !selectedMovie ? "search" : !selectedMode ? "mode" : "details";

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
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setQuery("");
    setSearchResults([]);
    setSelectedMovie(null);
    setSelectedMode(null);
    setSelectedFormat(defaultFormat);
    setSelectedCondition("good");
    setWatchedDate(new Date().toISOString().split('T')[0]);
    setRating(0);
    setReview("");
    setSheetHeight("compact");
  };

  const handleBack = () => {
    if (selectedMode) {
      setSelectedMode(null);
    } else if (selectedMovie) {
      setSelectedMovie(null);
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setSheetHeight("expanded");
  };

  const handleSelectMode = (mode: AddMode) => {
    setSelectedMode(mode);
  };

  const handleConfirm = async () => {
    if (!user || !selectedMovie || !selectedMode) return;

    setIsAdding(true);

    try {
      switch (selectedMode) {
        case "collection":
          await addPhysicalMovie(user.id, {
            tmdb_id: selectedMovie.id,
            format: selectedFormat,
            condition: selectedCondition,
          });
          await updateChallengeProgress(user.id, "add_movies");
          await updateChallengeProgress(user.id, "format_specific", selectedFormat);
          toast({
            title: "Ajouté à la collection !",
            description: (
              <div className="flex items-center gap-2">
                <span>{selectedMovie.title}</span>
                <Badge className={cn("text-xs text-white", FORMAT_CONFIG[selectedFormat].color)}>
                  {FORMAT_CONFIG[selectedFormat].label}
                </Badge>
              </div>
            ),
          });
          break;

        case "wishlist":
          await addToWishlist(user.id, {
            tmdb_id: selectedMovie.id,
            title: selectedMovie.title,
            poster_path: selectedMovie.poster_path,
            release_year: selectedMovie.release_date ? parseInt(selectedMovie.release_date.substring(0, 4)) : null,
          });
          toast({
            title: "Ajouté à la wishlist !",
            description: selectedMovie.title,
          });
          break;

        case "watched":
          await markAsWatchedWithDetails(selectedMovie.id, {
            watchedDate,
            rating: rating > 0 ? rating : undefined,
            review: review.trim() || undefined,
          });
          break;
      }

      onMovieAdded();
      onClose();
    } catch (error) {
      console.error("Error adding movie:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le film",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
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

  const renderSearchStep = () => (
    <>
      {/* Search Input */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Ajouter un film</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

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
              <motion.button
                key={movie.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectMovie(movie)}
                className="w-full flex items-center gap-3 p-2 rounded-xl border hover:bg-muted transition-all text-left"
              >
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
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{movie.title}</p>
                  <p className="text-sm text-muted-foreground">{movie.release_date?.substring(0, 4) || "—"}</p>
                </div>
                <ChevronUp className="w-5 h-5 text-muted-foreground rotate-90" />
              </motion.button>
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
    </>
  );

  const renderModeStep = () => (
    <>
      {/* Header with movie */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-muted">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            {selectedMovie?.poster_path && (
              <img 
                src={getImageUrl(selectedMovie.poster_path, "w92") || ""} 
                alt="" 
                className="w-10 h-14 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{selectedMovie?.title}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedMovie?.release_date?.substring(0, 4) || "—"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode selection */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-sm text-muted-foreground mb-4">Que souhaitez-vous faire ?</p>
        <div className="space-y-3">
          {ADD_MODES.map((mode, index) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelectMode(mode.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border hover:bg-muted transition-all text-left group"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br",
                mode.color
              )}>
                <mode.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{mode.label}</p>
                <p className="text-sm text-muted-foreground">{mode.description}</p>
              </div>
              <ChevronUp className="w-5 h-5 text-muted-foreground rotate-90 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ))}
        </div>
      </div>
    </>
  );

  const renderDetailsStep = () => (
    <>
      {/* Header */}
      <div className="px-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 rounded-full hover:bg-muted">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold">
              {selectedMode === "collection" && "Ajouter à la collection"}
              {selectedMode === "wishlist" && "Ajouter à la wishlist"}
              {selectedMode === "watched" && "Marquer comme vu"}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{selectedMovie?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Details form */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {selectedMode === "collection" && (
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-medium mb-3 block">Format</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FORMAT_CONFIG) as PhysicalFormat[]).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      selectedFormat === format 
                        ? "border-amber-500 bg-amber-500/10" 
                        : "hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", FORMAT_CONFIG[format].color)} />
                      <span className="font-medium">{FORMAT_CONFIG[format].label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">État</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["mint", "very_good", "good", "acceptable"] as PhysicalCondition[]).map((condition) => (
                  <button
                    key={condition}
                    onClick={() => setSelectedCondition(condition)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      selectedCondition === condition 
                        ? "border-amber-500 bg-amber-500/10" 
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="font-medium capitalize">
                      {condition === "mint" && "Neuf"}
                      {condition === "very_good" && "Très bon"}
                      {condition === "good" && "Bon état"}
                      {condition === "acceptable" && "Acceptable"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedMode === "wishlist" && (
          <div className="text-center py-8">
            <Heart className="w-16 h-16 mx-auto mb-4 text-pink-500" />
            <p className="text-muted-foreground">
              Ce film sera ajouté à votre liste d'envies.
            </p>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Vous pourrez configurer les alertes de prix plus tard.
            </p>
          </div>
        )}

        {selectedMode === "watched" && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                Date de visionnage
              </Label>
              <Input
                type="date"
                value={watchedDate}
                onChange={(e) => setWatchedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Star className="w-4 h-4" />
                Votre note
              </Label>
              <StarRating value={rating} onChange={setRating} />
              <p className="text-xs text-muted-foreground">
                {rating > 0 ? `${rating}/5` : 'Optionnel'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="w-4 h-4" />
                Votre avis
              </Label>
              <Textarea
                placeholder="Qu'avez-vous pensé de ce film ?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">Optionnel</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirm button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={handleConfirm}
          disabled={isAdding}
          className={cn(
            "w-full h-12 rounded-xl text-white font-semibold",
            "bg-gradient-to-r",
            selectedMode === "collection" && "from-amber-500 to-orange-500",
            selectedMode === "wishlist" && "from-pink-500 to-rose-500",
            selectedMode === "watched" && "from-emerald-500 to-teal-500",
          )}
        >
          {isAdding ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Confirmer
            </>
          )}
        </Button>
      </div>
    </>
  );

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
              height: sheetHeight === "expanded" || currentStep !== "search" ? "85vh" : "60vh",
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

            {/* Content based on step */}
            {currentStep === "search" && renderSearchStep()}
            {currentStep === "mode" && renderModeStep()}
            {currentStep === "details" && renderDetailsStep()}

            {/* Expand hint */}
            {currentStep === "search" && sheetHeight === "compact" && searchResults.length > 5 && (
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
