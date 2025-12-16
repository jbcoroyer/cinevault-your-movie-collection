/**
 * CineVault - ValuationDashboardPremium
 * 
 * Dashboard de valorisation premium style banque en ligne / app trading
 * Regroupe tous les widgets de valorisation avec un design premium
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw,
  Bell,
  BellRing,
  Settings,
  Download,
  Share2,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Info,
  AlertCircle,
  BarChart3,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

// Components
import { PortfolioValueCard } from "./PortfolioValueCard";
import { PortfolioChart } from "./PortfolioChart";
import { RecentSalesWidget, generateMockSales } from "./RecentSalesWidget";
import { TopGainersWidget } from "./TopGainersWidget";
import { HiddenGemsWidget, generateMockGems } from "./HiddenGemsWidget";
import { PriceAlertDialog } from "./PriceAlertDialog";

// Services & Hooks
import {
  CollectionValuation,
  MovieValuation,
  formatPrice,
  calculateCollectionValuation,
  getSavedValuation,
} from "@/services/priceService";
import { PhysicalMovie } from "@/services/physicalMovies";
import { MovieDetails, getImageUrl } from "@/services/tmdb";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";

// ============================================
// Types
// ============================================

interface ValuationDashboardPremiumProps {
  userId: string;
  movies: PhysicalMovie[];
  movieDetails: Record<number, MovieDetails>;
  onMovieClick?: (tmdbId: number) => void;
  className?: string;
}

interface RefreshProgress {
  current: number;
  total: number;
  status: string;
}

// ============================================
// Quick Stats Bar
// ============================================

function QuickStatsBar({
  valuation,
  alertsCount,
  onAlertsClick,
}: {
  valuation: CollectionValuation | null;
  alertsCount: number;
  onAlertsClick: () => void;
}) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-zinc-400">Marché actif</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10"
      >
        <BarChart3 className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs text-zinc-400">
          {valuation?.itemsWithPrice || 0} prix actifs
        </span>
      </motion.div>

      {alertsCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onAlertsClick}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
        >
          <BellRing className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">
            {alertsCount} alerte{alertsCount > 1 ? "s" : ""} active
            {alertsCount > 1 ? "s" : ""}
          </span>
        </motion.button>
      )}

      {valuation?.lastUpdated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 ml-auto"
        >
          <span className="text-[10px] text-zinc-500">Mis à jour:</span>
          <span className="text-xs text-zinc-400">
            {new Date(valuation.lastUpdated).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function ValuationDashboardPremium({
  userId,
  movies,
  movieDetails,
  onMovieClick,
  className,
}: ValuationDashboardPremiumProps) {
  // State
  const [valuation, setValuation] = useState<CollectionValuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<RefreshProgress | null>(
    null
  );
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedMovieForAlert, setSelectedMovieForAlert] = useState<{
    tmdbId: number;
    title: string;
    format: string;
    posterPath?: string;
    currentPrice?: number;
  } | null>(null);

  // Hooks
  const {
    alerts,
    activeAlertsCount,
    createAlert,
    deleteAlert,
    updateAlert,
    getAlertsForMovie,
  } = usePriceAlerts();

  // Prepare movie data
  const movieData = useMemo(() => {
    return movies.map((m) => {
      const details = movieDetails[m.tmdb_id];
      return {
        tmdbId: m.tmdb_id,
        title: details?.title || `Film #${m.tmdb_id}`,
        format: m.format,
        posterPath: details?.poster_path,
        purchasePrice: m.price || undefined,
        releaseYear: details?.release_date
          ? new Date(details.release_date).getFullYear()
          : undefined,
      };
    });
  }, [movies, movieDetails]);

  // Load saved valuation
  useEffect(() => {
    const loadValuation = async () => {
      try {
        const saved = await getSavedValuation(userId);
        if (saved) {
          setValuation(saved);
        }
      } catch (error) {
        console.error("Load valuation error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadValuation();
  }, [userId]);

  // Refresh valuation
  const handleRefresh = useCallback(async () => {
    if (refreshing || movieData.length === 0) return;

    setRefreshing(true);
    setRefreshProgress({ current: 0, total: movieData.length, status: "Démarrage..." });

    try {
      const newValuation = await calculateCollectionValuation(
        userId,
        movieData,
        {
          fullRefresh: true,
          batchSize: 10,
          onProgress: (current, total, status) => {
            setRefreshProgress({ current, total, status });
          },
        }
      );

      setValuation(newValuation);

      toast({
        title: "Valorisation mise à jour",
        description: `${newValuation.itemsWithPrice} films valorisés`,
      });
    } catch (error) {
      console.error("Refresh error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la valorisation",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
      setRefreshProgress(null);
    }
  }, [userId, movieData, refreshing]);

  // Auto-refresh on first load
  useEffect(() => {
    if (!loading && !valuation && movieData.length > 0) {
      handleRefresh();
    }
  }, [loading, valuation, movieData.length, handleRefresh]);

  // Transform data for widgets
  const gainers = useMemo(() => {
    if (!valuation?.biggestGainers) return [];
    return valuation.biggestGainers.map((g) => ({
      tmdbId: g.tmdbId,
      title: g.title,
      format: g.format,
      posterPath: g.posterPath,
      currentPrice: g.marketPrice?.median || 0,
      purchasePrice: g.purchasePrice || 0,
      profitLoss: g.profitLoss || 0,
      profitLossPercent: g.profitLossPercent || 0,
    }));
  }, [valuation?.biggestGainers]);

  const losers = useMemo(() => {
    if (!valuation?.biggestLosers) return [];
    return valuation.biggestLosers.map((l) => ({
      tmdbId: l.tmdbId,
      title: l.title,
      format: l.format,
      posterPath: l.posterPath,
      currentPrice: l.marketPrice?.median || 0,
      purchasePrice: l.purchasePrice || 0,
      profitLoss: l.profitLoss || 0,
      profitLossPercent: l.profitLossPercent || 0,
    }));
  }, [valuation?.biggestLosers]);

  // Calculate total invested
  const totalInvested = useMemo(() => {
    return movies.reduce((sum, m) => sum + (m.price || 0), 0);
  }, [movies]);

  // Open alert dialog for movie
  const openAlertDialog = (movie: MovieValuation) => {
    setSelectedMovieForAlert({
      tmdbId: movie.tmdbId,
      title: movie.title,
      format: movie.format,
      posterPath: movie.posterPath,
      currentPrice: movie.marketPrice?.median,
    });
    setAlertDialogOpen(true);
  };

  // Empty state
  if (movies.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col items-center justify-center py-16 text-center",
          "rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/40",
          "border border-white/10 backdrop-blur-xl",
          className
        )}
      >
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <Wallet className="w-12 h-12 text-primary/50" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Aucun film dans votre collection
        </h3>
        <p className="text-sm text-zinc-500 max-w-md">
          Ajoutez des films à votre collection pour voir leur valeur sur le
          marché et suivre l'évolution de votre portfolio.
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/30">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Portfolio Valorisation
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                LIVE
              </Badge>
            </h2>
            <p className="text-xs text-zinc-500">
              {movies.length} film{movies.length > 1 ? "s" : ""} •{" "}
              {valuation?.itemsWithPrice || 0} valorisé
              {(valuation?.itemsWithPrice || 0) > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh progress */}
          {refreshing && refreshProgress && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              <div className="flex flex-col">
                <span className="text-xs text-white font-medium">
                  {refreshProgress.status}
                </span>
                <Progress
                  value={(refreshProgress.current / refreshProgress.total) * 100}
                  className="h-1 w-24 mt-1"
                />
              </div>
              <span className="text-[10px] text-zinc-500">
                {refreshProgress.current}/{refreshProgress.total}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-9 w-9 border-white/10 hover:bg-white/5"
                >
                  <RefreshCw
                    className={cn("w-4 h-4", refreshing && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Actualiser les prix</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 border-white/10 hover:bg-white/5"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Exporter le rapport</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Quick stats bar */}
      <QuickStatsBar
        valuation={valuation}
        alertsCount={activeAlertsCount}
        onAlertsClick={() => {}}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio value card */}
          <PortfolioValueCard
            totalValue={valuation?.totalValueMedian || 0}
            totalInvested={totalInvested > 0 ? totalInvested : undefined}
            itemsCount={movies.length}
            itemsWithPrice={valuation?.itemsWithPrice || 0}
            loading={loading}
          />

          {/* Portfolio chart */}
          <PortfolioChart
            currentValue={valuation?.totalValueMedian || 0}
            loading={loading}
          />

          {/* Top gainers */}
          <TopGainersWidget
            gainers={gainers}
            losers={losers}
            loading={loading}
            onMovieClick={onMovieClick}
          />
        </div>

        {/* Right column - Secondary widgets */}
        <div className="space-y-6">
          {/* Recent sales */}
          <RecentSalesWidget
            sales={generateMockSales(8)}
            loading={loading}
            onRefresh={() => {}}
          />

          {/* Hidden gems */}
          <HiddenGemsWidget
            gems={generateMockGems()}
            loading={loading}
            onMovieClick={onMovieClick}
          />
        </div>
      </div>

      {/* Coverage warning */}
      {valuation &&
        valuation.itemsWithPrice < movies.length * 0.5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
          >
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-400">
                Couverture partielle ({Math.round((valuation.itemsWithPrice / movies.length) * 100)}%)
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                {movies.length - valuation.itemsWithPrice} films n'ont pas de
                prix de marché disponible. Les valeurs affichées sont des
                estimations partielles.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              Réessayer
            </Button>
          </motion.div>
        )}

      {/* Price Alert Dialog */}
      {selectedMovieForAlert && (
        <PriceAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          movie={selectedMovieForAlert}
          existingAlerts={getAlertsForMovie(
            selectedMovieForAlert.tmdbId,
            selectedMovieForAlert.format
          )}
          onCreateAlert={async (params) => {
            await createAlert({
              ...params,
              tmdbId: selectedMovieForAlert.tmdbId,
              format: selectedMovieForAlert.format,
            });
          }}
          onDeleteAlert={deleteAlert}
          onToggleAlert={(alertId, isActive) =>
            updateAlert(alertId, { isActive })
          }
        />
      )}
    </div>
  );
}

// ============================================
// Export default
// ============================================

export default ValuationDashboardPremium;
