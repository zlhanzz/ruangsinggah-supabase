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
    roomType?: string;
    occupants?: number | string;
    startDate?: string;
    endDate?: string;
  };
}

/**
 * notificationBridge: Centralized service to notify Mitra (Owner) 
 * via both In-App Notifications and WhatsApp.
 */
export async function notifyMitra({ ownerId, propertyId, type, details }: NotifyMitraParams) {
  try {
    // 1. Fetch Owner Profile (Try native first)
    let owner: any = null;
    let userError: any = null;

    // Attempt 1: Standard Table Fetch (Will fail for Tenants due to RLS)
    const { data: nativeOwner, error: nativeError } = await supabase
      .from('users')
      .select('name, phone, role')
      .eq('id', ownerId)
      .maybeSingle();

    if (nativeOwner) {
      owner = nativeOwner;
    } else {
      // Attempt 2: RPC Fallback (Bypasses RLS)
      const { data: rpcOwner, error: rpcError } = await supabase
        .rpc('get_owner_contact', { target_id: ownerId });

      if (rpcOwner) {
        owner = rpcOwner;
      } else {
        console.warn(`[NotificationBridge] Failed to fetch owner via both native and RPC.`, rpcError || nativeError);
      }
    }

    // 2. Fetch Property Details (Mandatory for Omnichannel fallback if Admin)
    let omnichannelPhone = '';
    let isMitraOwned = false;

    if (owner && ['owner', 'mitra'].includes(owner.role?.toLowerCase())) {
      isMitraOwned = true;
    }

    if (propertyId) {
      const { data: prop } = await supabase
        .from('properties')
        .select('omnichannel_contact_phone, omnichannel_contact_name')
        .eq('id', propertyId)
        .maybeSingle();

      if (prop) {
        omnichannelPhone = prop.omnichannel_contact_phone;
      }
    }

    const ownerName = owner?.displayName || owner?.name || 'Bapak/Ibu Mitra';

    // DECISION LOGIC: 
    // Fallback unconditionally to omnichannel if owner profile fails or lacks phone.
    let ownerPhone = isMitraOwned ? (owner?.phone || omnichannelPhone) : (omnichannelPhone || owner?.phone);

    if (!ownerPhone) {
      console.warn(`[NotificationBridge] No valid phone number found for owner ${ownerId} or property ${propertyId}`);
      return; // Only abort if we TRULY have no phone number to send to
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
        waMessage = `Halo pak/bu ${ownerName}, ada pengajuan sewa baru dari ${details.senderName}:\n\nNama Kost: ${details.propertyTitle}\nJenis Kamar: ${details.roomType || '-'}\nPaket Sewa: ${details.period || '-'}\nJumlah Penghuni: ${details.occupants || 1}\nTanggal Masuk: ${details.startDate || '-'}\nTotal Tagihan: ${details.amount || '-'}\n\nApakah terima atau tolak pengajuan ini?`;
        break;

      case 'payment':
        subject = 'Pembayaran Berhasil 💸';
        appTitle = 'Pembayaran Terverifikasi';
        appMsg = `Pembayaran untuk unit ${details.propertyTitle} telah diterima.`;
        link = `${baseUrl}/mitra-dashboard/bookings`;
        waMessage = `Pembayaran dari ${details.senderName || 'Penyewa'} berhasil dilakukan, sekarang ${details.senderName || 'Penyewa'} berstatus sebagai penyewa aktif.\n\nNama Kost: ${details.propertyTitle}\nTipe Kamar: ${details.roomType || '-'}\nJenis Paket Sewa: ${details.period || '-'}\nTotal Tagihan: ${details.amount || '-'}\nTanggal Masuk: ${details.startDate || '-'}\nTanggal Berakhir/Tagihan Selanjutnya: ${details.endDate || '-'}\n\nSistem akan otomatis memberi pengingat tagihan setiap masa sewa akan berakhir.`;
        break;
    }

    // 3. Send In-App Notification (Always to ownerId)
    await sendNotification(ownerId, appTitle, appMsg, type === 'chat' ? 'chat' : 'info', details, link);

    // 4. Send WhatsApp Notification
    if (ownerPhone) {
      try {
        const res = await sendWhatsAppText(ownerPhone, waMessage);
        if (!res.success) {
          console.warn(`[NotificationBridge] WhatsApp send failed for ${ownerPhone}:`, res.error || res.data);
        } else {
          console.log(`[NotificationBridge] WhatsApp notification sent to ${ownerPhone}`);
        }
      } catch (e) {
        console.error(`[NotificationBridge] Crash sending WA:`, e);
      }
    }

  } catch (err) {
    console.error('[NotificationBridge] Unexpected error:', err);
  }
}

export const notificationBridge = {
  notifyMitra
};
