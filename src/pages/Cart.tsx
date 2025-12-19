/**
 * CineVault - Cart Page
 * 
 * Page panier avec:
 * - Regroupement par vendeur
 * - Optimisation des frais de port
 * - Calcul des totaux
 */

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ShoppingCart,
  Trash2,
  Package,
  Store,
  Star,
  Truck,
  ChevronRight,
  AlertCircle,
  Info,
  Sparkles,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCart,
  removeFromCart,
  clearCart,
  getCartOptimization,
  type CartSummary,
  type CartItem,
  type SellerGroup,
} from "@/services/cartService";
import { toast } from "@/hooks/use-toast";

// ============================================
// Cart Item Component
// ============================================

interface CartItemRowProps {
  item: CartItem;
  onRemove: (id: string) => void;
  removing: boolean;
}

const CartItemRow = ({ item, onRemove, removing }: CartItemRowProps) => {
  const navigate = useNavigate();
  const { listing } = item;
  
  const posterUrl = listing.movie_poster_path
    ? `https://image.tmdb.org/t/p/w92${listing.movie_poster_path}`
    : "/placeholder-movie.png";

  const conditionLabels: Record<string, string> = {
    mint: "Neuf",
    near_mint: "Comme neuf",
    very_good: "Très bon",
    good: "Bon",
    acceptable: "Acceptable",
  };

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <div
        className="w-16 h-24 rounded overflow-hidden cursor-pointer flex-shrink-0"
        onClick={() => navigate(`/listing/${listing.id}`)}
      >
        <img
          src={posterUrl}
          alt={listing.movie_title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-semibold truncate cursor-pointer hover:text-amber-400 transition-colors"
          onClick={() => navigate(`/listing/${listing.id}`)}
        >
          {listing.movie_title}
        </h3>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {listing.format?.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {conditionLabels[listing.condition] || listing.condition}
          </Badge>
          {listing.is_sealed && (
            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Scellé
            </Badge>
          )}
        </div>
        {listing.edition && (
          <p className="text-xs text-muted-foreground mt-1">
            {listing.edition}
          </p>
        )}
      </div>

      {/* Price & Actions */}
      <div className="text-right flex flex-col items-end">
        <p className="font-bold text-amber-400">
          {(listing.price_cents / 100).toFixed(2)} €
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mt-2 -mr-2"
          onClick={() => onRemove(listing.id)}
          disabled={removing}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ============================================
// Seller Group Component
// ============================================

interface SellerGroupCardProps {
  group: SellerGroup;
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  removingId: string | null;
}

const SellerGroupCard = ({ group, items, onRemoveItem, removingId }: SellerGroupCardProps) => {
  const seller = items[0]?.listing.seller;

  return (
    <GlassCard className="overflow-hidden">
      {/* Seller Header */}
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center gap-3">
        <Store className="w-5 h-5 text-amber-400" />
        <div className="flex-1">
          <p className="font-semibold">{group.sellerName}</p>
          {seller && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {seller.average_rating && (
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {seller.average_rating.toFixed(1)}
                </span>
              )}
              {seller.location_city && (
                <span>{seller.location_city}</span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Sous-total</p>
          <p className="font-semibold text-amber-400">
            {(group.subtotalCents / 100).toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 divide-y divide-white/5">
        {items.map(item => (
          <CartItemRow
            key={item.listingId}
            item={item}
            onRemove={onRemoveItem}
            removing={removingId === item.listingId}
          />
        ))}
      </div>

      {/* Shipping */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Livraison</span>
          </div>
          <span className="font-medium">
            {(group.shippingCents / 100).toFixed(2)} €
          </span>
        </div>
        {items.length > 1 && (
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Frais de port groupés pour ce vendeur
          </p>
        )}
      </div>
    </GlassCard>
  );
};

// ============================================
// Order Summary Component
// ============================================

interface OrderSummaryProps {
  cart: CartSummary;
  onCheckout: () => void;
  loading: boolean;
}

const OrderSummary = ({ cart, onCheckout, loading }: OrderSummaryProps) => {
  const { user } = useAuth();

  return (
    <GlassCard className="p-6 sticky top-24">
      <h3 className="font-semibold text-lg mb-4">Résumé de la commande</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Sous-total ({cart.items.length} article{cart.items.length > 1 ? "s" : ""})
          </span>
          <span>{(cart.subtotalCents / 100).toFixed(2)} €</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Livraison</span>
          <span>{(cart.shippingCents / 100).toFixed(2)} €</span>
        </div>

        {cart.sellerGroups.length > 1 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" />
            Frais de port pour {cart.sellerGroups.length} vendeurs
          </p>
        )}

        <Separator className="bg-white/10" />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-amber-400">
            {(cart.totalCents / 100).toFixed(2)} €
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Commission CineVault incluse (5%)
        </p>
      </div>

      <Button
        className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
        size="lg"
        onClick={onCheckout}
        disabled={loading || cart.items.length === 0}
      >
        <CreditCard className="w-5 h-5 mr-2" />
        {user ? "Passer commande" : "Se connecter pour commander"}
      </Button>

      {/* Trust badges */}
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Paiement sécurisé par Stripe</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Protection acheteur 14 jours</span>
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================
// Main Cart Page
// ============================================

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Fetch cart
  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true);
      try {
        const data = await getCart(user?.id);
        setCart(data);
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user?.id]);

  // Handlers
  const handleRemoveItem = async (listingId: string) => {
    setRemovingId(listingId);
    try {
      await removeFromCart(listingId, user?.id);
      // Refresh cart
      const data = await getCart(user?.id);
      setCart(data);
      toast({ title: "Article retiré du panier" });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'article.",
        variant: "destructive",
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearCart = async () => {
    await clearCart(user?.id);
    setCart({
      items: [],
      subtotalCents: 0,
      shippingCents: 0,
      platformFeeCents: 0,
      totalCents: 0,
      sellerGroups: [],
    });
    toast({ title: "Panier vidé" });
  };

  const handleCheckout = () => {
    if (!user) {
      navigate("/auth?redirect=/cart");
      return;
    }
    navigate("/checkout");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-md">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Votre panier est vide</h2>
          <p className="text-muted-foreground mb-6">
            Parcourez notre marketplace pour trouver des films à ajouter.
          </p>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-black"
            onClick={() => navigate("/marketplace")}
          >
            Découvrir le marketplace
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Build items by seller
  const itemsBySeller = new Map<string, CartItem[]>();
  for (const item of cart.items) {
    const sellerId = item.listing.seller.id;
    if (!itemsBySeller.has(sellerId)) {
      itemsBySeller.set(sellerId, []);
    }
    itemsBySeller.get(sellerId)!.push(item);
  }

  const optimization = getCartOptimization(cart);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Mon panier
                <Badge variant="outline">{cart.items.length}</Badge>
              </h1>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Vider
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Vider le panier ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tous les articles seront retirés de votre panier.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearCart}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Vider le panier
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Optimization tip */}
        {optimization.suggestions.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">{optimization.suggestions[0]}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items by Seller */}
          <div className="lg:col-span-2 space-y-4">
            {cart.sellerGroups.map(group => (
              <SellerGroupCard
                key={group.sellerId}
                group={group}
                items={itemsBySeller.get(group.sellerId) || []}
                onRemoveItem={handleRemoveItem}
                removingId={removingId}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <OrderSummary
              cart={cart}
              onCheckout={handleCheckout}
              loading={checkoutLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
