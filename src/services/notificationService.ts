import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 
  | 'price_alert' 
  | 'new_follower' 
  | 'like' 
  | 'comment' 
  | 'badge_earned' 
  | 'challenge_completed' 
  | 'streak_milestone'
  | 'daily_bonus'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  price_alerts: boolean;
  new_followers: boolean;
  likes: boolean;
  comments: boolean;
  badges: boolean;
  challenges: boolean;
  system: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  price_alert: 'Alertes de prix',
  new_follower: 'Nouveaux abonnés',
  like: 'J\'aime',
  comment: 'Commentaires',
  badge_earned: 'Badges obtenus',
  challenge_completed: 'Défis complétés',
  streak_milestone: 'Paliers de streak',
  daily_bonus: 'Bonus quotidien',
  system: 'Système',
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  price_alert: 'Bell',
  new_follower: 'UserPlus',
  like: 'Heart',
  comment: 'MessageCircle',
  badge_earned: 'Award',
  challenge_completed: 'Trophy',
  streak_milestone: 'Flame',
  daily_bonus: 'Gift',
  system: 'Info',
};

// Fetch notifications for a user
export const fetchNotifications = async (userId: string, limit = 50): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return (data || []) as Notification[];
};

// Fetch unread count
export const fetchUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create a notification
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata: Record<string, unknown> = {}
): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
    } as any);

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Fetch user preferences
export const fetchNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching preferences:', error);
    throw error;
  }

  return data as NotificationPreferences | null;
};

// Create or update preferences
export const upsertNotificationPreferences = async (
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> => {
  // First check if preferences exist
  const { data: existing } = await supabase
    .from('notification_preferences')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('notification_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  } else {
    // Insert new
    const { error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId,
        ...preferences,
      } as any);

    if (error) {
      console.error('Error inserting preferences:', error);
      throw error;
    }
  }
};
