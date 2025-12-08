import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Disc, Save, ExternalLink, Info } from "lucide-react";
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
  const [format, setFormat] = useState<PhysicalFormat>("bluray");
  const [condition, setCondition] = useState<PhysicalCondition>("good");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize values when dialog opens
  useEffect(() => {
    if (physicalMovie && open) {
      setFormat(physicalMovie.format);
      setCondition(physicalMovie.condition || "good");
      setPrice(physicalMovie.price?.toString() || "");
      setPurchaseDate(physicalMovie.purchase_date?.split("T")[0] || "");
      setNotes(physicalMovie.notes || "");
    }
  }, [physicalMovie, open]);

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

  const posterUrl = movieDetails?.poster_path ? getImageUrl(movieDetails.poster_path, "w200") : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
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
  );
};
