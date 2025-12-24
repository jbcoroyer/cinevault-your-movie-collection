/**
 * CineVault - AddPhysicalMovieDialog AMÉLIORÉ
 *
 * AMÉLIORATIONS:
 * - Choix entre Collection et Wishlist
 * - Sélection de format (DVD/Blu-ray/4K/Steelbook/Collector) RÉTABLIE
 * - Son au déblocage
 * - Animation du film qui vole vers l'étagère
 * - Appels updateChallengeProgress pour les défis hebdomadaires
 */

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Plus, Disc, Heart, X, Package, Library, Volume2 } from "lucide-react";
import { searchMovies, Movie, getImageUrl, getMovieDetails } from "@/services/tmdb";
import { 
  PhysicalFormat, 
  PhysicalCondition,
  formatLabels, 
  conditionLabels,
  addPhysicalMovie 
} from "@/services/physicalMovies";
import { addToWishlist } from "@/services/wishlistService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LootBoxReveal } from "@/components/gamification/LootBoxReveal";
import { getXpForFormat, calculateRarity } from "@/services/xpService";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { updateChallengeProgress } from "@/services/gamificationService";
import { LORE_TERMINOLOGY } from "@/data/videoClubData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Sound effect for successful add
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant "ding" sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6
    oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.2); // E6
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    // Audio not supported, fail silently
  }
};

interface AddPhysicalMovieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieAdded: () => void;
}

interface SelectedMovieWithDetails {
  movie: Movie;
  format: PhysicalFormat;
  condition: PhysicalCondition;
  price: string;
  purchaseDate: string;
  notes: string;
}

type AddTarget = "collection" | "wishlist";

// Format config with visual elements
const FORMAT_CONFIG: Record<PhysicalFormat, { label: string; color: string; icon: string }> = {
  dvd: { label: "DVD", color: "bg-slate-500 hover:bg-slate-600", icon: "📀" },
  bluray: { label: "Blu-ray", color: "bg-blue-600 hover:bg-blue-700", icon: "💿" },
  "4k": { label: "4K UHD", color: "bg-purple-600 hover:bg-purple-700", icon: "✨" },
  steelbook: { label: "Steelbook", color: "bg-amber-600 hover:bg-amber-700", icon: "🔩" },
  collector: { label: "Collector", color: "bg-red-600 hover:bg-red-700", icon: "👑" },
};

