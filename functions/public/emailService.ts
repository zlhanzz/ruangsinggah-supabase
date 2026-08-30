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
  propertyTitle: string;
  propertyAddress?: string;
  propertyCity?: string;
  messageSnippet: string;
  sessionId: string;
}) {
  return notifyAdminTransaction(`Pesan Chat Baru dari ${details.customerName} (${details.propertyTitle})`, {
    "Nama Calon Penyewa": details.customerName,
    "Properti Kost": details.propertyTitle,
    "Lokasi": `${details.propertyAddress ? details.propertyAddress + ', ' : ''}${details.propertyCity || ''}`.trim() || 'Properti Terkelola',
    "Isi Pesan": details.messageSnippet,
    "Aksi Cepat": "Buka menu Pesan & Chat Customer di Portal KostManager untuk membalas",
    "Link Portal Chat": "https://ruangsinggah.id/dashboard-admin/km_chats"
  });
}

export async function notifyAdminIdentityVerification(details: {
  role: 'mitra' | 'agent' | 'user' | string;
  name: string;
  email?: string;
  phone?: string;
  ktp_number?: string;
  ktp_address?: string;
  ktp_photo_url?: string;
  userId: string;
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
    "Nomor NIK KTP": details.ktp_number || 'Belum diisi',
    "Alamat Sesuai KTP": details.ktp_address || 'Belum diisi',
    "Tautan Foto KTP": details.ktp_photo_url || '-',
    "ID Pengguna": details.userId,
    "Petunjuk Admin": "Silakan buka Dashboard Admin untuk memeriksa dan menyetujui verifikasi berkas identitas ini.",
    "Link Dashboard Verifikasi": "https://ruangsinggah.id/dashboard"
  });
}


