/**
 * CineVault - useWishlist Hook
 * 
 * Hook React pour la gestion de la wishlist
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  WishlistItem,
  AddWishlistData,
  EbayAlert,
  getWishlist,
  addToWishlist,
  updateWishlistItem,
  removeFromWishlist,
  isInWishlist,
  toggleEbayTracking,
  getEbayAlerts,
  getUnseenAlertsCount,
  markAlertAsSeen,
  markAllAlertsAsSeen,
  dismissAlert,
} from '@/services/wishlistService';
import { toast } from '@/hooks/use-toast';

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [alerts, setAlerts] = useState<EbayAlert[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Fetch wishlist
  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getWishlist(user.id);
      setItems(data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch eBay alerts
  const fetchAlerts = useCallback(async () => {
    if (!user) {
      setAlerts([]);
      return;
    }

    setAlertsLoading(true);
    try {
      const [alertsData, count] = await Promise.all([
        getEbayAlerts(user.id),
        getUnseenAlertsCount(user.id),
      ]);
      setAlerts(alertsData);
      setUnseenCount(count);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchWishlist();
    fetchAlerts();
  }, [fetchWishlist, fetchAlerts]);

  // Add to wishlist
  const add = useCallback(async (data: AddWishlistData): Promise<boolean> => {
    if (!user) return false;

    try {
      const item = await addToWishlist(user.id, data);
      if (item) {
        setItems(prev => [item, ...prev]);
        toast({
          title: '🎯 Ajouté à la wishlist',
          description: `${data.title} a été ajouté à votre liste d'achats.`,
        });
        return true;
      }
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Déjà dans la wishlist',
          description: 'Ce film est déjà dans votre liste d\'achats.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'ajouter à la wishlist.',
          variant: 'destructive',
        });
      }
    }
    return false;
  }, [user]);

  // Update item
  const update = useCallback(async (
    id: string,
    updates: Partial<AddWishlistData>
  ): Promise<boolean> => {
    try {
      const updated = await updateWishlistItem(id, updates);
      if (updated) {
        setItems(prev => prev.map(item => item.id === id ? updated : item));
        toast({
          title: 'Wishlist mise à jour',
        });
        return true;
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour.',
        variant: 'destructive',
      });
    }
    return false;
  }, []);

  // Remove from wishlist
  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await removeFromWishlist(id);
      if (success) {
        setItems(prev => prev.filter(item => item.id !== id));
        toast({
          title: 'Retiré de la wishlist',
        });
        return true;
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer de la wishlist.',
        variant: 'destructive',
      });
    }
    return false;
  }, []);

  // Check if in wishlist
  const checkInWishlist = useCallback(async (tmdbId: number): Promise<boolean> => {
    if (!user) return false;
    return isInWishlist(user.id, tmdbId);
  }, [user]);

  // Toggle eBay tracking
  const toggleTracking = useCallback(async (id: string, enabled: boolean): Promise<boolean> => {
    try {
      const success = await toggleEbayTracking(id, enabled);
      if (success) {
        setItems(prev => prev.map(item => 
          item.id === id ? { ...item, ebay_tracking_enabled: enabled } : item
        ));
        toast({
          title: enabled ? '🔔 Tracking activé' : 'Tracking désactivé',
          description: enabled 
            ? 'Vous recevrez des alertes pour les nouvelles annonces eBay.' 
            : 'Les alertes eBay sont désactivées.',
        });
        return true;
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        variant: 'destructive',
      });
    }
    return false;
  }, []);

  // Alert actions
  const markSeen = useCallback(async (alertId: string) => {
    const success = await markAlertAsSeen(alertId);
    if (success) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_seen: true } : a));
      setUnseenCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const markAllSeen = useCallback(async () => {
    if (!user) return;
    const success = await markAllAlertsAsSeen(user.id);
    if (success) {
      setAlerts(prev => prev.map(a => ({ ...a, is_seen: true })));
      setUnseenCount(0);
    }
  }, [user]);

  const dismiss = useCallback(async (alertId: string) => {
    const success = await dismissAlert(alertId);
    if (success) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    }
  }, []);

  return {
    // Wishlist
    items,
    loading,
    add,
    update,
    remove,
    checkInWishlist,
    toggleTracking,
    refresh: fetchWishlist,
    
    // Alerts
    alerts,
    alertsLoading,
    unseenCount,
    markSeen,
    markAllSeen,
    dismiss,
    refreshAlerts: fetchAlerts,
  };
}

export default useWishlist;
