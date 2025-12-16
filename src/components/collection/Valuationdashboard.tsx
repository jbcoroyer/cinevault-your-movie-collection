/**
 * CineVault - Valuation Dashboard
 * 
 * Dashboard premium pour la valorisation temps réel de la collection
 * Affiche la valeur totale, les top performers, et l'évolution
 * 
 * CORRECTIONS:
 * - Support du mode fullRefresh avec progression
 * - Indicateur source prix (eBay vs estimation)
 * - itemsWithEstimate counter
 */

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  ChevronRight,
  Sparkles,
  BarChart3,
  Clock,
  AlertTriangle,
  Crown,
  Gem,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  CollectionValuation,
  MovieValuation,
  formatPrice,
  calculateCollectionValuation,
  getSavedValuation,
} from "@/services/priceService";
import { PhysicalMovie } from "@/services/physicalMovies";
import { MovieDetails, getImageUrl } from "@/services/tmdb";
import { toast } from "@/hooks/use-toast";

// ============================================
// Types
// ============================================

interface ValuationDashboardProps {
  userId: string;
  movies: PhysicalMovie[];
  movieDetails: Record<number, MovieDetails>;
  onRefresh?: () => void;
  compact?: boolean;
}

interface RefreshProgress {
  current: number;
  total: number;
  status: string;
}

// ============================================
// Sub-components
// ============================================

