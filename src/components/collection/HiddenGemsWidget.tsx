/**
 * CineVault - HiddenGemsWidget
 * 
 * Widget premium affichant les "pépites" de la collection
 * Films sous-évalués, rares ou avec fort potentiel de plus-value
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gem,
  Sparkles,
  TrendingUp,
  Star,
  Clock,
  Eye,
  ChevronRight,
  Info,
  Zap,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { getImageUrl } from "@/services/tmdb";

// ============================================
// Types
// ============================================

type GemType = "undervalued" | "rare" | "trending" | "classic";

interface HiddenGem {
  tmdbId: number;
  title: string;
  format: string;
  posterPath?: string;
  currentPrice: number; // en centimes
  estimatedPotential?: number; // prix potentiel estimé
  rarity: number; // 1-5, 5 étant le plus rare
  gemType: GemType;
  reason: string;
  lastSaleDate?: string;
  marketDemand?: "high" | "medium" | "low";
}

interface HiddenGemsWidgetProps {
  gems: HiddenGem[];
  loading?: boolean;
  onMovieClick?: (tmdbId: number) => void;
  className?: string;
}

// ============================================
// Gem Type Config
// ============================================

const GEM_TYPE_CONFIG: Record<
  GemType,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  undervalued: {
    label: "Sous-évalué",
    icon: Target,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  rare: {
    label: "Rare",
    icon: Gem,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  trending: {
    label: "Tendance",
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  classic: {
    label: "Classique",
    icon: Star,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
};

// ============================================
// Rarity Stars Component
// ============================================

function RarityStars({ rarity }: { rarity: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3",
            i < rarity
              ? "text-amber-400 fill-amber-400"
              : "text-zinc-700"
          )}
        />
      ))}
    </div>
  );
}

// ============================================
// Demand Indicator
// ============================================

function DemandIndicator({
  demand,
}: {
  demand: "high" | "medium" | "low";
}) {
  const config = {
    high: { label: "Forte demande", color: "text-green-400", bars: 3 },
    medium: { label: "Demande moyenne", color: "text-amber-400", bars: 2 },
    low: { label: "Faible demande", color: "text-zinc-500", bars: 1 },
  };

  const { label, color, bars } = config[demand];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all",
                  i < bars ? color : "bg-zinc-800",
                  i < bars ? "h-3" : "h-2"
                )}
                style={{
                  backgroundColor: i < bars ? undefined : undefined,
                }}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// Gem Card Component
// ============================================

function GemCard({
  gem,
  index,
  onClick,
}: {
  gem: HiddenGem;
  index: number;
  onClick?: () => void;
}) {
  const config = GEM_TYPE_CONFIG[gem.gemType];
  const Icon = config.icon;

  // Potential upside
  const potentialUpside = gem.estimatedPotential
    ? ((gem.estimatedPotential - gem.currentPrice) / gem.currentPrice) * 100
    : 0;

  // Format label
  const formatLabels: Record<string, string> = {
    "4k": "4K UHD",
    bluray: "Blu-ray",
    dvd: "DVD",
    steelbook: "Steelbook",
    collector: "Collector",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "group relative overflow-hidden rounded-xl cursor-pointer",
        "bg-gradient-to-br from-white/[0.03] to-transparent",
        "border border-white/10 hover:border-white/20",
        "transition-all duration-300 hover:shadow-xl hover:shadow-black/20"
      )}
      onClick={onClick}
    >
      {/* Glow effect */}
      <div
        className={cn(
          "absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
          gem.gemType === "undervalued"
            ? "bg-emerald-500"
            : gem.gemType === "rare"
              ? "bg-purple-500"
              : gem.gemType === "trending"
                ? "bg-amber-500"
                : "bg-blue-500"
        )}
      />

      <div className="relative p-4">
        <div className="flex gap-4">
          {/* Poster */}
          <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
            {gem.posterPath ? (
              <img
                src={getImageUrl(gem.posterPath, "w154")}
                alt={gem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                <Gem className="w-6 h-6 text-zinc-600" />
              </div>
            )}

            {/* Gem type badge */}
            <div
              className={cn(
                "absolute top-1 left-1 p-1 rounded",
                config.bgColor,
                "backdrop-blur-sm"
              )}
            >
              <Icon className={cn("w-3 h-3", config.color)} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                  {gem.title}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {formatLabels[gem.format.toLowerCase()] || gem.format}
                </p>
              </div>

              {/* Rarity */}
              <RarityStars rarity={gem.rarity} />
            </div>

            {/* Gem type badge */}
            <Badge
              variant="outline"
              className={cn(
                "mt-2 text-[10px]",
                config.color,
                config.borderColor,
                config.bgColor
              )}
            >
              {config.label}
            </Badge>

            {/* Reason */}
            <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2">
              {gem.reason}
            </p>
          </div>
        </div>

        {/* Footer stats */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Valeur actuelle
            </p>
            <p className="text-sm font-bold text-white mt-0.5">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0,
              }).format(gem.currentPrice / 100)}
            </p>
          </div>

          {gem.estimatedPotential && potentialUpside > 0 && (
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                Potentiel
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-sm font-bold text-green-400">
                  +{potentialUpside.toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {gem.marketDemand && (
            <DemandIndicator demand={gem.marketDemand} />
          )}
        </div>
      </div>

      {/* Hover arrow */}
      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function HiddenGemsWidget({
  gems,
  loading = false,
  onMovieClick,
  className,
}: HiddenGemsWidgetProps) {
  // Group gems by type
  const gemsByType = gems.reduce(
    (acc, gem) => {
      if (!acc[gem.gemType]) acc[gem.gemType] = [];
      acc[gem.gemType].push(gem);
      return acc;
    },
    {} as Record<GemType, HiddenGem[]>
  );

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
            <div className="h-6 w-20 bg-white/10 rounded" />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-800/50",
        "border border-white/10 backdrop-blur-xl",
        className
      )}
    >
      {/* Ambient glow */}
      <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl opacity-10 bg-purple-500" />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-10 bg-amber-500" />

      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-amber-500/20 border border-purple-500/20">
              <Gem className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white flex items-center gap-2">
                Pépites Cachées
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-[10px] text-zinc-500">
                {gems.length} opportunité{gems.length > 1 ? "s" : ""} détectée
                {gems.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="w-4 h-4 text-zinc-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-[250px]">
                <p className="text-xs">
                  Les pépites sont des films de votre collection qui pourraient
                  prendre de la valeur : éditions rares, films sous-évalués,
                  ou tendances du marché.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Quick filters */}
        {gems.length > 0 && (
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
            {(Object.keys(gemsByType) as GemType[]).map((type) => {
              const config = GEM_TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <Badge
                  key={type}
                  variant="outline"
                  className={cn(
                    "text-[10px] gap-1 flex-shrink-0",
                    config.color,
                    config.borderColor,
                    config.bgColor
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                  <span className="opacity-60">({gemsByType[type].length})</span>
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      {/* Gems list */}
      <ScrollArea className="h-[420px]">
        <div className="p-4 space-y-3">
          {gems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 rounded-full bg-purple-500/10 mb-4">
                <Gem className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-sm text-zinc-400 font-medium">
                Aucune pépite détectée
              </p>
              <p className="text-xs text-zinc-600 mt-2 max-w-[200px]">
                Ajoutez plus de films à votre collection pour découvrir des
                opportunités
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {gems.map((gem, index) => (
                <GemCard
                  key={`${gem.tmdbId}-${gem.format}`}
                  gem={gem}
                  index={index}
                  onClick={() => onMovieClick?.(gem.tmdbId)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

// ============================================
// Mock Data Generator (for demo)
// ============================================

export function generateMockGems(): HiddenGem[] {
  return [
    {
      tmdbId: 157336,
      title: "Interstellar",
      format: "steelbook",
      posterPath: null,
      currentPrice: 4500,
      estimatedPotential: 7500,
      rarity: 4,
      gemType: "rare",
      reason:
        "Édition Steelbook FNAC exclusive, très recherchée par les collectionneurs",
      marketDemand: "high",
    },
    {
      tmdbId: 27205,
      title: "Inception",
      format: "4k",
      posterPath: null,
      currentPrice: 1800,
      estimatedPotential: 3000,
      rarity: 3,
      gemType: "undervalued",
      reason:
        "Prix actuel inférieur à la moyenne du marché. Forte demande constatée",
      marketDemand: "high",
    },
    {
      tmdbId: 438631,
      title: "Dune",
      format: "collector",
      posterPath: null,
      currentPrice: 8900,
      estimatedPotential: 12000,
      rarity: 5,
      gemType: "trending",
      reason:
        "Intérêt croissant suite à la sortie de Dune 2. Édition collector épuisée",
      marketDemand: "high",
    },
    {
      tmdbId: 155,
      title: "The Dark Knight",
      format: "bluray",
      posterPath: null,
      currentPrice: 1200,
      rarity: 2,
      gemType: "classic",
      reason:
        "Film culte qui maintient sa valeur. Potentiel de réédition collector",
      marketDemand: "medium",
    },
  ];
}
