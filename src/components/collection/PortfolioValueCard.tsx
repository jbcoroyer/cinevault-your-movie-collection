/**
 * CineVault - PortfolioValueCard (CORRIGÉ)
 *
 * Affiche la valeur totale de la collection basée sur les vrais prix eBay
 * CORRECTION: Accepte maintenant les props avec les vraies données
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Disc, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PortfolioValueCardProps {
  totalValueMedian: number; // en centimes
  totalValueMin?: number; // en centimes
  totalValueMax?: number; // en centimes
  previousValue?: number; // valeur précédente pour calculer la croissance
  itemCount: number;
  itemsWithPrice: number;
  itemsWithoutPrice: number;
  lastUpdated?: string;
  loading?: boolean;
}

export const PortfolioValueCard = ({
  totalValueMedian,
  totalValueMin,
  totalValueMax,
  previousValue,
  itemCount,
  itemsWithPrice,
  itemsWithoutPrice,
  lastUpdated,
  loading = false,
}: PortfolioValueCardProps) => {
  // Convertir centimes en euros
  const valueInEuros = totalValueMedian / 100;
  const minInEuros = totalValueMin ? totalValueMin / 100 : undefined;
  const maxInEuros = totalValueMax ? totalValueMax / 100 : undefined;

  // Calculer la croissance si on a une valeur précédente
  const growth = previousValue && previousValue > 0 ? ((totalValueMedian - previousValue) / previousValue) * 100 : 0;
  const isPositive = growth >= 0;

  // Couverture des prix
  const coverage = itemCount > 0 ? Math.round((itemsWithPrice / itemCount) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-black border-purple-500/30 backdrop-blur-sm animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 w-40 bg-white/10 rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-white/10 rounded mb-2" />
          <div className="h-4 w-48 bg-white/10 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-black border-purple-500/30 backdrop-blur-sm group hover:border-purple-500/50 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-purple-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Valeur de la Collection
          </span>
          {growth !== 0 && (
            <span
              className={cn(
                "flex items-center text-xs px-2 py-1 rounded-full",
                isPositive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400",
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {growth > 0 ? "+" : ""}
              {growth.toFixed(1)}%
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-3xl font-bold text-white tracking-tight cursor-help">
                {valueInEuros.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="bg-zinc-900 border-zinc-700">
              <div className="text-sm space-y-1">
                {minInEuros && maxInEuros && (
                  <p className="text-zinc-400">
                    Fourchette: {minInEuros.toLocaleString("fr-FR")}€ - {maxInEuros.toLocaleString("fr-FR")}€
                  </p>
                )}
                <p className="text-zinc-500 text-xs">Basé sur les prix médians eBay</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <p className="text-xs text-purple-300/80 flex items-center gap-1">
            Est. basée sur {itemsWithPrice} prix eBay
            {itemsWithoutPrice > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-amber-500/70" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 border-zinc-700">
                    <p className="text-xs">{itemsWithoutPrice} film(s) sans prix trouvé</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </p>
          <div className="h-1 w-1 rounded-full bg-purple-500/50" />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Disc className="h-3 w-3" />
            {itemCount} édition{itemCount > 1 ? "s" : ""}
          </p>
        </div>

        {/* Barre de couverture */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
            <span>Couverture prix</span>
            <span>{coverage}%</span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                coverage >= 80 ? "bg-green-500" : coverage >= 50 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${coverage}%` }}
            />
          </div>
        </div>

        {/* Date de mise à jour */}
        {lastUpdated && (
          <p className="text-[10px] text-zinc-600 mt-2 flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5" />
            Mis à jour{" "}
            {new Date(lastUpdated).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