const ValueCard = ({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  trendValue,
  className,
  loading,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  loading?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "relative overflow-hidden rounded-xl p-4",
      "bg-gradient-to-br from-card/80 to-card/40",
      "border border-white/10 backdrop-blur-sm",
      className
    )}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        )}
        {subValue && !loading && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
      <div
        className={cn(
          "p-2 rounded-lg",
          trend === "up" && "bg-green-500/20 text-green-500",
          trend === "down" && "bg-red-500/20 text-red-500",
          trend === "neutral" && "bg-primary/20 text-primary",
          !trend && "bg-primary/20 text-primary"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
    {trend && trendValue && !loading && (
      <div
        className={cn(
          "mt-2 flex items-center gap-1 text-xs font-medium",
          trend === "up" && "text-green-500",
          trend === "down" && "text-red-500"
        )}
      >
        {trend === "up" ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{trendValue}</span>
      </div>
    )}
  </motion.div>
);

const rankColors = {
  1: "from-yellow-500 to-amber-600",
  2: "from-gray-300 to-gray-400",
  3: "from-amber-600 to-amber-700",
};

const TopMovieItem = ({
  movie,
  rank,
  showProfit,
}: {
  movie: MovieValuation;
  rank: number;
  showProfit?: boolean;
}) => {
  // Déterminer si c'est une estimation
  const isEstimate = 
    movie.marketPrice?.source === "estimate" || 
    (movie.marketPrice?.sampleSize ?? 0) === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
    >
      {/* Rank Badge */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
          rank <= 3
            ? `bg-gradient-to-br ${rankColors[rank as keyof typeof rankColors]} text-white`
            : "bg-muted text-muted-foreground"
        )}
      >
        {rank}
      </div>

      {/* Poster */}
      <div className="relative w-10 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
        {movie.posterPath ? (
          <img
            src={getImageUrl(movie.posterPath, "w92")}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gem className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {movie.title}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {movie.format}
        </p>
      </div>

      {/* Price */}
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
          <p className={cn(
            "text-sm font-semibold",
            isEstimate && "text-muted-foreground"
          )}>
            {formatPrice(movie.marketPrice?.median)}
          </p>
          {isEstimate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-amber-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">
                    Prix estimé. Aucune vente eBay trouvée.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {!isEstimate && movie.marketPrice?.sampleSize && movie.marketPrice.sampleSize > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {movie.marketPrice.sampleSize} vente{movie.marketPrice.sampleSize > 1 ? 's' : ''}
          </p>
        )}
        {showProfit && movie.profitLossPercent !== undefined && (
          <p
            className={cn(
              "text-xs font-medium",
              movie.profitLossPercent > 0 ? "text-green-500" : "text-red-500"
            )}
          >
            {movie.profitLossPercent > 0 ? "+" : ""}
            {movie.profitLossPercent}%
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export function ValuationDashboard({
  userId,
  movies,
  movieDetails,
  onRefresh,
  compact = false,
}: ValuationDashboardProps) {
  const [valuation, setValuation] = useState<CollectionValuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAllDialog, setShowAllDialog] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState<RefreshProgress | null>(null);

  // Prepare movie data for valuation
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

  // Load saved valuation on mount
  useEffect(() => {
    const loadSavedValuation = async () => {
      setLoading(true);
      const saved = await getSavedValuation(userId);
      if (saved) {
        setValuation(saved);
        setLastUpdated(new Date(saved.lastUpdated));
      }
      setLoading(false);
    };
    loadSavedValuation();
  }, [userId]);

  // Refresh valuation (CORRIGÉ: avec fullRefresh et progression)
  const handleRefresh = async () => {
    if (movieData.length === 0) return;

    setRefreshing(true);
    setRefreshProgress({ current: 0, total: movieData.length, status: "Initialisation..." });
    
    try {
      const newValuation = await calculateCollectionValuation(userId, movieData, {
        fullRefresh: true,
        batchSize: 10,
        onProgress: (current, total, status) => {
          setRefreshProgress({ current, total, status });
        },
      });
      
      setValuation(newValuation);
      setLastUpdated(new Date());
      onRefresh?.();
      
      // Toast de succès
      const estimateText = newValuation.itemsWithEstimate && newValuation.itemsWithEstimate > 0
        ? ` (dont ${newValuation.itemsWithEstimate} estimé${newValuation.itemsWithEstimate > 1 ? 's' : ''})`
        : '';
      
      toast({
        title: "Valorisation mise à jour",
        description: `${newValuation.itemsWithPrice} films valorisés${estimateText}`,
      });
    } catch (error) {
      console.error("Valuation refresh error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la valorisation",
        variant: "destructive",
      });
    }
    
    setRefreshing(false);
    setRefreshProgress(null);
  };

  // Auto-refresh on first load if no saved valuation
  useEffect(() => {
    if (!loading && !valuation && movieData.length > 0) {
      handleRefresh();
    }
  }, [loading, valuation, movieData.length]);

  // Calculate stats
  const coverage = valuation
    ? Math.round(
        (valuation.itemsWithPrice /
          (valuation.itemsWithPrice + valuation.itemsWithoutPrice)) *
          100
      )
    : 0;

  const profitTrend = valuation?.profitLossPercent
    ? valuation.profitLossPercent > 0
      ? "up"
      : valuation.profitLossPercent < 0
      ? "down"
      : "neutral"
    : "neutral";

  // ============================================
  // Compact View
  // ============================================

  if (compact) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">Valeur Collection</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", refreshing && "animate-spin")}
            />
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="space-y-2">
            <p className="text-2xl font-bold">
              {formatPrice(valuation?.totalValueMedian)}
            </p>
            {valuation?.profitLoss !== undefined && valuation.profitLoss !== 0 && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  profitTrend === "up" ? "text-green-500" : "text-red-500"
                )}
              >
                {profitTrend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {valuation.profitLoss > 0 ? "+" : ""}
                  {formatPrice(valuation.profitLoss)} ({valuation.profitLossPercent}%)
                </span>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    );
  }

  // ============================================
  // Full View
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Valorisation Collection</h2>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Mis à jour{" "}
                {lastUpdated.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progression du refresh */}
          {refreshing && refreshProgress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">{refreshProgress.status}</span>
              <span className="text-xs font-medium">
                ({refreshProgress.current}/{refreshProgress.total})
              </span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || movies.length === 0}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            {refreshing ? "Analyse..." : "Actualiser"}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {movies.length === 0 && (
        <GlassCard className="p-8 text-center">
          <Gem className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">Aucun film dans votre collection</h3>
          <p className="text-sm text-muted-foreground">
            Ajoutez des films pour voir leur valeur sur le marché
          </p>
        </GlassCard>
      )}

      {movies.length > 0 && (
        <>
          {/* Value Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ValueCard
              label="Valeur Médiane"
              value={formatPrice(valuation?.totalValueMedian)}
              icon={Crown}
              loading={loading}
              className="col-span-2 md:col-span-1"
            />
            <ValueCard
              label="Fourchette"
              value={`${formatPrice(valuation?.totalValueMin)} - ${formatPrice(valuation?.totalValueMax)}`}
              icon={BarChart3}
              loading={loading}
              className="col-span-2 md:col-span-1"
            />
            <ValueCard
              label="Plus-value"
              value={formatPrice(Math.abs(valuation?.profitLoss || 0))}
              subValue={
                valuation?.totalPurchasePrice
                  ? `vs ${formatPrice(valuation.totalPurchasePrice)} investi`
                  : undefined
              }
              icon={profitTrend === "up" ? TrendingUp : TrendingDown}
              trend={profitTrend}
              trendValue={
                valuation?.profitLossPercent
                  ? `${valuation.profitLossPercent > 0 ? "+" : ""}${valuation.profitLossPercent}%`
                  : undefined
              }
              loading={loading}
            />
            <ValueCard
              label="Couverture"
              value={`${valuation?.itemsWithPrice || 0}/${movies.length}`}
              subValue={
                valuation?.itemsWithEstimate && valuation.itemsWithEstimate > 0
                  ? `dont ${valuation.itemsWithEstimate} estimé${valuation.itemsWithEstimate > 1 ? 's' : ''}`
                  : "films valorisés"
              }
              icon={Sparkles}
              loading={loading}
            />
          </div>

          {/* Coverage Warning */}
          {valuation && coverage < 50 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-500">
                  Couverture partielle ({coverage}%)
                </p>
                <p className="text-xs text-muted-foreground">
                  {valuation.itemsWithoutPrice} films n'ont pas de prix de marché
                  disponible
                </p>
              </div>
            </motion.div>
          )}

          {/* Estimate Info */}
          {valuation && valuation.itemsWithEstimate && valuation.itemsWithEstimate > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
            >
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-500">
                  {valuation.itemsWithEstimate} prix estimé{valuation.itemsWithEstimate > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Ces films n'ont pas de ventes eBay récentes. Les prix sont des estimations.
                </p>
              </div>
            </motion.div>
          )}

          {/* Coverage Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Couverture prix</span>
              <span className="font-medium">{coverage}%</span>
            </div>
            <Progress value={coverage} className="h-2" />
          </div>

          {/* Top Valued Items */}
          {valuation && valuation.topValuedItems.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  Top Films Valorisés
                </h3>
                <Badge variant="outline" className="text-xs">
                  Top 10
                </Badge>
              </div>

              <div className="space-y-1">
                {valuation.topValuedItems.slice(0, 5).map((movie, i) => (
                  <TopMovieItem key={`${movie.tmdbId}-${movie.format}`} movie={movie} rank={i + 1} />
                ))}
              </div>

              {valuation.topValuedItems.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-muted-foreground"
                  onClick={() => setShowAllDialog(true)}
                >
                  Voir tout ({valuation.topValuedItems.length})
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </GlassCard>
          )}

          {/* All Top Movies Dialog */}
          <Dialog open={showAllDialog} onOpenChange={setShowAllDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Top Films Valorisés
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-1 pr-4">
                  {valuation?.topValuedItems.map((movie, i) => (
                    <TopMovieItem
                      key={`all-${movie.tmdbId}-${movie.format}`}
                      movie={movie}
                      rank={i + 1}
                    />
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Biggest Gainers */}
          {valuation && valuation.biggestGainers.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Meilleures Performances
                </h3>
              </div>

              <div className="space-y-1">
                {valuation.biggestGainers.map((movie, i) => (
                  <TopMovieItem
                    key={`gainer-${movie.tmdbId}-${movie.format}`}
                    movie={movie}
                    rank={i + 1}
                    showProfit
                  />
                ))}
              </div>
            </GlassCard>
          )}

          {/* Biggest Losers */}
          {valuation && valuation.biggestLosers.length > 0 && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  À Surveiller
                </h3>
              </div>

              <div className="space-y-1">
                {valuation.biggestLosers.map((movie, i) => (
                  <TopMovieItem
                    key={`loser-${movie.tmdbId}-${movie.format}`}
                    movie={movie}
                    rank={i + 1}
                    showProfit
                  />
                ))}
              </div>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
