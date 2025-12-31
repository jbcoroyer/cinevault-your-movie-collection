/**
 * CineVault - RecentSalesWidget (CORRIGÉ)
 *
 * Affiche les films de la collection avec leurs prix de marché réels
 * et liens vers les ventes eBay correspondantes
 *
 * CORRECTION: Utilise les vraies données de la collection + prix eBay
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ShoppingCart, TrendingUp, TrendingDown, Eye, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface CollectionItem {
  tmdbId: number;
  title: string;
  format: string;
  posterPath?: string;
  marketPrice?: {
    min: number; // centimes
    median: number; // centimes
    max: number; // centimes
    sampleSize: number;
    lastSoldPrice?: number;
    lastSoldDate?: string;
    source: string;
  };
  purchasePrice?: number; // centimes
}

interface RecentSalesWidgetProps {
  items: CollectionItem[];
  loading?: boolean;
  onMovieClick?: (tmdbId: number) => void;
  className?: string;
}

// ============================================
// Helpers
// ============================================

const formatPrice = (cents: number): string => {
  return (
    (cents / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
};

const getEbaySearchUrl = (title: string, format: string): string => {
  // Nettoyer le titre pour la recherche
  const cleanTitle = title
    .replace(/[:\-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const formatMapping: Record<string, string> = {
    "4k": "4K UHD",
    bluray: "Blu-ray",
    dvd: "DVD",
    steelbook: "Steelbook",
    collector: "Collector",
  };

  const formatLabel = formatMapping[format.toLowerCase()] || format;
  const query = encodeURIComponent(`${cleanTitle} ${formatLabel}`);

  // eBay France - Catégorie Films & Séries (11232)
  return `https://www.ebay.fr/sch/i.html?_nkw=${query}&_sacat=11232&LH_Complete=1&LH_Sold=1&_sop=13`;
};

const getEbayActiveListingsUrl = (title: string, format: string): string => {
  const cleanTitle = title
    .replace(/[:\-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const formatMapping: Record<string, string> = {
    "4k": "4K UHD",
    bluray: "Blu-ray",
    dvd: "DVD",
    steelbook: "Steelbook",
    collector: "Collector",
  };
  const formatLabel = formatMapping[format.toLowerCase()] || format;
  const query = encodeURIComponent(`${cleanTitle} ${formatLabel}`);
  return `https://www.ebay.fr/sch/i.html?_nkw=${query}&_sacat=11232&_sop=15`;
};

const formatLabels: Record<string, { label: string; color: string }> = {
  "4k": { label: "4K", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  bluray: { label: "Blu-ray", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  dvd: { label: "DVD", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  steelbook: { label: "Steelbook", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  collector: { label: "Collector", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  vhs: { label: "VHS", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

// ============================================
// Item Component
// ============================================

const SaleItem = ({ item, onClick }: { item: CollectionItem; onClick?: () => void }) => {
  const format = formatLabels[item.format.toLowerCase()] || formatLabels.dvd;
  const hasRealPrice = item.marketPrice && item.marketPrice.sampleSize > 0;

  // Calcul profit/perte si prix d'achat disponible
  const profitLoss = item.purchasePrice && item.marketPrice ? item.marketPrice.median - item.purchasePrice : null;
  const profitPercent =
    item.purchasePrice && item.marketPrice && item.purchasePrice > 0
      ? ((item.marketPrice.median - item.purchasePrice) / item.purchasePrice) * 100
      : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "bg-white/5 hover:bg-white/10 transition-all duration-200",
        "border border-transparent hover:border-blue-500/30",
        "group cursor-pointer",
      )}
      onClick={onClick}
    >
      {/* Poster */}
      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow-lg">
        {item.posterPath ? (
          <img
            src={getImageUrl(item.posterPath, "w92")}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-white truncate group-hover:text-blue-400 transition-colors">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", format.color)}>
            {format.label}
          </Badge>
          {hasRealPrice && <span className="text-[10px] text-zinc-500">{item.marketPrice!.sampleSize} ventes</span>}
        </div>
      </div>

      {/* Prix */}
      <div className="text-right shrink-0">
        {item.marketPrice ? (
          <>
            <div className="font-bold text-sm text-white">{formatPrice(item.marketPrice.median)}</div>
            {profitLoss !== null && (
              <div
                className={cn(
                  "text-[10px] flex items-center justify-end gap-0.5",
                  profitLoss >= 0 ? "text-green-400" : "text-red-400",
                )}
              >
                {profitLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {profitLoss >= 0 ? "+" : ""}
                {profitPercent?.toFixed(0)}%
              </div>
            )}
            {!hasRealPrice && <span className="text-[9px] text-amber-500/70">Estimé</span>}
          </>
        ) : (
          <span className="text-xs text-zinc-500">Prix inconnu</span>
        )}
      </div>

      {/* eBay link */}
      <a
        href={getEbaySearchUrl(item.title, item.format)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-blue-400 opacity-50 group-hover:opacity-100" />
      </a>
    </div>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const LoadingSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <div className="w-12 h-16 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-white/10 rounded" />
          <div className="h-3 w-1/2 bg-white/10 rounded" />
        </div>
        <div className="h-5 w-16 bg-white/10 rounded" />
      </div>
    ))}
  </div>
);

// ============================================
// Empty State
// ============================================

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <ShoppingCart className="w-12 h-12 text-zinc-700 mb-3" />
    <p className="text-sm text-zinc-500">Aucun film avec prix de marché</p>
    <p className="text-xs text-zinc-600 mt-1">Ajoutez des films à votre collection pour voir leurs cotations</p>
  </div>
);

// ============================================
// Main Component
// ============================================

export const RecentSalesWidget = ({ items, loading = false, onMovieClick, className }: RecentSalesWidgetProps) => {
  // Trier par prix décroissant pour montrer les plus précieux
  const sortedItems = [...items]
    .filter((item) => item.marketPrice)
    .sort((a, b) => (b.marketPrice?.median || 0) - (a.marketPrice?.median || 0))
    .slice(0, 10);

  // Stats
  const totalValue = sortedItems.reduce((sum, item) => sum + (item.marketPrice?.median || 0), 0);
  const avgPrice = sortedItems.length > 0 ? totalValue / sortedItems.length : 0;

  return (
    <Card className={cn("bg-black/40 border-white/10 backdrop-blur-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-blue-400" />
            Cotations de votre Collection
          </CardTitle>
          {sortedItems.length > 0 && (
            <Badge variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-300">
              Prix moy: {formatPrice(avgPrice)}
            </Badge>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-1">Cliquez sur un film pour voir l'évolution de son prix</p>
      </CardHeader>

      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : sortedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {sortedItems.map((item) => (
                <SaleItem
                  key={`${item.tmdbId}-${item.format}`}
                  item={item}
                  onClick={() => onMovieClick?.(item.tmdbId)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {sortedItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <a
              href="https://www.ebay.fr/sch/i.html?_nkw=blu+ray+4k+steelbook&_sacat=11232&LH_Complete=1&LH_Sold=1"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Eye className="w-3 h-3" />
              Voir plus de ventes sur eBay
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
