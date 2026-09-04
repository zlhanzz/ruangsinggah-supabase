import { supabase } from './supabase';

export async function notifyAdminTransaction(type: string, details: Record<string, any>) {
  try {
    // 1. Dapatkan semua email admin secara dinamis
    let adminEmails: string[] = [];
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email, role, is_admin');
        
      if (!error && data) {
        const admins = data.filter(u => 
          u.role === 'admin' || u.is_admin === true || u.is_admin === 1
        );
        adminEmails = admins.map(u => u.email).filter(Boolean);
      }
    } catch (dbErr) {
      console.warn("Gagal mengambil email admin dari database:", dbErr);
    }

    // Gunakan fallback email jika tidak ditemukan admin
    if (adminEmails.length === 0) {
      adminEmails = ['sulhan77777@gmail.com'];
    } else {
      adminEmails = Array.from(new Set(adminEmails));
    }

    // Buat objek payload dengan format profesional
    const payload: any = {
      _subject: `Transaksi Baru - ${type}!`,
      "Tipe Transaksi": type,
      ...details,
      "Waktu": new Date().toLocaleString('id-ID')
    };

    // 2. Kirim email ke setiap admin menggunakan FormSubmit
    for (const email of adminEmails) {
      const formSubmitUrl = `https://formsubmit.co/ajax/${email}`;
      try {
        const response = await fetch(formSubmitUrl, {
          method: "POST",
          headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.warn(`Notifikasi email ke ${email} mengembalikan status:`, await response.text());
        } else {
          console.log(`Notifikasi admin berhasil dikirim ke ${email} via FormSubmit.`);
        }
      } catch (sendErr) {
        console.warn(`Gagal mengirim notifikasi email ke ${email} (wajar dalam pengembangan lokal):`, sendErr);
      }
    }
  } catch (err) {
    console.warn("Gagal memproses notifikasi admin:", err);
  }
}

export async function notifyAdminStatusUpdate(type: string, targetId: string, newStatus: string, details: Record<string, any> = {}) {
  return notifyAdminTransaction(`UPDATE STATUS: ${type} -> ${newStatus}`, {
    "ID Transaksi": targetId,
    "Status Baru": newStatus,
    ...details
  });
}

export async function notifyAdminWithdrawalRequest(details: {
  agent_id: string;
  agent_name: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
}) {
  return notifyAdminTransaction(`Pengajuan Withdrawal Baru`, {
    "Nama Agen": details.agent_name,
    "Nominal WD": `Rp ${details.amount.toLocaleString('id-ID')}`,
    "Bank Tujuan": details.bank_name,
    "No Rekening": details.bank_account,
    "Atas Nama": details.bank_account_name,
    "ID Agen": details.agent_id
  });
}

export async function sendEmailVerificationOtp(email: string, otp: string): Promise<boolean> {
  const payload = {
    _subject: `[RuangSinggah.id] Kode Verifikasi Perubahan Email`,
    "Pemberitahuan": "Kami menerima permintaan untuk mengubah alamat email akun RuangSinggah Anda.",
    "Kode OTP": otp,
    "Instruksi": "Silakan gunakan kode OTP di atas untuk memverifikasi alamat email baru Anda pada halaman profil.",
    "Waktu": new Date().toLocaleString('id-ID')
  };

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${email}`, {
      method: "POST",
      headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (err) {
    console.error("Gagal mengirim email OTP:", err);
    return false;
  }
}

export async function notifyAdminNewChatMessage(details: {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  propertyTitle: string;
  propertyAddress?: string;
  propertyCity?: string;
  messageSnippet: string;
  sessionId: string;
  propertyId?: string;
}) {
  return notifyAdminTransaction(`💬 Pesan Masuk KostManager: ${details.propertyTitle}`, {
    "Tipe Notifikasi": "Inquiry Chat Calon Penghuni (KostManager)",
    "Nama Properti": details.propertyTitle,
    "Lokasi Properti": `${details.propertyAddress ? details.propertyAddress + ', ' : ''}${details.propertyCity || ''}`.trim() || 'Properti KostManager',
    "Nama Calon Penghuni": details.customerName || 'Pengguna',
    "Email Pengirim": details.customerEmail || '-',
    "No. WhatsApp Pengirim": details.customerPhone || '-',
    "Isi Pesan Masuk": details.messageSnippet,
    "Waktu Pesan": new Date().toLocaleString('id-ID'),
    "Tindakan Admin": "Pesan ini masuk untuk properti kelolaan KostManager. Segera tanggapi pesan calon penyewa melalui Portal KostManager.",
    "Link Portal Chat": `https://ruangsinggah.id/dashboard-admin/km_chats?session=${details.sessionId}`
  });
}

export async function notifyAdminIdentityVerification(details: {
  role: 'mitra' | 'agent' | 'user' | string;
  name: string;
  email?: string;
  phone?: string;
  userId: string;
  ktp_number?: string;
  ktp_address?: string;
  ktp_photo_url?: string;
}) {
  const roleLabel = details.role === 'mitra' 
    ? 'Calon Mitra / Pemilik Kost' 
    : details.role === 'agent' 
    ? 'Calon Agen Pemasaran' 
    : 'Pengguna';

  return notifyAdminTransaction(`Pengajuan Verifikasi Identitas (${roleLabel})`, {
    "Tipe Akun": roleLabel,
    "Nama Lengkap": details.name || 'Belum diisi',
    "Email Akun": details.email || 'Belum diisi',
    "Nomor WhatsApp": details.phone || 'Belum diisi',
    "ID Pengguna": details.userId,
    "Status Berkas": "Menunggu Peninjauan Admin (Pending)",
    "Keamanan Data": "Dokumen fisik KTP & NIK tersimpan aman terenkripsi di sistem database.",
    "Petunjuk Admin": "Silakan login ke Dashboard Admin resmi RuangSinggah untuk memeriksa berkas identitas dan menyetujui pengajuan ini.",
    "Link Dashboard Admin": "https://ruangsinggah.id/dashboard"
  });
}

