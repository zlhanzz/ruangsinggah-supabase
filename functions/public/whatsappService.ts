const getWhatsAppAccessToken = () => 
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_WHATSAPP_ACCESS_TOKEN) || '';

const getPhoneNumberId = () => 
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_WHATSAPP_PHONE_ID) || '';

const API_VERSION = 'v21.0';

/**
 * Helper untuk menormalisasi nomor WhatsApp ke standar format internasional (misal: 628123456789)
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.substring(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Interface untuk pengiriman pesan WhatsApp Template
 */
export interface SendWhatsAppParams {
  to: string; // Nomor telepon penerima
  templateName: string;
  languageCode?: string;
  components?: any[];
}

/**
 * Mengirim pesan WhatsApp menggunakan Template Meta Cloud API
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'id',
  components = []
}: SendWhatsAppParams) {
  const token = getWhatsAppAccessToken();
  const phoneId = getPhoneNumberId();

  if (!token || !phoneId) {
    console.error('[WHATSAPP_API] Kredensial WhatsApp (Token / Phone ID) belum dikonfigurasi di .env.local');
    return { success: false, error: 'Kredensial WhatsApp API belum dikonfigurasi.' };
  }

  const cleanTo = formatWhatsAppNumber(to);
  if (!cleanTo || cleanTo.length < 9) {
    console.warn('[WHATSAPP_API] Nomor telepon tidak valid:', to);
    return { success: false, error: 'Nomor telepon WhatsApp tidak valid.' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanTo,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode
            },
            components: components
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.warn(`[WHATSAPP_API] Gagal mengirim template ${templateName} ke ${cleanTo}:`, result);
      return { success: false, error: result?.error?.message || result };
    }

    console.log(`[WHATSAPP_API] Berhasil mengirim template ${templateName} ke ${cleanTo}:`, result);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('[WHATSAPP_API] Exception saat menghubungi Meta Graph API:', error);
    return { success: false, error: error?.message || error };
  }
}

/**
 * 1. Kirim Kode OTP Verifikasi Akun / Nomor WhatsApp
 */
export async function sendWaOtpVerification(phone: string, otpCode: string, languageCode = 'id') {
  return sendWhatsAppTemplate({
    to: phone,
    templateName: 'otp_verification',
    languageCode: languageCode,
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: otpCode }
        ]
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          { type: 'text', text: otpCode }
        ]
      }
    ]
  });
}

/**
 * 2. Kirim Notifikasi Pengingat Tagihan Sewa KostManager
 */
export async function sendWaRentBillingReminder(phone: string, details: {
  tenantName: string;
  roomNumber: string;
  propertyName: string;
  amount: number;
  dueDate: string;
  paymentUrl: string;
}) {
  const formattedAmount = `Rp ${Number(details.amount || 0).toLocaleString('id-ID')}`;
  return sendWhatsAppTemplate({
    to: phone,
    templateName: 'reminder_tagihan_kost',
    languageCode: 'id',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: details.tenantName || 'Penghuni' },
          { type: 'text', text: details.roomNumber || '-' },
          { type: 'text', text: details.propertyName },
          { type: 'text', text: formattedAmount },
          { type: 'text', text: details.dueDate },
          { type: 'text', text: details.paymentUrl }
        ]
      }
    ]
  });
}

/**
 * 3. Kirim Notifikasi Keluhan / Aduan Penghuni ke Pemilik KostManager
 */
export async function sendWaTenantComplaintNotification(phone: string, details: {
  propertyName: string;
  roomNumber: string;
  category: string;
  description: string;
  dashboardUrl?: string;
}) {
  return sendWhatsAppTemplate({
    to: phone,
    templateName: 'notifikasi_keluhan_baru',
    languageCode: 'id',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: details.roomNumber || '-' },
          { type: 'text', text: details.propertyName },
          { type: 'text', text: details.category || 'Keluhan Umum' },
          { type: 'text', text: details.description || '-' }
        ]
      }
    ]
  });
}

/**
 * 4. Kirim Notifikasi Rekap Laporan Keuangan Bulanan KostManager ke Mitra
 */
export async function sendWaMonthlyFinancialReport(phone: string, details: {
  propertyName: string;
  monthYear: string;
  totalRevenue: number;
  totalExpenses: number;
  netPayout: number;
  reportUrl: string;
}) {
  return sendWhatsAppTemplate({
    to: phone,
    templateName: 'laporan_keuangan_bulanan',
    languageCode: 'id',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: details.propertyName },
          { type: 'text', text: details.monthYear },
          { type: 'text', text: `Rp ${Number(details.totalRevenue || 0).toLocaleString('id-ID')}` },
          { type: 'text', text: `Rp ${Number(details.totalExpenses || 0).toLocaleString('id-ID')}` },
          { type: 'text', text: `Rp ${Number(details.netPayout || 0).toLocaleString('id-ID')}` },
          { type: 'text', text: details.reportUrl }
        ]
      }
    ]
  });
}

/**
 * Mengirim pesan teks biasa (Hanya bisa dikirim jika session chat 24-jam sudah terbuka)
 */
export async function sendWhatsAppText(to: string, message: string) {
  const token = getWhatsAppAccessToken();
  const phoneId = getPhoneNumberId();
  const cleanTo = formatWhatsAppNumber(to);

  if (!token || !phoneId || !cleanTo) {
    return { success: false, error: 'Kredensial atau nomor tidak valid.' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: { body: message }
        })
      }
    );

    const result = await response.json();
    return { success: response.ok, data: result };
  } catch (error: any) {
    return { success: false, error: error?.message || error };
  }
}

const whatsappService = {
  formatWhatsAppNumber,
  sendWhatsAppTemplate,
  sendWaOtpVerification,
  sendWaRentBillingReminder,
  sendWaTenantComplaintNotification,
  sendWaMonthlyFinancialReport,
  sendWhatsAppText
};

export default whatsappService;

