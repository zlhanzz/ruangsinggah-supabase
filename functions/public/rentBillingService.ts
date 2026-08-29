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
  billingPeriod?: string;
  previousPeriodStart?: string;
  previousPeriodEnd?: string;
  newPeriodStart?: string;
  newPeriodEnd?: string;
  extraFee?: number;
  extraFeeName?: string;
  createdAt: number;
}

/**
 * Kalkulasi Periode Perpanjangan Sewa Bersambung (Continuous Lease Anchor)
 * Aturan: Waktu mulai sewa baru SELALU bersambung dari tanggal akhir sewa sebelumnya!
 */
export function calculateNextLeasePeriod(
  currentStartDateStr?: string,
  currentEndDateStr?: string,
  periodType: string = 'bulanan',
  duration: number = 1
): {
  newStartDate: string;
  newEndDate: string;
  periodLabel: string;
  isLate: boolean;
  lateDays: number;
} {
  const today = new Date();
  const currentEndDate = currentEndDateStr && currentEndDateStr !== 'Sewa Berjalan' 
    ? new Date(currentEndDateStr) 
    : (currentStartDateStr ? new Date(currentStartDateStr) : new Date());

  // ATURAN BAKU: Waktu sewa baru selalu bersambung dari akhir sewa sebelumnya!
  const newStart = new Date(currentEndDate);
  const newEnd = new Date(newStart);

  const p = (periodType || 'bulanan').toLowerCase();
  if (p === 'harian') {
    newEnd.setDate(newEnd.getDate() + duration);
  } else if (p === 'mingguan') {
    newEnd.setDate(newEnd.getDate() + (duration * 7));
  } else if (p === '3bulanan' || p === '3_bulanan' || p === 'triwulan') {
    newEnd.setMonth(newEnd.getMonth() + (duration * 3));
  } else if (p === '6bulanan' || p === '6_bulanan' || p === 'semester') {
    newEnd.setMonth(newEnd.getMonth() + (duration * 6));
  } else if (p === 'tahunan' || p === 'tahunan (1 tahun)') {
    newEnd.setFullYear(newEnd.getFullYear() + duration);
  } else {
    // Bulanan default (1 bulan)
    newEnd.setMonth(newEnd.getMonth() + duration);
  }

  // Cek apakah tanggal saat ini melewati akhir sewa sebelumnya
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueTime = new Date(currentEndDate.getFullYear(), currentEndDate.getMonth(), currentEndDate.getDate()).getTime();
  const diffTime = todayTime - dueTime;
  const lateDays = diffTime > 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : 0;
  const isLate = lateDays > 0;

  const periodMap: Record<string, string> = {
    'bulanan': 'Bulanan (1 Bulan)',
    '3bulanan': '3 Bulanan',
    '6bulanan': '6 Bulanan',
    'tahunan': 'Tahunan (1 Tahun)',
    'mingguan': 'Mingguan (7 Hari)',
    'harian': 'Harian'
  };

  return {
    newStartDate: newStart.toISOString().split('T')[0],
    newEndDate: newEnd.toISOString().split('T')[0],
    periodLabel: periodMap[p] || 'Bulanan',
    isLate,
    lateDays
  };
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
 * Mengirimkan pesan WhatsApp pengingat tagihan sewa ke penghuni dengan rincian periode perpanjangan
 */
export async function sendRentBillingReminderWhatsApp(params: {
  phone: string;
  tenantName: string;
  propertyTitle: string;
  roomNumber: string;
  monthlyPrice: number;
  dueDate: string;
  propertyId: string;
  billingPeriod?: string;
  previousPeriodStart?: string;
  previousPeriodEnd?: string;
  newPeriodStart?: string;
  newPeriodEnd?: string;
  extraFee?: number;
  extraFeeName?: string;
  daysRemaining?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { 
      phone, 
      tenantName, 
      propertyTitle, 
      roomNumber, 
      monthlyPrice, 
      dueDate, 
      propertyId, 
      billingPeriod = 'Bulanan',
      previousPeriodStart,
      previousPeriodEnd,
      newPeriodStart,
      newPeriodEnd,
      extraFee = 0,
      extraFeeName,
      daysRemaining 
    } = params;

    // 1. Generate Magic Claim Token
    const token = createRentClaimToken({
      phone: phone.replace(/[^0-9]/g, ''),
      tenantName,
      propertyId,
      propertyTitle,
      roomNumber,
      monthlyPrice,
      dueDate,
      billingPeriod,
      previousPeriodStart,
      previousPeriodEnd,
      newPeriodStart,
      newPeriodEnd,
      extraFee,
      extraFeeName,
      createdAt: Date.now()
    });

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ruangsinggah.id';
    const claimUrl = `${origin}/claim-kost?token=${token}`;

    // 2. Format Tanggal yang rapi
    const formatDate = (d?: string) => {
      if (!d || d === 'Sewa Berjalan') return '-';
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const formattedDueDate = formatDate(dueDate);
    const totalTagihan = Number(monthlyPrice || 0) + Number(extraFee || 0);

    // 3. Susun teks pesan WhatsApp yang informatif dan profesional
    let message = `Halo Kak *${tenantName}*! 👋\n\n` +
      `Kami dari Manajemen *KostManager - RuangSinggah* menginformasikan mengenai perpanjangan masa sewa kamar Anda:\n\n` +
      `🏠 *Properti:* ${propertyTitle}\n` +
      `🚪 *Kamar:* No. ${roomNumber}\n` +
      `📋 *Jenis Sewa:* ${billingPeriod}\n`;

    if (newPeriodStart && newPeriodEnd) {
      message += `📅 *Periode Sewa Baru:* ${formatDate(newPeriodStart)} s/d ${formatDate(newPeriodEnd)}\n`;
    }

    message += `⚠️ *Jatuh Tempo:* ${formattedDueDate}\n` +
      `💵 *Tarif Pokok:* ${FORMAT_CURRENCY(monthlyPrice)}\n`;

    if (extraFee > 0 && extraFeeName) {
      message += `➕ *${extraFeeName}:* ${FORMAT_CURRENCY(extraFee)}\n`;
    }

    message += `💰 *Total Pembayaran:* *${FORMAT_CURRENCY(totalTagihan)}*\n\n` +
      `_(Catatan: Sesuai aturan sewa, periode perpanjangan baru tetap dihitung bersambung dari akhir masa sewa sebelumnya)_\n\n` +
      `Untuk memantau kwitansi resmi, melihat kartu sewa, dan melakukan perpanjangan instan via QRIS / Transfer Bank, silakan klik tautan resmi berikut:\n\n` +
      `👉 *Akses Kost Saya & Bayar:* \n${claimUrl}\n\n` +
      `Terima kasih atas kerjasamanya! 🙏✨`;

    // 4. Kirim via WhatsApp Service
    const res = await sendWhatsAppText(phone, message);
    return { success: res.success, error: res.error };
  } catch (err: any) {
    console.error('Error sending rent billing reminder WhatsApp:', err);
    return { success: false, error: err.message };
  }
}

