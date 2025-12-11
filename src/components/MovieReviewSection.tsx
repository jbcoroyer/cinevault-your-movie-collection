import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "@/components/ReviewCard";
import { EditReviewDialog } from "@/components/EditReviewDialog";
import { useReviews, Review } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { useBadgeNotification } from "@/contexts/BadgeNotificationContext";
import { MessageSquare, PenLine, Loader2, ChevronRight } from "lucide-react";
import { getYear } from "@/services/tmdb";

interface MovieReviewSectionProps {
  movieId: number;
  movieTitle: string;
  moviePosterPath: string | null;
  movieReleaseDate: string;
}

export function MovieReviewSection({
  movieId,
  movieTitle,
  moviePosterPath,
  movieReleaseDate,
}: MovieReviewSectionProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMyReview, fetchMovieReviews, createReview, updateReview, deleteReview } = useReviews();
  const { checkBadges } = useBadgeNotification();

  const [myReview, setMyReview] = useState<Review | null>(null);
  const [otherReviews, setOtherReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const releaseYear = movieReleaseDate ? parseInt(getYear(movieReleaseDate)) : null;

  // Charger les avis
  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        // Charger mon avis
        if (user) {
          const mine = await getMyReview(movieId);
          setMyReview(mine);
        }

        // Charger les autres avis
        const allReviews = await fetchMovieReviews(movieId, 5);
        // Exclure mon propre avis de la liste des autres
        const others = user
          ? allReviews.filter((r) => r.user_id !== user.id)
          : allReviews;
        setOtherReviews(others);
      } catch (error) {
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [movieId, user]);

  const handleOpenDialog = (review?: Review) => {
    if (review) {
      setEditingReview(review);
    } else {
      setEditingReview(null);
    }
    setDialogOpen(true);
  };

  const handleSave = async (data: {
    rating?: number;
    content: string;
    contains_spoilers: boolean;
  }): Promise<boolean> => {
    if (editingReview) {
      // Modification
      const success = await updateReview(editingReview.id, data);
      if (success) {
        setMyReview((prev) =>
          prev
            ? {
                ...prev,
                rating: data.rating ?? null,
                content: data.content,
                contains_spoilers: data.contains_spoilers,
                updated_at: new Date().toISOString(),
              }
            : null
        );
      }
      return success;
    } else {
      // Création
      const newReview = await createReview({
        tmdb_id: movieId,
        movie_title: movieTitle,
        movie_poster_path: moviePosterPath,
        movie_release_year: releaseYear,
        rating: data.rating,
        content: data.content,
        contains_spoilers: data.contains_spoilers,
      });

      if (newReview) {
        setMyReview(newReview);
        // Rafraîchir les stats pour débloquer les badges
        checkBadges();
        return true;
      }
      return false;
    }
  };

  const handleDelete = async (reviewId: string) => {
    const success = await deleteReview(reviewId);
    if (success) {
      setMyReview(null);
    }
  };

  const handleEdit = (review: Review) => {
    handleOpenDialog(review);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mon avis */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Votre avis
        </h3>

        {!user ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground mb-3">
              Connectez-vous pour publier votre avis
            </p>
            <Button onClick={() => navigate("/auth")}>Se connecter</Button>
          </div>
        ) : myReview ? (
          <ReviewCard
            review={myReview}
            onEdit={handleEdit}
            onDelete={handleDelete}
            showMovie={false}
          />
        ) : (
          <Button
            variant="outline"
            onClick={() => handleOpenDialog()}
            className="w-full h-auto py-4 flex flex-col items-center gap-2"
          >
            <PenLine className="w-5 h-5" />
            <span>Publier votre avis</span>
            <span className="text-xs text-muted-foreground">
              Partagez votre opinion avec la communauté
            </span>
          </Button>
        )}
      </div>

      {/* Autres avis */}
      {otherReviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Avis de la communauté</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/feed")}
              className="text-muted-foreground"
            >
              Voir tout
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-4">
            {otherReviews.slice(0, 3).map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showMovie={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dialog de création/modification */}
      <EditReviewDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingReview(null);
        }}
        movie={{
          tmdb_id: movieId,
          title: movieTitle,
          poster_path: moviePosterPath,
          release_year: releaseYear,
        }}
        existingReview={editingReview}
        onSave={handleSave}
      />
    </div>
  );
}
