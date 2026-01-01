/**
 * CineVault - ValuationDashboardPremium (AMÉLIORÉ)
 *
 * Dashboard principal de valorisation avec les vraies données de collection
 *
 * AMÉLIORATIONS:
 * - Bouton d'actualisation bien visible
 * - Distinction claire entre estimations et vrais prix eBay
 * - CTA pour charger les prix quand pas de données
 * - Barre de progression du chargement
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Film, TrendingUp, Sparkles, History, Trophy, Package, RefreshCw, AlertCircle, Zap, DollarSign, BarChart3, ExternalLink } from "lucide-react";
import { PortfolioValueCard } from "./PortfolioValueCard";
import { PortfolioChart } from "./PortfolioChart";
import { RecentSalesWidget } from "./RecentSalesWidget";
import { HiddenGemsWidget } from "./HiddenGemsWidget";
import { TopGainersWidget } from "./TopGainersWidget";
import { CollectionStats } from "./CollectionStats";
import { CollectionValuation, MovieValuation, PriceData } from "@/services/priceService";
import { getImageUrl } from "@/services/tmdb";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface CollectionMovie {
  tmdbId: number;
  title: string;
  format: string;
  posterPath?: string;
  purchasePrice?: number; // centimes
  releaseYear?: number;
}

interface ValuationDashboardProps {
  valuation: CollectionValuation | null;
  movies: CollectionMovie[];
  moviePrices: Map<string, PriceData>;
  loading?: boolean;
  refreshing?: boolean;
  lastUpdated?: Date | null;
  onRefresh?: () => void;
  onMovieClick?: (tmdbId: number) => void;
}

// ============================================
// Helpers
// ============================================

const formatPrice = (cents: number): string => {
  return (
    (cents / 100).toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " €"
  );
};

// Calculer les stats de couverture avec distinction estimations/vrais prix
const calculateCoverageStats = (movies: CollectionMovie[], moviePrices: Map<string, PriceData>) => {
  let withRealPrice = 0;
  let withEstimate = 0;
  let withoutPrice = 0;

  movies.forEach((movie) => {
    const priceKey = `${movie.tmdbId}-${movie.format}`;
    const price = moviePrices.get(priceKey);
    
    if (price) {
      if (price.source === "ebay" && price.sampleSize > 0) {
        withRealPrice++;
      } else {
        withEstimate++;
      }
    } else {
      withoutPrice++;
    }
  });

  return {
    withRealPrice,
    withEstimate,
    withoutPrice,
    total: movies.length,
    realCoverage: movies.length > 0 ? Math.round((withRealPrice / movies.length) * 100) : 0,
    totalCoverage: movies.length > 0 ? Math.round(((withRealPrice + withEstimate) / movies.length) * 100) : 0,
  };
};

// Préparer les données pour les widgets enfants
const prepareWidgetData = (movies: CollectionMovie[], moviePrices: Map<string, PriceData>) => {
  return movies.map((movie) => {
    const priceKey = `${movie.tmdbId}-${movie.format}`;
    const marketPrice = moviePrices.get(priceKey);

    return {
      tmdbId: movie.tmdbId,
      title: movie.title,
      format: movie.format,
      posterPath: movie.posterPath,
      releaseYear: movie.releaseYear,
      purchasePrice: movie.purchasePrice,
      marketPrice: marketPrice
        ? {
            min: marketPrice.min,
            median: marketPrice.median,
            max: marketPrice.max,
            sampleSize: marketPrice.sampleSize,
            lastSoldPrice: marketPrice.lastSoldPrice,
            lastSoldDate: marketPrice.lastSoldDate,
            source: marketPrice.source,
          }
        : undefined,
    };
  });
};

// Trouver l'édition la plus précieuse
const findMostValuableItem = (
  movies: CollectionMovie[],
  moviePrices: Map<string, PriceData>,
): { movie: CollectionMovie; price: PriceData } | null => {
  let mostValuable: { movie: CollectionMovie; price: PriceData } | null = null;
  let maxValue = 0;

  movies.forEach((movie) => {
    const priceKey = `${movie.tmdbId}-${movie.format}`;
    const price = moviePrices.get(priceKey);

    // Préférer les prix réels (source = ebay avec sampleSize > 0)
    if (price) {
      const isRealPrice = price.source === "ebay" && price.sampleSize > 0;
      const value = price.median;

      // Bonus pour les vrais prix
      const adjustedValue = isRealPrice ? value * 1.1 : value;

      if (adjustedValue > maxValue) {
        maxValue = adjustedValue;
        mostValuable = { movie, price };
      }
    }
  });

  return mostValuable;
};

// Calculer le potentiel caché (items avec forte plus-value)
const calculateHiddenPotential = (
  movies: CollectionMovie[],
  moviePrices: Map<string, PriceData>,
): { percent: number; count: number } => {
  let totalPotential = 0;
  let totalCurrent = 0;
  let count = 0;

  movies.forEach((movie) => {
    const priceKey = `${movie.tmdbId}-${movie.format}`;
    const price = moviePrices.get(priceKey);

    if (price && price.max > price.median * 1.2) {
      totalCurrent += price.median;
      totalPotential += price.max;
      count++;
    }
  });

  const percent = totalCurrent > 0 ? Math.round(((totalPotential - totalCurrent) / totalCurrent) * 100) : 0;

  return { percent, count };
};

// Préparer les gainers/losers pour TopGainersWidget
const prepareGainersLosers = (movies: CollectionMovie[], moviePrices: Map<string, PriceData>) => {
  const items = movies
    .filter((movie) => movie.purchasePrice && movie.purchasePrice > 0)
    .map((movie) => {
      const priceKey = `${movie.tmdbId}-${movie.format}`;
      const price = moviePrices.get(priceKey);

      if (!price) return null;

      const purchasePrice = movie.purchasePrice!;
      const currentPrice = price.median;
      const profitLoss = currentPrice - purchasePrice;
      const profitLossPercent = (profitLoss / purchasePrice) * 100;

      return {
        tmdbId: movie.tmdbId,
        title: movie.title,
        format: movie.format,
        posterPath: movie.posterPath,
        currentPrice,
        purchasePrice,
        profitLoss,
        profitLossPercent,
      };
    })
    .filter(Boolean) as Array<{
    tmdbId: number;
    title: string;
    format: string;
    posterPath?: string;
    currentPrice: number;
    purchasePrice: number;
    profitLoss: number;
    profitLossPercent: number;
  }>;

  const gainers = items
    .filter((i) => i.profitLossPercent > 0)
    .sort((a, b) => b.profitLossPercent - a.profitLossPercent)
    .slice(0, 5);

  const losers = items
    .filter((i) => i.profitLossPercent < 0)
    .sort((a, b) => a.profitLossPercent - b.profitLossPercent)
    .slice(0, 5);

  return { gainers, losers };
};

// ============================================
// Format Labels
// ============================================

const formatLabels: Record<string, string> = {
  "4k": "4K UHD",
  bluray: "Blu-ray",
  dvd: "DVD",
  steelbook: "Steelbook",
  collector: "Collector",
};

// ============================================
// Loading State Component
// ============================================

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-64 bg-white/10 rounded" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-white/10 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-80 bg-white/10 rounded-xl" />
      <div className="h-80 bg-white/10 rounded-xl" />
    </div>
  </div>
);

// ============================================
// Empty State / Need Refresh Component
// ============================================

const NeedPricesState = ({ 
  movieCount, 
  onRefresh, 
  refreshing 
}: { 
  movieCount: number; 
  onRefresh?: () => void; 
  refreshing?: boolean;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="relative mb-6">
      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
        <DollarSign className="w-12 h-12 text-purple-400" />
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
        <Zap className="w-4 h-4 text-black" />
      </div>
    </div>
    
    <h3 className="text-2xl font-bold text-white mb-3">
      Découvrez la valeur de votre collection
    </h3>
    <p className="text-zinc-400 max-w-md mb-6">
      Obtenez les prix réels du marché eBay pour vos <strong className="text-white">{movieCount} films</strong>. 
      Les cotations sont basées sur les ventes récentes.
    </p>
    
    <Button
      onClick={onRefresh}
      disabled={refreshing}
      size="lg"
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white gap-2 px-8"
    >
      {refreshing ? (
        <>
          <RefreshCw className="w-5 h-5 animate-spin" />
          Recherche des prix...
        </>
      ) : (
        <>
          <BarChart3 className="w-5 h-5" />
          Analyser ma collection
        </>
      )}
    </Button>
    
    <p className="text-xs text-zinc-600 mt-4">
      Cette opération peut prendre quelques secondes
    </p>
  </div>
);

// ============================================
// Coverage Stats Card
// ============================================

const CoverageStatsCard = ({
  stats,
  onRefresh,
  refreshing,
}: {
  stats: ReturnType<typeof calculateCoverageStats>;
  onRefresh?: () => void;
  refreshing?: boolean;
}) => (
  <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/20 backdrop-blur-sm">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-blue-200 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Couverture des Prix
        </span>
        <Button
          onClick={onRefresh}
          disabled={refreshing}
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-blue-300 hover:text-white hover:bg-blue-500/20"
        >
          <RefreshCw className={cn("w-3 h-3 mr-1", refreshing && "animate-spin")} />
          {refreshing ? "..." : "Actualiser"}
        </Button>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {/* Real prices progress */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-green-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Prix eBay réels
          </span>
          <span className="text-white font-medium">{stats.withRealPrice}/{stats.total}</span>
        </div>
        <Progress value={stats.realCoverage} className="h-2 bg-zinc-800" />
      </div>
      
      {/* Estimates */}
      {stats.withEstimate > 0 && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Estimations
            </span>
            <span className="text-zinc-400">{stats.withEstimate}</span>
          </div>
        </div>
      )}
      
      {/* Missing */}
      {stats.withoutPrice > 0 && (
        <div className="text-xs text-zinc-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {stats.withoutPrice} film{stats.withoutPrice > 1 ? "s" : ""} sans cotation
        </div>
      )}
    </CardContent>
  </Card>
);

