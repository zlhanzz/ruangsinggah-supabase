# Rencana Implementasi: Konfigurasi Nomor WhatsApp Operasional Resmi RuangSinggah.id (+62 878-8784-5584) & Penyelarasan Template OTP

Dokumen ini memuat analisis dan rencana eksekusi untuk mengganti nomor WhatsApp Sandbox/Uji Coba dengan nomor operasional resmi RuangSinggah.id (`+62 878-8784-5584`) beserta akun bisnis WABA utamanya, serta menyelaraskan payload template `otp_verification` agar pengiriman OTP dan pesan operasional berjalan lancar 100%.

---

## 1. Analisis Masalah & Temuan Investigasi

1. **Kondisi Sebelumnya (Sandbox/Test)**:
   - Konfigurasi aplikasi di `.env.local` sebelumnya mengarah ke akun uji coba Meta:
     - `VITE_WHATSAPP_PHONE_ID=1132009059986709` (Test Number Meta `+1 555-635-3168`)
     - `VITE_WHATSAPP_WABA_ID=1253101886503653` (Test WABA)
   - Akibatnya, pengiriman pesan operasional dari sistem masih menggunakan nomor uji coba dan template yang dibuat di WABA utama tidak terbaca oleh phone ID tersebut (memunculkan error `#132001`).

2. **Identifikasi Akun WhatsApp Operasional Resmi**:
   - Berdasarkan tangkapan layar pengguna dan hasil verifikasi langsung via Meta Graph API:
     - **Nama WABA**: *Ruang Singgah Id* (Dimiliki oleh *Ruang Singgah Nusantara*)
     - **WABA ID**: `3179718795693124`
     - **Nomor Telepon Operasional**: `+62 878-8784-5584`
     - **Phone Number ID**: `1377156352140430`
     - **Status Nomor**: `VERIFIED` & `Terhubung` (Quality: `UNKNOWN`, Throughput: `STANDARD`)
     - **Webhook Aplikasi**: Telah terhubung ke `https://sgcmnsnokrztocnhxnqm.supabase.co/functions/v1/wa-webhook`
     - **Access Token**: Token yang aktif di `.env.local` telah diverifikasi memiliki akses penuh (*Full Access*) ke WABA dan Phone ID operasional ini.

3. **Struktur Template `otp_verification` yang Disetujui di WABA Operasional**:
   - Meta Graph API mengonfirmasi bahwa template `otp_verification` pada WABA `3179718795693124` berstatus **`APPROVED`**:
     - Kategori: `AUTHENTICATION`, Bahasa: `id`
     - Body: `*{{1}}* adalah kode verifikasi Anda. Demi keamanan, jangan bagikan kode ini.`
     - Button: Tipe **`URL`** (`Salin Kode` dengan tautan dinamis `https://www.whatsapp.com/otp/code/?otp_type=COPY_CODE&code=otp{{1}}`).
   - Pada `whatsappService.ts`, payload pengiriman saat ini masih mengutamakan `sub_type: 'copy_code'`, sehingga Meta menolak dengan error `#132018 (Button at index 0 must be of type Url)`.
   - Oleh karena itu, kita perlu menjadikan `sub_type: 'url'` sebagai payload prioritas utama saat memanggil `sendWaOtpVerification`.

---

## 2. Dampak Perubahan File

1. [functions/public/.env.local](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/.env.local):
   - Mengubah `VITE_WHATSAPP_PHONE_ID` menjadi `1377156352140430`.
   - Mengubah `VITE_WHATSAPP_WABA_ID` menjadi `3179718795693124`.
2. [functions/public/whatsappService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/whatsappService.ts):
   - Menambahkan default fallback ID operasional:
     ```typescript
     const DEFAULT_OPERATIONAL_PHONE_ID = '1377156352140430'; // +62 878-8784-5584
     const DEFAULT_OPERATIONAL_WABA_ID = '3179718795693124';
     ```
     sehingga jika variabel env belum termuat atau di lingkungan produksi, sistem secara otomatis tetap menggunakan nomor resmi RuangSinggah.id.
   - Menyelaraskan fungsi `sendWaOtpVerification` agar mengirim komponen tombol bertipe URL (`sub_type: 'url'`) sebagai opsi utama, persis sesuai spesifikasi template `otp_verification` yang disetujui di Meta.
   - Mempertahankan fallback ke `body-only` dan `copy_code` sebagai pengaman sekunder.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Pembaruan Konfigurasi `.env.local`
- Set `VITE_WHATSAPP_PHONE_ID=1377156352140430`.
- Set `VITE_WHATSAPP_WABA_ID=3179718795693124`.

### Langkah 2: Pembaruan `whatsappService.ts`
- Tambahkan konstanta default operasional (`DEFAULT_OPERATIONAL_PHONE_ID` dan `DEFAULT_OPERATIONAL_WABA_ID`).
- Ubah prioritas `sendWaOtpVerification`:
  ```typescript
  // Prioritas Utama: Format URL Button resmi sesuai template approved di WABA Ruang Singgah Id
  const urlComponents = [
    {
      type: 'body',
      parameters: [{ type: 'text', text: otpCode }]
    },
    {
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: otpCode }]
    }
  ];
  ```

### Langkah 3: Uji Kirim Pesan & Kompilasi Frontend
- Jalankan simulasi kirim OTP dari nomor resmi `+62 878-8784-5584` ke nomor WhatsApp pengujian menggunakan Phone ID `1377156352140430`.
- Jalankan build `npm.cmd run build` di folder `functions/public` untuk memastikan kompilasi 100% lulus 0 error.

### Langkah 4: Dokumentasi Progres & Walkthrough
- Catat riwayat pekerjaan di `functions/PROGRESS.md` (#417).
- Terbitkan panduan hasil di `WALKTHROUGH.md`.
- Lakukan commit dan git push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Meta Cloud API**:
   - Panggilan API pengiriman pesan dengan Phone ID `1377156352140430` diterima oleh Meta dengan status HTTP 200 / `messages[0].id` (`wamid...`).
2. **Penerimaan Pesan di WhatsApp Pengguna**:
   - Pengguna menerima pesan WhatsApp resmi dengan pengirim terverifikasi **"Ruang Singgah Id"** (`+62 878-8784-5584`), berisi teks kode verifikasi dan tombol "Salin Kode".
3. **Uji Kompilasi Front-End**:
   - `npm.cmd run build` di direktori `functions/public` sukses tanpa error TypeScript ataupun Vite bundler.
4. **Verifikasi UI Profil Mitra**:
   - Menu Verifikasi Identitas di `MitraProfile.tsx` dapat mengirimkan OTP WhatsApp, menerima input kode 6 digit, dan sukses memvalidasi nomor menjadi terverifikasi (`whatsapp_verified: true`).
