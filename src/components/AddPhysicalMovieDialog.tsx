import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Disc, Info } from "lucide-react";
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

interface AddPhysicalMovieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovieAdded: () => void;
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
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  
  // Form fields
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
  } | null>(null);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("search");
      setQuery("");
      setSearchResults([]);
      setSelectedMovie(null);
      setFormat("bluray");
      setCondition("good");
      setPrice("");
      setPurchaseDate("");
      setNotes("");
    }
  }, [open]);

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

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setStep("details");
  };

  const handleSave = async () => {
    if (!user || !selectedMovie) return;

    setSaving(true);
    try {
      await addPhysicalMovie(user.id, {
        tmdb_id: selectedMovie.id,
        format,
        condition,
        price: price ? parseFloat(price) : null,
        purchase_date: purchaseDate || null,
        notes: notes || null,
      });

      // Calculate XP and rarity for loot box
      const xpGained = getXpForFormat(format);
      const rarity = calculateRarity(format);

      // Set loot box data and show animation
      setLootBoxData({
        movieTitle: selectedMovie.title,
        moviePoster: selectedMovie.poster_path || undefined,
        format: formatLabels[format],
        xpGained,
        rarity,
      });
      
      // Close dialog and show loot box
      onOpenChange(false);
      setShowLootBox(true);
      
      // Check for new badges
      await checkBadges();
    } catch (error: any) {
      setSaving(false);
      if (error.code === "23505") {
        toast({
          title: "Ce film existe déjà",
          description: `Vous possédez déjà ce film dans votre ${LORE_TERMINOLOGY.collection}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter le film",
          variant: "destructive",
        });
      }
    }
  };

  const handleLootBoxComplete = () => {
    setShowLootBox(false);
    setLootBoxData(null);
    setSaving(false);
    onMovieAdded();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-videoclub-surface border-videoclub-cyan/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Disc className="w-5 h-5 text-videoclub-cyan" />
              Ajouter à l'{LORE_TERMINOLOGY.collection}
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

              {/* Search results */}
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {searching ? (
                  <p className="text-center text-muted-foreground py-4 font-mono">Recherche...</p>
                ) : searchResults.length > 0 ? (
                  searchResults.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => handleSelectMovie(movie)}
                      className="w-full flex items-center gap-3 p-3 bg-background/50 hover:bg-videoclub-cyan/10 rounded-lg transition-colors text-left border border-transparent hover:border-videoclub-cyan/30"
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
                      <Plus className="w-5 h-5 text-videoclub-cyan" />
                    </button>
                  ))
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
              {/* Selected movie preview */}
              {selectedMovie && (
                <div className="flex gap-3 p-3 bg-background/50 rounded-lg border border-videoclub-cyan/20">
                  {selectedMovie.poster_path ? (
                    <img
                      src={getImageUrl(selectedMovie.poster_path, "w200")!}
                      alt={selectedMovie.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                      <Disc className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{selectedMovie.title}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {selectedMovie.release_date?.split("-")[0]}
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
                <Button variant="outline" onClick={() => setStep("search")} className="flex-1 border-videoclub-cyan/30">
                  Retour
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving} 
                  className="flex-1 bg-gradient-to-r from-videoclub-cyan to-videoclub-magenta hover:opacity-90"
                >
                  {saving ? "Ajout..." : "Ajouter"}
                </Button>
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