// ============================================
// Main Component
// ============================================

export const ValuationDashboardPremium = ({
  valuation,
  movies,
  moviePrices,
  loading = false,
  refreshing = false,
  lastUpdated,
  onRefresh,
  onMovieClick,
}: ValuationDashboardProps) => {
  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Calculate coverage stats
  const coverageStats = calculateCoverageStats(movies, moviePrices);
  
  // Show "need prices" state if no real prices found
  if (movies.length > 0 && coverageStats.withRealPrice === 0 && !valuation) {
    return <NeedPricesState movieCount={movies.length} onRefresh={onRefresh} refreshing={refreshing} />;
  }

  // Empty collection state
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="w-16 h-16 text-zinc-700 mb-4" />
        <h3 className="text-xl font-semibold text-zinc-400 mb-2">Aucun film dans votre collection</h3>
        <p className="text-zinc-500 max-w-md">
          Ajoutez des films physiques pour voir l'estimation de leur valeur sur le marché.
        </p>
      </div>
    );
  }

  // Prepare data
  const widgetData = prepareWidgetData(movies, moviePrices);
  const mostValuable = findMostValuableItem(movies, moviePrices);
  const hiddenPotential = calculateHiddenPotential(movies, moviePrices);
  const { gainers, losers } = prepareGainersLosers(movies, moviePrices);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header avec bouton d'actualisation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Trésorerie de la Collection
          </h2>
          <p className="text-muted-foreground mt-1">
            Prix basés sur les ventes réelles eBay France & Allemagne
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-zinc-500">
              Mis à jour {new Date(lastUpdated).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <Button
            onClick={onRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-white gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? "Actualisation..." : "Actualiser les prix"}
          </Button>
        </div>
      </div>

      {/* Cartes de Valeur Principales - 4 colonnes sur desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valeur totale */}
        <PortfolioValueCard
          totalValueMedian={valuation?.totalValueMedian || 0}
          totalValueMin={valuation?.totalValueMin}
          totalValueMax={valuation?.totalValueMax}
          itemCount={movies.length}
          itemsWithPrice={valuation?.itemsWithPrice || coverageStats.withRealPrice + coverageStats.withEstimate}
          itemsWithoutPrice={valuation?.itemsWithoutPrice || coverageStats.withoutPrice}
          lastUpdated={lastUpdated?.toISOString()}
          loading={refreshing}
        />

        {/* Couverture des prix */}
        <CoverageStatsCard 
          stats={coverageStats} 
          onRefresh={onRefresh} 
          refreshing={refreshing} 
        />

        {/* Édition la plus précieuse */}
        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Édition la plus Précieuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mostValuable ? (
              <div className="cursor-pointer group" onClick={() => onMovieClick?.(mostValuable.movie.tmdbId)}>
                <div className="text-lg font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                  {mostValuable.movie.title}
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  {formatLabels[mostValuable.movie.format.toLowerCase()] || mostValuable.movie.format} •{" "}
                  {formatPrice(mostValuable.price.median)}
                </p>
                {mostValuable.price.sampleSize > 0 ? (
                  <a
                    href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(mostValuable.movie.title + " " + mostValuable.movie.format)}&_sacat=11232&LH_Complete=1&LH_Sold=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-blue-400 mt-1 flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {mostValuable.price.sampleSize} ventes eBay
                  </a>
                ) : (
                  <p className="text-[10px] text-amber-500/70 mt-1">Prix estimé</p>
                )}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">Actualisez pour voir</div>
            )}
          </CardContent>
        </Card>

        {/* Potentiel caché */}
        <Card className="bg-black/40 border-purple-500/20 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-pink-500" />
              Potentiel Caché
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hiddenPotential.count > 0 ? (
              <>
                <div className="text-2xl font-bold text-white">+{hiddenPotential.percent}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sur {hiddenPotential.count} édition{hiddenPotential.count > 1 ? "s" : ""} avec potentiel
                </p>
              </>
            ) : coverageStats.withRealPrice === 0 ? (
              <>
                <div className="text-2xl font-bold text-zinc-600">—</div>
                <p className="text-xs text-amber-500/70 mt-1">Actualisez les prix</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-500">Optimal</div>
                <p className="text-xs text-muted-foreground mt-1">Vos films sont bien cotés</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Graphique + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique Principal */}
        <div className="lg:col-span-2">
          <Card className="h-full bg-black/40 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Évolution de la Valeur
              </CardTitle>
              <CardDescription>Historique de la cotation de votre vidéothèque</CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioChart totalValue={valuation?.totalValueMedian || 0} itemCount={movies.length} />
            </CardContent>
          </Card>
        </div>

        {/* Top Gainers Widget */}
        <div className="space-y-6">
          <TopGainersWidget gainers={gainers} losers={losers} loading={refreshing} onMovieClick={onMovieClick} />
        </div>
      </div>

      {/* Tabs: Ventes / Pépites */}
      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/10">
          <TabsTrigger value="market" className="data-[state=active]:bg-purple-500/20">
            <History className="w-4 h-4 mr-2" />
            Cotations Collection
          </TabsTrigger>
          <TabsTrigger value="gems" className="data-[state=active]:bg-pink-500/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Pépites Identifiées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="mt-4">
          <RecentSalesWidget items={widgetData} loading={refreshing} onMovieClick={onMovieClick} />
        </TabsContent>

        <TabsContent value="gems" className="mt-4">
          <HiddenGemsWidget items={widgetData} loading={refreshing} onMovieClick={onMovieClick} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
