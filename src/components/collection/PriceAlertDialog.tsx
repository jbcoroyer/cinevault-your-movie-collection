/**
 * CineVault - PriceAlertDialog
 * 
 * Dialog premium pour créer et gérer les alertes de prix
 * Permet de définir des seuils de prix ou de % de variation
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  BellRing,
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Trash2,
  Plus,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertType,
  PriceAlert,
  ALERT_TYPE_LABELS,
} from "@/services/priceAlertsService";
import { getImageUrl } from "@/services/tmdb";

// ============================================
// Types
// ============================================

interface PriceAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie: {
    tmdbId: number;
    title: string;
    format: string;
    posterPath?: string;
    currentPrice?: number; // en centimes
  };
  existingAlerts?: PriceAlert[];
  onCreateAlert: (params: {
    alertType: AlertType;
    thresholdPrice?: number;
    thresholdPercent?: number;
  }) => Promise<void>;
  onDeleteAlert: (alertId: string) => Promise<void | boolean>;
  onToggleAlert: (alertId: string, isActive: boolean) => Promise<void | boolean>;
}

// ============================================
// Alert Type Selector
// ============================================

function AlertTypeSelector({
  value,
  onChange,
}: {
  value: AlertType;
  onChange: (value: AlertType) => void;
}) {
  const options: { value: AlertType; label: string; icon: React.ElementType; description: string }[] = [
    {
      value: "price_increase",
      label: "Prix dépasse",
      icon: TrendingUp,
      description: "Notification quand le prix monte au-dessus d'un seuil",
    },
    {
      value: "price_drop",
      label: "Prix descend",
      icon: TrendingDown,
      description: "Notification quand le prix tombe sous un seuil",
    },
    {
      value: "threshold",
      label: "Variation %",
      icon: Percent,
      description: "Notification sur une variation en pourcentage",
    },
  ];

  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as AlertType)}
      className="grid grid-cols-1 gap-3"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            className={cn(
              "relative flex items-center gap-4 p-4 rounded-xl cursor-pointer",
              "border transition-all duration-200",
              isSelected
                ? "bg-primary/10 border-primary/50"
                : "bg-white/[0.02] border-white/10 hover:border-white/20"
            )}
          >
            <RadioGroupItem
              value={option.value}
              className="sr-only"
            />
            
            <div
              className={cn(
                "p-2 rounded-lg",
                isSelected
                  ? "bg-primary/20"
                  : "bg-white/5"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5",
                  isSelected ? "text-primary" : "text-zinc-400"
                )}
              />
            </div>

            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-white" : "text-zinc-300"
                )}
              >
                {option.label}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {option.description}
              </p>
            </div>

            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-primary-foreground" />
              </motion.div>
            )}
          </label>
        );
      })}
    </RadioGroup>
  );
}

// ============================================
// Existing Alert Item
// ============================================

function ExistingAlertItem({
  alert,
  onDelete,
  onToggle,
}: {
  alert: PriceAlert;
  onDelete: () => void;
  onToggle: (isActive: boolean) => void;
}) {
  const formatThreshold = () => {
    if (alert.alertType === "threshold") {
      return `${alert.thresholdPercent}%`;
    }
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    }).format((alert.thresholdPrice || 0) / 100);
  };

  const getIcon = () => {
    switch (alert.alertType) {
      case "price_increase":
        return TrendingUp;
      case "price_drop":
        return TrendingDown;
      case "threshold":
        return Percent;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-white/[0.02] border border-white/10",
        !alert.isActive && "opacity-50"
      )}
    >
      <div
        className={cn(
          "p-2 rounded-lg",
          alert.isActive ? "bg-primary/20" : "bg-zinc-800"
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4",
            alert.isActive ? "text-primary" : "text-zinc-500"
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {ALERT_TYPE_LABELS[alert.alertType]} {formatThreshold()}
        </p>
        <p className="text-[10px] text-zinc-500">
          {alert.triggeredAt
            ? `Déclenchée le ${new Date(alert.triggeredAt).toLocaleDateString("fr-FR")}`
            : "En attente"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={alert.isActive}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="h-8 w-8 text-zinc-500 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function PriceAlertDialog({
  open,
  onOpenChange,
  movie,
  existingAlerts = [],
  onCreateAlert,
  onDeleteAlert,
  onToggleAlert,
}: PriceAlertDialogProps) {
  const [alertType, setAlertType] = useState<AlertType>("price_increase");
  const [thresholdPrice, setThresholdPrice] = useState<number>(0);
  const [thresholdPercent, setThresholdPercent] = useState<number>(10);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(
    existingAlerts.length === 0
  );

  // Initialize threshold price from current price
  useEffect(() => {
    if (movie.currentPrice) {
      const adjustment = alertType === "price_increase" ? 1.2 : 0.8;
      setThresholdPrice(Math.round(movie.currentPrice * adjustment));
    }
  }, [movie.currentPrice, alertType]);

  // Handle create alert
  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreateAlert({
        alertType,
        thresholdPrice:
          alertType !== "threshold" ? thresholdPrice : undefined,
        thresholdPercent:
          alertType === "threshold" ? thresholdPercent : undefined,
      });
      setShowCreateForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  // Format label
  const formatLabels: Record<string, string> = {
    "4k": "4K UHD",
    bluray: "Blu-ray",
    dvd: "DVD",
    steelbook: "Steelbook",
    collector: "Collector",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-900 border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            Alertes de Prix
          </DialogTitle>
          <DialogDescription>
            Recevez une notification quand le prix change
          </DialogDescription>
        </DialogHeader>

        {/* Movie info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
            {movie.posterPath ? (
              <img
                src={getImageUrl(movie.posterPath, "w92")}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-zinc-600" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {movie.title}
            </p>
            <p className="text-[10px] text-zinc-500">
              {formatLabels[movie.format.toLowerCase()] || movie.format}
            </p>
            {movie.currentPrice && (
              <p className="text-xs text-primary font-medium mt-1">
                Prix actuel:{" "}
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(movie.currentPrice / 100)}
              </p>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="space-y-4 pr-2">
            {/* Existing alerts */}
            {existingAlerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-400">
                    Alertes actives ({existingAlerts.length})
                  </Label>
                  {!showCreateForm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateForm(true)}
                      className="h-7 text-xs gap-1 text-primary"
                    >
                      <Plus className="w-3 h-3" />
                      Ajouter
                    </Button>
                  )}
                </div>
                <AnimatePresence mode="popLayout">
                  {existingAlerts.map((alert) => (
                    <ExistingAlertItem
                      key={alert.id}
                      alert={alert}
                      onDelete={() => onDeleteAlert(alert.id)}
                      onToggle={(isActive) => onToggleAlert(alert.id, isActive)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Create form */}
            <AnimatePresence mode="wait">
              {showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {existingAlerts.length > 0 && (
                    <div className="h-px bg-white/10" />
                  )}

                  <Label className="text-xs text-zinc-400">
                    Nouvelle alerte
                  </Label>

                  {/* Alert type selector */}
                  <AlertTypeSelector
                    value={alertType}
                    onChange={setAlertType}
                  />

                  {/* Threshold input */}
                  {alertType === "threshold" ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Seuil de variation</Label>
                        <span className="text-lg font-bold text-primary">
                          {thresholdPercent}%
                        </span>
                      </div>
                      <Slider
                        value={[thresholdPercent]}
                        onValueChange={([v]) => setThresholdPercent(v)}
                        min={5}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>5%</span>
                        <span>50%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm">
                        Prix seuil (
                        {alertType === "price_increase" ? "maximum" : "minimum"})
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                          type="number"
                          value={thresholdPrice / 100}
                          onChange={(e) =>
                            setThresholdPrice(
                              Math.round(parseFloat(e.target.value) * 100) || 0
                            )
                          }
                          className="pl-9 bg-white/5 border-white/10"
                          placeholder="0.00"
                          step="0.5"
                          min="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                          €
                        </span>
                      </div>
                      {movie.currentPrice && (
                        <div className="flex gap-2">
                          {[0.8, 0.9, 1.1, 1.2, 1.5].map((mult) => (
                            <Button
                              key={mult}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setThresholdPrice(
                                  Math.round(movie.currentPrice! * mult)
                                )
                              }
                              className={cn(
                                "h-7 text-xs flex-1",
                                thresholdPrice ===
                                  Math.round(movie.currentPrice! * mult)
                                  ? "bg-primary/20 border-primary/50"
                                  : "border-white/10"
                              )}
                            >
                              {mult < 1 ? "" : "+"}
                              {Math.round((mult - 1) * 100)}%
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info note */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-300">
                      {alertType === "price_increase"
                        ? "Vous serez notifié quand le prix médian dépasse ce seuil."
                        : alertType === "price_drop"
                          ? "Vous serez notifié quand le prix médian descend sous ce seuil."
                          : "Vous serez notifié quand le prix varie de ce pourcentage (à la hausse ou à la baisse)."}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          {showCreateForm && existingAlerts.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
              className="text-zinc-400"
            >
              Annuler
            </Button>
          )}
          {showCreateForm && (
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Créer l'alerte
                </>
              )}
            </Button>
          )}
          {!showCreateForm && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
