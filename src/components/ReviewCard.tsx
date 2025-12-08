import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Star, MoreHorizontal, Edit2, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Review } from "@/hooks/useReviews";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  showMovie?: boolean;
}

export function ReviewCard({ review, onEdit, onDelete, showMovie = true }: ReviewCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSpoiler, setShowSpoiler] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isOwnReview = user?.id === review.user_id;

  const getInitials = () => {
    if (review.username) {
      return review.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleProfileClick = () => {
    navigate(`/profile/${review.user_id}`);
  };

  const handleMovieClick = () => {
    navigate(`/movie/${review.tmdb_id}`);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(review.id);
    }
    setDeleteDialogOpen(false);
  };

  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: fr,
  });

  const wasEdited = review.updated_at !== review.created_at;

  return (
    <>
      <article className="bg-card rounded-xl p-4 shadow-sm border border-border">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <button onClick={handleProfileClick} className="flex-shrink-0">
            <Avatar className="w-10 h-10 hover:ring-2 hover:ring-primary transition-all">
              <AvatarImage src={review.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </button>

          {/* User info & meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleProfileClick}
                className="font-semibold hover:underline truncate"
              >
                {review.username}
              </button>
              {review.rating && (
                <div className="flex items-center gap-0.5 text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3.5 h-3.5",
                        i < review.rating! ? "fill-current" : "fill-none opacity-30"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {timeAgo}
              {wasEdited && " • modifié"}
            </p>
          </div>

          {/* Actions */}
          {isOwnReview && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(review)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Movie info (optional) */}
        {showMovie && (
          <button
            onClick={handleMovieClick}
            className="flex items-center gap-3 mb-3 p-2 -mx-2 rounded-lg hover:bg-accent transition-colors w-full text-left"
          >
            {review.movie_poster_path ? (
              <img
                src={getImageUrl(review.movie_poster_path, "w92") || ""}
                alt={review.movie_title}
                className="w-12 h-18 rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-18 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-muted-foreground">?</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{review.movie_title}</p>
              {review.movie_release_year && (
                <p className="text-sm text-muted-foreground">{review.movie_release_year}</p>
              )}
            </div>
          </button>
        )}

        {/* Review content */}
        <div className="relative">
          {review.contains_spoilers && !showSpoiler ? (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm text-muted-foreground mb-2">
                Cet avis contient des spoilers
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSpoiler(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Afficher quand même
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{review.content}</p>
              {review.contains_spoilers && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSpoiler(false)}
                  className="mt-2 text-xs text-muted-foreground"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  Masquer les spoilers
                </Button>
              )}
            </>
          )}
        </div>
      </article>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet avis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Votre avis sur "{review.movie_title}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
