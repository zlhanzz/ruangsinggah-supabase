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
