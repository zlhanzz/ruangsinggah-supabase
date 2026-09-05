# WALKTHROUGH: Integrasi Ekosistem Meta WhatsApp Cloud API Resmi & Verifikasi Identitas Anti-Bobol

Dokumen ini merangkum seluruh perubahan, integrasi, dan hasil pengujian aktivasi ekosistem **WhatsApp Cloud API (Meta Developer)** pada platform **RuangSinggah**.

---

## 📌 Ringkasan Perubahan

### 1. Ekosistem Modular WhatsApp Cloud API (`functions/public/whatsappService.ts`)
- Memperbarui helper runtime `sendWhatsAppTemplate` dengan penanganan fallback token dinamis dan normalisasi nomor telepon Indonesia (`628...`).
- Menyediakan fungsi-fungsi helper modular:
  - **`sendWaOtpVerification(phone, otpCode)`**: Mengirimkan kode 6 digit OTP resmi ke nomor WhatsApp pengguna via template Meta.
  - **`sendWaTenantComplaintNotification(phone, details)`**: Mengirimkan notifikasi aduan/keluhan penghuni secara instan ke nomor WhatsApp pemilik kost.
  - **`sendWaRentBillingReminder(phone, details)`**: Mengirimkan pengingat tagihan jatuh tempo sewa KostManager lengkap dengan rincian biaya dan link pembayaran digital.
  - **`sendWaMonthlyFinancialReport(phone, details)`**: Mengirimkan ringkasan laporan keuangan bulanan (total pemasukan, pengeluaran, laba bersih, dan okupansi kamar).

### 2. Hard Gatekeeper & Proteksi Anti-Bypass Verifikasi Identitas Mitra (`functions/public/pages/MitraProfile.tsx`)
- **Penghapusan Fallback Palsu**: Menghilangkan fallback `hello_world` yang sebelumnya memungkinkan lolos tanpa OTP riil.
- **Validasi Keras (*Hard Gatekeeper*)**:
  - `saveStep1Draft` dan `handleSave` menolak proses simpan atau pengajuan verifikasi identitas secara mutlak jika `!waOtpVerified && !initialUser?.whatsapp_verified`.
  - Langkah 2 (Verifikasi KTP) menyematkan banner penguncian visual dan menonaktifkan (*disabled*) upload foto KTP serta tombol "SIMPAN & AJUKAN VERIFIKASI" jika nomor WhatsApp belum diverifikasi OTP di Langkah 1.
- **Sinkronisasi Database Instan**: Begitu kode OTP cocok, status `whatsapp_verified: true` langsung disimpan ke tabel `users` di Supabase.
- **Dukungan Ubah Nomor WhatsApp**: Fitur pergantian nomor WhatsApp terlindungi dengan validasi ganda (OTP email keamanan + OTP nomor WhatsApp baru).

### 3. Proteksi Verifikasi Identitas Agen Surveyor (`functions/public/pages/AgentProfile.tsx`)
- Menerapkan penguncian OTP WhatsApp, validasi keras submit, dan penguncian formulir KTP Langkah 2 yang sama untuk akun agen surveyor resmi.

### 4. Pemicu WhatsApp Otomatis Keluhan Penghuni KostManager (`functions/public/pages/MyKost.tsx`)
- Pada fungsi `submitComplaint`, setelah laporan kendala tersimpan di Supabase, sistem secara otomatis mengambil nomor telepon pengelola/pemilik kost (`properties.owner_uid` / `properties.omnichannel_contact_phone`) dan mengirimkan notifikasi WhatsApp instan berisi rincian:
  - Nama Properti & Nomor Kamar
  - Kategori & Urgensi Kendala
  - Judul & Rincian Masalah
  - Nama & Kontak Penghuni

---

## 🧪 Hasil Verifikasi & Uji Kompilasi

| Komponen | Perintah Uji | Hasil | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Vite** | `cmd /c npm run build` (di `functions/public/`) | ✓ 2510 modules transformed, built in 52.12s | **LULUS (0 Error)** |
| **Backend Functions** | `cmd /c npm run build` (di `functions/`) | `tsc` compile check | **LULUS (0 Error)** |

---

## 📋 Panduan Pengujian bagi Pengguna

1. **Uji Verifikasi Identitas Mitra (Pemilik Kost)**:
   - Masuk ke menu **Profil Mitra** (`/mitra-profile?edit=true&step=1`).
   - Masukkan nomor WhatsApp Anda lalu klik tombol **Kirim OTP**.
   - Periksa WhatsApp Anda untuk menerima kode 6 digit OTP resmi.
   - Masukkan 6 digit OTP dan klik **Verifikasi WhatsApp**.
   - Coba akses Langkah 2 KTP (`?step=2`); form KTP kini terbuka dan tombol pengajuan aktif. Jika nomor belum diverifikasi OTP, Langkah 2 akan terkunci total dengan banner peringatan.
2. **Uji Pengiriman Keluhan Penghuni**:
   - Masuk ke **Kost Saya** (`/my-kost`), buka modal **Lapor Kendala / Komplain**.
   - Isi judul dan deskripsi masalah, lalu klik kirim.
   - Notifikasi WhatsApp akan otomatis terkirim ke nomor pemilik kost / pengelola properti.
3. **Uji Pengingat Tagihan Sewa KostManager**:
   - Pada halaman KostManager, klik tombol **Kirim Pengingat Tagihan (WhatsApp)** pada daftar penyewa; pesan pengingat resmi berserta tautan pembayaran digital akan terkirim langsung ke nomor WhatsApp penyewa.