export async function notifyAdminPropertyReport(details: {
  propertyName: string;
  propertyId: string;
  categoryLabel: string;
  description: string;
  reporterName: string;
  reporterPhone: string;
  ownerName?: string;
  evidenceUrl?: string;
}) {
  return notifyAdminTransaction(`🚨 Aduan Properti Masuk: ${details.propertyName}`, {
    "Nama Properti": details.propertyName,
    "ID Properti": details.propertyId,
    "Kategori Aduan": details.categoryLabel,
    "Kronologi / Detail": details.description,
    "Nama Pelapor": details.reporterName || 'Pengguna',
    "WhatsApp Pelapor": details.reporterPhone || '-',
    "Nama Pemilik Kost": details.ownerName || '-',
    "Bukti Foto": details.evidenceUrl || '-',
    "Petunjuk Admin": "Silakan buka Pusat Moderasi Listing di Dashboard Admin untuk meninjau dan mengambil tindakan (Bekukan Listing / Hubungi Pemilik).",
    "Link Moderasi Listing": "https://ruangsinggah.id/dashboard"
  });
}

export interface PropertyReviewNotificationDetails {
  propertyId: string;
  propertyName: string;
  propertyCity?: string;
  propertyAddress?: string;
  propertyPrice?: number;
  propertyType?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  totalRoomTypes?: number;
  totalUnits?: number;
  coverPhotoUrl?: string;
  isResubmission?: boolean;
}

export async function notifyAdminPropertyReview(details: PropertyReviewNotificationDetails) {
  const isResub = details.isResubmission === true;
  const subjectPrefix = isResub ? '🔄 Pengajuan Ulang Listing Kost' : '🏠 Pengajuan Listing Kost Baru Menunggu Peninjauan';
  const priceFormatted = details.propertyPrice 
    ? `Rp ${Number(details.propertyPrice).toLocaleString('id-ID')} / bulan`
    : 'Belum ditentukan';

  // 1. Kirim notifikasi email via FormSubmit ke seluruh admin
  const emailPromise = notifyAdminTransaction(`${subjectPrefix}: ${details.propertyName}`, {
    "Tipe Notifikasi": isResub ? "Pengajuan Ulang Listing (Tahap Peninjauan Admin)" : "Pendaftaran Listing Baru (Tahap Peninjauan Admin)",
    "Nama Properti": details.propertyName,
    "ID Properti": details.propertyId,
    "Tipe Kost": details.propertyType || 'Campur',
    "Harga Mulai": priceFormatted,
    "Alamat Properti": details.propertyAddress || '-',
    "Kota / Area": details.propertyCity || '-',
    "Jumlah Tipe Kamar": details.totalRoomTypes ? `${details.totalRoomTypes} Tipe` : '-',
    "Estimasi Unit Kamar": details.totalUnits ? `${details.totalUnits} Kamar Tersedia` : '-',
    "Nama Pemilik / Mitra": details.ownerName || 'Mitra RuangSinggah',
    "Email Pemilik": details.ownerEmail || '-',
    "No. WhatsApp Pemilik": details.ownerPhone || '-',
    "Foto Cover Bangunan": details.coverPhotoUrl || 'Tidak ada foto cover',
    "Status Saat Ini": "Sedang Ditinjau (Draft / Pending Verification)",
    "Petunjuk Tindakan Admin": "Silakan buka Pusat Moderasi Listing di Dashboard Admin untuk memeriksa keakuratan data, fasilitas, harga, dan foto kost, kemudian setujui (Publikasikan) atau minta revisi jika diperlukan.",
    "Link Pusat Moderasi Admin": "https://ruangsinggah.id/dashboard"
  });

  // 2. Kirim notifikasi in-app ke setiap admin di tabel notifications (non-blocking)
  const inAppPromise = (async () => {
    try {
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id, role, is_admin')
        .or('role.eq.admin,is_admin.eq.true');

      if (adminUsers && adminUsers.length > 0) {
        const notifInserts = adminUsers.map(adm => ({
          user_id: adm.id,
          title: `${isResub ? '🔄 Pembaruan Listing' : '🏠 Listing Baru'}: ${details.propertyName}`,
          message: `Mitra ${details.ownerName || 'Pemilik Kost'} mengajukan listing kost untuk ditinjau dan diverifikasi oleh admin sebelum dipublikasikan.`,
          type: 'submission',
          metadata: {
            property_id: details.propertyId,
            property_name: details.propertyName,
            is_resubmission: isResub
          },
          link: '/dashboard',
          is_read: false
        }));

        await supabase.from('notifications').insert(notifInserts);
      }
    } catch (notifErr) {
      console.warn('Gagal menyimpan notifikasi in-app admin review listing:', notifErr);
    }
  })();

  return Promise.allSettled([emailPromise, inAppPromise]);
}



