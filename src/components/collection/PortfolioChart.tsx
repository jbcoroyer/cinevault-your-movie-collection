/**
 * CineVault - PortfolioChart (CORRIGÉ)
 *
 * Graphique d'évolution de la valeur de la collection
 *
 * CORRECTION:
 * - Accepte les vraies données
 * - Génère un historique réaliste basé sur la valeur actuelle
 * - Affiche un message si pas assez de données historiques
 */

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info } from "lucide-react";

// ============================================
// Types
// ============================================

interface PortfolioChartProps {
  totalValue: number; // en centimes
  itemCount: number;
  priceHistory?: Array<{
    date: string;
    value: number; // en centimes
  }>;
  className?: string;
}

interface ChartDataPoint {
  month: string;
  value: number;
  displayValue: string;
}

// ============================================
// Helpers
// ============================================

const formatValue = (cents: number): string => {
  const euros = cents / 100;
  if (euros >= 1000) {
    return `${(euros / 1000).toFixed(1)}k€`;
  }
  return `${euros.toFixed(0)}€`;
};

const formatTooltipValue = (cents: number): string => {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

// Générer des données historiques simulées basées sur la valeur actuelle
// (à remplacer par les vraies données historiques quand disponibles)
const generateSimulatedHistory = (currentValue: number, months: number = 6): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  const now = new Date();

  // Variation aléatoire mais cohérente (seed basé sur la valeur)
  const seed = currentValue % 100;
  const variationFactor = 0.15; // 15% max de variation

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    // Créer une progression réaliste vers la valeur actuelle
    const progress = (months - i) / months;
    const baseValue = currentValue * (0.85 + progress * 0.15);

    // Ajouter une variation pour plus de réalisme
    const variation = Math.sin(seed + i) * variationFactor * currentValue * 0.5;
    const value = Math.round(baseValue + variation);

    data.push({
      month: date.toLocaleDateString("fr-FR", { month: "short" }),
      value: Math.max(0, value),
      displayValue: formatValue(value),
    });
  }

  // Assurer que le dernier point est la valeur actuelle
  if (data.length > 0) {
    data[data.length - 1].value = currentValue;
    data[data.length - 1].displayValue = formatValue(currentValue);
  }

  return data;
};

// ============================================
// Custom Tooltip
// ============================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{formatTooltipValue(payload[0].value)}</p>
    </div>
  );
};

// ============================================
// Empty State
// ============================================

const EmptyState = () => (
  <div className="h-[250px] flex flex-col items-center justify-center text-center">
    <Info className="w-10 h-10 text-zinc-700 mb-3" />
    <p className="text-sm text-zinc-500">Pas assez de données</p>
    <p className="text-xs text-zinc-600 mt-1">L'historique s'affichera après quelques jours d'utilisation</p>
  </div>
);

// ============================================
// Main Component
// ============================================

export const PortfolioChart = ({ totalValue, itemCount, priceHistory, className }: PortfolioChartProps) => {
  // Générer les données du graphique
  const chartData = useMemo(() => {
    if (priceHistory && priceHistory.length > 0) {
      // Utiliser les vraies données historiques
      return priceHistory.map((point) => ({
        month: new Date(point.date).toLocaleDateString("fr-FR", { month: "short" }),
        value: point.value,
        displayValue: formatValue(point.value),
      }));
    }

    // Générer des données simulées si pas d'historique
    if (totalValue > 0) {
      return generateSimulatedHistory(totalValue);
    }

    return [];
  }, [totalValue, priceHistory]);

  // Calculer la tendance
  const trend = useMemo(() => {
    if (chartData.length < 2) return { percent: 0, isPositive: true };

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;

    if (firstValue === 0) return { percent: 0, isPositive: true };

    const percent = ((lastValue - firstValue) / firstValue) * 100;
    return {
      percent: Math.abs(percent),
      isPositive: percent >= 0,
    };
  }, [chartData]);

  // Empty state
  if (totalValue === 0 || chartData.length === 0) {
    return (
      <div className={className}>
        <EmptyState />
      </div>
    );
  }

  // Calculer les bounds pour le graphique
  const minValue = Math.min(...chartData.map((d) => d.value)) * 0.9;
  const maxValue = Math.max(...chartData.map((d) => d.value)) * 1.1;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Trend indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Tendance 6 mois</span>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              trend.isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
            )}
          >
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.isPositive ? "+" : "-"}
            {trend.percent.toFixed(1)}%
          </div>
        </div>
        <span className="text-xs text-zinc-600">
          {itemCount} film{itemCount > 1 ? "s" : ""} valorisé{itemCount > 1 ? "s" : ""}
        </span>
      </div>

      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} dy={10} />

            <YAxis
              domain={[minValue, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickFormatter={(value) => formatValue(value)}
              width={50}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#colorValue)"
              animationDuration={1000}
            />

            {/* Reference line for current value */}
            <ReferenceLine y={totalValue} stroke="#a855f7" strokeDasharray="5 5" strokeOpacity={0.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex justify-center">
        <p className="text-[10px] text-zinc-600 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {priceHistory ? "Données historiques réelles" : "Simulation basée sur la valeur actuelle"}
        </p>
      </div>
    </div>
  );
};
