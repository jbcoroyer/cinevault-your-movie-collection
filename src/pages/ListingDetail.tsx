/**
 * CineVault - Listing Detail Page
 * 
 * Page de détail d'une annonce avec:
 * - Galerie d'images
 * - Informations produit
 * - Profil vendeur
 * - Actions (panier, favoris)
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  ShoppingCart, Heart, Share2, MapPin, Star, Package, Shield, Clock,
  ChevronLeft, Store, MessageCircle, Truck, CheckCircle, AlertCircle,
  ExternalLink, Sparkles, Disc, BookOpen, Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getListing, getImageUrl, type ListingWithSeller } from "@/services/listingService";
import { addToCart, isInCart } from "@/services/cartService";
import { toast } from "@/hooks/use-toast";

const CONDITION_DETAILS: Record<string, { label: string; description: string; color: string; bgColor: string }> = {
  mint: { label: "Neuf", description: "Article neuf, jamais ouvert, dans son emballage d'origine scellé.", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  near_mint: { label: "Comme neuf", description: "Article en parfait état, ouvert mais jamais utilisé.", color: "text-green-400", bgColor: "bg-green-500/20" },
  very_good: { label: "Très bon état", description: "Légères traces d'usure sur le boîtier, disque impeccable.", color: "text-blue-400", bgColor: "bg-blue-500/20" },
  good: { label: "Bon état", description: "Usure normale, quelques marques sur le boîtier.", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  acceptable: { label: "Acceptable", description: "Usure visible, mais article complet et fonctionnel.", color: "text-orange-400", bgColor: "bg-orange-500/20" },
};

const FORMAT_INFO: Record<string, { label: string; icon: any; color: string }> = {
  "4k": { label: "4K Ultra HD", icon: Disc, color: "text-purple-400" },
  bluray: { label: "Blu-ray", icon: Disc, color: "text-blue-400" },
  steelbook: { label: "Steelbook", icon: Box, color: "text-amber-400" },
  collector: { label: "Édition Collector", icon: Sparkles, color: "text-rose-400" },
  dvd: { label: "DVD", icon: Disc, color: "text-zinc-400" },
};

// Image Gallery
const ImageGallery = ({ images, posterPath, title }: { images: any[]; posterPath?: string | null; title: string }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const imageList = images.length > 0
    ? images.map(img => getImageUrl(img.storage_path))
    : posterPath ? [`https://image.tmdb.org/t/p/w780${posterPath}`] : ["/placeholder-movie.png"];

  return (
    <div className="space-y-3">
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative aspect-square rounded-xl overflow-hidden cursor-zoom-in bg-black/20">
            <img src={imageList[selectedIndex]} alt={title} className="w-full h-full object-contain" />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 bg-black/95">
          <img src={imageList[selectedIndex]} alt={title} className="w-full h-auto max-h-[90vh] object-contain" />
        </DialogContent>
      </Dialog>
      {imageList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imageList.map((src, index) => (
            <button key={index} onClick={() => setSelectedIndex(index)}
              className={cn("w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                selectedIndex === index ? "border-amber-500" : "border-transparent opacity-60 hover:opacity-100")}>
              <img src={src} alt={`${title} - ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Seller Card
const SellerCard = ({ seller }: { seller: ListingWithSeller["seller"] }) => (
  <GlassCard className="p-4">
    <div className="flex items-center gap-3 mb-4">
      <Avatar className="w-12 h-12">
        <AvatarFallback className="bg-amber-500/20 text-amber-400">
          {seller.display_name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{seller.display_name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {seller.average_rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {seller.average_rating.toFixed(1)} ({seller.rating_count})
            </span>
          )}
          {seller.total_sales > 0 && <span>{seller.total_sales} ventes</span>}
        </div>
      </div>
    </div>
    {seller.location_city && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <MapPin className="w-4 h-4" />
        <span>{seller.location_city}, {seller.location_country || "FR"}</span>
      </div>
    )}
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" asChild>
        <Link to={`/seller/${seller.id}`}><Store className="w-4 h-4 mr-2" />Voir la boutique</Link>
      </Button>
      <Button variant="outline" size="icon"><MessageCircle className="w-4 h-4" /></Button>
    </div>
  </GlassCard>
);

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingWithSeller | null>(null);
  const [loading, setLoading] = useState(true);
  const [inCart, setInCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getListing(id);
        setListing(data);
        if (data) setInCart(isInCart(data.id));
      } catch (error) {
        console.error("Failed to fetch listing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleAddToCart = async () => {
    if (!listing) return;
    setAddingToCart(true);
    try {
      const result = await addToCart(listing.id, user?.id);
      if (result.success) {
        setInCart(true);
        toast({ title: "Ajouté au panier", description: "L'article a été ajouté à votre panier." });
      } else {
        toast({ title: "Erreur", description: result.error, variant: "destructive" });
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && listing) {
      try {
        await navigator.share({ title: listing.movie_title, text: `${listing.movie_title} - ${(listing.price_cents / 100).toFixed(2)} € sur CineVault`, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Lien copié !" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" /><Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <GlassCard className="p-8 text-center max-w-md">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Annonce introuvable</h2>
            <p className="text-muted-foreground mb-4">Cette annonce n'existe plus ou a été vendue.</p>
            <Button onClick={() => navigate("/marketplace")}>Retour au marketplace</Button>
          </GlassCard>
        </div>
        <BottomNav />
      </div>
    );
  }

  const condition = CONDITION_DETAILS[listing.condition];
  const format = FORMAT_INFO[listing.format?.toLowerCase()];
  const FormatIcon = format?.icon || Disc;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" />Retour
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ImageGallery images={listing.images || []} posterPath={listing.movie_poster_path} title={listing.movie_title} />

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={cn("text-xs", format?.color)}><FormatIcon className="w-3 h-3 mr-1" />{format?.label || listing.format}</Badge>
                {listing.edition && <Badge variant="outline" className="text-xs">{listing.edition}</Badge>}
                {listing.region_code && <Badge variant="outline" className="text-xs">Région {listing.region_code}</Badge>}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">{listing.movie_title}</h1>
              {listing.movie_release_year && <p className="text-muted-foreground">{listing.movie_release_year}</p>}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-amber-400">{(listing.price_cents / 100).toFixed(2)} €</span>
              <span className="text-sm text-muted-foreground">+ {((listing.shipping_domestic_cents || 399) / 100).toFixed(2)} € livraison</span>
            </div>

            <GlassCard className={cn("p-4", condition?.bgColor)}>
              <div className="flex items-start gap-3">
                <CheckCircle className={cn("w-5 h-5 mt-0.5", condition?.color)} />
                <div>
                  <p className={cn("font-semibold", condition?.color)}>{condition?.label}</p>
                  <p className="text-sm text-muted-foreground">{condition?.description}</p>
                  {listing.condition_notes && <p className="text-sm mt-2 italic">"{listing.condition_notes}"</p>}
                </div>
              </div>
            </GlassCard>

            <div className="flex flex-wrap gap-2">
              {listing.is_sealed && <Badge className="bg-emerald-500/20 text-emerald-400"><Sparkles className="w-3 h-3 mr-1" />Sous blister</Badge>}
              {listing.includes_slipcover && <Badge className="bg-blue-500/20 text-blue-400"><Box className="w-3 h-3 mr-1" />Slipcover</Badge>}
              {listing.includes_booklet && <Badge className="bg-purple-500/20 text-purple-400"><BookOpen className="w-3 h-3 mr-1" />Livret</Badge>}
            </div>

            {listing.description && (
              <div><h3 className="font-semibold mb-2">Description</h3><p className="text-muted-foreground whitespace-pre-line">{listing.description}</p></div>
            )}

            <Separator className="bg-white/10" />

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2"><Truck className="w-4 h-4" />Livraison</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {listing.accepts_colissimo && <div className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /><span>Colissimo: {((listing.shipping_domestic_cents || 399) / 100).toFixed(2)} €</span></div>}
                {listing.accepts_mondial_relay && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /><span>Point Relais: {(((listing.shipping_domestic_cents || 399) - 100) / 100).toFixed(2)} €</span></div>}
                {listing.accepts_hand_delivery && <div className="flex items-center gap-2"><Store className="w-4 h-4 text-muted-foreground" /><span>Remise en main propre</span></div>}
              </div>
              {listing.shipping_from_city && <p className="text-xs text-muted-foreground">Expédié depuis {listing.shipping_from_city}</p>}
            </div>

            <Separator className="bg-white/10" />

            <div className="flex gap-3">
              <Button size="lg" onClick={inCart ? () => navigate("/cart") : handleAddToCart} disabled={addingToCart}
                className={cn("flex-1", inCart ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-amber-500 hover:bg-amber-600 text-black")}>
                <ShoppingCart className="w-5 h-5 mr-2" />{inCart ? "Voir le panier" : "Ajouter au panier"}
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12"><Heart className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleShare}><Share2 className="w-5 h-5" /></Button>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Shield className="w-4 h-4 text-emerald-400" /><span>Paiement sécurisé</span></div>
              <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>Protection acheteur 14j</span></div>
            </div>

            <Separator className="bg-white/10" />
            <SellerCard seller={listing.seller} />

            {listing.tmdb_id && (
              <a href={`https://www.themoviedb.org/movie/${listing.tmdb_id}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
                <ExternalLink className="w-4 h-4" />Voir sur TMDB
              </a>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
