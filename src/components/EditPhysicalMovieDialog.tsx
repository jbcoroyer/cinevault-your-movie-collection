/**
 * CineVault - EditPhysicalMovieDialog (CORRIGÉ)
 *
 * CORRECTION: Ajout d'un bouton d'alerte de prix bien visible
 * avec intégration du PriceAlertDialog
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { AlertType } from "@/services/priceAlertsService";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useAuth } from "@/contexts/AuthContext";
import { lookupPrice, formatPrice, PriceData } from "@/services/priceService";
import { cn } from "@/lib/utils";

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

  // NOUVEAU: États pour les alertes de prix
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [marketPrice, setMarketPrice] = useState<PriceData | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // NOUVEAU: Hook pour les alertes
  const { createAlert, deleteAlert, updateAlert, getAlertsForMovie, hasAlertForMovie } = usePriceAlerts();

  // Alertes existantes pour ce film
  const movieAlerts = physicalMovie ? getAlertsForMovie(physicalMovie.tmdb_id, format) : [];
  const hasActiveAlert = physicalMovie ? hasAlertForMovie(physicalMovie.tmdb_id, format) : false;

  // Initialize values when dialog opens
  useEffect(() => {
    if (physicalMovie && open) {
      setFormat(physicalMovie.format);
      setCondition(physicalMovie.condition || "good");
      setPrice(physicalMovie.price?.toString() || "");
      setPurchaseDate(physicalMovie.purchase_date?.split("T")[0] || "");
      setNotes(physicalMovie.notes || "");

      // Charger le prix du marché
      loadMarketPrice(physicalMovie.tmdb_id, physicalMovie.format);
    }
  }, [physicalMovie, open]);

  // Recharger le prix si le format change
  useEffect(() => {
    if (physicalMovie && open && format) {
      loadMarketPrice(physicalMovie.tmdb_id, format);
    }
  }, [format]);

  const loadMarketPrice = async (tmdbId: number, movieFormat: string) => {
    if (!movieDetails) return;

    setLoadingPrice(true);
    try {
      const priceData = await lookupPrice(
        tmdbId,
        movieDetails.title,
        movieFormat,
        movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : undefined,
      );
      setMarketPrice(priceData);
    } catch (error) {
      console.error("Error loading market price:", error);
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

      toast({ title: "Modifications enregistrées !" });
      onMovieUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetails = () => {
    if (physicalMovie) {
      onOpenChange(false);
      navigate(`/movie/${physicalMovie.tmdb_id}`);
    }
  };

  // NOUVEAU: Handlers pour les alertes
  const handleCreateAlert = async (params: {
    alertType: AlertType;
    thresholdPrice?: number;
    thresholdPercent?: number;
  }) => {
    if (!physicalMovie || !movieDetails) return;

    await createAlert({
      tmdbId: physicalMovie.tmdb_id,
      format,
      alertType: params.alertType,
      thresholdPrice: params.thresholdPrice,
      thresholdPercent: params.thresholdPercent,
      movieTitle: movieDetails.title,
      posterPath: movieDetails.poster_path || undefined,
    });
  };

  const handleDeleteAlert = async (alertId: string) => {
    await deleteAlert(alertId);
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    await updateAlert(alertId, { isActive });
  };

  const posterUrl = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w200") : null;

  // Calcul de la plus-value
  const purchasePrice = price ? parseFloat(price) : null;
  const profitLoss = marketPrice && purchasePrice ? marketPrice.median / 100 - purchasePrice : null;
  const profitPercent = profitLoss && purchasePrice ? Math.round((profitLoss / purchasePrice) * 100) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5" />
              Modifier le film
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Movie preview */}
            {movieDetails && (
              <div className="flex gap-3 p-3 bg-card rounded-lg">
                {posterUrl ? (
                  <img src={posterUrl} alt={movieDetails.title} className="w-16 h-24 object-cover rounded" />
                ) : (
                  <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                    <Disc className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{movieDetails.title}</p>
                  <p className="text-sm text-muted-foreground">{movieDetails.release_date?.split("-")[0]}</p>
                  <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-primary" onClick={handleViewDetails}>
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Voir les détails du film
                  </Button>
                </div>
              </div>
            )}

            {/* ================================================ */}
            {/* NOUVEAU: Section Prix du Marché & Alertes */}
            {/* ================================================ */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/10 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Prix du Marché</span>
                </div>
                {loadingPrice ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : marketPrice ? (
                  <span className="text-lg font-bold text-primary">{formatPrice(marketPrice.median)}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Non disponible</span>
                )}
              </div>

              {/* Plus-value */}
              {marketPrice && purchasePrice && profitLoss !== null && (
                <div
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg",
                    profitLoss > 0 ? "bg-green-500/10" : profitLoss < 0 ? "bg-red-500/10" : "bg-muted/50",
                  )}
                >
                  <span className="text-xs text-muted-foreground">Plus-value estimée</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      className={cn(
                        "w-4 h-4",
                        profitLoss > 0
                          ? "text-green-500"
                          : profitLoss < 0
                            ? "text-red-500 rotate-180"
                            : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "font-semibold",
                        profitLoss > 0 ? "text-green-500" : profitLoss < 0 ? "text-red-500" : "",
                      )}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {profitLoss.toFixed(2)} € ({profitPercent}%)
                    </span>
                  </div>
                </div>
              )}

              {/* ================================================ */}
              {/* BOUTON D'ALERTE BIEN VISIBLE */}
              {/* ================================================ */}
              <Button
                variant={hasActiveAlert ? "secondary" : "default"}
                size="sm"
                className={cn(
                  "w-full gap-2",
                  hasActiveAlert
                    ? "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
                    : "bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90",
                )}
                onClick={() => setAlertDialogOpen(true)}
                disabled={!user}
              >
                <Bell className={cn("w-4 h-4", hasActiveAlert && "fill-current")} />
                {hasActiveAlert ? `Gérer mes alertes (${movieAlerts.length})` : "🔔 Créer une alerte de prix"}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">Connectez-vous pour créer des alertes</p>
              )}
            </div>

            {/* Format */}
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as PhysicalFormat)}>
                <SelectTrigger>
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
              <Label>État</Label>
              <Select value={condition} onValueChange={(v) => setCondition(v as PhysicalCondition)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(conditionLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <ConditionBadge condition={value as PhysicalCondition} size="sm" />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                L'état physique du boîtier et du disque
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Prix d'achat</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
            </div>

            {/* Purchase date */}
            <div className="space-y-2">
              <Label>Date d'achat</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Ex: Édition limitée, coffret spécial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NOUVEAU: Dialog d'alertes de prix */}
      {physicalMovie && movieDetails && (
        <PriceAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          movie={{
            tmdbId: physicalMovie.tmdb_id,
            title: movieDetails.title,
            format: format,
            posterPath: movieDetails.poster_path || undefined,
            currentPrice: marketPrice?.median,
          }}
          existingAlerts={movieAlerts}
          onCreateAlert={handleCreateAlert}
          onDeleteAlert={handleDeleteAlert}
          onToggleAlert={handleToggleAlert}
        />
      )}
    </>
  );
};
