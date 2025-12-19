/**
 * CineVault - Sell Page (Seller Dashboard)
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Store, Package, TrendingUp, Star, Truck, Clock, CheckCircle, AlertCircle,
  ExternalLink, CreditCard, Settings, BarChart3, Euro, ShoppingBag, ArrowRight,
  Sparkles, RefreshCw, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCurrentSellerProfile, createSellerProfile, startStripeOnboarding,
  getStripeOnboardingStatus, getStripeDashboardLink, refreshOnboardingLink,
  getSellerDetailedStats, type SellerOnboardingStatus,
} from "@/services/sellerService";
import { getSellerListings, type ListingWithSeller } from "@/services/listingService";
import { getSellerOrders, type SellerOrderItem, ITEM_STATUS_LABELS } from "@/services/orderService";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type SellerProfile = Database["public"]["Tables"]["seller_profiles"]["Row"];

// Onboarding Card
const OnboardingCard = ({ status, onStart, onRefresh, onDashboard, loading }: {
  status: SellerOnboardingStatus; onStart: () => void; onRefresh: () => void; onDashboard: () => void; loading: boolean;
}) => {
  const getProgress = () => {
    const map: Record<string, number> = { not_started: 0, incomplete: 33, pending_verification: 66, complete: 100 };
    return map[status.status] || 0;
  };
  const info = {
    not_started: { title: "Commencez à vendre sur CineVault", description: "Créez votre profil vendeur.", icon: Store, color: "text-amber-400", action: "Devenir vendeur" },
    incomplete: { title: "Finalisez votre inscription", description: "Votre compte Stripe n'est pas complet.", icon: AlertCircle, color: "text-yellow-400", action: "Continuer" },
    pending_verification: { title: "Vérification en cours", description: "Stripe vérifie vos informations.", icon: Clock, color: "text-blue-400", action: "Vérifier le statut" },
    complete: { title: "Compte vendeur actif !", description: "Vous pouvez maintenant vendre.", icon: CheckCircle, color: "text-emerald-400", action: "Dashboard Stripe" },
  }[status.status] || { title: "Erreur", description: "", icon: AlertCircle, color: "text-red-400", action: "Réessayer" };
  const Icon = info.icon;

  return (
    <GlassCard className="p-6">
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl bg-white/5", info.color)}><Icon className="w-6 h-6" /></div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{info.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{info.description}</p>
          {status.status !== "complete" && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progression</span><span>{getProgress()}%</span></div>
              <Progress value={getProgress()} className="h-2" />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={status.status === "complete" ? onDashboard : onStart} disabled={loading}
              className={cn(status.status === "complete" ? "bg-white/10 hover:bg-white/20" : "bg-amber-500 hover:bg-amber-600 text-black")}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : status.status === "complete" ? <ExternalLink className="w-4 h-4 mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {info.action}
            </Button>
            {status.status === "incomplete" && <Button variant="outline" onClick={onRefresh} disabled={loading}><RefreshCw className="w-4 h-4" /></Button>}
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// Stats Cards
const StatsCards = ({ stats }: { stats: { totalSales: number; totalRevenueCents: number; activeListings: number; pendingShipments: number; averageRating: number } }) => {
  const cards = [
    { label: "Ventes", value: stats.totalSales, icon: ShoppingBag, color: "text-emerald-400" },
    { label: "Revenus", value: `${(stats.totalRevenueCents / 100).toFixed(2)} €`, icon: Euro, color: "text-amber-400" },
    { label: "Annonces", value: stats.activeListings, icon: Package, color: "text-blue-400" },
    { label: "À expédier", value: stats.pendingShipments, icon: Truck, color: stats.pendingShipments > 0 ? "text-orange-400" : "text-zinc-400" },
    { label: "Note", value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "—", icon: Star, color: "text-amber-400" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <GlassCard key={i} className="p-4">
          <div className="flex items-center gap-2 mb-2"><c.icon className={cn("w-4 h-4", c.color)} /><span className="text-xs text-muted-foreground">{c.label}</span></div>
          <p className="text-2xl font-bold">{c.value}</p>
        </GlassCard>
      ))}
    </div>
  );
};

// Listing Mini Card
const ListingMiniCard = ({ listing }: { listing: ListingWithSeller }) => {
  const navigate = useNavigate();
  const statusColors: Record<string, string> = { draft: "bg-zinc-500/20 text-zinc-400", active: "bg-emerald-500/20 text-emerald-400", sold: "bg-blue-500/20 text-blue-400" };
  const statusLabels: Record<string, string> = { draft: "Brouillon", active: "En ligne", sold: "Vendu" };
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate(`/listing/${listing.id}`)}>
      <img src={listing.movie_poster_path ? `https://image.tmdb.org/t/p/w92${listing.movie_poster_path}` : "/placeholder-movie.png"} alt="" className="w-12 h-16 object-cover rounded" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{listing.movie_title}</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-amber-400 font-semibold">{(listing.price_cents / 100).toFixed(2)} €</span>
          <Badge className={cn("text-xs", statusColors[listing.status] || "")}>{statusLabels[listing.status] || listing.status}</Badge>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{listing.views_count || 0} vues</div>
    </div>
  );
};

// Order Item Card
const OrderItemCard = ({ item, onShip }: { item: SellerOrderItem; onShip: (id: string) => void }) => (
  <GlassCard className="p-4">
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">{item.order.order_number}</Badge>
          <Badge className={cn("text-xs", item.status === "confirmed" ? "bg-yellow-500/20 text-yellow-400" : "bg-emerald-500/20 text-emerald-400")}>
            {ITEM_STATUS_LABELS[item.status as keyof typeof ITEM_STATUS_LABELS] || item.status}
          </Badge>
        </div>
        <p className="font-semibold">{item.movie_title}</p>
        <div className="mt-3 p-2 rounded bg-white/5 text-xs">
          <p className="font-medium">Expédier à:</p>
          <p>{item.order.shipping_name}</p>
          <p>{item.order.shipping_address_line1}</p>
          <p>{item.order.shipping_postal_code} {item.order.shipping_city}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-amber-400">{(item.seller_payout_cents / 100).toFixed(2)} €</p>
        <p className="text-xs text-muted-foreground">votre revenu</p>
        {item.status === "confirmed" && (
          <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600 text-black" onClick={() => onShip(item.id)}>
            <Truck className="w-4 h-4 mr-1" />Expédier
          </Button>
        )}
      </div>
    </div>
  </GlassCard>
);

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<SellerOnboardingStatus>({ hasAccount: false, status: "not_started", chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false });
  const [stats, setStats] = useState({ totalSales: 0, totalRevenueCents: 0, activeListings: 0, pendingShipments: 0, averageRating: 0 });
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [pendingOrders, setPendingOrders] = useState<SellerOrderItem[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (searchParams.get("onboarding") === "complete") toast({ title: "Inscription terminée !" });
    if (searchParams.get("refresh") === "true") toast({ title: "Session expirée", variant: "destructive" });
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) { navigate("/auth"); return; }
      setLoading(true);
      try {
        let profile = await getCurrentSellerProfile(user.id);
        if (!profile) {
          const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Vendeur";
          const result = await createSellerProfile(user.id, displayName);
          if (result.success) profile = result.profile;
        }
        setSellerProfile(profile);
        if (profile) {
          const status = await getStripeOnboardingStatus();
          setOnboardingStatus(status);
          if (status.status === "complete") {
            setStats(await getSellerDetailedStats(profile.id));
            setListings(await getSellerListings(profile.id));
            setPendingOrders(await getSellerOrders(profile.id, "confirmed"));
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user, navigate]);

  const handleStartOnboarding = async () => {
    setActionLoading(true);
    try {
      const result = await startStripeOnboarding();
      if (result.success && result.onboardingUrl) window.location.href = result.onboardingUrl;
      else toast({ title: "Erreur", description: result.error, variant: "destructive" });
    } finally { setActionLoading(false); }
  };

  const handleRefreshOnboarding = async () => {
    setActionLoading(true);
    try {
      const result = await refreshOnboardingLink();
      if (result.success && result.onboardingUrl) window.location.href = result.onboardingUrl;
      else toast({ title: "Erreur", description: result.error, variant: "destructive" });
    } finally { setActionLoading(false); }
  };

  const handleOpenDashboard = async () => {
    setActionLoading(true);
    try {
      const result = await getStripeDashboardLink();
      if (result.success && result.loginUrl) window.open(result.loginUrl, "_blank");
      else toast({ title: "Erreur", description: result.error, variant: "destructive" });
    } finally { setActionLoading(false); }
  };

  if (loading) return <div className="min-h-screen bg-background p-4"><div className="container mx-auto space-y-6"><Skeleton className="h-32 w-full" /><div className="grid grid-cols-5 gap-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div></div></div>;
  if (!user) return null;

  const canSell = onboardingStatus.status === "complete";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-b from-amber-500/10 to-transparent border-b border-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><Store className="w-6 h-6 text-amber-400" />Espace Vendeur</h1>{sellerProfile && <p className="text-muted-foreground">{sellerProfile.display_name}</p>}</div>
            {canSell && <Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={() => navigate("/sell/new")}><Plus className="w-4 h-4 mr-2" />Nouvelle annonce</Button>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {onboardingStatus.status !== "complete" && <OnboardingCard status={onboardingStatus} onStart={handleStartOnboarding} onRefresh={handleRefreshOnboarding} onDashboard={handleOpenDashboard} loading={actionLoading} />}
        {sellerProfile && onboardingStatus.status === "complete" && <StatsCards stats={stats} />}

        {canSell ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/5">
              <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
              <TabsTrigger value="listings"><Package className="w-4 h-4 mr-2" />Annonces ({listings.length})</TabsTrigger>
              <TabsTrigger value="orders"><Truck className="w-4 h-4 mr-2" />Commandes{pendingOrders.length > 0 && <Badge className="ml-2 bg-orange-500/20 text-orange-400">{pendingOrders.length}</Badge>}</TabsTrigger>
              <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Paramètres</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 cursor-pointer hover:border-amber-500/30" onClick={() => navigate("/sell/new")}>
                  <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-500/20"><Plus className="w-5 h-5 text-amber-400" /></div><div><p className="font-semibold">Créer une annonce</p><p className="text-xs text-muted-foreground">Vendez vos films</p></div><ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" /></div>
                </GlassCard>
                <GlassCard className="p-4 cursor-pointer hover:border-blue-500/30" onClick={handleOpenDashboard}>
                  <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/20"><CreditCard className="w-5 h-5 text-blue-400" /></div><div><p className="font-semibold">Paiements Stripe</p><p className="text-xs text-muted-foreground">Gérer vos revenus</p></div><ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" /></div>
                </GlassCard>
                <GlassCard className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-500/20"><TrendingUp className="w-5 h-5 text-emerald-400" /></div><div><p className="font-semibold">Ce mois</p><p className="text-xs text-muted-foreground">+{stats.totalSales} ventes</p></div></div></GlassCard>
              </div>
              {pendingOrders.length > 0 && (
                <GlassCard className="p-4 border-orange-500/30 bg-orange-500/5">
                  <div className="flex items-center gap-3"><Truck className="w-5 h-5 text-orange-400" /><div className="flex-1"><p className="font-semibold">{pendingOrders.length} commande(s) à expédier</p></div><Button variant="outline" className="border-orange-500/30" onClick={() => setActiveTab("orders")}>Voir</Button></div>
                </GlassCard>
              )}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Annonces récentes</h3><Button variant="ghost" size="sm" onClick={() => setActiveTab("listings")}>Voir tout<ArrowRight className="w-4 h-4 ml-1" /></Button></div>
                {listings.length > 0 ? <div className="space-y-2">{listings.slice(0, 5).map(l => <ListingMiniCard key={l.id} listing={l} />)}</div> : (
                  <div className="text-center py-8"><Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground mb-3">Aucune annonce</p><Button className="bg-amber-500 hover:bg-amber-600 text-black" onClick={() => navigate("/sell/new")}><Plus className="w-4 h-4 mr-2" />Créer ma première annonce</Button></div>
                )}
              </GlassCard>
            </TabsContent>

            <TabsContent value="listings" className="mt-6">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Mes annonces</h3><Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black" onClick={() => navigate("/sell/new")}><Plus className="w-4 h-4 mr-2" />Nouvelle</Button></div>
                {listings.length > 0 ? <div className="space-y-2">{listings.map(l => <ListingMiniCard key={l.id} listing={l} />)}</div> : <div className="text-center py-8"><Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">Aucune annonce</p></div>}
              </GlassCard>
            </TabsContent>

            <TabsContent value="orders" className="mt-6 space-y-4">
              {pendingOrders.length > 0 ? pendingOrders.map(item => <OrderItemCard key={item.id} item={item} onShip={() => toast({ title: "Fonctionnalité en développement" })} />) : (
                <GlassCard className="p-8 text-center"><CheckCircle className="w-12 h-12 mx-auto text-emerald-400 mb-3" /><p className="font-semibold mb-1">Tout est à jour !</p><p className="text-muted-foreground">Aucune commande en attente.</p></GlassCard>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-6"><GlassCard className="p-6"><h3 className="font-semibold mb-4">Paramètres vendeur</h3><p className="text-muted-foreground">En cours de développement.</p></GlassCard></TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Euro, title: "Commission de 5%", description: "La plus basse du marché." },
              { icon: Shield, title: "Paiement sécurisé", description: "Via Stripe." },
              { icon: Sparkles, title: "Visibilité maximale", description: "Milliers de collectionneurs." },
            ].map((b, i) => (
              <GlassCard key={i} className="p-6 text-center"><b.icon className="w-10 h-10 mx-auto text-amber-400 mb-3" /><h3 className="font-semibold mb-2">{b.title}</h3><p className="text-sm text-muted-foreground">{b.description}</p></GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
