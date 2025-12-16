/**
 * CineVault - HiddenGemsWidget (CORRIGÉ)
 *
 * Identifie les "pépites cachées" de la collection :
 * - Films sous-évalués (achetés peu cher, valeur marché élevée)
 * - Éditions rares (peu de ventes, prix élevé)
 * - Films avec forte plus-value potentielle
 *
 * CORRECTION: Utilise les vraies données + liens eBay précis
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, ArrowUpRight, Search, Sparkles, TrendingUp, Star, ExternalLink, Package } from "lucide-react";
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
  releaseYear?: number;
  marketPrice?: {
    min: number;
    median: number;
    max: number;
    sampleSize: number;
    source: string;
  };
  purchasePrice?: number; // centimes
}

interface HiddenGem {
  item: CollectionItem;
  reason: string;
  reasonIcon: "profit" | "rare" | "undervalued" | "trending";
  potentialValue: string;
  profitPercent?: number;
}

interface HiddenGemsWidgetProps {
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + "€"
  );
};

const getEbaySearchUrl = (title: string, format: string, sold: boolean = false): string => {
  const cleanTitle = title
    .replace(/[:\-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const formatMapping: Record<string, string> = {
    "4k": "4K UHD",
    bluray: "Blu-ray",
    dvd: "DVD",
    steelbook: "Steelbook",
    collector: "Collector Edition",
  };
  const formatLabel = formatMapping[format.toLowerCase()] || format;
  const query = encodeURIComponent(`${cleanTitle} ${formatLabel}`);

  if (sold) {
    // Ventes terminées
    return `https://www.ebay.fr/sch/i.html?_nkw=${query}&_sacat=11232&LH_Complete=1&LH_Sold=1&_sop=13`;
  }
  // Annonces actives
  return `https://www.ebay.fr/sch/i.html?_nkw=${query}&_sacat=11232&_sop=15`;
};

const formatLabels: Record<string, { label: string; color: string }> = {
  "4k": { label: "4K", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  bluray: { label: "Blu-ray", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  dvd: { label: "DVD", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  steelbook: { label: "Steelbook", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  collector: { label: "Collector", color: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
};

const reasonConfig = {
  profit: { icon: TrendingUp, color: "text-green-400", bgColor: "bg-green-500/10" },
  rare: { icon: Star, color: "text-amber-400", bgColor: "bg-amber-500/10" },
  undervalued: { icon: Gem, color: "text-pink-400", bgColor: "bg-pink-500/10" },
  trending: { icon: Sparkles, color: "text-purple-400", bgColor: "bg-purple-500/10" },
};

// ============================================
// Gem Detection Logic
// ============================================

const identifyHiddenGems = (items: CollectionItem[]): HiddenGem[] => {
  const gems: HiddenGem[] = [];

  items.forEach((item) => {
    if (!item.marketPrice) return;

    const purchasePrice = item.purchasePrice || 0;
    const marketPrice = item.marketPrice.median;
    const profitPercent = purchasePrice > 0 ? ((marketPrice - purchasePrice) / purchasePrice) * 100 : 0;

    // 1. Forte plus-value (>50%)
    if (purchasePrice > 0 && profitPercent >= 50) {
      gems.push({
        item,
        reason: `+${profitPercent.toFixed(0)}% depuis l'achat`,
        reasonIcon: "profit",
        potentialValue: `${formatPrice(item.marketPrice.min)} - ${formatPrice(item.marketPrice.max)}`,
        profitPercent,
      });
      return;
    }

    // 2. Édition rare (peu de ventes, prix élevé)
    if (item.marketPrice.sampleSize <= 5 && marketPrice >= 3000) {
      gems.push({
        item,
        reason: `Édition rare (${item.marketPrice.sampleSize} ventes)`,
        reasonIcon: "rare",
        potentialValue: `${formatPrice(item.marketPrice.min)} - ${formatPrice(item.marketPrice.max)}`,
      });
      return;
    }

    // 3. Format premium sous-évalué
    const premiumFormats = ["steelbook", "collector", "4k"];
    if (premiumFormats.includes(item.format.toLowerCase()) && marketPrice >= 4000) {
      gems.push({
        item,
        reason: `${formatLabels[item.format.toLowerCase()]?.label || item.format} recherché`,
        reasonIcon: "undervalued",
        potentialValue: `${formatPrice(item.marketPrice.min)} - ${formatPrice(item.marketPrice.max)}`,
      });
      return;
    }

    // 4. Prix max très supérieur à la médiane (potentiel de revente)
    if (item.marketPrice.max > marketPrice * 1.5 && marketPrice >= 2000) {
      gems.push({
        item,
        reason: "Potentiel de revente élevé",
        reasonIcon: "trending",
        potentialValue: `Jusqu'à ${formatPrice(item.marketPrice.max)}`,
      });
    }
  });

  // Trier par potentiel (profitPercent si disponible, sinon par prix max)
  return gems
    .sort((a, b) => {
      if (a.profitPercent && b.profitPercent) return b.profitPercent - a.profitPercent;
      const aMax = a.item.marketPrice?.max || 0;
      const bMax = b.item.marketPrice?.max || 0;
      return bMax - aMax;
    })
    .slice(0, 5);
};

// ============================================
// Gem Item Component
// ============================================

const GemItem = ({ gem, onClick }: { gem: HiddenGem; onClick?: () => void }) => {
  const format = formatLabels[gem.item.format.toLowerCase()] || formatLabels.dvd;
  const ReasonIcon = reasonConfig[gem.reasonIcon].icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg",
        "bg-pink-500/5 hover:bg-pink-500/10 transition-all duration-200",
        "border border-pink-500/10 hover:border-pink-500/30",
        "group cursor-pointer",
      )}
      onClick={onClick}
    >
      {/* Poster */}
      <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-lg">
        {gem.item.posterPath ? (
          <img
            src={getImageUrl(gem.item.posterPath, "w92")}
            alt={gem.item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <Package className="w-6 h-6 text-zinc-600" />
          </div>
        )}
        {/* Gem indicator */}
        <div
          className={cn(
            "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
            reasonConfig[gem.reasonIcon].bgColor,
          )}
        >
          <Gem className={cn("w-3 h-3", reasonConfig[gem.reasonIcon].color)} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-sm text-pink-100 truncate group-hover:text-pink-400 transition-colors">
            {gem.item.title}
          </h4>
          <a
            href={getEbaySearchUrl(gem.item.title, gem.item.format)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <ArrowUpRight className="h-4 w-4 text-pink-500 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        {/* Format + Reason */}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", format.color)}>
            {format.label}
          </Badge>
          <span className={cn("text-[10px] flex items-center gap-1", reasonConfig[gem.reasonIcon].color)}>
            <ReasonIcon className="w-3 h-3" />
            {gem.reason}
          </span>
        </div>

        {/* Value + Links */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs font-mono bg-black/40 px-1.5 py-0.5 rounded text-pink-200 border border-pink-500/20">
            Est. {gem.potentialValue}
          </span>
          <a
            href={getEbaySearchUrl(gem.item.title, gem.item.format, true)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-pink-300 transition-colors"
          >
            <Search className="w-3 h-3" />
            Ventes eBay
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Loading Skeleton
// ============================================

const LoadingSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-start gap-3 p-3">
        <div className="w-12 h-16 rounded-lg bg-pink-500/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-pink-500/10 rounded" />
          <div className="h-3 w-1/2 bg-pink-500/10 rounded" />
          <div className="h-5 w-24 bg-pink-500/10 rounded" />
        </div>
      </div>
    ))}
  </div>
);

