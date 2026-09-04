# WALKTHROUGH: Notifikasi Email Otomatis ke Admin untuk Pesan Masuk KostManager

## 1. Ringkasan Eksekusi
Telah berhasil diimplementasikan fitur **Notifikasi Email Otomatis ke Administrator** setiap kali ada calon penyewa / penghuni mengirim pesan chat ke properti yang dikelola secara **KostManager**.

---

## 2. Rincian Perubahan Kode

### A. Format Notifikasi Email Admin (`emailService.ts`)
- **[emailService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/emailService.ts)**:
  - Memperbarui fungsi `notifyAdminNewChatMessage` untuk menyusun format email profesional ke seluruh email administrator terdaftar via FormSubmit.
  - **Data dalam Email**:
    - Subjek: `💬 Pesan Masuk KostManager: [Nama Properti]`
    - Nama Properti Kost & Lokasi (Kota/Alamat).
    - Nama Calon Penghuni / Pengirim.
    - Email & No. WhatsApp aktif pengirim.
    - Cuplikan/Isi Pesan Masuk.
    - Cap Waktu Pesan Masuk.
    - Petunjuk & Tindakan Admin.
    - Tautan Cepat Langsung ke Sesi Chat di Portal KostManager (`https://ruangsinggah.id/dashboard-admin/km_chats?session={sessionId}`).

### B. Deteksi Properti KostManager & Pengiriman Asinkron (`chatService.ts`)
- **[chatService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/chatService.ts)**:
  - Pada fungsi `sendMessage`:
    - Mengambil data profil pengirim (nama, email, nomor HP) dari tabel `users` dengan mekanisme fallback yang aman.
    - Melakukan deteksi menyeluruh apakah properti berstatus KostManager (`session.owner_id === SYSTEM_ADMIN_ID`, `managed_by === 'kostmanager'`, `is_managed === true`, atau di dalam properti metadata).
    - Memicu pengiriman email `notifyAdminNewChatMessage` ke admin secara asinkron (*non-blocking*) sehingga tidak menghambat kecepatan respons chat pengguna (0ms lag).
    - Mengirimkan notifikasi internal *in-app* ke akun Admin (`SYSTEM_ADMIN_ID`).
    - Untuk properti non-KostManager (mitra mandiri), notifikasi tetap diteruskan ke WhatsApp pemilik kost (`notifyMitra`).

### C. Penyelarasan Inisialisasi Sesi Chat (`KostDetail.tsx`)
- **[KostDetail.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)**:
  - Memperluas validasi `isKostManagerManaged` pada fungsi `handleOpenChat` agar mendeteksi `managed_by === 'kostmanager'`, sehingga sesi chat yang dibuka calon penyewa langsung diarahkan ke Admin KostManager (`SYSTEM_ADMIN_ID`).

---

## 3. Hasil Pengujian & Kompilasi
- **Build Frontend (`functions/public`)**: `npm run build` lulus 100% (✓ 2510 modules transformed, built in 38.77s, **0 error**).
- **Build Backend (`functions`)**: `tsc` lulus 100% (**0 error**).

---

## 4. Panduan Verifikasi Pengujian oleh User

1. **Simulasi Pengiriman Pesan**:
   - Buka salah satu halaman detail kost yang berstatus **KostManager** (misal: `/kost/:id`).
   - Klik tombol **"Tanya Pemilik / Chat"**.
   - Kirim pesan pertanyaan (misal: *"Halo admin, apakah kamar tipe A masih tersedia untuk bulan depan?"*).
2. **Pemeriksaan Notifikasi Email**:
   - Periksa kotak masuk email Administrator (atau email pengelola).
   - Email notifikasi akan masuk dengan subjek `💬 Pesan Masuk KostManager: [Nama Kost]`, lengkap dengan nama pengirim, no. kontak/email, cuplikan isi pesan, dan link cepat menuju Portal KostManager.
3. **Pemeriksaan Portal Chat Admin**:
   - Masuk ke Admin Dashboard $\rightarrow$ Portal KostManager $\rightarrow$ tab **"Pesan & Chat"** (`/dashboard-admin/km_chats`).
   - Pesan baru akan muncul pada daftar percakapan aktif dan siap dibalas oleh tim KostManager.
