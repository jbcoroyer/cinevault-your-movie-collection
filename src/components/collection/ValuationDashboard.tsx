/**
 * CineVault - Corrections pour ValuationDashboard.tsx
 *
 * Ce fichier contient les modifications à appliquer au composant ValuationDashboard
 * pour améliorer l'UX de la valorisation.
 */

// ============================================
// 1. IMPORTS À AJOUTER
// ============================================

import { Info, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// ============================================
// 2. STATE À AJOUTER DANS LE COMPOSANT
// ============================================

// Ajouter ces states dans le composant ValuationDashboard:
const [refreshProgress, setRefreshProgress] = useState<{
  current: number;
  total: number;
  status: string;
} | null>(null);

// ============================================
// 3. MODIFIER handleRefresh
// ============================================

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

    // Toast de succès avec détails
    toast({
      title: "Valorisation mise à jour",
      description: `${newValuation.itemsWithPrice} films valorisés${
        newValuation.itemsWithEstimate > 0 ? ` (dont ${newValuation.itemsWithEstimate} estimations)` : ""
      }`,
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

// ============================================
// 4. COMPOSANT TopMovieItem MODIFIÉ
// ============================================

/**
 * Affiche un film dans le top avec indicateur de source de prix
 */
const TopMovieItem = ({ movie, rank, showProfit = false }: TopMovieItemProps) => {
  // Déterminer si c'est une estimation ou un vrai prix eBay
  const isEstimate = movie.marketPrice?.source === "estimate" || (movie.marketPrice?.sampleSize ?? 0) === 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg",
        "hover:bg-white/5 transition-colors cursor-pointer group",
      )}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
          rank <= 3
            ? `bg-gradient-to-br ${rankColors[rank as keyof typeof rankColors]} text-white`
            : "bg-muted text-muted-foreground",
        )}
      >
        {rank}
      </div>

      {/* Poster */}
      <div className="relative w-10 h-14 rounded overflow-hidden bg-muted flex-shrink-0">
        {movie.posterPath ? (
          <img src={getImageUrl(movie.posterPath, "w92")} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gem className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{movie.title}</p>
        <p className="text-xs text-muted-foreground capitalize">{movie.format}</p>
      </div>

      {/* Price avec indicateur de source */}
      <div className="text-right">
        <div className="flex items-center gap-1 justify-end">
          <p
            className={cn(
              "text-sm font-semibold",
              isEstimate && "text-muted-foreground", // Prix estimé en gris
            )}
          >
            {formatPrice(movie.marketPrice?.median)}
          </p>

          {/* Indicateur estimation */}
          {isEstimate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-amber-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[200px]">
                  <p className="text-xs">Prix estimé basé sur le format. Aucune vente eBay trouvée pour ce titre.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Nombre de ventes si prix réel */}
        {!isEstimate && movie.marketPrice?.sampleSize && movie.marketPrice.sampleSize > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {movie.marketPrice.sampleSize} vente{movie.marketPrice.sampleSize > 1 ? "s" : ""}
          </p>
        )}

        {/* Profit/Loss */}
        {showProfit && movie.profitLossPercent !== undefined && (
          <p className={cn("text-xs font-medium", movie.profitLossPercent > 0 ? "text-green-500" : "text-red-500")}>
            {movie.profitLossPercent > 0 ? "+" : ""}
            {movie.profitLossPercent}%
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// 5. JSX À AJOUTER POUR LA PROGRESSION
// ============================================

// Ajouter dans le header, après le bouton refresh:
{
  refreshing && refreshProgress && (
    <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="hidden sm:inline">{refreshProgress.status}</span>
      <span className="text-xs font-medium">
        ({refreshProgress.current}/{refreshProgress.total})
      </span>
    </div>
  );
}

// ============================================
// 6. AJOUTER UN WARNING POUR LES ESTIMATIONS
// ============================================

// Ajouter après le Coverage Warning existant:
{
  valuation && valuation.itemsWithEstimate > 0 && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
    >
      <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-500">
          {valuation.itemsWithEstimate} prix estimé{valuation.itemsWithEstimate > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          Ces films n'ont pas de ventes eBay récentes. Les prix sont des estimations basées sur le format.
        </p>
      </div>
    </motion.div>
  );
}

// ============================================
// 7. MODIFIER LA CARTE "COUVERTURE"
// ============================================

// Remplacer la ValueCard de couverture par:
<ValueCard
  label="Couverture"
  value={`${valuation?.itemsWithPrice || 0}/${movies.length}`}
  subValue={
    valuation?.itemsWithEstimate
      ? `dont ${valuation.itemsWithEstimate} estimé${valuation.itemsWithEstimate > 1 ? "s" : ""}`
      : "films valorisés"
  }
  icon={Sparkles}
  loading={loading}
/>;
