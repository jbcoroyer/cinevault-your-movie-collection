/**
 * CineVault - TopGainersWidget
 * 
 * Widget premium affichant les films qui ont le plus gagné en valeur
 * Design style app de trading/investissement
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Crown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getImageUrl } from "@/services/tmdb";

// ============================================
// Types
// ============================================

interface GainerItem {
  tmdbId: number;
  title: string;
  format: string;
  posterPath?: string;
  currentPrice: number; // en centimes
  purchasePrice: number; // en centimes
  profitLoss: number; // en centimes
  profitLossPercent: number;
}

interface TopGainersWidgetProps {
  gainers: GainerItem[];
  losers?: GainerItem[];
  loading?: boolean;
  onMovieClick?: (tmdbId: number) => void;
  className?: string;
}

type ViewMode = "gainers" | "losers";

// ============================================
// Rank Badge Component
// ============================================

function RankBadge({ rank }: { rank: number }) {
  const colors = {
    1: "from-amber-500 to-yellow-500",
    2: "from-zinc-400 to-zinc-300",
    3: "from-amber-700 to-amber-600",
  };

  if (rank <= 3) {
    return (
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center",
          "bg-gradient-to-br text-white text-xs font-bold shadow-lg",
          colors[rank as keyof typeof colors]
        )}
      >
        {rank}
      </div>
    );
  }

  return (
    <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 text-zinc-500 text-xs font-medium">
      {rank}
    </div>
  );
}

// ============================================
// Gainer Item Component
// ============================================

function GainerItemRow({
  item,
  rank,
  isGainer,
  onClick,
}: {
  item: GainerItem;
  rank: number;
  isGainer: boolean;
  onClick?: () => void;
}) {
  // Format label
  const formatLabels: Record<string, { label: string; color: string }> = {
    "4k": { label: "4K", color: "text-purple-400" },
    bluray: { label: "BR", color: "text-blue-400" },
    dvd: { label: "DVD", color: "text-zinc-400" },
    steelbook: { label: "SB", color: "text-amber-400" },
    collector: { label: "CE", color: "text-rose-400" },
  };

  const formatInfo = formatLabels[item.format.toLowerCase()] || formatLabels.dvd;

  return (
    <motion.div
      initial={{ opacity: 0, x: isGainer ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl cursor-pointer",
        "bg-white/[0.02] hover:bg-white/[0.05]",
        "border border-transparent hover:border-white/10",
        "transition-all duration-200"
      )}
      onClick={onClick}
    >
      {/* Rank */}
      <RankBadge rank={rank} />

      {/* Poster */}
      <div className="relative w-10 h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
        {item.posterPath ? (
          <img
            src={getImageUrl(item.posterPath, "w92")}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-lg">🎬</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
          {item.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[10px] font-medium", formatInfo.color)}>
            {formatInfo.label}
          </span>
          <span className="text-[10px] text-zinc-600">•</span>
          <span className="text-[10px] text-zinc-500">
            Acheté{" "}
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              minimumFractionDigits: 0,
            }).format(item.purchasePrice / 100)}
          </span>
        </div>
      </div>

      {/* Performance */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-white">
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
          }).format(item.currentPrice / 100)}
        </p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-0.5",
            isGainer ? "text-green-400" : "text-red-400"
          )}
        >
          {isGainer ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          <span className="text-xs font-semibold">
            {item.profitLossPercent > 0 ? "+" : ""}
            {item.profitLossPercent.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Hover indicator */}
      <ChevronRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

// ============================================
// Summary Stats
// ============================================

function SummaryStats({
  items,
  isGainer,
}: {
  items: GainerItem[];
  isGainer: boolean;
}) {
  if (items.length === 0) return null;

  const totalProfitLoss = items.reduce((sum, i) => sum + i.profitLoss, 0);
  const avgPercent =
    items.reduce((sum, i) => sum + i.profitLossPercent, 0) / items.length;
  const bestPerformer = items[0];

  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/5">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
          Total {isGainer ? "Gains" : "Pertes"}
        </p>
        <p
          className={cn(
            "text-sm font-bold",
            isGainer ? "text-green-400" : "text-red-400"
          )}
        >
          {totalProfitLoss >= 0 ? "+" : ""}
          {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: 0,
          }).format(totalProfitLoss / 100)}
        </p>
      </div>

      <div className="text-center border-x border-white/5">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
          Moyenne
        </p>
        <p
          className={cn(
            "text-sm font-bold",
            isGainer ? "text-green-400" : "text-red-400"
          )}
        >
          {avgPercent >= 0 ? "+" : ""}
          {avgPercent.toFixed(1)}%
        </p>
      </div>

      <div className="text-center">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
          {isGainer ? "Top" : "Pire"}
        </p>
        <p
          className={cn(
            "text-sm font-bold",
            isGainer ? "text-green-400" : "text-red-400"
          )}
        >
          {bestPerformer.profitLossPercent >= 0 ? "+" : ""}
          {bestPerformer.profitLossPercent.toFixed(0)}%
        </p>
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function TopGainersWidget({
  gainers,
  losers = [],
  loading = false,
  onMovieClick,
  className,
}: TopGainersWidgetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("gainers");

  const currentItems = viewMode === "gainers" ? gainers : losers;
  const isGainer = viewMode === "gainers";

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
            <div className="h-8 w-48 bg-white/10 rounded" />
          </div>
          <div className="h-16 bg-white/5 rounded-xl" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 bg-white/10 rounded-full" />
              <div className="w-10 h-14 bg-white/10 rounded-lg" />
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
      transition={{ duration: 0.5, delay: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-800/50",
        "border border-white/10 backdrop-blur-xl",
        className
      )}
    >
      {/* Ambient glow */}
      <div
        className={cn(
          "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-10",
          isGainer ? "bg-green-500" : "bg-red-500"
        )}
      />

      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-xl border",
                isGainer
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              )}
            >
              {isGainer ? (
                <Flame className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">
                {isGainer ? "Top Performers" : "En Baisse"}
              </h3>
              <p className="text-[10px] text-zinc-500">
                {currentItems.length} film{currentItems.length > 1 ? "s" : ""} •
                vs prix d'achat
              </p>
            </div>
          </div>

          {/* View toggle */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            <TabsList className="h-8 bg-white/5 border border-white/10">
              <TabsTrigger
                value="gainers"
                className={cn(
                  "h-6 text-xs gap-1.5 data-[state=active]:bg-green-500/20",
                  "data-[state=active]:text-green-400"
                )}
              >
                <TrendingUp className="w-3 h-3" />
                Gainers
                {gainers.length > 0 && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[10px] border-green-500/30 text-green-400"
                  >
                    {gainers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="losers"
                className={cn(
                  "h-6 text-xs gap-1.5 data-[state=active]:bg-red-500/20",
                  "data-[state=active]:text-red-400"
                )}
              >
                <TrendingDown className="w-3 h-3" />
                Losers
                {losers.length > 0 && (
                  <Badge
                    variant="outline"
                    className="h-4 px-1 text-[10px] border-red-500/30 text-red-400"
                  >
                    {losers.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Summary stats */}
      {currentItems.length > 0 && (
        <div className="px-6 pb-4">
          <SummaryStats items={currentItems} isGainer={isGainer} />
        </div>
      )}

      {/* List */}
      <ScrollArea className="h-[340px]">
        <div className="px-4 pb-4 space-y-1">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {isGainer ? (
                <>
                  <TrendingUp className="w-12 h-12 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">
                    Aucun film en plus-value
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Les films qui prennent de la valeur apparaîtront ici
                  </p>
                </>
              ) : (
                <>
                  <TrendingDown className="w-12 h-12 text-zinc-700 mb-3" />
                  <p className="text-sm text-zinc-500">
                    Aucun film en moins-value
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">
                    Bonne nouvelle ! 🎉
                  </p>
                </>
              )}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {currentItems.map((item, index) => (
                <GainerItemRow
                  key={`${item.tmdbId}-${item.format}`}
                  item={item}
                  rank={index + 1}
                  isGainer={isGainer}
                  onClick={() => onMovieClick?.(item.tmdbId)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