// ============================================
// Empty State
// ============================================

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Gem className="w-12 h-12 text-zinc-700 mb-3" />
    <p className="text-sm text-zinc-500">Pas de pépites identifiées</p>
    <p className="text-xs text-zinc-600 mt-1 max-w-xs">
      Les films avec forte plus-value ou éditions rares apparaîtront ici. Ajoutez vos prix d'achat pour un meilleur
      tracking.
    </p>
  </div>
);

// ============================================
// Main Component
// ============================================

export const HiddenGemsWidget = ({ items, loading = false, onMovieClick, className }: HiddenGemsWidgetProps) => {
  const gems = identifyHiddenGems(items);

  // Total potential value
  const totalPotentialMax = gems.reduce((sum, gem) => sum + (gem.item.marketPrice?.max || 0), 0);

  return (
    <Card className={cn("bg-black/40 border-pink-500/20 backdrop-blur-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-pink-100">
            <Gem className="h-5 w-5 text-pink-500" />
            Pépites de votre Collection
          </CardTitle>
          {gems.length > 0 && (
            <Badge variant="outline" className="text-[10px] bg-pink-500/10 border-pink-500/30 text-pink-300">
              {gems.length} identifiée{gems.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <p className="text-xs text-zinc-500 mt-1">Films avec fort potentiel de revente ou éditions recherchées</p>
      </CardHeader>

      <CardContent>
        {loading ? (
          <LoadingSkeleton />
        ) : gems.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollArea className="h-[350px] pr-2">
            <div className="space-y-3">
              {gems.map((gem) => (
                <GemItem
                  key={`${gem.item.tmdbId}-${gem.item.format}`}
                  gem={gem}
                  onClick={() => onMovieClick?.(gem.item.tmdbId)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {gems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-pink-500/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500">Potentiel total max</span>
              <span className="font-bold text-pink-400">{formatPrice(totalPotentialMax)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
