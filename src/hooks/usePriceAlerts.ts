/**
 * CineVault - usePriceAlerts Hook
 * 
 * Hook pour gérer les alertes de prix avec state local et sync Supabase
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  PriceAlert,
  AlertType,
  CreateAlertParams,
  getUserAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
  getMovieAlerts,
} from "@/services/priceAlertsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ============================================
// Types
// ============================================

interface UsePriceAlertsReturn {
  alerts: PriceAlert[];
  loading: boolean;
  error: string | null;
  createAlert: (params: CreateAlertParams) => Promise<PriceAlert | null>;
  updateAlert: (alertId: string, updates: Partial<{ thresholdPrice: number; thresholdPercent: number; isActive: boolean }>) => Promise<boolean>;
  deleteAlert: (alertId: string) => Promise<boolean>;
  getAlertsForMovie: (tmdbId: number, format?: string) => PriceAlert[];
  hasAlertForMovie: (tmdbId: number, format?: string) => boolean;
  activeAlertsCount: number;
  triggeredAlertsCount: number;
  refresh: () => Promise<void>;
}

// ============================================
// Hook
// ============================================

export function usePriceAlerts(): UsePriceAlertsReturn {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getUserAlerts(user.id);
      setAlerts(data);
      setError(null);
    } catch (err) {
      console.error("[usePriceAlerts] Fetch error:", err);
      setError("Erreur lors du chargement des alertes");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("price-alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "price_alerts",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAlerts]);

  // Create alert
  const createAlert = useCallback(
    async (params: CreateAlertParams): Promise<PriceAlert | null> => {
      if (!user) return null;

      const alert = await createPriceAlert(user.id, params);
      
      if (alert) {
        setAlerts((prev) => [alert, ...prev]);
        toast({
          title: "Alerte créée",
          description: "Vous serez notifié quand le prix atteindra votre seuil",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer l'alerte",
          variant: "destructive",
        });
      }

      return alert;
    },
    [user]
  );

  // Update alert
  const updateAlertHandler = useCallback(
    async (
      alertId: string,
      updates: Partial<{ thresholdPrice: number; thresholdPercent: number; isActive: boolean }>
    ): Promise<boolean> => {
      const success = await updatePriceAlert(alertId, updates);
      
      if (success) {
        setAlerts((prev) =>
          prev.map((a) =>
            a.id === alertId ? { ...a, ...updates } : a
          )
        );
        toast({
          title: "Alerte mise à jour",
        });
      }

      return success;
    },
    []
  );

  // Delete alert
  const deleteAlertHandler = useCallback(
    async (alertId: string): Promise<boolean> => {
      const success = await deletePriceAlert(alertId);
      
      if (success) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        toast({
          title: "Alerte supprimée",
        });
      }

      return success;
    },
    []
  );

  // Get alerts for specific movie
  const getAlertsForMovie = useCallback(
    (tmdbId: number, format?: string): PriceAlert[] => {
      return alerts.filter(
        (a) =>
          a.tmdbId === tmdbId &&
          (!format || a.format === format.toLowerCase())
      );
    },
    [alerts]
  );

  // Check if movie has alert
  const hasAlertForMovie = useCallback(
    (tmdbId: number, format?: string): boolean => {
      return alerts.some(
        (a) =>
          a.tmdbId === tmdbId &&
          a.isActive &&
          (!format || a.format === format.toLowerCase())
      );
    },
    [alerts]
  );

  // Computed values
  const activeAlertsCount = alerts.filter((a) => a.isActive).length;
  const triggeredAlertsCount = alerts.filter((a) => a.triggeredAt).length;

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert: updateAlertHandler,
    deleteAlert: deleteAlertHandler,
    getAlertsForMovie,
    hasAlertForMovie,
    activeAlertsCount,
    triggeredAlertsCount,
    refresh: fetchAlerts,
  };
}

// ============================================
// Hook for single movie alerts
// ============================================

export function useMoviePriceAlerts(tmdbId: number, format?: string) {
  const { alerts, createAlert, deleteAlert, loading } = usePriceAlerts();
  
  const movieAlerts = alerts.filter(
    (a) =>
      a.tmdbId === tmdbId &&
      (!format || a.format === format.toLowerCase())
  );

  const activeAlert = movieAlerts.find((a) => a.isActive);
  const hasActiveAlert = !!activeAlert;

  const toggleAlert = async (params: Omit<CreateAlertParams, "tmdbId" | "format">) => {
    if (activeAlert) {
      await deleteAlert(activeAlert.id);
    } else {
      await createAlert({
        ...params,
        tmdbId,
        format: format || "bluray",
      });
    }
  };

  return {
    alerts: movieAlerts,
    activeAlert,
    hasActiveAlert,
    toggleAlert,
    loading,
  };
}
