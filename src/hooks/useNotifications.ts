import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Notification,
  NotificationPreferences,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  fetchNotificationPreferences,
  upsertNotificationPreferences,
} from '@/services/notificationService';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences | null;
  preferencesLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(user.id),
        fetchUnreadCount(user.id),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const prefs = await fetchNotificationPreferences(user.id);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setPreferencesLoading(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      setPreferencesLoading(false);
    }
  }, [user?.id, loadNotifications, loadPreferences]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [user?.id]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const notif = notifications.find(n => n.id === id);
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  const handleUpdatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    if (!user?.id) return;
    
    try {
      await upsertNotificationPreferences(user.id, prefs);
      setPreferences(prev => prev ? { ...prev, ...prefs } : null);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [user?.id]);

  return {
    notifications,
    unreadCount,
    loading,
    preferences,
    preferencesLoading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    updatePreferences: handleUpdatePreferences,
    refresh: loadNotifications,
  };
};