export const AddPhysicalMovieDialog: React.FC<AddPhysicalMovieDialogProps> = ({ 
  open, 
  onOpenChange, 
  onMovieAdded 
}) => {
  const { user } = useAuth();
  const { checkBadges } = useBadgeNotification();
  const [step, setStep] = useState<"search" | "details">("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Target selection
  const [addTarget, setAddTarget] = useState<AddTarget>("collection");
  
  // Multiple movies selection
  const [selectedMovies, setSelectedMovies] = useState<SelectedMovieWithDetails[]>([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  
  // Form fields for current movie
  const [format, setFormat] = useState<PhysicalFormat>("bluray");
  const [condition, setCondition] = useState<PhysicalCondition>("good");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Animation states
  const [flyingPoster, setFlyingPoster] = useState<string | null>(null);

  // Loot Box Animation state
  const [showLootBox, setShowLootBox] = useState(false);
  const [lootBoxData, setLootBoxData] = useState<{
    movieTitle: string;
    moviePoster?: string;
    format: string;
    xpGained: number;
    rarity: "common" | "rare" | "epic" | "legendary" | "grail";
    isMultiple?: boolean;
    totalCount?: number;
  } | null>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("search");
      setQuery("");
      setSearchResults([]);
      setSelectedMovies([]);
      setCurrentMovieIndex(0);
      setAddTarget("collection");
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormat("bluray");
    setCondition("good");
    setPrice("");
    setPurchaseDate("");
    setNotes("");
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const results = await searchMovies(query);
    setSearchResults(results);
    setSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleAddToQueue = (movie: Movie) => {
    if (selectedMovies.some(m => m.movie.id === movie.id)) {
      toast({
        title: "Film déjà ajouté",
        description: "Ce film est déjà dans votre liste d'ajout.",
        variant: "destructive",
      });
      return;
    }

    setSelectedMovies(prev => [...prev, {
      movie,
      format: "bluray",
      condition: "good",
      price: "",
      purchaseDate: "",
      notes: "",
    }]);
    
    toast({
      title: "Film ajouté à la liste",
      description: `${movie.title} ajouté. ${selectedMovies.length + 1} film(s) en attente.`,
    });
  };

  const handleRemoveFromQueue = (movieId: number) => {
    setSelectedMovies(prev => prev.filter(m => m.movie.id !== movieId));
  };

  const handleGoToDetails = () => {
    if (selectedMovies.length === 0) {
      toast({
        title: "Aucun film sélectionné",
        description: "Ajoutez au moins un film à la liste.",
        variant: "destructive",
      });
      return;
    }
    setCurrentMovieIndex(0);
    loadMovieDetails(0);
    setStep("details");
  };

  const loadMovieDetails = (index: number) => {
    const movieData = selectedMovies[index];
    if (movieData) {
      setFormat(movieData.format);
      setCondition(movieData.condition);
      setPrice(movieData.price);
      setPurchaseDate(movieData.purchaseDate);
      setNotes(movieData.notes);
    }
  };

  const saveCurrentMovieDetails = () => {
    setSelectedMovies(prev => prev.map((m, i) => 
      i === currentMovieIndex 
        ? { ...m, format, condition, price, purchaseDate, notes }
        : m
    ));
  };

  const handleNextMovie = () => {
    saveCurrentMovieDetails();
    const nextIndex = currentMovieIndex + 1;
    if (nextIndex < selectedMovies.length) {
      setCurrentMovieIndex(nextIndex);
      loadMovieDetails(nextIndex);
    }
  };

  const handlePreviousMovie = () => {
    saveCurrentMovieDetails();
    const prevIndex = currentMovieIndex - 1;
    if (prevIndex >= 0) {
      setCurrentMovieIndex(prevIndex);
      loadMovieDetails(prevIndex);
    }
  };

  const handleSaveAll = async () => {
    if (!user || selectedMovies.length === 0) return;

    setSaving(true);
    saveCurrentMovieDetails();
    
    const moviesToSave = selectedMovies.map((m, i) => 
      i === currentMovieIndex 
        ? { ...m, format, condition, price, purchaseDate, notes }
        : m
    );

    if (addTarget === "wishlist") {
      // Add to wishlist
      let successCount = 0;
      for (const movieData of moviesToSave) {
        try {
          await addToWishlist(user.id, {
            tmdb_id: movieData.movie.id,
            title: movieData.movie.title,
            poster_path: movieData.movie.poster_path,
            release_year: movieData.movie.release_date 
              ? parseInt(movieData.movie.release_date.substring(0, 4)) 
              : null,
            desired_formats: [movieData.format],
            priority: "medium",
          });
          successCount++;
        } catch (error: any) {
          if (error.code === "23505") {
            toast({
              title: "Déjà dans la wishlist",
              description: `${movieData.movie.title} est déjà dans votre wishlist.`,
              variant: "destructive",
            });
          }
        }
      }

      if (successCount > 0) {
        playSuccessSound();
        toast({
          title: `${successCount} film${successCount > 1 ? 's' : ''} ajouté${successCount > 1 ? 's' : ''} à la wishlist`,
          description: "Activez le tracking eBay pour recevoir des alertes !",
        });
        onOpenChange(false);
        onMovieAdded();
      }
      setSaving(false);
      return;
    }

    // Add to collection
    let totalXp = 0;
    let successCount = 0;
    let highestRarity: "common" | "rare" | "epic" | "legendary" | "grail" = "common";
    const rarityOrder = ["common", "rare", "epic", "legendary", "grail"];
    const formatsAdded: PhysicalFormat[] = [];
    const genresAdded: string[] = [];

    for (const movieData of moviesToSave) {
      try {
        await addPhysicalMovie(user.id, {
          tmdb_id: movieData.movie.id,
          format: movieData.format,
          condition: movieData.condition,
          price: movieData.price ? parseFloat(movieData.price) : null,
          purchase_date: movieData.purchaseDate || null,
          notes: movieData.notes || null,
        });

        const xp = getXpForFormat(movieData.format);
        totalXp += xp;
        successCount++;
        formatsAdded.push(movieData.format);

        // Get genres for challenge updates
        try {
          const details = await getMovieDetails(movieData.movie.id);
          if (details?.genres) {
            details.genres.forEach(g => {
              if (!genresAdded.includes(String(g.id))) {
                genresAdded.push(String(g.id));
              }
            });
          }
        } catch (e) {
          // Ignore genre fetch errors
        }

        const rarity = calculateRarity(movieData.format);
        if (rarityOrder.indexOf(rarity) > rarityOrder.indexOf(highestRarity)) {
          highestRarity = rarity;
        }
      } catch (error: any) {
        if (error.code === "23505") {
          toast({
            title: "Film déjà existant",
            description: `${movieData.movie.title} existe déjà dans votre ${LORE_TERMINOLOGY.collection}.`,
            variant: "destructive",
          });
        }
      }
    }

    // Update challenges
    if (successCount > 0) {
      console.log(`[AddPhysicalMovieDialog] Updating challenges for ${successCount} movies added`);
      
      for (let i = 0; i < successCount; i++) {
        await updateChallengeProgress(user.id, 'add_movies');
      }

      for (const fmt of formatsAdded) {
        await updateChallengeProgress(user.id, 'format_specific', fmt);
      }

      for (const genreId of genresAdded) {
        await updateChallengeProgress(user.id, 'genre_specific', genreId);
      }

      // Play success sound
      playSuccessSound();

      // Start flying animation
      const firstMovie = moviesToSave[0];
      if (firstMovie.movie.poster_path) {
        setFlyingPoster(getImageUrl(firstMovie.movie.poster_path, "w185"));
      }

      // Show loot box
      setLootBoxData({
        movieTitle: successCount > 1 
          ? `${successCount} films ajoutés !` 
          : firstMovie.movie.title,
        moviePoster: successCount === 1 ? firstMovie.movie.poster_path || undefined : undefined,
        format: successCount > 1 
          ? `Pack de ${successCount} films` 
          : formatLabels[firstMovie.format],
        xpGained: totalXp,
        rarity: highestRarity,
        isMultiple: successCount > 1,
        totalCount: successCount,
      });

      onOpenChange(false);
      
      // Delay loot box to allow flying animation
      setTimeout(() => {
        setFlyingPoster(null);
        setShowLootBox(true);
      }, 800);
      
      setTimeout(async () => {
        await checkBadges();
      }, 1500);
    } else {
      setSaving(false);
    }
  };

  const handleLootBoxComplete = () => {
    setShowLootBox(false);
    setLootBoxData(null);
    setSaving(false);
    onMovieAdded();
  };

  const currentMovie = selectedMovies[currentMovieIndex]?.movie;

  return (
    <>
      {/* Flying poster animation */}
      <AnimatePresence>
        {flyingPoster && (
          <motion.div
            initial={{ 
              position: "fixed",
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "-50%",
              scale: 1,
              opacity: 1,
              zIndex: 9999,
            }}
            animate={{ 
              top: "100%",
              left: "50%",
              scale: 0.3,
              opacity: 0,
              rotate: 15,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeIn" }}
            className="pointer-events-none"
          >
            <img
              src={flyingPoster}
              alt="Flying"
              className="w-32 h-48 object-cover rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-background border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Disc className="w-5 h-5 text-primary" />
              Ajouter un film
              {selectedMovies.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedMovies.length} film{selectedMovies.length > 1 ? 's' : ''}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {step === "search" ? (
            <div className="space-y-4">
              {/* Target selection */}
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setAddTarget("collection")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all",
                    addTarget === "collection"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Library className="w-4 h-4" />
                  Collection
                </button>
                <button
                  onClick={() => setAddTarget("wishlist")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition-all",
                    addTarget === "wishlist"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Heart className="w-4 h-4" />
                  Wishlist
                </button>
              </div>

              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un film..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? "..." : "Chercher"}
                </Button>
              </div>

              {/* Selected Movies Queue */}
              {selectedMovies.length > 0 && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Films sélectionnés
                    </span>
                    <Button 
                      size="sm" 
                      onClick={handleGoToDetails}
                      className="bg-primary hover:bg-primary/80"
                    >
                      Continuer →
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovies.map(m => (
                      <Badge 
                        key={m.movie.id} 
                        variant="secondary" 
                        className="flex items-center gap-1"
                      >
                        {m.movie.title.substring(0, 20)}{m.movie.title.length > 20 ? '...' : ''}
                        <button 
                          onClick={() => handleRemoveFromQueue(m.movie.id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {searchResults.map((movie) => {
                  const isSelected = selectedMovies.some(m => m.movie.id === movie.id);
                  return (
                    <div
                      key={movie.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border",
                        isSelected 
                          ? 'bg-primary/20 border-primary' 
                          : 'hover:bg-muted border-transparent'
                      )}
                      onClick={() => !isSelected && handleAddToQueue(movie)}
                    >
                      {movie.poster_path ? (
                        <img
                          src={getImageUrl(movie.poster_path, "w92")}
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-18 bg-muted rounded flex items-center justify-center">
                          <Disc className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{movie.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {movie.release_date?.substring(0, 4) || "N/A"}
                        </p>
                      </div>
                      {isSelected ? (
                        <Badge className="bg-primary">Ajouté</Badge>
                      ) : (
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Movie info header */}
              {currentMovie && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  {currentMovie.poster_path ? (
                    <img
                      src={getImageUrl(currentMovie.poster_path, "w92")}
                      alt={currentMovie.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                      <Disc className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{currentMovie.title}</p>
                    <p className="text-muted-foreground">
                      {currentMovie.release_date?.substring(0, 4)}
                    </p>
                    {selectedMovies.length > 1 && (
                      <Badge variant="outline" className="mt-1">
                        Film {currentMovieIndex + 1} / {selectedMovies.length}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* FORMAT SELECTION - RESTORED */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Format</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setFormat(key as PhysicalFormat)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all",
                        format === key
                          ? `${config.color} text-white border-transparent`
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span>{config.icon}</span>
                      <span className="font-medium">{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Selection (only for collection) */}
              {addTarget === "collection" && (
                <div className="space-y-2">
                  <Label>État</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v as PhysicalCondition)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(conditionLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price (only for collection) */}
              {addTarget === "collection" && (
                <div className="space-y-2">
                  <Label>Prix d'achat (optionnel)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
              )}

              {/* Purchase date (only for collection) */}
              {addTarget === "collection" && (
                <div className="space-y-2">
                  <Label>Date d'achat (optionnel)</Label>
                  <Input 
                    type="date" 
                    value={purchaseDate} 
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  placeholder="Ex: Édition limitée, coffret spécial, acheté chez..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {selectedMovies.length > 1 ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handlePreviousMovie} 
                      disabled={currentMovieIndex === 0}
                    >
                      Précédent
                    </Button>
                    {currentMovieIndex < selectedMovies.length - 1 ? (
                      <Button 
                        onClick={handleNextMovie}
                        className="flex-1"
                      >
                        Suivant
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleSaveAll} 
                        disabled={saving} 
                        className={cn(
                          "flex-1",
                          addTarget === "wishlist" 
                            ? "bg-red-500 hover:bg-red-600" 
                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                        )}
                      >
                        {saving ? "Ajout..." : `Ajouter ${selectedMovies.length} films`}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setStep("search")} className="flex-1">
                      Retour
                    </Button>
                    <Button 
                      onClick={handleSaveAll} 
                      disabled={saving} 
                      className={cn(
                        "flex-1",
                        addTarget === "wishlist" 
                          ? "bg-red-500 hover:bg-red-600" 
                          : "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
                      )}
                    >
                      {saving ? "Ajout..." : addTarget === "wishlist" ? "Ajouter à la wishlist" : "Ajouter"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Loot Box Animation */}
      {lootBoxData && (
        <LootBoxReveal
          isOpen={showLootBox}
          onComplete={handleLootBoxComplete}
          movieTitle={lootBoxData.movieTitle}
          moviePoster={lootBoxData.moviePoster}
          format={lootBoxData.format}
          xpGained={lootBoxData.xpGained}
          rarity={lootBoxData.rarity}
        />
      )}
    </>
  );
};
