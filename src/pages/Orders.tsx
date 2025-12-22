/**
 * CineVault - Orders Page
 * 
 * Historique des commandes avec:
 * - Vue acheteur (mes achats)
 * - Détails commande
 * - Suivi livraison
 * - Actions (confirmer réception, avis)
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Store,
  Star,
  ExternalLink,
  Copy,
  MessageCircle,
  ShoppingBag,
  Calendar,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getBuyerOrders,
  getOrder,
  confirmDelivery,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type OrderWithItems,
} from "@/services/orderService";
import { createReview } from "@/services/sellerService";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ============================================
// Order Card Component
// ============================================

interface OrderCardProps {
  order: OrderWithItems;
  onClick: () => void;
}

const OrderCard = ({ order, onClick }: OrderCardProps) => {
  const status = order.status as keyof typeof ORDER_STATUS_LABELS;
  const statusColor = ORDER_STATUS_COLORS[status];

  // Get first item poster
  const firstItem = order.items?.[0];
  const posterUrl = firstItem?.listing?.movie_poster_path
    ? `https://image.tmdb.org/t/p/w92${firstItem.listing.movie_poster_path}`
    : "/placeholder-movie.png";

  return (
    <GlassCard
      className="p-4 cursor-pointer hover:border-white/20 transition-colors"
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Image stack */}
        <div className="relative w-16 h-24 flex-shrink-0">
          <img
            src={posterUrl}
            alt="Order item"
            className="w-full h-full object-cover rounded"
          />
          {order.items && order.items.length > 1 && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
              +{order.items.length - 1}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold truncate">
                Commande {order.order_number}
              </p>
              <p className="text-xs text-muted-foreground">
                {order.created_at &&
                  formatDistanceToNow(new Date(order.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })}
              </p>
            </div>
            <Badge className={cn("text-xs whitespace-nowrap", statusColor)}>
              {ORDER_STATUS_LABELS[status]}
            </Badge>
          </div>

          {/* Items summary */}
          <div className="text-sm text-muted-foreground mb-2">
            {order.items?.map((item, i) => (
              <span key={item.id}>
                {item.movie_title}
                {i < (order.items?.length || 0) - 1 ? ", " : ""}
              </span>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between">
            <p className="font-bold text-amber-400">
              {((order.total_cents || 0) / 100).toFixed(2)} €
            </p>
            {order.status === "shipped" && (
              <div className="flex items-center gap-1 text-xs text-blue-400">
                <Truck className="w-3 h-3" />
                En cours de livraison
              </div>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================
// Order Detail Component
// ============================================

interface OrderDetailProps {
  order: OrderWithItems;
  onConfirmDelivery: () => void;
  onLeaveReview: (sellerId: string, orderItemId: string) => void;
}

const OrderDetail = ({ order, onConfirmDelivery, onLeaveReview }: OrderDetailProps) => {
  const status = order.status as keyof typeof ORDER_STATUS_LABELS;
  const statusColor = ORDER_STATUS_COLORS[status];

  // Timeline steps
  const steps = [
    {
      id: "paid",
      label: "Payée",
      icon: CreditCard,
      completed: ["paid", "processing", "shipped", "delivered", "completed"].includes(status),
      date: order.paid_at,
    },
    {
      id: "processing",
      label: "En préparation",
      icon: Package,
      completed: ["processing", "shipped", "delivered", "completed"].includes(status),
    },
    {
      id: "shipped",
      label: "Expédiée",
      icon: Truck,
      completed: ["shipped", "delivered", "completed"].includes(status),
      date: order.shipped_at,
    },
    {
      id: "delivered",
      label: "Livrée",
      icon: CheckCircle,
      completed: ["delivered", "completed"].includes(status),
      date: order.delivered_at,
    },
  ];

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number || "");
    toast({ title: "Numéro copié !" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{order.order_number}</h2>
              <button onClick={copyOrderNumber} className="text-muted-foreground hover:text-white">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Passée le{" "}
              {order.created_at &&
                new Date(order.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </p>
          </div>
          <Badge className={cn("text-sm", statusColor)}>
            {ORDER_STATUS_LABELS[status]}
          </Badge>
        </div>

        {/* Timeline */}
        {status !== "cancelled" && status !== "refunded" && (
          <div className="flex items-center justify-between py-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        step.completed
                          ? "bg-emerald-500 text-black"
                          : "bg-white/10 text-muted-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-1",
                        step.completed ? "text-white" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-16 h-0.5 mx-2",
                        step.completed && steps[i + 1].completed
                          ? "bg-emerald-500"
                          : "bg-white/10"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        {status === "shipped" && (
          <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm mb-3">
              Avez-vous reçu votre commande ?
            </p>
            <Button onClick={onConfirmDelivery} className="bg-emerald-500 hover:bg-emerald-600 text-black">
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmer la réception
            </Button>
          </div>
        )}

        {status === "completed" && (
          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm mb-3">
              Laissez un avis pour aider les autres acheteurs !
            </p>
            {order.items?.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => onLeaveReview(item.seller_id, item.id)}
                className="mr-2 mb-2"
              >
                <Star className="w-4 h-4 mr-2" />
                Évaluer {item.seller?.display_name}
              </Button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Items */}
      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Articles commandés
        </h3>

        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex gap-4">
              <img
                src={
                  item.listing?.movie_poster_path
                    ? `https://image.tmdb.org/t/p/w92${item.listing.movie_poster_path}`
                    : "/placeholder-movie.png"
                }
                alt={item.movie_title || ""}
                className="w-16 h-24 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-semibold">{item.movie_title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.format?.toUpperCase()} • {item.condition}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Store className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Vendu par {item.seller?.display_name}
                  </span>
                </div>

                {/* Tracking */}
                {item.tracking_number && (
                  <div className="mt-2 p-2 rounded bg-white/5 text-xs">
                    <p className="font-medium">Suivi: {item.tracking_number}</p>
                    {item.tracking_url && (
                      <a
                        href={item.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 flex items-center gap-1 mt-1"
                      >
                        Suivre le colis <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-400">
                  {(item.price_cents / 100).toFixed(2)} €
                </p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Shipping Address */}
      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Adresse de livraison
        </h3>
        <div className="text-sm space-y-1">
          <p className="font-medium">{order.shipping_name}</p>
          <p>{order.shipping_address_line1}</p>
          {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
          <p>
            {order.shipping_postal_code} {order.shipping_city}
          </p>
          <p>{order.shipping_country}</p>
          {order.relay_point_name && (
            <p className="text-amber-400 mt-2">
              Point Relais: {order.relay_point_name}
            </p>
          )}
        </div>
      </GlassCard>

      {/* Summary */}
      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4">Récapitulatif</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{((order.subtotal_cents || 0) / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span>{((order.shipping_cents || 0) / 100).toFixed(2)} €</span>
          </div>
          <Separator className="bg-white/10 my-2" />
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-amber-400">
              {((order.total_cents || 0) / 100).toFixed(2)} €
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Notes */}
      {order.buyer_notes && (
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Votre message
          </h3>
          <p className="text-sm text-muted-foreground">{order.buyer_notes}</p>
        </GlassCard>
      )}
    </div>
  );
};

// ============================================
// Review Dialog Component
// ============================================

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  orderId: string;
  orderItemId: string;
  sellerName: string;
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewDialog = ({
  open,
  onOpenChange,
  sellerName,
  onSubmit,
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Évaluer {sellerName}</DialogTitle>
          <DialogDescription>
            Partagez votre expérience avec ce vendeur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Rating */}
          <div>
            <Label>Note globale</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      star <= rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-white/20"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience..."
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              onSubmit(rating, comment);
              onOpenChange(false);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            Publier l'avis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// Main Orders Page
// ============================================

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId?: string }>();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    sellerId: string;
    orderId: string;
    orderItemId: string;
    sellerName: string;
  } | null>(null);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        navigate("/auth?redirect=/orders");
        return;
      }

      setLoading(true);
      try {
        if (orderId) {
          // Fetch single order
          const order = await getOrder(orderId, user.id);
          if (order) {
            setSelectedOrder(order);
          } else {
            toast({
              title: "Commande introuvable",
              variant: "destructive",
            });
            navigate("/orders");
          }
        } else {
          // Fetch all orders
          const data = await getBuyerOrders(user.id);
          setOrders(data);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, orderId, navigate]);

  // Handle confirm delivery
  const handleConfirmDelivery = async () => {
    if (!selectedOrder || !user) return;

    try {
      const result = await confirmDelivery(selectedOrder.id, user.id);
      if (result.success) {
        toast({
          title: "Réception confirmée !",
          description: "Merci de laisser un avis pour le vendeur.",
        });
        // Refresh order
        const updated = await getOrder(selectedOrder.id, user.id);
        if (updated) setSelectedOrder(updated);
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de confirmer la réception.",
        variant: "destructive",
      });
    }
  };

  // Handle leave review
  const handleLeaveReview = (sellerId: string, orderItemId: string) => {
    const item = selectedOrder?.items?.find((i) => i.id === orderItemId);
    setReviewDialog({
      open: true,
      sellerId,
      orderId: selectedOrder?.id || "",
      orderItemId,
      sellerName: item?.seller?.display_name || "Vendeur",
    });
  };

  // Submit review
  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!reviewDialog) return;

    try {
      const result = await createReview(
        reviewDialog.sellerId,
        reviewDialog.orderId,
        reviewDialog.orderItemId,
        { rating, comment: comment || undefined }
      );

      if (result.success) {
        toast({ title: "Avis publié !" });
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier l'avis.",
        variant: "destructive",
      });
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Order detail view
  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedOrder(null);
                navigate("/orders");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Mes commandes
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <OrderDetail
            order={selectedOrder}
            onConfirmDelivery={handleConfirmDelivery}
            onLeaveReview={handleLeaveReview}
          />
        </div>

        {reviewDialog && (
          <ReviewDialog
            open={reviewDialog.open}
            onOpenChange={(open) =>
              setReviewDialog(open ? reviewDialog : null)
            }
            sellerId={reviewDialog.sellerId}
            orderId={reviewDialog.orderId}
            orderItemId={reviewDialog.orderItemId}
            sellerName={reviewDialog.sellerName}
            onSubmit={handleSubmitReview}
          />
        )}
        <BottomNav />
      </div>
    );
  }

  // Orders list view
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5" />
            Mes commandes
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => navigate(`/orders/${order.id}`)}
              />
            ))}
          </div>
        ) : (
          <GlassCard className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Aucune commande</h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore passé de commande.
            </p>
            <Button
              onClick={() => navigate("/marketplace")}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Découvrir le marketplace
            </Button>
          </GlassCard>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
