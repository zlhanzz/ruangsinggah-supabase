import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'submission' | 'payment' | 'rental' | 'chat';
  metadata: any;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export const sendNotification = async (
  userId: string,
  title: string,
  message: string,
  type: Notification['type'] = 'info',
  metadata: any = {},
  link?: string
) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          metadata,
          link
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

export const getNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

export const markAllAsRead = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

export const subscribeToNotifications = (userId: string, onNewNotification: (notif: Notification) => void) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNewNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    }
  };
};

export const notifySurveyStatusUpdate = async (surveyId: string, newStatus: string) => {
  try {
    // 1. Ambil detail survey untuk mendapatkan ID User & ID Agent
    const { data: survey, error } = await supabase
      .from('survey_requests')
      .select('user_id, assigned_agent_id, kost_name, survey_date, survey_time')
      .eq('id', surveyId)
      .single();

    if (error || !survey) throw error || new Error('Survey not found');

    const { user_id, assigned_agent_id, kost_name } = survey;

    // 2. Kirim notifikasi ke USER
    let userTitle = 'Update Status Survey';
    let userMsg = `Status survey Anda untuk ${kost_name} telah diperbarui menjadi ${newStatus}.`;

    if (newStatus === 'AGENT_ASSIGNED') {
      userTitle = 'Surveyor Ditemukan! 🔎';
      userMsg = `Surveyor telah ditetapkan untuk kost ${kost_name}. Mohon tunggu jadwal kunjungan.`;
    } else if (newStatus === 'SURVEYING') {
      userTitle = 'Survey Sedang Berlangsung ⚡';
      userMsg = `Surveyor sedang berada di lokasi ${kost_name} untuk melakukan pengecekan.`;
    } else if (newStatus === 'COMPLETED') {
      userTitle = 'Survey Selesai! ✅';
      userMsg = `Hasil survey untuk ${kost_name} telah tersedia. Silakan cek di menu My Kost.`;
    }

    await sendNotification(user_id, userTitle, userMsg, 'info', { surveyId, status: newStatus }, '/my-kost');

    // 3. Kirim notifikasi ke AGENT (jika sudah ada agent)
    if (assigned_agent_id) {
      let agentTitle = 'Update Tugas Survey';
      let agentMsg = `Status tugas survey ${kost_name} diperbarui: ${newStatus}`;

      if (newStatus === 'AGENT_ASSIGNED') {
        agentTitle = 'Tugas Survey Baru! 📝';
        agentMsg = `Anda telah ditugaskan untuk melakukan survey di ${kost_name}. Cek dashboard agen Anda.`;
      }

      await sendNotification(assigned_agent_id, agentTitle, agentMsg, 'assignment', { surveyId, status: newStatus }, '/agent-dashboard');
    }

    return true;
  } catch (err) {
    console.error('Error in notifySurveyStatusUpdate:', err);
    return false;
  }
};

export const notificationService = {
  sendNotification,
  createNotification: sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  notifySurveyStatusUpdate
};

export default notificationService;
