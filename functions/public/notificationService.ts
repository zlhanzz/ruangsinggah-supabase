
import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'payment' | 'rental' | 'chat' | 'system';
  is_read: boolean;
  link?: string;
  created_at: string;
}

export const notificationService = {
  /**
   * Fetch all notifications for the current user
   */
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  },

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Create a new notification
   */
  async createNotification(payload: {
    user_id: string;
    title: string;
    message: string;
    type: Notification['type'];
    link?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  },

  /**
   * Subscribe to new notifications for a user
   */
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`user-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
};
