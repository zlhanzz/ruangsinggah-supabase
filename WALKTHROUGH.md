# Walkthrough: Notifikasi Email Otomatis ke Admin pada Pengajuan Verifikasi Identitas Mitra & Agen (`emailService.ts`, `MitraProfile.tsx`, `AgentProfile.tsx`, `Profile.tsx`)

Dokumentasi ini merangkum penyelesaian implementasi **Fitur #224**, yaitu pengiriman notifikasi email otomatis ke admin setiap kali ada pengajuan verifikasi identitas (KTP) baru yang masuk dari calon mitra (pemilik kost) maupun calon agen pemasaran.

---

## 1. Ringkasan Perubahan

### A. Helper Notifikasi Email Terstruktur (`emailService.ts`)
- Menambahkan fungsi [`notifyAdminIdentityVerification`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts) yang secara dinamis mengambil seluruh alamat email admin aktif dari tabel `users` (dengan fallback `sulhan77777@gmail.com`).
- Format email memuat:
  1. **Subjek**: `Transaksi Baru - Pengajuan Verifikasi Identitas (Calon Mitra / Calon Agen)!`
  2. **Tipe Akun**: *"Calon Mitra / Pemilik Kost"* atau *"Calon Agen Pemasaran"*.
  3. **Nama Lengkap**: Sesuai KTP / Profil.
  4. **Email Akun & Nomor WhatsApp**.
  5. **Nomor NIK KTP & Alamat Sesuai KTP**.
  6. **Tautan Foto KTP**: Untuk pratinjau instan foto dokumen KTP.
  7. **ID Pengguna & Tautan Langsung ke Dashboard Verifikasi Admin**.

### B. Integrasi Pengiriman pada Form Pengajuan
- **Mitra Profile ([`MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx))**:
  - Saat calon mitra melengkapi formulir dan menyimpan data verifikasi KTP (`user_verifications` status `'pending'`), sistem secara otomatis mengirimkan email notifikasi ke admin.
- **Agent Profile ([`AgentProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx))**:
  - Saat calon agen melengkapi formulir dan mengajukan data verifikasi KTP, sistem secara otomatis mengirimkan email notifikasi ke admin.
- **Profile Umum ([`Profile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx))**:
  - Jika agen memperbarui berkas verifikasi identitas di halaman profil pengguna, sistem juga memicu email notifikasi ke admin.

---

## 2. Hasil Pengujian & Kompilasi

### Uji Build Frontend (Vite)
```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 2504 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 25.55s
```
*Hasil:* **100% Lulus (0 Error)**.

---

## 3. Panduan Pengujian bagi Pengguna

1. Buka halaman **Profil Mitra** (`/dashboard-mitra/profile`) atau **Profil Agen** (`/agent/profile`).
2. Klik tombol **"Lengkapi Profil & Verifikasi"**.
3. Masukkan data profil, unggah foto KTP, dan klik **"Simpan Profil"**.
4. **Hasil**:
   - Data verifikasi tersimpan dengan status `pending`.
   - Admin akan menerima email pemberitahuan yang berisi detail lengkap nama calon mitra/agen, nomor WhatsApp, nomor KTP, alamat, dan tautan foto KTP untuk ditinjau.
