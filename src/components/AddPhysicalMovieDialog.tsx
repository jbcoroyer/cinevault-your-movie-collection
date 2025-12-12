import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Disc, Info, X, Package } from "lucide-react";
import { searchMovies, Movie, getImageUrl } from "@/services/tmdb";
import { 
  PhysicalFormat, 
  PhysicalCondition,
  formatLabels, 
  conditionLabels,
  addPhysicalMovie 
} from "@/services/physicalMovies";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { LootBoxReveal } from "@/components/gamification/LootBoxReveal";
import { getXpForFormat, calculateRarity } from "@/services/xpService";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { LORE_TERMINOLOGY } from "@/data/videoClubData";
import { Badge } from "@/components/ui/badge";

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
    // Check if already in queue
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
    
    let totalXp = 0;
    let successCount = 0;
    let highestRarity: "common" | "rare" | "epic" | "legendary" | "grail" = "common";
    const rarityOrder = ["common", "rare", "epic", "legendary", "grail"];
    
    // Get updated movies with current form values
    const moviesToSave = selectedMovies.map((m, i) => 
      i === currentMovieIndex 
        ? { ...m, format, condition, price, purchaseDate, notes }
        : m
    );

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

    if (successCount > 0) {
      const firstMovie = moviesToSave[0];
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
      setShowLootBox(true);
      
      // Attendre un peu avant de vérifier les badges pour laisser le temps à la DB
      setTimeout(async () => {
        console.log("[AddPhysicalMovieDialog] Checking badges after adding movies...");
        await checkBadges();
      }, 1000);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-videoclub-surface border-videoclub-cyan/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Disc className="w-5 h-5 text-videoclub-cyan" />
              Ajouter à l'{LORE_TERMINOLOGY.collection}
              {selectedMovies.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-videoclub-cyan/20 text-videoclub-cyan">
                  {selectedMovies.length} film{selectedMovies.length > 1 ? 's' : ''}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {step === "search" ? (
            <div className="space-y-4">
              {/* Search input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Rechercher un film..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-background/50 border-videoclub-cyan/20 focus:border-videoclub-cyan"
                />
                <Button onClick={handleSearch} disabled={searching} className="bg-videoclub-cyan hover:bg-videoclub-cyan/80 text-background">
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Selected movies queue */}
              {selectedMovies.length > 0 && (
                <div className="p-3 bg-videoclub-cyan/10 rounded-lg border border-videoclub-cyan/20">
                  <p className="text-sm font-mono text-videoclub-cyan mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Films à ajouter ({selectedMovies.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMovies.map((m) => (
                      <Badge 
                        key={m.movie.id} 
                        variant="outline" 
                        className="border-videoclub-cyan/30 bg-background/50 pr-1"
                      >
                        <span className="truncate max-w-[120px]">{m.movie.title}</span>
                        <button
                          onClick={() => handleRemoveFromQueue(m.movie.id)}
                          className="ml-1 p-0.5 hover:bg-videoclub-magenta/20 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    onClick={handleGoToDetails}
                    className="w-full mt-3 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta hover:opacity-90"
                  >
                    Configurer les {selectedMovies.length} film{selectedMovies.length > 1 ? 's' : ''}
                  </Button>
                </div>
              )}

              {/* Search results */}
              <div className="max-h-[350px] overflow-y-auto space-y-2">
                {searching ? (
                  <p className="text-center text-muted-foreground py-4 font-mono">Recherche...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((movie) => {
                    const isInQueue = selectedMovies.some(m => m.movie.id === movie.id);
                    return (
                      <button
                        key={movie.id}
                        onClick={() => handleAddToQueue(movie)}
                        disabled={isInQueue}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left border ${
                          isInQueue 
                            ? "bg-videoclub-cyan/10 border-videoclub-cyan/30 opacity-60"
                            : "bg-background/50 hover:bg-videoclub-cyan/10 border-transparent hover:border-videoclub-cyan/30"
                        }`}
                      >
                        {movie.poster_path ? (
                          <img
                            src={getImageUrl(movie.poster_path, "w200")!}
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
                          <p className="text-sm text-muted-foreground font-mono">
                            {movie.release_date?.split("-")[0] || "Date inconnue"}
                          </p>
                        </div>
                        {isInQueue ? (
                          <Badge variant="outline" className="border-videoclub-cyan text-videoclub-cyan">
                            Ajouté
                          </Badge>
                        ) : (
                          <Plus className="w-5 h-5 text-videoclub-cyan" />
                        )}
                      </button>
                    );
                  })
                ) : query ? (
                  <p className="text-center text-muted-foreground py-4 font-mono">Aucun résultat</p>
                ) : (
                  <p className="text-center text-muted-foreground py-4 font-mono">
                    Recherchez un film pour l'ajouter
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress indicator */}
              {selectedMovies.length > 1 && (
                <div className="flex items-center justify-center gap-2 mb-2">
                  {selectedMovies.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentMovieIndex 
                          ? "bg-videoclub-cyan" 
                          : i < currentMovieIndex 
                            ? "bg-videoclub-magenta" 
                            : "bg-muted"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-mono text-muted-foreground">
                    {currentMovieIndex + 1} / {selectedMovies.length}
                  </span>
                </div>
              )}

              {/* Current movie preview */}
              {currentMovie && (
                <div className="flex gap-3 p-3 bg-background/50 rounded-lg border border-videoclub-cyan/20">
                  {currentMovie.poster_path ? (
                    <img
                      src={getImageUrl(currentMovie.poster_path, "w200")!}
                      alt={currentMovie.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                      <Disc className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{currentMovie.title}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {currentMovie.release_date?.split("-")[0]}
                    </p>
                  </div>
                </div>
              )}

              {/* Format */}
              <div className="space-y-2">
                <Label>Format *</Label>
                <Select value={format} onValueChange={(v) => setFormat(v as PhysicalFormat)}>
                  <SelectTrigger className="bg-background/50 border-videoclub-cyan/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(formatLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>État *</Label>
                <Select value={condition} onValueChange={(v) => setCondition(v as PhysicalCondition)}>
                  <SelectTrigger className="bg-background/50 border-videoclub-cyan/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Info className="w-3 h-3" />
                  L'état physique du boîtier et du disque
                </p>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label>Prix d'achat (optionnel)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pr-8 bg-background/50 border-videoclub-cyan/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
              </div>

              {/* Purchase date */}
              <div className="space-y-2">
                <Label>Date d'achat (optionnel)</Label>
                <Input 
                  type="date" 
                  value={purchaseDate} 
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="bg-background/50 border-videoclub-cyan/20"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Textarea
                  placeholder="Ex: Édition limitée, coffret spécial, acheté chez..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="bg-background/50 border-videoclub-cyan/20"
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
                      className="border-videoclub-cyan/30"
                    >
                      Précédent
                    </Button>
                    {currentMovieIndex < selectedMovies.length - 1 ? (
                      <Button 
                        onClick={handleNextMovie}
                        className="flex-1 bg-videoclub-cyan hover:bg-videoclub-cyan/80 text-background"
                      >
                        Suivant
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleSaveAll} 
                        disabled={saving} 
                        className="flex-1 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta hover:opacity-90"
                      >
                        {saving ? "Ajout..." : `Ajouter ${selectedMovies.length} films`}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setStep("search")} className="flex-1 border-videoclub-cyan/30">
                      Retour
                    </Button>
                    <Button 
                      onClick={handleSaveAll} 
                      disabled={saving} 
                      className="flex-1 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta hover:opacity-90"
                    >
                      {saving ? "Ajout..." : "Ajouter"}
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
