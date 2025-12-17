/**
 * CineVault - Price Card Component (CORRIGÉ)
 *
 * CORRECTIONS:
 * - Le bouton "Créer alerte" ouvre maintenant le PriceAlertDialog
 * - Intégration complète avec usePriceAlerts hook
 * - Gestion des alertes existantes (créer, supprimer, toggle)
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink,
  Bell,
  BellOff,
  Info,
  Loader2,
  DollarSign,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PriceData,
  formatPrice,
  lookupPrice,
  getCachedPrice,
  calculateProfitPercent,
  eurosToCents,
} from "@/services/priceService";
import { PriceAlertDialog } from "./PriceAlertDialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";

// ============================================
// Types
// ============================================
interface PriceCardProps {
  tmdbId: number;
  title: string;
  format: string;
  year?: number;
  purchasePrice?: number;
  posterPath?: string;
  className?: string;
  variant?: "compact" | "full" | "inline";
  onPriceLoaded?: (price: PriceData) => void;
}

// ============================================
// Component
// ============================================
export function PriceCard({
  tmdbId,
  title,
  format,
  year,
  purchasePrice,
  posterPath,
  className,
  variant = "compact",
  onPriceLoaded,
}: PriceCardProps) {
  const { user } = useAuth();
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // CORRECTION: État pour contrôler l'ouverture du dialog
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);

  // CORRECTION: Hook pour gérer les alertes
  const { createAlert, deleteAlert, updateAlert, getAlertsForMovie, hasAlertForMovie } = usePriceAlerts();

  // Récupérer les alertes existantes pour ce film
  const movieAlerts = getAlertsForMovie(tmdbId, format);
  const hasActiveAlert = hasAlertForMovie(tmdbId, format);

  // Calcul profit/loss
  const purchaseCents = purchasePrice ? eurosToCents(purchasePrice) : null;
  const profitLoss = price && purchaseCents ? price.median - purchaseCents : null;
  const profitPercent = price && purchaseCents ? calculateProfitPercent(purchaseCents, price.median) : null;

  const trend = profitPercent !== null ? (profitPercent > 5 ? "up" : profitPercent < -5 ? "down" : "neutral") : null;

  // Charger le prix au mount
  useEffect(() => {
    loadPrice();
  }, [tmdbId, format]);

  const loadPrice = async () => {
    setLoading(true);

    // Vérifier le cache d'abord
    const cached = await getCachedPrice(tmdbId, format);
    if (cached) {
      setPrice(cached);
      setLoading(false);
      onPriceLoaded?.(cached);
      return;
    }

    // Fetch depuis l'API
    const result = await lookupPrice(tmdbId, title, format, year);
    if (result) {
      setPrice(result);
      onPriceLoaded?.(result);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await lookupPrice(tmdbId, title, format, year);
    if (result) {
      setPrice(result);
      onPriceLoaded?.(result);
    }
    setRefreshing(false);
  };

  // CORRECTION: Handler qui ouvre le dialog au lieu de juste setAlertSet(true)
  const handleSetAlert = () => {
    if (user) {
      setAlertDialogOpen(true);
    }
  };

  // CORRECTION: Handler pour créer une alerte
  const handleCreateAlert = async (params: {
    alertType: "price_above" | "price_below" | "percent_change";
    thresholdPrice?: number;
    thresholdPercent?: number;
  }) => {
    await createAlert({
      tmdbId,
      format,
      alertType: params.alertType,
      thresholdPrice: params.thresholdPrice,
      thresholdPercent: params.thresholdPercent,
      movieTitle: title,
      posterPath,
    });
  };

  // CORRECTION: Handler pour supprimer une alerte
  const handleDeleteAlert = async (alertId: string) => {
    await deleteAlert(alertId);
  };

  // CORRECTION: Handler pour activer/désactiver une alerte
  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    await updateAlert(alertId, { isActive });
  };

  // ============================================
  // Inline Variant (minimal)
  // ============================================
  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        ) : price ? (
          <>
            <span className="font-medium">{formatPrice(price.median)}</span>
            {trend && (
              <span className={cn("text-xs", trend === "up" && "text-green-500", trend === "down" && "text-red-500")}>
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : trend === "down" ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </span>
    );
  }

  // ============================================
  // Compact Variant
  // ============================================
  if (variant === "compact") {
    return (
      <>
        <Popover open={showDetails} onOpenChange={setShowDetails}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                "bg-card/50 border border-white/10 backdrop-blur-sm",
                "hover:bg-card/80 transition-colors cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                className,
              )}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : price ? (
                <>
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{formatPrice(price.median)}</span>
                  {trend && (
                    <span
                      className={cn("text-xs", trend === "up" && "text-green-500", trend === "down" && "text-red-500")}
                    >
                      {trend === "up" ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : trend === "down" ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                    </span>
                  )}
                  {hasActiveAlert && <Bell className="w-3 h-3 text-primary" />}
                </>
              ) : (
                <span className="text-muted-foreground text-sm">Prix N/A</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            {price ? (
              <div className="space-y-3">
                {/* Fourchette de prix */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fourchette</span>
                    <span>
                      {formatPrice(price.min)} - {formatPrice(price.max)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Médiane</span>
                    <span className="font-medium text-primary">{formatPrice(price.median)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Basé sur {price.sampleSize} vente{price.sampleSize > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Plus-value si prix d'achat disponible */}
                {profitLoss !== null && purchaseCents && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Plus-value</span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          profitLoss > 0 ? "text-green-500" : profitLoss < 0 ? "text-red-500" : "",
                        )}
                      >
                        {profitLoss > 0 ? "+" : ""}
                        {formatPrice(profitLoss)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Acheté {formatPrice(purchaseCents)} • {profitPercent! > 0 ? "+" : ""}
                      {profitPercent}%
                    </p>
                  </div>
                )}

                {/* Source et actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs text-muted-foreground capitalize">Source: {price.source}</span>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleRefresh}
                          disabled={refreshing}
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Actualiser</TooltipContent>
                    </Tooltip>

                    {/* CORRECTION: Bouton qui ouvre maintenant le dialog */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleSetAlert}
                          disabled={!user}
                        >
                          {hasActiveAlert ? (
                            <BellOff className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{hasActiveAlert ? "Gérer les alertes" : "Créer une alerte"}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Prix non disponible</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh} disabled={refreshing}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
                  Réessayer
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* CORRECTION: Rendu du PriceAlertDialog */}
        <PriceAlertDialog
          open={alertDialogOpen}
          onOpenChange={setAlertDialogOpen}
          movie={{
            tmdbId,
            title,
            format,
            posterPath,
            currentPrice: price?.median,
          }}
          existingAlerts={movieAlerts}
          onCreateAlert={handleCreateAlert}
          onDeleteAlert={handleDeleteAlert}
          onToggleAlert={handleToggleAlert}
        />
      </>
    );
  }

  // ============================================
  // Full Variant
  // ============================================
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-xl p-4 space-y-4",
          "bg-gradient-to-br from-card/80 to-card/40",
          "border border-white/10 backdrop-blur-sm",
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Prix du Marché</h4>
              <p className="text-xs text-muted-foreground capitalize">{format}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={cn("w-4 h-4", (refreshing || loading) && "animate-spin")} />
          </Button>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : price ? (
          <div className="space-y-4">
            {/* Prix principal */}
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{formatPrice(price.median)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatPrice(price.min)} - {formatPrice(price.max)}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <p className="text-xs text-muted-foreground">Échantillon</p>
                <p className="font-semibold">{price.sampleSize} ventes</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-semibold capitalize">{price.source}</p>
              </div>
            </div>

            {/* Plus-value */}
            {profitLoss !== null && purchaseCents && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-3 rounded-lg",
                  trend === "up" && "bg-green-500/10 border border-green-500/20",
                  trend === "down" && "bg-red-500/10 border border-red-500/20",
                  trend === "neutral" && "bg-muted",
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Plus-value</p>
                    <p
                      className={cn(
                        "text-xl font-bold",
                        trend === "up" && "text-green-500",
                        trend === "down" && "text-red-500",
                      )}
                    >
                      {profitLoss > 0 ? "+" : ""}
                      {formatPrice(profitLoss)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "p-3 rounded-full",
                      trend === "up" && "bg-green-500/20",
                      trend === "down" && "bg-red-500/20",
                      trend === "neutral" && "bg-muted",
                    )}
                  >
                    {trend === "up" ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : trend === "down" ? (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    ) : (
                      <Minus className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <p
                  className={cn(
                    "text-sm font-medium mt-2",
                    trend === "up" && "text-green-500",
                    trend === "down" && "text-red-500",
                    trend === "neutral" && "text-muted-foreground",
                  )}
                >
                  {profitPercent! > 0 ? "+" : ""}
                  {profitPercent}% depuis l'achat
                </p>
              </motion.div>
            )}

            {/* CORRECTION: Actions avec dialog fonctionnel */}
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleSetAlert} disabled={!user}>
                {hasActiveAlert ? (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Gérer alertes ({movieAlerts.length})
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Créer alerte
                  </>
                )}
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={`https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(title + " " + format)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  eBay
                </a>
              </Button>
            </div>

            {/* Info source */}
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Info className="w-3 h-3" />
              <span>
                Source: {price.source} •{" "}
                {price.cached
                  ? `Mis en cache le ${new Date(price.updatedAt || Date.now()).toLocaleDateString("fr-FR")}`
                  : "Données en temps réel"}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucune donnée de prix disponible</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
              Rechercher
            </Button>
          </div>
        )}
      </motion.div>

      {/* CORRECTION: Dialog d'alertes pour la variante full */}
      <PriceAlertDialog
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        movie={{
          tmdbId,
          title,
          format,
          posterPath,
          currentPrice: price?.median,
        }}
        existingAlerts={movieAlerts}
        onCreateAlert={handleCreateAlert}
        onDeleteAlert={handleDeleteAlert}
        onToggleAlert={handleToggleAlert}
      />
    </>
  );
}
