/**
 * CineVault - Checkout Page
 * 
 * Page de paiement avec:
 * - Formulaire d'adresse
 * - Sélection méthode de livraison
 * - Point Relais Mondial Relay
 * - Paiement Stripe
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Package,
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle,
  Store,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCart, createCheckoutSession, type CartSummary } from "@/services/cartService";
import { toast } from "@/hooks/use-toast";

// ============================================
// Types
// ============================================

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

interface RelayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  distance: string;
}

type ShippingMethod = "colissimo" | "mondial_relay" | "hand_delivery";

// ============================================
// Address Form Component
// ============================================

interface AddressFormProps {
  address: ShippingAddress;
  onChange: (address: ShippingAddress) => void;
  errors: Record<string, string>;
}

const AddressForm = ({ address, onChange, errors }: AddressFormProps) => {
  const handleChange = (field: keyof ShippingAddress, value: string) => {
    onChange({ ...address, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Nom complet *</Label>
          <Input
            id="name"
            value={address.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className={cn(errors.name && "border-red-500")}
            placeholder="Jean Dupont"
          />
          {errors.name && (
            <p className="text-xs text-red-400 mt-1">{errors.name}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="line1">Adresse *</Label>
          <Input
            id="line1"
            value={address.line1}
            onChange={(e) => handleChange("line1", e.target.value)}
            className={cn(errors.line1 && "border-red-500")}
            placeholder="123 rue de la République"
          />
          {errors.line1 && (
            <p className="text-xs text-red-400 mt-1">{errors.line1}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="line2">Complément d'adresse</Label>
          <Input
            id="line2"
            value={address.line2}
            onChange={(e) => handleChange("line2", e.target.value)}
            placeholder="Appartement, étage, bâtiment..."
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Code postal *</Label>
          <Input
            id="postalCode"
            value={address.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            className={cn(errors.postalCode && "border-red-500")}
            placeholder="75001"
          />
          {errors.postalCode && (
            <p className="text-xs text-red-400 mt-1">{errors.postalCode}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city">Ville *</Label>
          <Input
            id="city"
            value={address.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className={cn(errors.city && "border-red-500")}
            placeholder="Paris"
          />
          {errors.city && (
            <p className="text-xs text-red-400 mt-1">{errors.city}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="country">Pays *</Label>
          <Select
            value={address.country}
            onValueChange={(value) => handleChange("country", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un pays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="BE">Belgique</SelectItem>
              <SelectItem value="CH">Suisse</SelectItem>
              <SelectItem value="LU">Luxembourg</SelectItem>
              <SelectItem value="DE">Allemagne</SelectItem>
              <SelectItem value="ES">Espagne</SelectItem>
              <SelectItem value="IT">Italie</SelectItem>
              <SelectItem value="NL">Pays-Bas</SelectItem>
              <SelectItem value="PT">Portugal</SelectItem>
              <SelectItem value="AT">Autriche</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            value={address.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pour le suivi de livraison
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Shipping Method Selector
// ============================================

interface ShippingMethodSelectorProps {
  method: ShippingMethod;
  onChange: (method: ShippingMethod) => void;
  domesticPrice: number;
  hasHandDelivery: boolean;
}

const ShippingMethodSelector = ({
  method,
  onChange,
  domesticPrice,
  hasHandDelivery,
}: ShippingMethodSelectorProps) => {
  const relayPrice = Math.max(domesticPrice - 100, 199); // 1€ moins cher

  return (
    <RadioGroup value={method} onValueChange={(v) => onChange(v as ShippingMethod)}>
      <div className="space-y-3">
        {/* Mondial Relay */}
        <label
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
            method === "mondial_relay"
              ? "border-amber-500 bg-amber-500/10"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <RadioGroupItem value="mondial_relay" />
          <MapPin className="w-5 h-5 text-amber-400" />
          <div className="flex-1">
            <p className="font-medium">Point Relais</p>
            <p className="text-sm text-muted-foreground">
              Mondial Relay - 3 à 5 jours
            </p>
          </div>
          <span className="font-semibold">
            {(relayPrice / 100).toFixed(2)} €
          </span>
        </label>

        {/* Colissimo */}
        <label
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
            method === "colissimo"
              ? "border-amber-500 bg-amber-500/10"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <RadioGroupItem value="colissimo" />
          <Package className="w-5 h-5 text-blue-400" />
          <div className="flex-1">
            <p className="font-medium">Colissimo</p>
            <p className="text-sm text-muted-foreground">
              Livraison à domicile - 2 à 3 jours
            </p>
          </div>
          <span className="font-semibold">
            {(domesticPrice / 100).toFixed(2)} €
          </span>
        </label>

        {/* Hand Delivery */}
        {hasHandDelivery && (
          <label
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
              method === "hand_delivery"
                ? "border-amber-500 bg-amber-500/10"
                : "border-white/10 hover:border-white/20"
            )}
          >
            <RadioGroupItem value="hand_delivery" />
            <Store className="w-5 h-5 text-emerald-400" />
            <div className="flex-1">
              <p className="font-medium">Remise en main propre</p>
              <p className="text-sm text-muted-foreground">
                À convenir avec le vendeur
              </p>
            </div>
            <span className="font-semibold text-emerald-400">Gratuit</span>
          </label>
        )}
      </div>
    </RadioGroup>
  );
};

