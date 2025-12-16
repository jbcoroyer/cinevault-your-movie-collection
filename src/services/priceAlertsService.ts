/**
 * CineVault - Price Alerts Service
 * 
 * Service pour la gestion des alertes de prix utilisateur
 * Permet de créer, modifier, supprimer et vérifier les alertes
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================
// Types
// ============================================

export type AlertType = "price_above" | "price_below" | "percent_change";

export interface PriceAlert {
  id: string;
  userId: string;
  tmdbId: number;
  format: string;
  alertType: AlertType;
  thresholdPrice?: number; // en centimes
  thresholdPercent?: number;
  isActive: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
  createdAt: string;
  // Données enrichies (non stockées)
  movieTitle?: string;
  posterPath?: string;
  currentPrice?: number;
}

export interface CreateAlertParams {
  tmdbId: number;
  format: string;
  alertType: AlertType;
  thresholdPrice?: number;
  thresholdPercent?: number;
  movieTitle?: string;
  posterPath?: string;
}

export interface AlertCheckResult {
  alert: PriceAlert;
  triggered: boolean;
  currentPrice: number;
  message: string;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crée une nouvelle alerte de prix
 */
export const createPriceAlert = async (
  userId: string,
  params: CreateAlertParams
): Promise<PriceAlert | null> => {
  try {
    const { data, error } = await supabase
      .from("price_alerts")
      .insert({
        user_id: userId,
        tmdb_id: params.tmdbId,
        format: params.format.toLowerCase(),
        alert_type: params.alertType,
        threshold_price: params.thresholdPrice,
        threshold_percent: params.thresholdPercent,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("[PriceAlerts] Create error:", error);
      return null;
    }

    return mapDbToAlert(data);
  } catch (error) {
    console.error("[PriceAlerts] Create exception:", error);
    return null;
  }
};

/**
 * Récupère toutes les alertes d'un utilisateur
 */
export const getUserAlerts = async (userId: string): Promise<PriceAlert[]> => {
  try {
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PriceAlerts] Fetch error:", error);
      return [];
    }

    return (data || []).map(mapDbToAlert);
  } catch (error) {
    console.error("[PriceAlerts] Fetch exception:", error);
    return [];
  }
};

/**
 * Récupère les alertes actives pour un film spécifique
 */
export const getMovieAlerts = async (
  userId: string,
  tmdbId: number,
  format?: string
): Promise<PriceAlert[]> => {
  try {
    let query = supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("is_active", true);

    if (format) {
      query = query.eq("format", format.toLowerCase());
    }

    const { data, error } = await query;

    if (error) return [];
    return (data || []).map(mapDbToAlert);
  } catch {
    return [];
  }
};

/**
 * Met à jour une alerte
 */
export const updatePriceAlert = async (
  alertId: string,
  updates: Partial<{
    thresholdPrice: number;
    thresholdPercent: number;
    isActive: boolean;
  }>
): Promise<boolean> => {
  try {
    const updateData: Record<string, unknown> = {};
    
    if (updates.thresholdPrice !== undefined) {
      updateData.threshold_price = updates.thresholdPrice;
    }
    if (updates.thresholdPercent !== undefined) {
      updateData.threshold_percent = updates.thresholdPercent;
    }
    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    const { error } = await supabase
      .from("price_alerts")
      .update(updateData)
      .eq("id", alertId);

    return !error;
  } catch {
    return false;
  }
};

/**
 * Supprime une alerte
 */
export const deletePriceAlert = async (alertId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("price_alerts")
      .delete()
      .eq("id", alertId);

    return !error;
  } catch {
    return false;
  }
};

/**
 * Marque une alerte comme déclenchée
 */
export const triggerAlert = async (
  alertId: string,
  triggeredPrice: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("price_alerts")
      .update({
        triggered_at: new Date().toISOString(),
        triggered_price: triggeredPrice,
        is_active: false,
      })
      .eq("id", alertId);

    return !error;
  } catch {
    return false;
  }
};

// ============================================
// Alert Checking
// ============================================

/**
 * Vérifie si une alerte doit être déclenchée
 */
export const checkAlert = (
  alert: PriceAlert,
  currentPrice: number,
  previousPrice?: number
): AlertCheckResult => {
  let triggered = false;
  let message = "";

  switch (alert.alertType) {
    case "price_above":
      if (alert.thresholdPrice && currentPrice >= alert.thresholdPrice) {
        triggered = true;
        message = `Le prix a atteint ${formatCents(currentPrice)} (seuil: ${formatCents(alert.thresholdPrice)})`;
      }
      break;

    case "price_below":
      if (alert.thresholdPrice && currentPrice <= alert.thresholdPrice) {
        triggered = true;
        message = `Le prix est descendu à ${formatCents(currentPrice)} (seuil: ${formatCents(alert.thresholdPrice)})`;
      }
      break;

    case "percent_change":
      if (alert.thresholdPercent && previousPrice) {
        const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
        if (Math.abs(percentChange) >= alert.thresholdPercent) {
          triggered = true;
          const direction = percentChange > 0 ? "augmenté" : "diminué";
          message = `Le prix a ${direction} de ${Math.abs(percentChange).toFixed(1)}% (seuil: ${alert.thresholdPercent}%)`;
        }
      }
      break;
  }

  return { alert, triggered, currentPrice, message };
};

/**
 * Vérifie toutes les alertes actives d'un utilisateur
 */
export const checkUserAlerts = async (
  userId: string,
  priceMap: Map<string, number>,
  previousPriceMap?: Map<string, number>
): Promise<AlertCheckResult[]> => {
  const alerts = await getUserAlerts(userId);
  const activeAlerts = alerts.filter((a) => a.isActive);
  const results: AlertCheckResult[] = [];

  for (const alert of activeAlerts) {
    const key = `${alert.tmdbId}-${alert.format}`;
    const currentPrice = priceMap.get(key);
    const previousPrice = previousPriceMap?.get(key);

    if (currentPrice) {
      const result = checkAlert(alert, currentPrice, previousPrice);
      if (result.triggered) {
        // Marquer l'alerte comme déclenchée
        await triggerAlert(alert.id, currentPrice);
        results.push(result);
      }
    }
  }

  return results;
};

// ============================================
// Helpers
// ============================================

interface DbPriceAlert {
  id: string;
  user_id: string;
  tmdb_id: number;
  format: string;
  alert_type: string;
  threshold_price: number | null;
  threshold_percent: number | null;
  is_active: boolean | null;
  triggered_at: string | null;
  triggered_price: number | null;
  created_at: string | null;
}

const mapDbToAlert = (row: DbPriceAlert): PriceAlert => ({
  id: row.id,
  userId: row.user_id,
  tmdbId: row.tmdb_id,
  format: row.format,
  alertType: row.alert_type as AlertType,
  thresholdPrice: row.threshold_price ?? undefined,
  thresholdPercent: row.threshold_percent ?? undefined,
  isActive: row.is_active ?? true,
  triggeredAt: row.triggered_at ?? undefined,
  triggeredPrice: row.triggered_price ?? undefined,
  createdAt: row.created_at ?? new Date().toISOString(),
});

const formatCents = (cents: number): string => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

// ============================================
// Export alert type labels
// ============================================

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  price_above: "Prix dépasse",
  price_below: "Prix descend sous",
  percent_change: "Variation de",
};

export const ALERT_TYPE_ICONS: Record<AlertType, string> = {
  price_above: "TrendingUp",
  price_below: "TrendingDown",
  percent_change: "Percent",
};
