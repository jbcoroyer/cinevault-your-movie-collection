import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { StarRating } from "@/components/StarRating";
import { Star, AlertTriangle, Loader2 } from "lucide-react";
import { Review } from "@/hooks/useReviews";
import { getImageUrl } from "@/services/tmdb";

interface MovieInfo {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_year: number | null;
}

interface EditReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie?: MovieInfo;
  existingReview?: Review | null;
  onSave: (data: {
    rating?: number;
    content: string;
    contains_spoilers: boolean;
  }) => Promise<boolean>;
}

export function EditReviewDialog({
  open,
  onOpenChange,
  movie,
  existingReview,
  onSave,
}: EditReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = !!existingReview;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (existingReview) {
        setRating(existingReview.rating || 0);
        setContent(existingReview.content);
        setContainsSpoilers(existingReview.contains_spoilers);
      } else {
        setRating(0);
        setContent("");
        setContainsSpoilers(false);
      }
    }
  }, [open, existingReview]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setSaving(true);
    const success = await onSave({
      rating: rating > 0 ? rating : undefined,
      content: content.trim(),
      contains_spoilers: containsSpoilers,
    });

    setSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  const movieTitle = existingReview?.movie_title || movie?.title || "";
  const posterPath = existingReview?.movie_poster_path || movie?.poster_path;
  const releaseYear = existingReview?.movie_release_year || movie?.release_year;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier votre avis" : "Publier un avis"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Movie info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            {posterPath ? (
              <img
                src={getImageUrl(posterPath, "w92") || ""}
                alt={movieTitle}
                className="w-12 h-18 rounded object-cover"
              />
            ) : (
              <div className="w-12 h-18 rounded bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">?</span>
              </div>
            )}
            <div>
              <p className="font-medium">{movieTitle}</p>
              {releaseYear && (
                <p className="text-sm text-muted-foreground">{releaseYear}</p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Star className="w-4 h-4" />
              Votre note
            </Label>
            <StarRating value={rating} onChange={setRating} />
            <p className="text-xs text-muted-foreground">
              {rating > 0 ? `${rating}/5` : "Optionnel"}
            </p>
          </div>

          {/* Review content */}
          <div className="space-y-2">
            <Label htmlFor="review-content" className="text-sm font-medium">
              Votre avis *
            </Label>
            <Textarea
              id="review-content"
              placeholder="Qu'avez-vous pensé de ce film ? Partagez votre expérience..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none"
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 10 caractères</span>
              <span>{content.length}/2000</span>
            </div>
          </div>

          {/* Spoilers toggle */}
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <div>
                <Label htmlFor="spoilers" className="text-sm font-medium">
                  Contient des spoilers
                </Label>
                <p className="text-xs text-muted-foreground">
                  Masque l'avis par défaut
                </p>
              </div>
            </div>
            <Switch
              id="spoilers"
              checked={containsSpoilers}
              onCheckedChange={setContainsSpoilers}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={saving || content.trim().length < 10}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? "Modification..." : "Publication..."}
              </>
            ) : isEditing ? (
              "Modifier"
            ) : (
              "Publier"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
