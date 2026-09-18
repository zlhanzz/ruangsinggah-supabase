import { supabase } from './supabase';

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
 * Mengirim pesan WhatsApp menggunakan Serverless Edge Function / Meta Cloud API (Bebas CORS)
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'id',
  components = []
}: SendWhatsAppParams) {
  const token = getWhatsAppAccessToken();
  const phoneId = getPhoneNumberId();
  const cleanTo = formatWhatsAppNumber(to);

  if (!cleanTo || cleanTo.length < 9) {
    console.warn('[WHATSAPP_API] Nomor telepon tidak valid:', to);
    return { success: false, error: 'Nomor telepon WhatsApp tidak valid.' };
  }

  // ── 1. Coba kirim via Supabase Edge Function 'send-wa-message' (Server-Side, Bebas CORS) ──
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-wa-message', {
      body: {
        to: cleanTo,
        templateName,
        languageCode,
        components,
        token: token || undefined,
        phoneId: phoneId || undefined
      }
    });

    if (!edgeError && edgeData && edgeData.success) {
      console.log(`[WHATSAPP_API] Berhasil kirim template ${templateName} via Edge Function ke ${cleanTo}:`, edgeData);
      return { success: true, data: edgeData.data };
    }

    if (edgeError || (edgeData && !edgeData.success)) {
      const errMsg = edgeData?.error || edgeError?.message || 'Gagal mengirim pesan via Edge Function';
      console.warn(`[WHATSAPP_API] Edge Function mengembalikan error:`, errMsg, edgeData?.details);
      
      // Jika error spesifik dari Meta API (misal template tidak cocok), kembalikan detailnya
      if (edgeData?.details) {
        return { success: false, error: errMsg, details: edgeData.details };
      }
    }
  } catch (edgeInvokeErr: any) {
    console.warn('[WHATSAPP_API] Panggilan invoke Edge Function gagal, mencoba fallback langsung:', edgeInvokeErr?.message);
  }

  // ── 2. Fallback: Panggilan langsung dari client (hanya jika token & phoneId ada) ──
  if (!token || !phoneId) {
    console.warn('[WHATSAPP_API] Kredensial WhatsApp lokal (Token/Phone ID) belum diset di .env.local.');
    return { 
      success: false, 
      error: 'Kredensial WhatsApp API belum lengkap di server/klien.',
      isConfigMissing: true
    };
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
            language: { code: languageCode },
            components: components
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.warn(`[WHATSAPP_API] Direct fetch gagal (${templateName} ke ${cleanTo}):`, result);
      return { success: false, error: result?.error?.message || 'Gagal mengirim template WhatsApp', details: result };
    }

    return { success: true, data: result };
  } catch (fetchErr: any) {
    console.error('[WHATSAPP_API] Network/CORS exception saat direct fetch:', fetchErr);
    return { 
      success: false, 
      error: fetchErr?.message?.includes('Failed to fetch') 
        ? 'Koneksi ke Meta WhatsApp API dibatasi browser (CORS). Silakan deploy Supabase Edge Function send-wa-message.'
        : fetchErr?.message || 'Gagal menghubungi WhatsApp API'
    };
  }
}

/**
 * 1. Kirim Kode OTP Verifikasi Akun / Nomor WhatsApp
 * Mendukung template dengan tombol URL/Copy Code, serta auto-retry dengan body-only jika tombol tidak cocok.
 */
export async function sendWaOtpVerification(phone: string, otpCode: string, languageCode = 'id') {
  // Opsi A: Template standar dengan Parameter Body & Tombol URL / Copy Code
  const primaryComponents = [
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
  ];

  const primaryRes = await sendWhatsAppTemplate({
    to: phone,
    templateName: 'otp_verification',
    languageCode: languageCode,
    components: primaryComponents
  });

  if (primaryRes.success) {
    return primaryRes;
  }

  // Jika gagal karena struktur komponen tombol tidak sesuai dengan konfigurasi template di Meta Business Manager,
  // lakukan fallback ke Opsi B (Hanya parameter body)
  const isComponentMismatch = 
    primaryRes.error?.toLowerCase().includes('component') ||
    primaryRes.error?.toLowerCase().includes('parameter') ||
    primaryRes.error?.toLowerCase().includes('button') ||
    primaryRes.error?.toLowerCase().includes('does not exist');

  if (isComponentMismatch) {
    console.log('[WHATSAPP_API] Mencoba ulang kirim OTP dengan parameter body murni tanpa tombol...');
    const bodyOnlyComponents = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: otpCode }
        ]
      }
    ];

    const retryRes = await sendWhatsAppTemplate({
      to: phone,
      templateName: 'otp_verification',
      languageCode: languageCode,
      components: bodyOnlyComponents
    });

    if (retryRes.success) {
      return retryRes;
    }
  }

  return primaryRes;
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
 * Mengirim pesan teks biasa (Server-side via Edge Function / Meta Cloud API)
 */
export async function sendWhatsAppText(to: string, message: string) {
  const cleanTo = formatWhatsAppNumber(to);
  if (!cleanTo) return { success: false, error: 'Nomor tujuan tidak valid.' };

  // 1. Coba via Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('send-wa-message', {
      body: {
        to: cleanTo,
        text: message
      }
    });
    if (!error && data?.success) {
      return { success: true, data: data.data };
    }
  } catch (err) {
    console.warn('[WHATSAPP_API] Send text via edge function failed, falling back:', err);
  }

  // 2. Direct Fallback
  const token = getWhatsAppAccessToken();
  const phoneId = getPhoneNumberId();
  if (!token || !phoneId) {
    return { success: false, error: 'Kredensial WhatsApp API belum dikonfigurasi.' };
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
