/**
 * CineVault - PortfolioValueCard
 * 
 * Carte premium affichant la valeur totale du portfolio
 * Style banque en ligne avec animations fluides
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ============================================
// Types
// ============================================

interface PortfolioValueCardProps {
  totalValue: number; // en centimes
  previousValue?: number; // pour calculer l'évolution
  totalInvested?: number; // prix d'achat total
  itemsCount: number;
  itemsWithPrice: number;
  loading?: boolean;
  className?: string;
}

type TrendDirection = "up" | "down" | "neutral";

// ============================================
// Animated Counter Component
// ============================================

function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const springValue = useSpring(0, {
    stiffness: 75,
    damping: 30,
  });

  const displayValue = useTransform(springValue, (v) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v)
  );

  useEffect(() => {
    springValue.set(value / 100);
  }, [value, springValue]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}

// ============================================
// Mini Sparkline Component
// ============================================

function MiniSparkline({
  trend,
  className,
}: {
  trend: TrendDirection;
  className?: string;
}) {
  const points =
    trend === "up"
      ? "0,20 10,15 20,18 30,12 40,14 50,8 60,10 70,5 80,7 90,3 100,0"
      : trend === "down"
        ? "0,0 10,3 20,2 30,8 40,6 50,12 60,10 70,15 80,13 90,18 100,20"
        : "0,10 10,11 20,9 30,10 40,10 50,11 60,9 70,10 80,10 90,11 100,10";

  return (
    <svg
      viewBox="0 0 100 20"
      className={cn("h-8 w-24", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={`sparkline-gradient-${trend}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor={
              trend === "up"
                ? "#22c55e"
                : trend === "down"
                  ? "#ef4444"
                  : "#a1a1aa"
            }
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor={
              trend === "up"
                ? "#22c55e"
                : trend === "down"
                  ? "#ef4444"
                  : "#a1a1aa"
            }
            stopOpacity="1"
          />
        </linearGradient>
      </defs>
      <motion.polyline
        points={points}
        fill="none"
        stroke={`url(#sparkline-gradient-${trend})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

// ============================================
// Main Component
// ============================================

export function PortfolioValueCard({
  totalValue,
  previousValue,
  totalInvested,
  itemsCount,
  itemsWithPrice,
  loading = false,
  className,
}: PortfolioValueCardProps) {
  // Calculate evolution
  const evolution = previousValue
    ? ((totalValue - previousValue) / previousValue) * 100
    : 0;

  const absoluteChange = previousValue ? totalValue - previousValue : 0;

  // Calculate profit/loss vs invested
  const profitLoss = totalInvested ? totalValue - totalInvested : 0;
  const profitLossPercent = totalInvested
    ? ((totalValue - totalInvested) / totalInvested) * 100
    : 0;

  // Determine trend
  const trend: TrendDirection =
    profitLoss > 0 ? "up" : profitLoss < 0 ? "down" : "neutral";

  // Coverage percentage
  const coverage = itemsCount > 0 ? (itemsWithPrice / itemsCount) * 100 : 0;

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          "bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40",
          "border border-white/10 backdrop-blur-xl",
          className
        )}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-12 w-48 bg-white/10 rounded" />
          <div className="h-6 w-40 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-800/50",
        "border border-white/10 backdrop-blur-xl",
        "shadow-2xl shadow-black/20",
        className
      )}
    >
      {/* Ambient glow effect */}
      <div
        className={cn(
          "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20",
          trend === "up"
            ? "bg-green-500"
            : trend === "down"
              ? "bg-red-500"
              : "bg-amber-500"
        )}
      />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full blur-2xl opacity-10 bg-primary" />

      {/* Content */}
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl",
                "bg-gradient-to-br from-amber-500/20 to-amber-600/10",
                "border border-amber-500/20"
              )}
            >
              <Wallet className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-400">
                Valeur du Portfolio
              </h3>
              <p className="text-[10px] text-zinc-500">
                {itemsWithPrice} / {itemsCount} films valorisés
              </p>
            </div>
          </div>

          {/* Mini sparkline */}
          <MiniSparkline trend={trend} />
        </div>

        {/* Main Value */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <AnimatedCounter
              value={totalValue}
              className="text-4xl md:text-5xl font-bold tracking-tight text-white"
            />
            
            {/* Evolution badge */}
            {previousValue && evolution !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold",
                  evolution > 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                )}
              >
                {evolution > 0 ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {Math.abs(evolution).toFixed(1)}%
              </motion.div>
            )}
          </div>

          {/* Range */}
          <p className="text-xs text-zinc-500">
            Estimation basée sur les ventes eBay récentes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          {/* Profit/Loss */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                Plus-value
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-zinc-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">
                      Différence entre la valeur actuelle et votre investissement total
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-lg font-semibold",
                  profitLoss > 0
                    ? "text-green-400"
                    : profitLoss < 0
                      ? "text-red-400"
                      : "text-zinc-400"
                )}
              >
                {profitLoss >= 0 ? "+" : ""}
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(profitLoss / 100)}
              </span>
              {profitLoss !== 0 && (
                <span
                  className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    profitLoss > 0
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  )}
                >
                  {profitLossPercent > 0 ? "+" : ""}
                  {profitLossPercent.toFixed(1)}%
                </span>
              )}
            </div>
            {totalInvested && (
              <p className="text-[10px] text-zinc-500">
                vs {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(totalInvested / 100)} investi
              </p>
            )}
          </div>

          {/* Coverage */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              Couverture
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">
                {coverage.toFixed(0)}%
              </span>
              {coverage < 80 && (
                <span className="text-[10px] text-amber-400">
                  {itemsCount - itemsWithPrice} non valorisés
                </span>
              )}
            </div>
            {/* Coverage bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${coverage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  coverage >= 80
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : coverage >= 50
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gradient-to-r from-red-500 to-orange-400"
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Premium indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-400">LIVE</span>
        </div>
      </div>
    </motion.div>
  );
}
