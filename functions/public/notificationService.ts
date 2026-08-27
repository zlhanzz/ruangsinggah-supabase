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

    if (error) {
      console.error('Notification insertion failed:', error.message);
      // Still return null instead of throwing to prevent crashing the whole flow, 
      // but log it clearly as an error now.
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in sendNotification (non-fatal):', error);
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
      .select('user_id, assigned_agent_id, kost_name, survey_date, survey_time, notes')
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
    } else if (newStatus === 'HEADING_TO_LOCATION') {
      userTitle = 'Surveyor Menuju Lokasi 🚗';
      userMsg = `Surveyor kami sedang dalam perjalanan menuju ${kost_name}. Mohon pastikan akses tersedia.`;
    } else if (newStatus === 'RESCHEDULED') {
      userTitle = 'Jadwal Survey Diperbarui 🗓️';
      userMsg = `Jadwal survey untuk ${kost_name} diubah menjadi ${survey.survey_date} pukul ${survey.survey_time} dengan alasan: "${survey.notes || 'Penyesuaian jadwal lapangan oleh Surveyor.'}"`;
    } else if (newStatus === 'SURVEYING') {
      userTitle = 'Survey Sedang Berlangsung ⚡';
      userMsg = `Surveyor sedang berada di lokasi ${kost_name} untuk melakukan pengecekan.`;
    } else if (newStatus === 'COMPLETED' || newStatus === 'SUBMITTED') {
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

    // 4. Kirim Email Notifikasi via Cloud Function
    try {
      const emailEndpoint = 'https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendSurveyStatusEmail';
      
      // Tentukan siapa yang menerima email berdasarkan status
      let recipientRole: 'user' | 'agent' | null = null;
      
      // Kasus khusus: ASSIGNED_TO_AGENT dipanggil saat admin pertama kali menetapkan agen
      if (newStatus === 'ASSIGNED_TO_AGENT') {
        recipientRole = 'agent';
      } else if (['AGENT_ASSIGNED', 'HEADING_TO_LOCATION', 'RESCHEDULED', 'COMPLETED'].includes(newStatus)) {
        recipientRole = 'user';
      }

      if (recipientRole) {
        // Panggil secara asynchronous tanpa menunggu (fire and forget)
        // untuk menjaga performa UI
        fetch(emailEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surveyId,
            status: newStatus,
            recipientRole
          })
        }).catch(err => console.error('[NotificationService] Email trigger failed:', err));
      }
    } catch (emailErr) {
      console.error('[NotificationService] Error in email notification block:', emailErr);
    }

    return true;
  } catch (err) {
    console.error('Error in notifySurveyStatusUpdate:', err);
    return false;
  }
};

export const notifySurveyRevisionRequested = async (
  agentId: string,
  kostName: string,
  categories: string[] = [],
  notes: string = '',
  surveyId?: string
) => {
  try {
    const title = `⚠️ Permintaan Revisi Survei: ${kostName}`;
    const catStr = categories.length > 0 ? ` [Kategori: ${categories.join(', ')}]` : '';
    const message = `Admin meminta evaluasi/revisi pendataan untuk ${kostName}${catStr}. Catatan: "${notes || 'Mohon lengkapi dan perbaiki data survei.'}"`;

    let agentEmail = '';
    let agentName = 'Surveyor';

    // 1. Ambil data agent dari DB untuk pengiriman email & in-app notification
    if (agentId) {
      try {
        const { data: agentUser } = await supabase
          .from('users')
          .select('email, full_name, name')
          .eq('id', agentId)
          .maybeSingle();

        if (agentUser) {
          agentEmail = agentUser.email || '';
          agentName = agentUser.full_name || agentUser.name || 'Surveyor';
        }
      } catch (e) {
        console.warn('[NotificationService] Failed to query agent profile:', e);
      }

      // Kirim In-App Notification
      await sendNotification(
        agentId,
        title,
        message,
        'warning',
        { surveyId, status: 'REVISION_REQUIRED', categories, notes },
        '/agent-dashboard'
      );
    }

    // 2. Kirim Email Langsung ke Surveyor via FormSubmit Gateway
    if (agentEmail) {
      try {
        const emailData = {
          _subject: `⚠️ Permintaan Revisi & Evaluasi Survei: ${kostName}`,
          "Kepada": agentName,
          "Nama Properti Kost": kostName,
          "Status Pendataan": "PERLU REVISI / EVALUASI ADMIN",
          "Bagian yang Perlu Diperbaiki": categories.join(', ') || 'Semua Elemen Data',
          "Catatan Evaluasi & Koreksi Admin": notes || 'Mohon perbaiki dan lengkapi data pendataan.',
          "Akses Dashboard Agen": `${window.location.origin}/dashboard-agent`,
          "Waktu Evaluasi": new Date().toLocaleString('id-ID')
        };
        fetch(`https://formsubmit.co/ajax/${agentEmail}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(emailData)
        }).then(res => {
          if (res.ok) console.log(`[NotificationService] Email evaluasi berhasil dikirim ke ${agentEmail}`);
        }).catch(err => console.warn('[NotificationService] FormSubmit email to agent warning:', err));
      } catch (emailErr) {
        console.warn('[NotificationService] Error sending direct email to agent:', emailErr);
      }
    }

    // 3. Panggil Cloud Function Trigger (Brevo integration)
    try {
      const emailEndpoint = 'https://us-central1-ruangsinggahid-3afb2.cloudfunctions.net/sendSurveyStatusEmail';
      fetch(emailEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId,
          status: 'REVISION_REQUIRED',
          recipientRole: 'agent',
          agentEmail,
          agentName,
          kostName,
          notes,
          categories
        })
      }).catch(err => console.error('[NotificationService] Revision email trigger failed:', err));
    } catch (e) {
      console.error('[NotificationService] Error triggering revision email:', e);
    }

    return true;
  } catch (err) {
    console.error('Error in notifySurveyRevisionRequested:', err);
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
  notifySurveyStatusUpdate,
  notifySurveyRevisionRequested
};

export default notificationService;
