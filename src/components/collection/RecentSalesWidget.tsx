/**
 * CineVault - RecentSalesWidget
 * 
 * Widget premium affichant les dernières ventes eBay
 * pour les films de la collection de l'utilisateur
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  ExternalLink,
  Clock,
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
  ChevronRight,
  Gavel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getImageUrl } from "@/services/tmdb";

// ============================================
// Types
// ============================================

interface RecentSale {
  id: string;
  tmdbId: number;
  title: string;
  format: string;
  posterPath?: string;
  soldPrice: number; // en centimes
  estimatedPrice?: number; // prix estimé de la collection
  soldDate: string;
  condition?: string;
  ebayUrl?: string;
}

interface RecentSalesWidgetProps {
  sales: RecentSale[];
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

// ============================================
// Sale Item Component
// ============================================

function SaleItem({ sale, index }: { sale: RecentSale; index: number }) {
  const priceDiff = sale.estimatedPrice
    ? ((sale.soldPrice - sale.estimatedPrice) / sale.estimatedPrice) * 100
    : 0;

  const isAboveEstimate = priceDiff > 5;
  const isBelowEstimate = priceDiff < -5;

  // Time ago
  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  // Format label
  const formatLabels: Record<string, { label: string; color: string }> = {
    "4k": { label: "4K UHD", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
    bluray: { label: "Blu-ray", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    dvd: { label: "DVD", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" },
    steelbook: { label: "Steelbook", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    collector: { label: "Collector", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  };

  const formatInfo = formatLabels[sale.format.toLowerCase()] || formatLabels.dvd;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(
        "group relative flex items-center gap-3 p-3 rounded-xl",
        "bg-white/[0.02] hover:bg-white/[0.05]",
        "border border-transparent hover:border-white/10",
        "transition-all duration-200 cursor-pointer"
      )}
      onClick={() => sale.ebayUrl && window.open(sale.ebayUrl, "_blank")}
    >
      {/* Poster */}
      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
        {sale.posterPath ? (
          <img
            src={getImageUrl(sale.posterPath, "w92")}
            alt={sale.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-zinc-600" />
          </div>
        )}
        
        {/* Format badge overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
          <span className="text-[8px] font-medium text-white/80">
            {formatInfo.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
          {sale.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {getTimeAgo(sale.soldDate)}
          </span>
          {sale.condition && (
            <span className="text-[10px] text-zinc-500">
              • {sale.condition}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
          }).format(sale.soldPrice / 100)}
        </p>
        
        {/* Price comparison */}
        {sale.estimatedPrice && priceDiff !== 0 && (
          <div
            className={cn(
              "flex items-center justify-end gap-1 mt-0.5",
              isAboveEstimate
                ? "text-green-400"
                : isBelowEstimate
                  ? "text-red-400"
                  : "text-zinc-500"
            )}
          >
            {isAboveEstimate ? (
              <TrendingUp className="w-3 h-3" />
            ) : isBelowEstimate ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            <span className="text-[10px] font-medium">
              {priceDiff > 0 ? "+" : ""}
              {priceDiff.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* External link indicator */}
      {sale.ebayUrl && (
        <ExternalLink className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      )}
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function RecentSalesWidget({
  sales,
  loading = false,
  onRefresh,
  className,
}: RecentSalesWidgetProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing || !onRefresh) return;
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Stats
  const totalSales = sales.length;
  const avgPrice =
    totalSales > 0
      ? sales.reduce((sum, s) => sum + s.soldPrice, 0) / totalSales
      : 0;

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-2xl p-6",
          "bg-gradient-to-br from-zinc-900/80 to-zinc-800/40",
          "border border-white/10 backdrop-blur-xl",
          className
        )}
      >
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="h-6 w-40 bg-white/10 rounded" />
            <div className="h-8 w-20 bg-white/10 rounded" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-12 h-16 bg-white/10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-white/10 rounded" />
                <div className="h-3 w-1/2 bg-white/10 rounded" />
              </div>
              <div className="h-5 w-16 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-800/50",
        "border border-white/10 backdrop-blur-xl",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Gavel className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">
                Dernières Ventes eBay
              </h3>
              <p className="text-[10px] text-zinc-500">
                Films similaires à votre collection
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <RefreshCw
              className={cn("w-4 h-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>

        {/* Quick stats */}
        {totalSales > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Ventes:</span>
              <span className="text-xs font-semibold text-white">
                {totalSales}
              </span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Prix moyen:</span>
              <span className="text-xs font-semibold text-white">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(avgPrice / 100)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sales list */}
      <ScrollArea className="h-80">
        <div className="p-4 space-y-1">
          {sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">
                Aucune vente récente trouvée
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Les ventes apparaîtront ici quand des films similaires seront vendus
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {sales.map((sale, index) => (
                <SaleItem key={sale.id} sale={sale} index={index} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {sales.length > 0 && (
        <div className="p-4 pt-0">
          <Button
            variant="ghost"
            className="w-full text-xs text-zinc-500 hover:text-white"
          >
            Voir toutes les ventes
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Mock Data Generator (for demo)
// ============================================

export function generateMockSales(count: number = 10): RecentSale[] {
  const titles = [
    "Interstellar",
    "The Dark Knight",
    "Inception",
    "Blade Runner 2049",
    "Dune",
    "Oppenheimer",
    "Mad Max: Fury Road",
    "The Matrix",
    "Pulp Fiction",
    "Fight Club",
  ];

  const formats = ["4k", "bluray", "steelbook", "collector", "dvd"];
  const conditions = ["Comme neuf", "Très bon état", "Bon état", "État correct"];

  return Array.from({ length: count }, (_, i) => {
    const format = formats[Math.floor(Math.random() * formats.length)];
    const basePrice =
      format === "4k"
        ? 2500
        : format === "steelbook"
          ? 3500
          : format === "collector"
            ? 5000
            : format === "bluray"
              ? 1500
              : 800;

    const soldPrice = Math.round(
      basePrice * (0.7 + Math.random() * 0.6)
    );
    const estimatedPrice = Math.round(basePrice * (0.9 + Math.random() * 0.2));

    const daysAgo = Math.floor(Math.random() * 14);
    const soldDate = new Date();
    soldDate.setDate(soldDate.getDate() - daysAgo);

    return {
      id: `sale-${i}`,
      tmdbId: 100 + i,
      title: titles[i % titles.length],
      format,
      posterPath: null,
      soldPrice,
      estimatedPrice,
      soldDate: soldDate.toISOString(),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      ebayUrl: "https://www.ebay.fr",
    };
  });
}