// ============================================
// Relay Point Selector (Placeholder)
// ============================================

interface RelayPointSelectorProps {
  postalCode: string;
  selected: RelayPoint | null;
  onSelect: (point: RelayPoint) => void;
}

const RelayPointSelector = ({ postalCode, selected, onSelect }: RelayPointSelectorProps) => {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState<RelayPoint[]>([]);

  // Mock relay points for demo
  useEffect(() => {
    if (postalCode.length === 5) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setPoints([
          {
            id: "MR001",
            name: "Tabac Presse Le Central",
            address: "12 rue du Commerce",
            city: "Paris",
            postalCode: "75015",
            distance: "350m",
          },
          {
            id: "MR002",
            name: "Carrefour City",
            address: "45 avenue des Lilas",
            city: "Paris",
            postalCode: "75015",
            distance: "520m",
          },
          {
            id: "MR003",
            name: "Relay - Gare Montparnasse",
            address: "Place Raoul Dautry",
            city: "Paris",
            postalCode: "75015",
            distance: "1.2km",
          },
        ]);
        setLoading(false);
      }, 1000);
    }
  }, [postalCode]);

  if (postalCode.length < 5) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        Entrez votre code postal pour voir les points relais disponibles
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {points.map((point) => (
        <button
          key={point.id}
          onClick={() => onSelect(point)}
          className={cn(
            "w-full text-left p-3 rounded-lg border transition-all",
            selected?.id === point.id
              ? "border-amber-500 bg-amber-500/10"
              : "border-white/10 hover:border-white/20"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">{point.name}</p>
              <p className="text-xs text-muted-foreground">{point.address}</p>
              <p className="text-xs text-muted-foreground">
                {point.postalCode} {point.city}
              </p>
            </div>
            <span className="text-xs text-amber-400">{point.distance}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

// ============================================
// Order Summary Sidebar
// ============================================

interface CheckoutSummaryProps {
  cart: CartSummary;
  shippingMethod: ShippingMethod;
}

const CheckoutSummary = ({ cart, shippingMethod }: CheckoutSummaryProps) => {
  // Adjust shipping based on method
  let adjustedShipping = cart.shippingCents;
  if (shippingMethod === "mondial_relay") {
    adjustedShipping = Math.max(cart.shippingCents - 100, 199);
  } else if (shippingMethod === "hand_delivery") {
    adjustedShipping = 0;
  }

  const total = cart.subtotalCents + adjustedShipping;

  return (
    <GlassCard className="p-6 sticky top-24">
      <h3 className="font-semibold mb-4">Votre commande</h3>

      {/* Items preview */}
      <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
        {cart.items.map((item) => (
          <div key={item.listingId} className="flex gap-3">
            <img
              src={
                item.listing.movie_poster_path
                  ? `https://image.tmdb.org/t/p/w92${item.listing.movie_poster_path}`
                  : "/placeholder-movie.png"
              }
              alt={item.listing.movie_title}
              className="w-10 h-14 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {item.listing.movie_title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.listing.format?.toUpperCase()}
              </p>
            </div>
            <p className="text-sm font-medium">
              {(item.listing.price_cents / 100).toFixed(2)} €
            </p>
          </div>
        ))}
      </div>

      <Separator className="bg-white/10 my-4" />

      {/* Totals */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sous-total</span>
          <span>{(cart.subtotalCents / 100).toFixed(2)} €</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Livraison</span>
          <span>
            {shippingMethod === "hand_delivery"
              ? "Gratuit"
              : `${(adjustedShipping / 100).toFixed(2)} €`}
          </span>
        </div>
        <Separator className="bg-white/10 my-2" />
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-amber-400">
            {(total / 100).toFixed(2)} €
          </span>
        </div>
      </div>

      {/* Security badges */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-4 h-4" />
        <span>Paiement sécurisé SSL</span>
      </div>
    </GlassCard>
  );
};

// ============================================
// Main Checkout Page
// ============================================

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<"address" | "shipping" | "payment">("address");

  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "FR",
    phone: "",
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("colissimo");
  const [relayPoint, setRelayPoint] = useState<RelayPoint | null>(null);
  const [buyerNotes, setBuyerNotes] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/checkout");
    }
  }, [user, navigate]);

  // Fetch cart
  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await getCart(user.id);
        if (!data || data.items.length === 0) {
          navigate("/cart");
          return;
        }
        setCart(data);
      } catch (error) {
        console.error("Failed to fetch cart:", error);
        navigate("/cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [user, navigate]);

  // Validate address
  const validateAddress = (): boolean => {
    const errors: Record<string, string> = {};

    if (!address.name.trim()) errors.name = "Nom requis";
    if (!address.line1.trim()) errors.line1 = "Adresse requise";
    if (!address.postalCode.trim()) errors.postalCode = "Code postal requis";
    if (!address.city.trim()) errors.city = "Ville requise";

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle checkout
  const handlePayment = async () => {
    if (!cart) return;

    // Validate relay point if needed
    if (shippingMethod === "mondial_relay" && !relayPoint) {
      toast({
        title: "Point Relais requis",
        description: "Veuillez sélectionner un point relais.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const result = await createCheckoutSession({
        items: cart.items.map((item) => ({
          listingId: item.listingId,
          quantity: 1,
        })),
        shippingAddress: address,
        shippingMethod,
        relayPoint: relayPoint
          ? {
              id: relayPoint.id,
              name: relayPoint.name,
              address: `${relayPoint.address}, ${relayPoint.postalCode} ${relayPoint.city}`,
            }
          : undefined,
        buyerNotes,
      });

      if (result.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.sessionUrl;
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de créer la session de paiement.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    if (step === "address") {
      if (validateAddress()) {
        setStep("shipping");
      }
    } else if (step === "shipping") {
      if (shippingMethod === "mondial_relay" && !relayPoint) {
        toast({
          title: "Point Relais requis",
          description: "Veuillez sélectionner un point relais.",
          variant: "destructive",
        });
        return;
      }
      setStep("payment");
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  if (!cart) return null;

  // Check if any seller offers hand delivery
  const hasHandDelivery = cart.items.some(
    (item) => item.listing.accepts_hand_delivery
  );

  // Average shipping price
  const avgShippingPrice =
    cart.items.reduce(
      (sum, item) => sum + (item.listing.shipping_domestic_cents || 399),
      0
    ) / cart.items.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/cart")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Retour
            </Button>
            <h1 className="text-xl font-bold">Paiement</h1>
          </div>

          {/* Steps */}
          <div className="flex items-center gap-2 mt-4 text-sm">
            <span
              className={cn(
                "flex items-center gap-1",
                step === "address" ? "text-amber-400" : "text-muted-foreground"
              )}
            >
              {step !== "address" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-xs flex items-center justify-center">
                  1
                </span>
              )}
              Adresse
            </span>
            <div className="w-8 h-px bg-white/20" />
            <span
              className={cn(
                "flex items-center gap-1",
                step === "shipping"
                  ? "text-amber-400"
                  : step === "payment"
                  ? "text-muted-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step === "payment" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <span
                  className={cn(
                    "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                    step === "shipping"
                      ? "bg-amber-500 text-black"
                      : "bg-white/10"
                  )}
                >
                  2
                </span>
              )}
              Livraison
            </span>
            <div className="w-8 h-px bg-white/20" />
            <span
              className={cn(
                "flex items-center gap-1",
                step === "payment" ? "text-amber-400" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "w-5 h-5 rounded-full text-xs flex items-center justify-center",
                  step === "payment" ? "bg-amber-500 text-black" : "bg-white/10"
                )}
              >
                3
              </span>
              Paiement
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Address Step */}
            {step === "address" && (
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  Adresse de livraison
                </h2>
                <AddressForm
                  address={address}
                  onChange={setAddress}
                  errors={addressErrors}
                />
                <Button
                  className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={handleNext}
                >
                  Continuer
                </Button>
              </GlassCard>
            )}

            {/* Shipping Step */}
            {step === "shipping" && (
              <div className="space-y-6">
                <GlassCard className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-400" />
                    Mode de livraison
                  </h2>
                  <ShippingMethodSelector
                    method={shippingMethod}
                    onChange={setShippingMethod}
                    domesticPrice={avgShippingPrice}
                    hasHandDelivery={hasHandDelivery}
                  />
                </GlassCard>

                {/* Relay Point Selection */}
                {shippingMethod === "mondial_relay" && (
                  <GlassCard className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      Choisir un point relais
                    </h3>
                    <RelayPointSelector
                      postalCode={address.postalCode}
                      selected={relayPoint}
                      onSelect={setRelayPoint}
                    />
                  </GlassCard>
                )}

                {/* Notes */}
                <GlassCard className="p-6">
                  <Label htmlFor="notes">Message au vendeur (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="Instructions particulières..."
                    className="mt-2"
                  />
                </GlassCard>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("address")}>
                    Retour
                  </Button>
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                    onClick={handleNext}
                  >
                    Continuer vers le paiement
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {step === "payment" && (
              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-400" />
                  Paiement sécurisé
                </h2>

                <div className="space-y-4">
                  {/* Summary */}
                  <div className="p-4 rounded-lg bg-white/5 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Livraison à</span>
                      <span>
                        {address.name}, {address.city}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mode</span>
                      <span>
                        {shippingMethod === "mondial_relay"
                          ? `Point Relais: ${relayPoint?.name}`
                          : shippingMethod === "colissimo"
                          ? "Colissimo"
                          : "Remise en main propre"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-400">
                        Paiement 100% sécurisé
                      </p>
                      <p className="text-muted-foreground">
                        Vous allez être redirigé vers Stripe pour finaliser
                        votre paiement de manière sécurisée.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep("shipping")}
                      disabled={processing}
                    >
                      Retour
                    </Button>
                    <Button
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                      onClick={handlePayment}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer {(cart.totalCents / 100).toFixed(2)} €
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <CheckoutSummary cart={cart} shippingMethod={shippingMethod} />
          </div>
        </div>
      </div>
    </div>
  );
}
