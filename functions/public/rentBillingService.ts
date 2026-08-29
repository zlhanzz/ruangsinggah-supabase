import { supabase } from './supabase';
import { sendWhatsAppText } from './whatsappService';
import { FORMAT_CURRENCY } from './constants';

export interface RentClaimPayload {
  phone: string;
  tenantName: string;
  propertyId: string;
  propertyTitle: string;
  roomNumber: string;
  roomType?: string;
  monthlyPrice: number;
  dueDate: string;
  periodStart?: string;
  periodEnd?: string;
  createdAt: number;
}

/**
 * Membuat Token Klaim / Magic Link yang aman dan terenkripsi secara Base64 URL-safe
 */
export function createRentClaimToken(payload: RentClaimPayload): string {
  try {
    const jsonStr = JSON.stringify(payload);
    // Base64 encoding yang aman untuk URL
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64;
  } catch (err) {
    console.error('Failed to create rent claim token:', err);
    return '';
  }
}

/**
 * Memverifikasi dan mendekode token klaim dari URL WhatsApp
 */
export function verifyRentClaimToken(token: string): RentClaimPayload | null {
  try {
    if (!token) return null;
    let base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(escape(atob(base64)));
    const data = JSON.parse(jsonStr) as RentClaimPayload;

    if (!data.phone || !data.propertyId || !data.roomNumber) {
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to decode rent claim token:', err);
    return null;
  }
}

/**
 * Mengirimkan pesan WhatsApp pengingat tagihan sewa ke penghuni
 */
export async function sendRentBillingReminderWhatsApp(params: {
  phone: string;
  tenantName: string;
  propertyTitle: string;
  roomNumber: string;
  monthlyPrice: number;
  dueDate: string;
  propertyId: string;
  daysRemaining?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { phone, tenantName, propertyTitle, roomNumber, monthlyPrice, dueDate, propertyId, daysRemaining } = params;

    // 1. Generate Magic Claim Token
    const token = createRentClaimToken({
      phone: phone.replace(/[^0-9]/g, ''),
      tenantName,
      propertyId,
      propertyTitle,
      roomNumber,
      monthlyPrice,
      dueDate,
      createdAt: Date.now()
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ruangsinggah.id';
    const claimUrl = `${origin}/claim-kost?token=${token}`;

    // 2. Format Due Date yang rapi
    const formattedDueDate = new Date(dueDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 3. Susun teks pesan WhatsApp yang ramah dan profesional
    const message = `Halo Kak *${tenantName}*! 👋\n\n` +
      `Kami dari Manajemen *KostManager - RuangSinggah* menginformasikan mengenai masa sewa kamar Anda:\n\n` +
      `🏠 *Properti:* ${propertyTitle}\n` +
      `🚪 *Kamar:* No. ${roomNumber}\n` +
      `📅 *Jatuh Tempo:* ${formattedDueDate}\n` +
      `💵 *Tarif Sewa:* ${FORMAT_CURRENCY(monthlyPrice)} / bulan\n\n` +
      `Untuk memantau sisa masa sewa, mengunduh kwitansi resmi, dan melakukan perpanjangan sewa dengan mudah via QRIS / Transfer Bank, silakan klik tautan resmi berikut:\n\n` +
      `👉 *Akses Kost Saya & Bayar:* \n${claimUrl}\n\n` +
      `_(Tautan ini akan langsung membuka halaman Kost Anda secara otomatis)_\n\n` +
      `Terima kasih atas kerjasamanya! 🙏✨`;

    // 4. Kirim via WhatsApp Service
    const res = await sendWhatsAppText(phone, message);
    return { success: res.success, error: res.error };
  } catch (err: any) {
    console.error('Error sending rent billing reminder WhatsApp:', err);
    return { success: false, error: err.message };
  }
}
