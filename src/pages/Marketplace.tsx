/**
 * CineVault - Marketplace Page
 * 
 * Page d'accueil du marketplace avec:
 * - Recherche de films
 * - Filtres (format, condition, prix)
 * - Grille d'annonces
 */

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  ShoppingCart,
  Heart,
  MapPin,
  Star,
  Tag,
  Package,
  ChevronLeft,
  ChevronRight,
  Store,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { searchListings, type ListingWithSeller, type ListingFilters } from "@/services/listingService";
import { addToCart, isInCart, getCartCount } from "@/services/cartService";
import { toast } from "@/hooks/use-toast";

// ============================================
// Constants
// ============================================

const FORMATS = [
  { id: "4k", label: "4K UHD", color: "bg-purple-500/20 text-purple-300" },
  { id: "bluray", label: "Blu-ray", color: "bg-blue-500/20 text-blue-300" },
  { id: "steelbook", label: "Steelbook", color: "bg-amber-500/20 text-amber-300" },
  { id: "collector", label: "Collector", color: "bg-rose-500/20 text-rose-300" },
  { id: "dvd", label: "DVD", color: "bg-zinc-500/20 text-zinc-300" },
];

const CONDITIONS = [
  { id: "mint", label: "Neuf", description: "Jamais ouvert" },
  { id: "near_mint", label: "Comme neuf", description: "Parfait état" },
  { id: "very_good", label: "Très bon", description: "Légères traces" },
  { id: "good", label: "Bon", description: "Usure normale" },
  { id: "acceptable", label: "Acceptable", description: "Usure visible" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Plus récentes" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "relevance", label: "Pertinence" },
];

// ============================================
// Listing Card Component
// ============================================

interface ListingCardProps {
  listing: ListingWithSeller;
  onAddToCart: (id: string) => void;
  inCart: boolean;
}

const ListingCard = ({ listing, onAddToCart, inCart }: ListingCardProps) => {
  const navigate = useNavigate();
  const posterUrl = listing.movie_poster_path
    ? `https://image.tmdb.org/t/p/w300${listing.movie_poster_path}`
    : "/placeholder-movie.png";

  const formatInfo = FORMATS.find(f => f.id === listing.format.toLowerCase());
  const conditionInfo = CONDITIONS.find(c => c.id === listing.condition);

  return (
    <GlassCard
      className="group overflow-hidden cursor-pointer hover:border-amber-500/30 transition-all duration-300"
      onClick={() => navigate(`/listing/${listing.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={posterUrl}
          alt={listing.movie_title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {formatInfo && (
            <Badge className={cn("text-xs", formatInfo.color)}>
              {formatInfo.label}
            </Badge>
          )}
          {listing.is_sealed && (
            <Badge className="bg-emerald-500/20 text-emerald-300 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Neuf scellé
            </Badge>
          )}
        </div>

        {/* Favorites button */}
        <button
          className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Add to favorites
          }}
        >
          <Heart className="w-4 h-4 text-white" />
        </button>

        {/* Quick add to cart */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            className={cn(
              "w-full",
              inCart
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-amber-500 hover:bg-amber-600 text-black"
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (!inCart) onAddToCart(listing.id);
            }}
            disabled={inCart}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {inCart ? "Dans le panier" : "Ajouter"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-1">{listing.movie_title}</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-amber-400">
            {(listing.price_cents / 100).toFixed(2)} €
          </span>
          <Badge variant="outline" className="text-xs">
            {conditionInfo?.label || listing.condition}
          </Badge>
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Store className="w-3 h-3" />
          <span className="truncate">{listing.seller.display_name}</span>
          {listing.seller.average_rating && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {listing.seller.average_rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Shipping */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="w-3 h-3" />
          <span>
            Livraison: {((listing.shipping_domestic_cents || 399) / 100).toFixed(2)} €
          </span>
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================
// Filter Sheet Component
// ============================================

interface FiltersSheetProps {
  filters: ListingFilters;
  onFiltersChange: (filters: ListingFilters) => void;
}

const FiltersSheet = ({ filters, onFiltersChange }: FiltersSheetProps) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [priceRange, setPriceRange] = useState([
    (filters.minPrice || 0) / 100,
    (filters.maxPrice || 10000) / 100,
  ]);

  const handleFormatToggle = (format: string) => {
    const current = localFilters.formats || [];
    const updated = current.includes(format)
      ? current.filter(f => f !== format)
      : [...current, format];
    setLocalFilters({ ...localFilters, formats: updated });
  };

  const handleConditionToggle = (condition: string) => {
    const current = localFilters.conditions || [];
    const updated = current.includes(condition as any)
      ? current.filter(c => c !== condition)
      : [...current, condition as any];
    setLocalFilters({ ...localFilters, conditions: updated });
  };

  const applyFilters = () => {
    onFiltersChange({
      ...localFilters,
      minPrice: priceRange[0] * 100,
      maxPrice: priceRange[1] * 100,
    });
  };

  const resetFilters = () => {
    setLocalFilters({});
    setPriceRange([0, 500]);
    onFiltersChange({});
  };

  return (
    <div className="space-y-6 py-4">
      {/* Formats */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Format</h4>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map(format => (
            <Badge
              key={format.id}
              variant="outline"
              className={cn(
                "cursor-pointer transition-all",
                localFilters.formats?.includes(format.id)
                  ? format.color + " border-current"
                  : "hover:border-white/30"
              )}
              onClick={() => handleFormatToggle(format.id)}
            >
              {format.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">État</h4>
        <div className="space-y-2">
          {CONDITIONS.map(condition => (
            <div key={condition.id} className="flex items-center space-x-2">
              <Checkbox
                id={condition.id}
                checked={localFilters.conditions?.includes(condition.id as any) || false}
                onCheckedChange={() => handleConditionToggle(condition.id)}
              />
              <label
                htmlFor={condition.id}
                className="text-sm cursor-pointer flex-1"
              >
                <span className="font-medium">{condition.label}</span>
                <span className="text-muted-foreground ml-1">
                  - {condition.description}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Prix</h4>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={500}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0]} €</span>
          <span>{priceRange[1]} €</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4">
        <Button variant="outline" className="flex-1" onClick={resetFilters}>
          Réinitialiser
        </Button>
        <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-black" onClick={applyFilters}>
          Appliquer
        </Button>
      </div>
    </div>
  );
};

// ============================================
// Main Marketplace Page
// ============================================

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [cartItems, setCartItems] = useState<Set<string>>(new Set());
  const [cartCount, setCartCount] = useState(0);

  // Filters from URL
  const [filters, setFilters] = useState<ListingFilters>({
    query: searchParams.get("q") || "",
    formats: searchParams.get("formats")?.split(",").filter(Boolean) || [],
    sortBy: (searchParams.get("sort") as ListingFilters["sortBy"]) || "newest",
    page: parseInt(searchParams.get("page") || "1"),
    limit: 24,
  });

  // Fetch listings
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchListings(filters);
      setListings(result.listings);
      setTotal(result.total);

      // Check which are in cart
      const inCart = new Set<string>();
      for (const listing of result.listings) {
        if (isInCart(listing.id)) {
          inCart.add(listing.id);
        }
      }
      setCartItems(inCart);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchListings();
    setCartCount(getCartCount());
  }, [fetchListings]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.formats?.length) params.set("formats", filters.formats.join(","));
    if (filters.sortBy && filters.sortBy !== "newest") params.set("sort", filters.sortBy);
    if (filters.page && filters.page > 1) params.set("page", filters.page.toString());
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Handlers
  const handleSearch = (query: string) => {
    setFilters({ ...filters, query, page: 1 });
  };

  const handleAddToCart = async (listingId: string) => {
    const result = await addToCart(listingId, user?.id);
    if (result.success) {
      setCartItems(new Set([...cartItems, listingId]));
      setCartCount(getCartCount());
      toast({
        title: "Ajouté au panier",
        description: "L'article a été ajouté à votre panier.",
      });
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Impossible d'ajouter au panier.",
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(total / (filters.limit || 24));

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un film..."
                value={filters.query || ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10"
              />
            </div>

            {/* Filters button (mobile) */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden">
                  <Filter className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <FiltersSheet filters={filters} onFiltersChange={setFilters} />
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select
              value={filters.sortBy || "newest"}
              onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}
            >
              <SelectTrigger className="w-40 hidden sm:flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cart button */}
            <Button
              variant="outline"
              className="relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-black text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>

          {/* Quick format filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {FORMATS.map(format => (
              <Badge
                key={format.id}
                variant="outline"
                className={cn(
                  "cursor-pointer whitespace-nowrap transition-all",
                  filters.formats?.includes(format.id)
                    ? format.color + " border-current"
                    : "hover:border-white/30"
                )}
                onClick={() => {
                  const current = filters.formats || [];
                  const updated = current.includes(format.id)
                    ? current.filter(f => f !== format.id)
                    : [...current, format.id];
                  setFilters({ ...filters, formats: updated, page: 1 });
                }}
              >
                {format.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <GlassCard className="sticky top-32 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtres
              </h3>
              <FiltersSheet filters={filters} onFiltersChange={setFilters} />
            </GlassCard>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {total} annonce{total !== 1 ? "s" : ""} trouvée{total !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[2/3] rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onAddToCart={handleAddToCart}
                    inCart={cartItems.has(listing.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune annonce trouvée</h3>
                <p className="text-muted-foreground mb-4">
                  Essayez de modifier vos filtres ou votre recherche.
                </p>
                <Button onClick={() => setFilters({ page: 1, limit: 24 })}>
                  Voir toutes les annonces
                </Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm text-muted-foreground px-4">
                  Page {filters.page || 1} sur {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="icon"
                  disabled={(filters.page || 1) >= totalPages}
                  onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Sell CTA (mobile) */}
      <div className="fixed bottom-20 right-4 lg:bottom-4">
        <Button
          size="lg"
          className="bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20 rounded-full"
          onClick={() => navigate("/sell")}
        >
          <Tag className="w-5 h-5 mr-2" />
          Vendre
        </Button>
      </div>
    </div>
  );
}
