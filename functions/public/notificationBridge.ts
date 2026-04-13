import { supabase } from './supabase';
import { sendWhatsAppTemplate, sendWhatsAppText } from './whatsappService';
import { sendNotification } from './notificationService';

export type MitraNotificationType = 'chat' | 'booking' | 'payment';

interface NotifyMitraParams {
  ownerId: string;
  propertyId?: string; // Optional but recommended for dynamic routing
  type: MitraNotificationType;
  details: {
    propertyTitle?: string;
    senderName?: string;
    messageSnippet?: string;
    amount?: number | string;
    bookingId?: string;
    period?: string;
    sessionId?: string;
  };
}

/**
 * notificationBridge: Centralized service to notify Mitra (Owner) 
 * via both In-App Notifications and WhatsApp.
 */
export async function notifyMitra({ ownerId, propertyId, type, details }: NotifyMitraParams) {
  try {
    // 1. Fetch Owner Profile
    const { data: owner, error: userError } = await supabase
      .from('users')
      .select('name, phone, displayName, role')
      .eq('id', ownerId)
      .single();

    if (userError || !owner) {
      console.warn(`[NotificationBridge] Could not find owner ${ownerId} for notification.`);
      return;
    }

    // 2. Fetch Property Details (to check omnichannel fallback)
    let omnichannelPhone = '';
    let isMitraOwned = ['owner', 'mitra'].includes(owner.role?.toLowerCase());

    if (propertyId) {
      const { data: prop } = await supabase
        .from('properties')
        .select('omnichannel_contact_phone')
        .eq('id', propertyId)
        .single();
      
      if (prop) {
        omnichannelPhone = prop.omnichannel_contact_phone;
      }
    }

    const ownerName = owner.displayName || owner.name || 'Pak/Ibu';
    
    // DECISION LOGIC: 
    // If it's a Mitra listing -> Use Mitra's profile phone.
    // If it's an Admin listing -> Use property's omnichannel phone.
    // Fallback -> Use profile phone if available.
    let ownerPhone = isMitraOwned ? (owner.phone || omnichannelPhone) : (omnichannelPhone || owner.phone);

    if (!ownerPhone) {
        console.warn(`[NotificationBridge] No valid phone number found for owner ${ownerId} or property ${propertyId}`);
    }

    let subject = '';
    let waMessage = '';
    let appTitle = '';
    let appMsg = '';
    let link = '/mitra-dashboard';

    const baseUrl = window.location.origin;

    switch (type) {
      case 'chat':
        subject = 'Pesan Masuk ✉️';
        appTitle = 'Pesan Baru';
        appMsg = `Pesan baru dari ${details.senderName} untuk ${details.propertyTitle}`;
        link = `${baseUrl}/mitra-dashboard/chat?session_id=${details.sessionId}`;
        waMessage = `*Subject: ${subject}*\n\nHalo ${ownerName}, ada pesan baruu di RuangSinggah.id!\n\nProperti: ${details.propertyTitle}\nPengirim: ${details.senderName}\nPesan: "${details.messageSnippet}"\n\nBalas di sini: ${link}`;
        break;

      case 'booking':
        subject = 'Permintaan Sewa 📝';
        appTitle = 'Permintaan Sewa Baru';
        appMsg = `Ada pemesanan baru untuk ${details.propertyTitle} dari ${details.senderName}`;
        link = `${baseUrl}/mitra-dashboard/bookings`;
        waMessage = `*Subject: ${subject}*\n\nHalo ${ownerName}, ada permintaan sewa baru di RuangSinggah.id!\n\nProperti: ${details.propertyTitle}\nPemohon: ${details.senderName}\nLama Sewa: ${details.period || '-'}\n\nCek di sini: ${link}`;
        break;

      case 'payment':
        subject = 'Pembayaran Berhasil 💸';
        appTitle = 'Pembayaran Terverifikasi';
        appMsg = `Pembayaran untuk unit ${details.propertyTitle} telah diterima.`;
        link = `${baseUrl}/mitra-dashboard/bookings`;
        waMessage = `*Subject: ${subject}*\n\nHalo ${ownerName}, pembayaran untuk pesanan #${details.bookingId?.substring(0, 8)} telah diverifikasi!\n\nProperti: ${details.propertyTitle}\nTotal: ${details.amount}\n\nCek di sini: ${link}`;
        break;
    }

    // 3. Send In-App Notification (Always to ownerId)
    await sendNotification(ownerId, appTitle, appMsg, type === 'chat' ? 'chat' : 'info', details, link);

    // 4. Send WhatsApp Notification
    if (ownerPhone) {
        const res = await sendWhatsAppText(ownerPhone, waMessage);
        if (!res.success) {
            console.warn(`[NotificationBridge] WhatsApp send failed for ${ownerPhone}:`, res.error);
        } else {
            console.log(`[NotificationBridge] WhatsApp notification sent to ${ownerPhone}`);
        }
    }

  } catch (err) {
    console.error('[NotificationBridge] Unexpected error:', err);
  }
}

export const notificationBridge = {
  notifyMitra
};
