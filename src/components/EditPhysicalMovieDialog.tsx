/**
 * CineVault - EditPhysicalMovieDialog CORRIGÉ
 *
 * CORRECTIONS:
 * - Sélection de format (DVD/Blu-ray/4K/Steelbook/Collector) RÉTABLIE
 * - Interface améliorée avec boutons visuels pour les formats
 * - Bouton d'alerte de prix intégré
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Disc, Save, ExternalLink, Info, Bell, TrendingUp, DollarSign, Loader2 } from "lucide-react";
import { Movie, getImageUrl } from "@/services/tmdb";
import {
  PhysicalMovie,
  PhysicalFormat,
  PhysicalCondition,
  formatLabels,
  conditionLabels,
  updatePhysicalMovie,
} from "@/services/physicalMovies";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ConditionBadge } from "./collection/ConditionBadge";
import { PriceAlertDialog } from "./collection/PriceAlertDialog";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useAuth } from "@/contexts/AuthContext";
import { lookupPrice, formatPrice, PriceData } from "@/services/priceService";
import { cn } from "@/lib/utils";

// Format config with visual elements
const FORMAT_CONFIG: Record<PhysicalFormat, { label: string; color: string; icon: string }> = {
  dvd: { label: "DVD", color: "bg-slate-500 hover:bg-slate-600", icon: "📀" },
  bluray: { label: "Blu-ray", color: "bg-blue-600 hover:bg-blue-700", icon: "💿" },
  "4k": { label: "4K UHD", color: "bg-purple-600 hover:bg-purple-700", icon: "✨" },
  steelbook: { label: "Steelbook", color: "bg-amber-600 hover:bg-amber-700", icon: "🔩" },
  collector: { label: "Collector", color: "bg-red-600 hover:bg-red-700", icon: "👑" },
};

interface EditPhysicalMovieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  physicalMovie: PhysicalMovie | null;
  movieDetails: Movie | null;
  onMovieUpdated: () => void;
}

export const EditPhysicalMovieDialog: React.FC<EditPhysicalMovieDialogProps> = ({
  open,
  onOpenChange,
  physicalMovie,
  movieDetails,
  onMovieUpdated,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [format, setFormat] = useState<PhysicalFormat>("bluray");
  const [condition, setCondition] = useState<PhysicalCondition>("good");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Price alert states
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [marketPrice, setMarketPrice] = useState<PriceData | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Price alerts hook
  const { getAlertsForMovie, hasAlertForMovie } = usePriceAlerts();
  const movieAlerts = physicalMovie ? getAlertsForMovie(physicalMovie.tmdb_id, format) : [];
  const hasActiveAlert = physicalMovie ? hasAlertForMovie(physicalMovie.tmdb_id, format) : false;

  // Load movie data when dialog opens
  useEffect(() => {
    if (physicalMovie && open) {
      setFormat(physicalMovie.format);
      setCondition(physicalMovie.condition || "good");
      setPrice(physicalMovie.price?.toString() || "");
      setPurchaseDate(physicalMovie.purchase_date || "");
      setNotes(physicalMovie.notes || "");
      
      // Fetch market price
      fetchMarketPrice();
    }
  }, [physicalMovie, open]);

  const fetchMarketPrice = async () => {
    if (!movieDetails) return;
    
    setLoadingPrice(true);
    try {
      const priceData = await lookupPrice(
        movieDetails.title,
        physicalMovie?.format || "bluray"
      );
      setMarketPrice(priceData);
    } catch (error) {
      console.error("Error fetching market price:", error);
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleSave = async () => {
    if (!physicalMovie) return;

    setSaving(true);
    try {
      await updatePhysicalMovie(physicalMovie.id, {
        format,
        condition,
        price: price ? parseFloat(price) : null,
        purchase_date: purchaseDate || null,
        notes: notes || null,
      });

      toast({
        title: "Film mis à jour",
        description: "Les modifications ont été enregistrées.",
      });
      onMovieUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le film.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = () => {
    if (movieDetails) {
      navigate(`/movie/${movieDetails.id}`);
      onOpenChange(false);
    }
  };

  if (!physicalMovie || !movieDetails) return null;

  const posterUrl = movieDetails.poster_path ? getImageUrl(movieDetails.poster_path, "w185") : null;
  const releaseYear = movieDetails.release_date?.substring(0, 4);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-primary" />
              Modifier le film
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Movie Info Header */}
            <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={movieDetails.title}
                  className="w-20 h-30 object-cover rounded-lg shadow-md"
                />
              ) : (
                <div className="w-20 h-30 bg-muted rounded-lg flex items-center justify-center">
                  <Disc className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg line-clamp-2">{movieDetails.title}</h3>
                <p className="text-sm text-muted-foreground">{releaseYear}</p>
                
                {/* Market price */}
                {loadingPrice ? (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recherche du prix...
                  </div>
                ) : marketPrice ? (
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Valeur: {formatPrice(marketPrice.averagePrice)}
                    </Badge>
                  </div>
                ) : null}

                <Button
                  variant="link"
                  size="sm"
                  onClick={handleViewDetails}
                  className="px-0 mt-1"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Voir la fiche film
                </Button>
              </div>
            </div>

            {/* FORMAT SELECTION - RESTORED */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Format</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
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

            {/* Condition Selection */}
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

            {/* Price */}
            <div className="space-y-2">
              <Label>Prix d'achat</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-10 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  €
                </span>
              </div>
            </div>

            {/* Purchase Date */}
            <div className="space-y-2">
              <Label>Date d'achat</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Édition spéciale, état du boîtier, où acheté..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Price Alert Button */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Alerte de prix
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasActiveAlert 
                      ? `${movieAlerts.length} alerte${movieAlerts.length > 1 ? 's' : ''} active${movieAlerts.length > 1 ? 's' : ''}`
                      : "Soyez notifié des bonnes affaires"
                    }
                  </p>
                </div>
                <Button
                  variant={hasActiveAlert ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAlertDialogOpen(true)}
                  className={cn(hasActiveAlert && "bg-amber-500 hover:bg-amber-600")}
                >
                  <Bell className="w-4 h-4 mr-1" />
                  {hasActiveAlert ? "Gérer" : "Créer"}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price Alert Dialog */}
      {physicalMovie && movieDetails && (
        <PriceAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          tmdbId={physicalMovie.tmdb_id}
          movieTitle={movieDetails.title}
          format={format}
          currentMarketPrice={marketPrice?.averagePrice}
        />
      )}
    </>
  );
};

export default EditPhysicalMovieDialog;
