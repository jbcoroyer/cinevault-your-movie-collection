/**
 * CineVault - Feed Page Optimisé
 *
 * Phase 4: Nettoyage V1
 * - Skeletons de chargement
 * - Animations fluides
 * - Layout optimisé
 */

import { useState, useEffect, useCallback } from "react";
import { MinimalHeader } from "@/components/MinimalHeader";
import { FloatingDock } from "@/components/FloatingDock";
import { ReviewCard } from "@/components/ReviewCard";
import { EditReviewDialog } from "@/components/EditReviewDialog";
import { Button } from "@/components/ui/button";
import { useReviews, Review } from "@/hooks/useReviews";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Users, Globe, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LiveActivityFeed } from "@/components/home/LiveActivityFeed";

type FeedType = "following" | "global";

// ============================================
// Skeleton Components
// ============================================

const ReviewSkeleton = () => (
  <div className="animate-pulse p-4 rounded-xl bg-white/5 border border-white/10">
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-white/10 rounded w-1/4" />
        <div className="h-3 bg-white/10 rounded w-1/3" />
      </div>
      <div className="w-16 h-24 rounded-lg bg-white/10" />
    </div>
    <div className="mt-3 space-y-2">
      <div className="h-3 bg-white/10 rounded w-full" />
      <div className="h-3 bg-white/10 rounded w-3/4" />
    </div>
  </div>
);

// ============================================
// Empty State Component
// ============================================

const EmptyState = ({
  feedType,
  onSwitchFeed,
}: {
  feedType: FeedType;
  onSwitchFeed: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12"
  >
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
      <MessageSquare className="w-8 h-8 text-white/30" />
    </div>
    <h2 className="text-lg font-medium text-white mb-2">
      Aucun avis pour le moment
    </h2>
    <p className="text-white/50 text-sm max-w-sm mx-auto mb-6">
      {feedType === "following"
        ? "Les avis des personnes que vous suivez apparaîtront ici. Suivez des utilisateurs ou consultez tous les avis."
        : "Soyez le premier à partager votre avis sur un film !"}
    </p>
    {feedType === "following" && (
      <Button
        variant="outline"
        className="border-white/20 text-white hover:bg-white/10"
        onClick={onSwitchFeed}
      >
        <Globe className="w-4 h-4 mr-2" />
        Voir tous les avis
      </Button>
    )}
  </motion.div>
);

// ============================================
// Main Feed Component
// ============================================

export default function Feed() {
  const { user } = useAuth();
  const {
    loading,
    fetchAllReviews,
    fetchFollowingReviews,
    updateReview,
    deleteReview,
  } = useReviews();

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
            : r
        )
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
    <div className="min-h-screen bg-background pb-24 md:pb-32">
      <MinimalHeader />

      <main className="pt-20 md:pt-24">
        {/* Live Activity Ticker */}
        <LiveActivityFeed speed="normal" />

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Avis</h1>
                <p className="text-sm text-white/50">
                  Découvrez ce que pense la communauté
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="text-white/50 hover:text-white hover:bg-white/10"
            >
              <RefreshCw
                className={cn("w-5 h-5", refreshing && "animate-spin")}
              />
            </Button>
          </div>

          {/* Feed type tabs */}
          {user && (
            <div className="flex p-1 bg-white/5 rounded-xl mb-6">
              <button
                onClick={() => setFeedType("following")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  feedType === "following"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Users className="w-4 h-4" />
                Abonnements
              </button>
              <button
                onClick={() => setFeedType("global")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  feedType === "global"
                    ? "bg-white/10 text-white"
                    : "text-white/50 hover:text-white"
                )}
              >
                <Globe className="w-4 h-4" />
                Tous les avis
              </button>
            </div>
          )}

          {/* Reviews list */}
          {loading && reviews.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <ReviewSkeleton key={i} />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              feedType={feedType}
              onSwitchFeed={() => setFeedType("global")}
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ReviewCard
                    review={review}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showMovie={true}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <FloatingDock />

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
