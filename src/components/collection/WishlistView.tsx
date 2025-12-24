/**
 * CineVault - Wishlist View Component
 * 
 * Affichage de la wishlist avec tracking eBay intégré
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Plus,
  Bell,
  BellOff,
  ExternalLink,
  Trash2,
  Film,
  Search,
  ShoppingCart,
  Tag,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWishlist } from "@/hooks/useWishlist";
import { 
  WishlistItem, 
  EbayAlert,
  priorityLabels, 
  priorityColors 
} from "@/services/wishlistService";
import { PhysicalFormat, formatLabels } from "@/services/physicalMovies";
import { searchMovies, Movie, getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface WishlistViewProps {
  onCountChange?: (count: number) => void;
}

// Format config
const FORMAT_CONFIG: Record<PhysicalFormat, { label: string; color: string }> = {
  dvd: { label: "DVD", color: "bg-slate-500" },
  bluray: { label: "Blu-ray", color: "bg-blue-600" },
  "4k": { label: "4K UHD", color: "bg-purple-600" },
  steelbook: { label: "Steelbook", color: "bg-amber-600" },
  collector: { label: "Collector", color: "bg-red-600" },
};

// ============================================
// Add to Wishlist Dialog
// ============================================
const AddToWishlistDialog = ({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (movie: Movie, formats: PhysicalFormat[], priority: WishlistItem['priority']) => void;
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<PhysicalFormat[]>(["bluray"]);
  const [priority, setPriority] = useState<WishlistItem['priority']>("medium");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const movies = await searchMovies(query);
    setResults(movies);
    setSearching(false);
  };

  const toggleFormat = (format: PhysicalFormat) => {
    setSelectedFormats(prev => 
      prev.includes(format)
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const handleAdd = () => {
    if (!selectedMovie || selectedFormats.length === 0) return;
    onAdd(selectedMovie, selectedFormats, priority);
    onOpenChange(false);
    setSelectedMovie(null);
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Ajouter à la wishlist
          </DialogTitle>
        </DialogHeader>

        {!selectedMovie ? (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher un film..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? "..." : "Chercher"}
              </Button>
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {results.map((movie) => (
                <div
                  key={movie.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => setSelectedMovie(movie)}
                >
                  {movie.poster_path ? (
                    <img
                      src={getImageUrl(movie.poster_path, "w92")}
                      alt={movie.title}
                      className="w-12 h-18 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-18 bg-muted rounded flex items-center justify-center">
                      <Film className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{movie.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {movie.release_date?.substring(0, 4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected movie */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {selectedMovie.poster_path ? (
                <img
                  src={getImageUrl(selectedMovie.poster_path, "w92")}
                  alt={selectedMovie.title}
                  className="w-16 h-24 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-24 bg-muted rounded flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-semibold">{selectedMovie.title}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMovie.release_date?.substring(0, 4)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMovie(null)}
                  className="mt-1 h-auto p-0 text-muted-foreground"
                >
                  Changer de film
                </Button>
              </div>
            </div>

            {/* Format selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Formats recherchés
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(FORMAT_CONFIG).map(([format, config]) => (
                  <Badge
                    key={format}
                    variant={selectedFormats.includes(format as PhysicalFormat) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      selectedFormats.includes(format as PhysicalFormat) && config.color
                    )}
                    onClick={() => toggleFormat(format as PhysicalFormat)}
                  >
                    {config.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-medium mb-2 block">Priorité</label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <Badge
                    key={p}
                    variant={priority === p ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer",
                      priority === p && priorityColors[p]
                    )}
                    onClick={() => setPriority(p)}
                  >
                    {priorityLabels[p]}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={handleAdd} 
                className="flex-1 bg-red-500 hover:bg-red-600"
                disabled={selectedFormats.length === 0}
              >
                <Heart className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// Wishlist Item Card
// ============================================
const WishlistItemCard = ({
  item,
  onToggleTracking,
  onRemove,
}: {
  item: WishlistItem;
  onToggleTracking: (id: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
}) => {
  const posterUrl = item.poster_path ? getImageUrl(item.poster_path, "w185") : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:border-red-500/30 transition-colors"
    >
      {/* Poster */}
      <div className="flex-shrink-0">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={item.title}
            className="w-20 h-30 object-cover rounded-lg"
          />
        ) : (
          <div className="w-20 h-30 bg-muted rounded-lg flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold line-clamp-1">{item.title}</h3>
            {item.release_year && (
              <p className="text-sm text-muted-foreground">{item.release_year}</p>
            )}
          </div>
          <Badge className={cn("text-xs", priorityColors[item.priority])}>
            {priorityLabels[item.priority]}
          </Badge>
        </div>

        {/* Formats */}
        <div className="flex flex-wrap gap-1 mt-2">
          {item.desired_formats.map((format) => (
            <Badge
              key={format}
              variant="outline"
              className="text-xs"
            >
              {FORMAT_CONFIG[format]?.label || format}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant={item.ebay_tracking_enabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleTracking(item.id, !item.ebay_tracking_enabled)}
            className={cn(
              "gap-1 text-xs",
              item.ebay_tracking_enabled && "bg-green-600 hover:bg-green-700"
            )}
          >
            {item.ebay_tracking_enabled ? (
              <>
                <Bell className="w-3 h-3" />
                Tracking actif
              </>
            ) : (
              <>
                <BellOff className="w-3 h-3" />
                Activer tracking
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// eBay Alert Card
// ============================================
const EbayAlertCard = ({
  alert,
  onSeen,
  onDismiss,
}: {
  alert: EbayAlert;
  onSeen: (id: string) => void;
  onDismiss: (id: string) => void;
}) => {
  const price = (alert.price_cents / 100).toFixed(2);
  const shipping = alert.shipping_cost_cents 
    ? (alert.shipping_cost_cents / 100).toFixed(2) 
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "p-4 rounded-xl border transition-colors",
        alert.is_seen 
          ? "bg-muted/50 border-border" 
          : "bg-green-500/5 border-green-500/30"
      )}
      onClick={() => !alert.is_seen && onSeen(alert.id)}
    >
      <div className="flex gap-3">
        {/* Image */}
        {alert.image_url && (
          <img
            src={alert.image_url}
            alt={alert.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="font-medium text-sm line-clamp-2">{alert.title}</h4>

          {/* Price */}
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-green-600">
              {price} {alert.currency}
            </span>
            {shipping && (
              <span className="text-xs text-muted-foreground">
                + {shipping} € livraison
              </span>
            )}
            {alert.is_auction && (
              <Badge variant="outline" className="text-xs">
                Enchère
              </Badge>
            )}
          </div>

          {/* Seller & Location */}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {alert.seller_name && <span>{alert.seller_name}</span>}
            {alert.location && <span>• {alert.location}</span>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <Button
          size="sm"
          className="flex-1 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            window.open(alert.item_url, "_blank");
          }}
        >
          <ExternalLink className="w-3 h-3" />
          Voir sur eBay
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(alert.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================
export const WishlistView = ({ onCountChange }: WishlistViewProps) => {
  const {
    items,
    loading,
    add,
    remove,
    toggleTracking,
    alerts,
    unseenCount,
    markSeen,
    markAllSeen,
    dismiss,
  } = useWishlist();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"wishlist" | "alerts">("wishlist");

  // Update parent count
  useEffect(() => {
    onCountChange?.(items.length);
  }, [items.length, onCountChange]);

  const handleAdd = async (
    movie: Movie,
    formats: PhysicalFormat[],
    priority: WishlistItem['priority']
  ) => {
    await add({
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_year: movie.release_date ? parseInt(movie.release_date.substring(0, 4)) : null,
      desired_formats: formats,
      priority,
      ebay_tracking_enabled: false,
    });
  };

  // Empty state
  if (!loading && items.length === 0 && activeTab === "wishlist") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <Heart className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-display font-bold mb-2">
          Votre wishlist est vide
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Ajoutez des films que vous souhaitez acheter et activez le tracking eBay pour être alerté des nouvelles annonces.
        </p>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-red-500 hover:bg-red-600 gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter à ma wishlist
        </Button>

        <AddToWishlistDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onAdd={handleAdd}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ma Wishlist</h2>
          <p className="text-sm text-muted-foreground">
            {items.length} film{items.length !== 1 ? 's' : ''} à trouver
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="sm"
          className="bg-red-500 hover:bg-red-600 gap-1"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="wishlist" className="flex-1 gap-2">
            <Heart className="w-4 h-4" />
            Wishlist
            <Badge variant="secondary" className="ml-1">
              {items.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex-1 gap-2">
            <Bell className="w-4 h-4" />
            Alertes eBay
            {unseenCount > 0 && (
              <Badge className="ml-1 bg-green-500">
                {unseenCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist" className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onToggleTracking={toggleTracking}
                    onRemove={remove}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="mt-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="font-medium">Aucune alerte</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Activez le tracking sur vos films en wishlist pour recevoir des alertes eBay.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {unseenCount > 0 && (
                <div className="flex justify-end mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllSeen}
                    className="text-xs"
                  >
                    Tout marquer comme lu
                  </Button>
                </div>
              )}
              <div className="space-y-3">
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <EbayAlertCard
                      key={alert.id}
                      alert={alert}
                      onSeen={markSeen}
                      onDismiss={dismiss}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <AddToWishlistDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
      />
    </div>
  );
};

export default WishlistView;
