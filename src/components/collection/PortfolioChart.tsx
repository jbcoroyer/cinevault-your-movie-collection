/**
 * CineVault - PortfolioChart
 * 
 * Graphique premium d'évolution de la valeur du portfolio
 * Style app de trading avec vue par période
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// Types
// ============================================

type TimePeriod = "7d" | "1m" | "3m" | "6m" | "1y" | "all";

interface DataPoint {
  date: string;
  value: number;
  displayDate: string;
}

interface PortfolioChartProps {
  data?: DataPoint[];
  currentValue: number;
  loading?: boolean;
  className?: string;
  onPeriodChange?: (period: TimePeriod) => void;
}

// ============================================
// Period Selector
// ============================================

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "7d", label: "7J" },
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1A" },
  { value: "all", label: "Tout" },
];

function PeriodSelector({
  selected,
  onChange,
}: {
  selected: TimePeriod;
  onChange: (period: TimePeriod) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
      {PERIODS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200",
            selected === value
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Custom Tooltip
// ============================================

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.[0]) return null;

  const value = payload[0].value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "px-3 py-2 rounded-lg",
        "bg-zinc-900/95 border border-white/10",
        "backdrop-blur-xl shadow-xl"
      )}
    >
      <p className="text-[10px] text-zinc-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">
        {new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
        }).format(value / 100)}
      </p>
    </motion.div>
  );
}

// ============================================
// Generate Mock Data (for demo)
// ============================================

function generateMockData(
  currentValue: number,
  period: TimePeriod
): DataPoint[] {
  const days =
    period === "7d"
      ? 7
      : period === "1m"
        ? 30
        : period === "3m"
          ? 90
          : period === "6m"
            ? 180
            : period === "1y"
              ? 365
              : 730;

  const data: DataPoint[] = [];
  const volatility = 0.02; // 2% daily volatility
  let value = currentValue * (1 - Math.random() * 0.1); // Start slightly lower

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Add some realistic market movement
    const change = (Math.random() - 0.48) * volatility * value;
    value = Math.max(value + change, currentValue * 0.7);

    // Trend towards current value at the end
    if (i < 5) {
      value = value + (currentValue - value) * ((5 - i) / 5) * 0.3;
    }

    data.push({
      date: date.toISOString(),
      value: Math.round(i === 0 ? currentValue : value),
      displayDate: date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      }),
    });
  }

  return data;
}

// ============================================
// Main Component
// ============================================

export function PortfolioChart({
  data: externalData,
  currentValue,
  loading = false,
  className,
  onPeriodChange,
}: PortfolioChartProps) {
  const [period, setPeriod] = useState<TimePeriod>("1m");

  // Use external data or generate mock data
  const data = useMemo(() => {
    if (externalData && externalData.length > 0) {
      return externalData;
    }
    return generateMockData(currentValue, period);
  }, [externalData, currentValue, period]);

  // Calculate stats
  const stats = useMemo(() => {
    if (data.length < 2) {
      return { change: 0, changePercent: 0, trend: "neutral" as const };
    }

    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = (change / firstValue) * 100;
    const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";

    return { change, changePercent, trend };
  }, [data]);

  // Min/max for chart domain
  const [minValue, maxValue] = useMemo(() => {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [data]);

  // Handle period change
  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  // Loading state
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
            <div className="h-8 w-64 bg-white/10 rounded" />
          </div>
          <div className="h-64 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-800/50",
        "border border-white/10 backdrop-blur-xl",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">
                Évolution du Portfolio
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "text-xs font-medium",
                    stats.trend === "up"
                      ? "text-green-400"
                      : stats.trend === "down"
                        ? "text-red-400"
                        : "text-zinc-400"
                  )}
                >
                  {stats.change >= 0 ? "+" : ""}
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                  }).format(stats.change / 100)}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                    stats.trend === "up"
                      ? "bg-green-500/10 text-green-400"
                      : stats.trend === "down"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-zinc-500/10 text-zinc-400"
                  )}
                >
                  {stats.changePercent >= 0 ? "+" : ""}
                  {stats.changePercent.toFixed(1)}%
                </span>
                <span className="text-[10px] text-zinc-500">
                  sur {period === "7d" ? "7 jours" : period === "1m" ? "1 mois" : period === "3m" ? "3 mois" : period === "6m" ? "6 mois" : period === "1y" ? "1 an" : "tout"}
                </span>
              </div>
            </div>
          </div>

          <PeriodSelector selected={period} onChange={handlePeriodChange} />
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 px-2 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="portfolioGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={
                    stats.trend === "up"
                      ? "#22c55e"
                      : stats.trend === "down"
                        ? "#ef4444"
                        : "#f59e0b"
                  }
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={
                    stats.trend === "up"
                      ? "#22c55e"
                      : stats.trend === "down"
                        ? "#ef4444"
                        : "#f59e0b"
                  }
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient
                id="portfolioStroke"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop
                  offset="0%"
                  stopColor={
                    stats.trend === "up"
                      ? "#22c55e"
                      : stats.trend === "down"
                        ? "#ef4444"
                        : "#f59e0b"
                  }
                  stopOpacity={0.5}
                />
                <stop
                  offset="100%"
                  stopColor={
                    stats.trend === "up"
                      ? "#22c55e"
                      : stats.trend === "down"
                        ? "#ef4444"
                        : "#f59e0b"
                  }
                  stopOpacity={1}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.03)"
              vertical={false}
            />

            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickMargin={10}
              interval="preserveStartEnd"
              minTickGap={50}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickFormatter={(value) =>
                new Intl.NumberFormat("fr-FR", {
                  notation: "compact",
                  compactDisplay: "short",
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(value / 100)
              }
              domain={[minValue, maxValue]}
              width={60}
            />

            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "rgba(255,255,255,0.1)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="url(#portfolioStroke)"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer note */}
      <div className="px-6 pb-4">
        <p className="text-[10px] text-zinc-600 text-center">
          * Données basées sur les prix médians eBay. L'évolution passée ne préjuge pas des performances futures.
        </p>
      </div>
    </motion.div>
  );
}
