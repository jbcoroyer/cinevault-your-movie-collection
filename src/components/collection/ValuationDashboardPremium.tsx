/**
 * CineVault - ValuationDashboardPremium (CORRIGÉ)
 *
 * Dashboard principal de valorisation avec les vraies données de collection
 *
 * CORRECTION MAJEURE:
 * - Accepte maintenant les props avec les vraies données
 * - Plus de données mockées hardcodées
 * - Intégration complète avec useCollectionValuation
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Film, TrendingUp, Sparkles, History, Trophy, Package, RefreshCw, AlertCircle } from "lucide-react";
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
// Empty State Component
// ============================================

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <Package className="w-16 h-16 text-zinc-700 mb-4" />
    <h3 className="text-xl font-semibold text-zinc-400 mb-2">Aucune donnée de valorisation</h3>
    <p className="text-zinc-500 max-w-md">
      Ajoutez des films à votre collection et actualisez les prix pour voir l'estimation de votre patrimoine
      cinématographique.
    </p>
  </div>
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

  // Empty state
  if (!valuation || movies.length === 0) {
    return <EmptyState />;
  }

  // Prepare data
  const widgetData = prepareWidgetData(movies, moviePrices);
  const mostValuable = findMostValuableItem(movies, moviePrices);
  const hiddenPotential = calculateHiddenPotential(movies, moviePrices);
  const { gainers, losers } = prepareGainersLosers(movies, moviePrices);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Trésorerie de la Collection
          </h2>
          <p className="text-muted-foreground mt-1">
            Analysez la valeur et l'évolution de votre patrimoine cinématographique.
          </p>
        </div>
        {refreshing && (
          <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 animate-pulse">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Actualisation...
          </Badge>
        )}
      </div>

      {/* Cartes de Valeur Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Valeur totale */}
        <PortfolioValueCard
          totalValueMedian={valuation.totalValueMedian}
          totalValueMin={valuation.totalValueMin}
          totalValueMax={valuation.totalValueMax}
          itemCount={movies.length}
          itemsWithPrice={valuation.itemsWithPrice}
          itemsWithoutPrice={valuation.itemsWithoutPrice}
          lastUpdated={lastUpdated?.toISOString()}
          loading={refreshing}
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
                <div className="text-xl font-bold text-white truncate group-hover:text-purple-400 transition-colors">
                  {mostValuable.movie.title}
                </div>
                <p className="text-xs text-purple-400 mt-1">
                  {formatLabels[mostValuable.movie.format.toLowerCase()] || mostValuable.movie.format} •{" "}
                  {formatPrice(mostValuable.price.median)}
                </p>
                {mostValuable.price.sampleSize > 0 && (
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Basé sur {mostValuable.price.sampleSize} ventes eBay
                  </p>
                )}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">Aucune donnée disponible</div>
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
                  Sur {hiddenPotential.count} édition{hiddenPotential.count > 1 ? "s" : ""} avec potentiel de revente
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-zinc-600">—</div>
                <p className="text-xs text-muted-foreground mt-1">Pas assez de données pour calculer</p>
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
              <PortfolioChart totalValue={valuation.totalValueMedian} itemCount={movies.length} />
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
