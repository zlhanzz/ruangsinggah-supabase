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
    balance?: string | number; // Total balance in dashboard
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
    
    let waTemplateName = '';
    let waComponents: any[] = [];

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

        // WhatsApp Template Configuration (7 Parameters)
        waTemplateName = 'booking_notification_v1'; // SESUAIKAN DENGAN NAMA TEMPLATE DI META DASHBOARD
        waComponents = [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: details.senderName || '-' },      // {{1}} Nama Pengaju
              { type: 'text', text: details.propertyTitle || '-' },   // {{2}} Nama Kost
              { type: 'text', text: details.roomType || '-' },        // {{3}} Jenis Kamar
              { type: 'text', text: details.period || '-' },          // {{4}} Paket Sewa
              { type: 'text', text: details.occupants?.toString() || '1' }, // {{5}} Jumlah Penghuni
              { type: 'text', text: details.startDate || '-' },       // {{6}} Tanggal Masuk
              { type: 'text', text: details.amount || '-' }           // {{7}} Total Tagihan
            ]
          }
        ];
        break;

      case 'payment':
        subject = 'Pembayaran Berhasil 💸';
        appTitle = 'Pembayaran Terverifikasi';
        appMsg = `Pembayaran untuk unit ${details.propertyTitle} telah diterima.`;
        link = `${baseUrl}/mitra-dashboard/bookings`;

        // 2a. Dynamic Balance Calculation if not provided
        let currentBalance = details.balance;
        if (!currentBalance) {
          try {
            // Fetch all successful transactions for the properties owned by this Mitra
            const { data: ownerProps } = await supabase.from('properties').select('id').eq('owner_uid', ownerId);
            if (ownerProps && ownerProps.length > 0) {
              const propIds = ownerProps.map(p => p.id);
              const { data: trxs } = await supabase
                .from('transactions')
                .select('amount')
                .eq('status', 'PAID')
                .in('product_id', propIds);
              
              const total = trxs?.reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
              currentBalance = "Rp " + total.toLocaleString('id-ID');
            }
          } catch (e) {
            console.error('[NotificationBridge] Balance calc error:', e);
            currentBalance = details.amount || '0'; // Fallback to current transaction amount
          }
        }

        // WhatsApp Template Configuration (11 Parameters as per User request)
        waTemplateName = 'payment_notification_v1'; // SESUAIKAN DENGAN NAMA TEMPLATE DI META DASHBOARD
        waComponents = [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: details.senderName || 'Penyewa' }, // {{1}} Nama User
              { type: 'text', text: details.propertyTitle || '-' },  // {{2}} Nama Kost
              { type: 'text', text: details.senderName || '-' },      // {{3}} Nama Pengaju
              { type: 'text', text: details.propertyTitle || '-' },   // {{4}} Nama Kost
              { type: 'text', text: details.roomType || '-' },        // {{5}} Jenis Kamar
              { type: 'text', text: details.occupants?.toString() || '1' }, // {{6}} Jumlah Penghuni
              { type: 'text', text: details.period || '-' },          // {{7}} Paket Sewa
              { type: 'text', text: details.amount || '-' },          // {{8}} Total Tagihan
              { type: 'text', text: details.startDate || '-' },       // {{9}} Tanggal Masuk
              { type: 'text', text: details.endDate || '-' },         // {{10}} Tanggal sewa berakhir
              { type: 'text', text: currentBalance || '0' }           // {{11}} Total Saldo
            ]
          }
        ];
        break;
    }

    // 3. Send In-App Notification (Always to ownerId)
    await sendNotification(ownerId, appTitle, appMsg, type === 'chat' ? 'chat' : 'info', details, link);

    // 4. Send WhatsApp Notification
    if (ownerPhone) {
      try {
        let res;
        if (type === 'chat') {
          // Chat notification uses plain text
          res = await sendWhatsAppText(ownerPhone, waMessage);
        } else if (waTemplateName) {
          // Use Official Template for non-chat notifications
          res = await sendWhatsAppTemplate({
            to: ownerPhone,
            templateName: waTemplateName,
            languageCode: 'id', // Default Indonesian
            components: waComponents
          });
        }

        if (res && !res.success) {
          console.warn(`[NotificationBridge] WhatsApp send failed for ${ownerPhone}:`, res.error || res.data);
        } else if (res) {
          console.log(`[NotificationBridge] WhatsApp notification (${type}) sent to ${ownerPhone}`);
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
