import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ReviewCard } from "@/components/ReviewCard";
import { EditReviewDialog } from "@/components/EditReviewDialog";
import { Button } from "@/components/ui/button";
import { useReviews, Review } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Users, Globe, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedType = "following" | "global";

export default function Feed() {
  const { user } = useAuth();
  const { loading, fetchAllReviews, fetchFollowingReviews, updateReview, deleteReview } = useReviews();

  const [feedType, setFeedType] = useState<FeedType>("following");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const loadReviews = useCallback(async () => {
    let data: Review[] = [];

    if (feedType === "following" && user) {
      data = await fetchFollowingReviews();
    } else {
      data = await fetchAllReviews();
    }

    setReviews(data);
  }, [feedType, user, fetchAllReviews, fetchFollowingReviews]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditDialogOpen(true);
  };

  const handleEditSave = async (data: {
    rating?: number;
    content: string;
    contains_spoilers: boolean;
  }): Promise<boolean> => {
    if (!editingReview) return false;

    const success = await updateReview(editingReview.id, data);
    if (success) {
      // Mettre à jour la review dans la liste locale
      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id
            ? {
                ...r,
                rating: data.rating ?? null,
                content: data.content,
                contains_spoilers: data.contains_spoilers,
                updated_at: new Date().toISOString(),
              }
            : r,
        ),
      );
      setEditingReview(null);
    }
    return success;
  };

  const handleDelete = async (reviewId: string) => {
    const success = await deleteReview(reviewId);
    if (success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Header />

      <main className="container mx-auto px-4 py-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold font-serif">Avis</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Feed type tabs (Segmented Control) */}
        {user && (
          <div className="flex p-1 bg-muted/50 rounded-xl mb-6 relative">
            <button
              onClick={() => setFeedType("following")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                feedType === "following"
                  ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Users className="w-4 h-4" />
              Abonnements
            </button>
            <button
              onClick={() => setFeedType("global")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                feedType === "global"
                  ? "bg-background text-foreground shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Globe className="w-4 h-4" />
              Tous les avis
            </button>
          </div>
        )}

        {/* Reviews list */}
        {loading && reviews.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-medium mb-2">Aucun avis pour le moment</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              {feedType === "following"
                ? "Les avis des personnes que vous suivez apparaîtront ici. Suivez des utilisateurs ou consultez tous les avis."
                : "Soyez le premier à partager votre avis sur un film !"}
            </p>
            {feedType === "following" && (
              <Button variant="outline" className="mt-4" onClick={() => setFeedType("global")}>
                <Globe className="w-4 h-4 mr-2" />
                Voir tous les avis
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <div key={review.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <ReviewCard review={review} onEdit={handleEdit} onDelete={handleDelete} showMovie={true} />
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Edit dialog */}
      <EditReviewDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingReview(null);
        }}
        existingReview={editingReview}
        onSave={handleEditSave}
      />
    </div>
  );
}
