# Laporan Penyelesaian (Walkthrough): Konfigurasi Nomor WhatsApp Operasional Resmi RuangSinggah.id (+62 878-8784-5584) & Penyelarasan Template OTP

Dokumen ini memuat ringkasan menyeluruh mengenai pekerjaan pengalihan nomor WhatsApp Business Cloud API dari akun Sandbox/Uji Coba ke nomor WhatsApp operasional resmi RuangSinggah.id, serta penyelarasan format komponen tombol template OTP.

---

## 1. Ringkasan Perubahan

### A. Konfigurasi Nomor WhatsApp Operasional Resmi
- **Nama Akun WhatsApp**: **Ruang Singgah Id** (Dimiliki oleh *Ruang Singgah Nusantara*)
- **WABA ID Resmi**: `3179718795693124`
- **Nomor Telepon Operasional**: `+62 878-8784-5584`
- **Phone Number ID**: `1377156352140430` (Status: `VERIFIED`, `Terhubung`)
- **Webhook Terhubung**: `https://sgcmnsnokrztocnhxnqm.supabase.co/functions/v1/wa-webhook`
- File [functions/public/.env.local](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/.env.local) telah diperbarui dengan:
  ```env
  VITE_WHATSAPP_PHONE_ID=1377156352140430
  VITE_WHATSAPP_WABA_ID=3179718795693124
  ```

### B. Default Fallback & Penyelarasan Payload di `whatsappService.ts`
- Menambahkan fallback permanen:
  ```typescript
  export const DEFAULT_OPERATIONAL_PHONE_ID = '1377156352140430'; // +62 878-8784-5584 (Ruang Singgah Id)
  export const DEFAULT_OPERATIONAL_WABA_ID = '3179718795693124';
  ```
  sehingga bila env tidak tersedia (misal di production bundle static), sistem otomatis menggunakan nomor operasional resmi RuangSinggah.id.
- Menjadikan komponen tombol **URL** (`sub_type: 'url'`) sebagai opsi prioritas utama pengiriman template `otp_verification` untuk mencocokkan skema template `APPROVED` di Meta WABA `3179718795693124`.
- Menjaga opsi fallback sekunder ke `copy_code` dan `body-only`.

---

## 2. Hasil Pengujian & Verifikasi

### A. Uji Live Kirim OTP via Meta Cloud API
- Pengujian langsung pengiriman template `otp_verification` dari Phone ID `1377156352140430` (`+62 878-8784-5584`) ke nomor WhatsApp penerima:
  ```json
  {
    "messaging_product": "whatsapp",
    "contacts": [
      {
        "input": "6281527080656",
        "wa_id": "6281527080656"
      }
    ],
    "messages": [
      {
        "id": "wamid.HBgNNjI4MTUyNzA4MDY1NhUCABEYEkU1ODczMEQ4RjA3OEYwNjhDQQA=",
        "message_status": "accepted"
      }
    ]
  }
  ```
- **Hasil**: **Sukses 100%** (Status: `accepted`, nomor pengirim: `+62 878-8784-5584` / *Ruang Singgah Id*).

### B. Uji Kompilasi Front-End Vite
- Perintah: `npm.cmd run build` di direktori `functions/public`
- Hasil:
  ```bash
  vite v6.4.1 building for production...
  transforming...
  ✓ 2512 modules transformed.
  ✓ built in 26.88s
  Exit code: 0 (No compile errors)
  ```

---

## 3. Panduan Pengujian bagi Pengguna di UI

1. Buka antarmuka aplikasi lokal atau deploy (misal di `localhost:5173`).
2. Masuk ke halaman **Profil Mitra** $\rightarrow$ **Verifikasi Identitas**.
3. Pada kartu **Verifikasi Nomor WhatsApp**, klik tombol **"Kirim Kode Verifikasi"**.
4. Periksa aplikasi WhatsApp pada ponsel Anda:
   - Pengirim adalah **"Ruang Singgah Id"** (`+62 878-8784-5584`).
   - Terdapat teks kode verifikasi beserta tombol **"Salin Kode"**.
5. Masukkan 6 digit kode OTP ke input formulir di website.
6. Nomor WhatsApp Anda akan langsung terverifikasi dengan tanda centang hijau (`whatsapp_verified: true`).

---

## 4. Keamanan & Deploy
- Sesuai protokol workspace: perubahan tidak di-deploy ke production secara otomatis. Pengguna dapat melakukan sinkronisasi/deploy secara mandiri saat diinginkan.
