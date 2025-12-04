import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StarRating } from '@/components/StarRating';
import { Calendar, Star, MessageSquare } from 'lucide-react';

interface WatchedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieTitle: string;
  initialDate?: string;
  initialRating?: number;
  initialReview?: string;
  onSave: (data: { watchedDate?: string; rating?: number; review?: string }) => void;
}

export const WatchedDialog: React.FC<WatchedDialogProps> = ({
  open,
  onOpenChange,
  movieTitle,
  initialDate,
  initialRating,
  initialReview,
  onSave,
}) => {
  const [watchedDate, setWatchedDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [rating, setRating] = useState(initialRating || 0);
  const [review, setReview] = useState(initialReview || '');

  const handleSave = () => {
    onSave({
      watchedDate: watchedDate || undefined,
      rating: rating > 0 ? rating : undefined,
      review: review.trim() || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Marquer comme vu</DialogTitle>
          <p className="text-sm text-muted-foreground">{movieTitle}</p>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Watch Date */}
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

          {/* Rating */}
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

          {/* Review */}
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

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};