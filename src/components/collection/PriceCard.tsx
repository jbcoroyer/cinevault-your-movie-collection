/**
 * CineVault - Price Card Component
 * 
 * Affiche le prix du marché pour un film physique individuel
 * Avec comparaison prix d'achat vs valeur marché
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PriceData,
  formatPrice,
  lookupPrice,
  getCachedPrice,
  createPriceAlert,
  calculateProfitPercent,
  eurosToCents,
} from "@/services/priceService";

// ============================================
// Types
// ============================================

interface PriceCardProps {
  tmdbId: number;
  title: string;
  format: string;
  year?: number;
  purchasePrice?: number; // En euros
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
  className,
  variant = "compact",
  onPriceLoaded,
}: PriceCardProps) {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertSet, setAlertSet] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate profit/loss
  const purchaseCents = purchasePrice ? eurosToCents(purchasePrice) : null;
  const profitLoss =
    price && purchaseCents ? price.median - purchaseCents : null;
  const profitPercent =
    price && purchaseCents
      ? calculateProfitPercent(purchaseCents, price.median)
      : null;

  const trend =
    profitPercent !== null
      ? profitPercent > 5
        ? "up"
        : profitPercent < -5
        ? "down"
        : "neutral"
      : null;

  // Load price on mount
  useEffect(() => {
    loadPrice();
  }, [tmdbId, format]);

  const loadPrice = async () => {
    setLoading(true);

    // Check cache first
    const cached = await getCachedPrice(tmdbId, format);
    if (cached) {
      setPrice(cached);
      setLoading(false);
      onPriceLoaded?.(cached);
      return;
    }

    // Fetch from API
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

  const handleSetAlert = async () => {
    // TODO: Get user ID from auth context
    // await createPriceAlert(userId, tmdbId, format, 'price_increase', 20);
    setAlertSet(true);
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
              <span
                className={cn(
                  "text-xs",
                  trend === "up" && "text-green-500",
                  trend === "down" && "text-red-500"
                )}
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
      <Popover open={showDetails} onOpenChange={setShowDetails}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg",
              "bg-card/50 border border-white/10 backdrop-blur-sm",
              "hover:bg-card/80 transition-colors cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-primary/50",
              className
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : price ? (
              <>
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold">{formatPrice(price.median)}</span>
                {trend && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      trend === "up" && "text-green-500",
                      trend === "down" && "text-red-500",
                      trend === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {profitPercent !== null && (
                      <>
                        {profitPercent > 0 ? "+" : ""}
                        {profitPercent}%
                      </>
                    )}
                  </span>
                )}
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">—</span>
              </>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Prix du Marché</h4>
              <Badge variant="outline" className="text-xs capitalize">
                {format}
              </Badge>
            </div>

            {price ? (
              <>
                {/* Main Price */}
                <div className="text-center py-2">
                  <p className="text-3xl font-bold">{formatPrice(price.median)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix médian • {price.sampleSize} annonces analysées
                  </p>
                </div>

                {/* Price Range */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Min</p>
                    <p className="font-semibold">{formatPrice(price.min)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Max</p>
                    <p className="font-semibold">{formatPrice(price.max)}</p>
                  </div>
                </div>

                {/* Profit/Loss */}
                {purchaseCents && profitLoss !== null && (
                  <div
                    className={cn(
                      "p-3 rounded-lg",
                      trend === "up" && "bg-green-500/10",
                      trend === "down" && "bg-red-500/10",
                      trend === "neutral" && "bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Plus-value
                      </span>
                      <div className="flex items-center gap-1">
                        {trend === "up" ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : trend === "down" ? (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span
                          className={cn(
                            "font-semibold",
                            trend === "up" && "text-green-500",
                            trend === "down" && "text-red-500"
                          )}
                        >
                          {profitLoss > 0 ? "+" : ""}
                          {formatPrice(profitLoss)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Acheté {formatPrice(purchaseCents)} • {profitPercent! > 0 ? "+" : ""}{profitPercent}%
                    </p>
                  </div>
                )}

                {/* Source & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-xs text-muted-foreground capitalize">
                    Source: {price.source}
                  </span>
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
                          <RefreshCw
                            className={cn(
                              "w-3.5 h-3.5",
                              refreshing && "animate-spin"
                            )}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Actualiser</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleSetAlert}
                          disabled={alertSet}
                        >
                          {alertSet ? (
                            <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {alertSet ? "Alerte active" : "Créer une alerte"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Prix non disponible
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")}
                  />
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // ============================================
  // Full Variant
  // ============================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl p-4 space-y-4",
        "bg-gradient-to-br from-card/80 to-card/40",
        "border border-white/10 backdrop-blur-sm",
        className
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
          <RefreshCw
            className={cn(
              "w-4 h-4",
              (refreshing || loading) && "animate-spin"
            )}
          />
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : price ? (
        <>
          {/* Main Price */}
          <div className="text-center">
            <motion.p
              key={price.median}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold"
            >
              {formatPrice(price.median)}
            </motion.p>
            <p className="text-sm text-muted-foreground mt-1">
              Basé sur {price.sampleSize} annonces
            </p>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Min</p>
              <p className="font-semibold text-sm">{formatPrice(price.min)}</p>
            </div>
            <div className="p-2 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground">Médian</p>
              <p className="font-semibold text-sm text-primary">
                {formatPrice(price.median)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">Max</p>
              <p className="font-semibold text-sm">{formatPrice(price.max)}</p>
            </div>
          </div>

          {/* Profit/Loss Card */}
          {purchaseCents && profitLoss !== null && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-4 rounded-lg",
                trend === "up" && "bg-green-500/10 border border-green-500/20",
                trend === "down" && "bg-red-500/10 border border-red-500/20",
                trend === "neutral" && "bg-muted/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Prix d'achat: {formatPrice(purchaseCents)}
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold mt-1",
                      trend === "up" && "text-green-500",
                      trend === "down" && "text-red-500"
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
                    trend === "neutral" && "bg-muted"
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
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {profitPercent! > 0 ? "+" : ""}
                {profitPercent}% depuis l'achat
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleSetAlert}
              disabled={alertSet}
            >
              {alertSet ? (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Alerte active
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Créer alerte
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
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

          {/* Source Info */}
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3" />
            <span>
              Source: {price.source} •{" "}
              {price.cached ? "Cache" : "Temps réel"}
            </span>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <BarChart2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Prix non disponible</p>
          <p className="text-xs text-muted-foreground mt-1">
            Aucune donnée trouvée pour ce format
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")}
            />
            Réessayer
          </Button>
        </div>
      )}
    </motion.div>
  );
}
