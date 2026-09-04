# IMPLEMENTATION PLAN - Penghapusan Data Sensitif Identitas (NIK & Foto KTP) dari Email Notifikasi Admin

## 1. Analisis Masalah & Kebutuhan
- **Keluhan & Risiko Keamanan**:
  Saat mitra atau agen mengajukan verifikasi identitas, sistem mengirimkan email notifikasi ke admin melalui fungsi `notifyAdminIdentityVerification` di [`emailService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts).
  Di dalam payload email tersebut, saat ini tercantum data sensitif (*Personally Identifiable Information - PII*):
  - `Nomor NIK KTP` (Nomor Induk Kependudukan)
  - `Alamat Sesuai KTP`
  - `Tautan Foto KTP` (URL publik/akses gambar KTP)
- **Bahaya & Dampak**:
  - Mengirimkan NIK dan link dokumen KTP secara terbuka via email (*cleartext email delivery*) berpotensi menimbulkan kebocoran data jika email disadap, di-forward, atau dibaca oleh pihak yang tidak berwenang (*data breach & non-compliance UU PDP*).
- **Tujuan Perbaikan**:
  - Menghapus seluruh data sensitif (NIK, Alamat KTP, dan Link Foto KTP) dari isi email notifikasi.
  - Email notifikasi hanya berfungsi sebagai **sinyal pemberitahuan (*alert signal*)** bahwa terdapat pengajuan verifikasi baru, dilengkapi ringkasan aman (Tipe Akun, Nama, Email, No. HP, ID Pengguna, dan Status Pengajuan).
  - Admin diarahkan untuk memeriksa berkas dan foto KTP secara aman dan terautentikasi langsung di dalam **Dashboard Admin resmi**.

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/emailService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts):
  - Memperbarui interface parameter dan payload pada fungsi `notifyAdminIdentityVerification` agar tidak lagi menyertakan `ktp_number`, `ktp_address`, dan `ktp_photo_url`.
  - Menambahkan keterangan standar keamanan data (*"Dokumen identitas tersimpan aman dan terenkripsi di sistem database"*).
- [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
  - Membersihkan pengiriman argumen sensitif saat memanggil `notifyAdminIdentityVerification`.
- [`functions/public/pages/AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx):
  - Membersihkan pengiriman argumen sensitif saat memanggil `notifyAdminIdentityVerification`.
- [`functions/public/pages/Profile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx):
  - Membersihkan pengiriman argumen sensitif saat memanggil `notifyAdminIdentityVerification`.
- [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Mencatat riwayat implementasi Progres 323.
- `WALKTHROUGH.md`:
  - Menerbitkan dokumentasi hasil pengujian dan verifikasi payload email aman.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Approval)
1. **Refactoring `emailService.ts`**:
   - Memodifikasi `notifyAdminIdentityVerification`:
     ```typescript
     export async function notifyAdminIdentityVerification(details: {
       role: 'mitra' | 'agent' | 'user' | string;
       name: string;
       email?: string;
       phone?: string;
       userId: string;
     }) { ... }
     ```
   - Menyusun payload email baru yang bersih dan aman:
     - Tipe Akun, Nama Lengkap, Email Akun, Nomor WhatsApp, ID Pengguna, Status ("Menunggu Verifikasi"), dan Instruksi Pemeriksaan via Dashboard Admin Resmi.
2. **Pembersihan Caller di `MitraProfile.tsx`, `AgentProfile.tsx`, dan `Profile.tsx`**:
   - Menghapus passing `ktp_number`, `ktp_address`, dan `ktp_photo_url` pada pemanggilan `notifyAdminIdentityVerification`.
3. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan tidak ada type mismatch atau kesalahan kompilasi.
4. **Pencatatan & Git Repository**:
   - Mencatat ke `functions/PROGRESS.md` (Progres 323) dan memperbarui `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- [ ] Analisis payload email `notifyAdminIdentityVerification` $\rightarrow$ Bebas dari field NIK, alamat KTP, dan link foto KTP.
- [ ] Pemeriksaan pemanggilan di modul Mitra, Agen, dan User $\rightarrow$ Hanya mengirimkan informasi identitas non-sensitif (Nama, Email, No. HP, User ID).
- [ ] Uji kompilasi build project $\rightarrow$ 100% lolos tanpa error.
