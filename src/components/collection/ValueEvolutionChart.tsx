/**
 * CineVault - Value Evolution Chart
 * 
 * Graphique d'évolution des prix sur 30/90/365 jours
 * Avec animations et interactions premium
 */

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  PriceHistoryPoint,
  getPriceHistory,
  formatPrice,
  centsToEuros,
} from "@/services/priceService";

// ============================================
// Types
// ============================================

interface ValueEvolutionChartProps {
  tmdbId: number;
  format: string;
  title: string;
  purchasePrice?: number; // En centimes
  currentPrice?: number;  // En centimes
  className?: string;
}

type TimeRange = "7d" | "30d" | "90d" | "365d";

// ============================================
// Custom Tooltip
// ============================================

const CustomTooltip = ({
  active,
  payload,
  label,
  purchasePrice,
}: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const priceMedian = data.priceMedian;
  const profitLoss = purchasePrice ? priceMedian - purchasePrice : null;
  const profitPercent = purchasePrice 
    ? Math.round(((priceMedian - purchasePrice) / purchasePrice) * 100)
    : null;

  return (
    <div className="bg-card/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">
        {new Date(label).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
      <p className="text-lg font-bold">{formatPrice(priceMedian)}</p>
      {data.priceMin && data.priceMax && (
        <p className="text-xs text-muted-foreground">
          {formatPrice(data.priceMin)} - {formatPrice(data.priceMax)}
        </p>
      )}
      {profitLoss !== null && (
        <p
          className={cn(
            "text-xs font-medium mt-1",
            profitLoss > 0 ? "text-green-500" : profitLoss < 0 ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {profitLoss > 0 ? "+" : ""}
          {formatPrice(profitLoss)} ({profitPercent! > 0 ? "+" : ""}{profitPercent}%)
        </p>
      )}
    </div>
  );
};

// ============================================
// Component
// ============================================

export function ValueEvolutionChart({
  tmdbId,
  format,
  title,
  purchasePrice,
  currentPrice,
  className,
}: ValueEvolutionChartProps) {
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Map time range to days
  const daysMap: Record<TimeRange, number> = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
  };

  // Load price history
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const data = await getPriceHistory(tmdbId, format, daysMap[timeRange]);
      setHistory(data);
      setLoading(false);
    };
    loadHistory();
  }, [tmdbId, format, timeRange]);

  // Calculate stats
  const stats = useMemo(() => {
    if (history.length === 0) return null;

    const prices = history.map((h) => h.priceMedian);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercent = Math.round((change / firstPrice) * 100);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    return {
      firstPrice,
      lastPrice,
      change,
      changePercent,
      minPrice,
      maxPrice,
      avgPrice,
      trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    };
  }, [history]);

  // Chart data with euro conversion for display (handle null values)
  const chartData = useMemo(() => {
    return history.map((h) => ({
      date: h.date,
      priceMedian: h.priceMedian,
      priceMin: h.priceMin ?? h.priceMedian,
      priceMax: h.priceMax ?? h.priceMedian,
      // For chart display (in euros)
      median: centsToEuros(h.priceMedian),
      min: h.priceMin ? centsToEuros(h.priceMin) : centsToEuros(h.priceMedian),
      max: h.priceMax ? centsToEuros(h.priceMax) : centsToEuros(h.priceMedian),
    }));
  }, [history]);

  // Chart colors using HSL tokens
  const chartColor =
    stats?.trend === "up"
      ? "hsl(142, 71%, 45%)"
      : stats?.trend === "down"
      ? "hsl(0, 84%, 60%)"
      : "hsl(var(--primary))";

  const gradientId = `gradient-${tmdbId}-${format}`;

  // ============================================
  // Loading State
  // ============================================

  if (loading) {
    return (
      <GlassCard className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </GlassCard>
    );
  }

  // ============================================
  // Empty State
  // ============================================

  if (history.length === 0) {
    return (
      <GlassCard className={cn("p-4", className)}>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-sm">Évolution du Prix</h4>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Pas encore d'historique disponible
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Les données seront collectées quotidiennement
          </p>
        </div>
      </GlassCard>
    );
  }

  // ============================================
  // Main Render
  // ============================================

  return (
    <GlassCard className={cn("p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-sm">Évolution du Prix</h4>
          {stats && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                stats.trend === "up" && "border-green-500 text-green-500",
                stats.trend === "down" && "border-red-500 text-red-500"
              )}
            >
              {stats.trend === "up" ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : stats.trend === "down" ? (
                <TrendingDown className="w-3 h-3 mr-1" />
              ) : (
                <Minus className="w-3 h-3 mr-1" />
              )}
              {stats.changePercent > 0 ? "+" : ""}
              {stats.changePercent}%
            </Badge>
          )}
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <StatBox
            label="Début"
            value={formatPrice(stats.firstPrice)}
            className="text-muted-foreground"
          />
          <StatBox
            label="Fin"
            value={formatPrice(stats.lastPrice)}
            className={cn(
              stats.trend === "up" && "text-green-500",
              stats.trend === "down" && "text-red-500"
            )}
          />
          <StatBox label="Min" value={formatPrice(stats.minPrice)} />
          <StatBox label="Max" value={formatPrice(stats.maxPrice)} />
        </div>
      )}

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={chartColor}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={chartColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              tickFormatter={(date) =>
                new Date(date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })
              }
              interval="preserveStartEnd"
              minTickGap={30}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              tickFormatter={(value) => `${value}€`}
              width={40}
              domain={["dataMin - 1", "dataMax + 1"]}
            />

            <Tooltip
              content={<CustomTooltip purchasePrice={purchasePrice} />}
              cursor={{
                stroke: "rgba(255,255,255,0.2)",
                strokeDasharray: "4 4",
              }}
            />

            {/* Purchase price reference line */}
            {purchasePrice && (
              <ReferenceLine
                y={centsToEuros(purchasePrice)}
                stroke="rgba(255,255,255,0.3)"
                strokeDasharray="4 4"
                label={{
                  value: "Achat",
                  position: "right",
                  fill: "rgba(255,255,255,0.4)",
                  fontSize: 10,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="median"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 4,
                fill: chartColor,
                stroke: "white",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span
            className="w-3 h-0.5 rounded-full"
            style={{ backgroundColor: chartColor }}
          />
          Prix médian
        </span>
        {purchasePrice && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded-full bg-white/30" />
            Prix d'achat
          </span>
        )}
      </div>
    </GlassCard>
  );
}

// ============================================
// Sub-components
// ============================================

const TimeRangeSelector = ({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) => {
  const ranges: TimeRange[] = ["7d", "30d", "90d", "365d"];
  const labels: Record<TimeRange, string> = {
    "7d": "7j",
    "30d": "30j",
    "90d": "90j",
    "365d": "1an",
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-md transition-all",
            value === range
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {labels[range]}
        </button>
      ))}
    </div>
  );
};

const StatBox = ({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div className="text-center">
    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
      {label}
    </p>
    <p className={cn("text-sm font-semibold", className)}>{value}</p>
  </div>
);

// ============================================
// Collection Value Chart (Aggregate)
// ============================================

interface CollectionValueChartProps {
  userId: string;
  className?: string;
}

export function CollectionValueChart({
  userId,
  className,
}: CollectionValueChartProps) {
  // TODO: Implement aggregate collection value chart
  // This would track the total collection value over time
  
  return (
    <GlassCard className={cn("p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm">Évolution Valeur Collection</h4>
      </div>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Bientôt disponible</p>
        <p className="text-xs text-muted-foreground mt-1">
          Suivez l'évolution de votre collection au fil du temps
        </p>
      </div>
    </GlassCard>
  );
}
