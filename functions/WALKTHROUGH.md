# WALKTHROUGH - Penyempurnaan Wizard Verifikasi KTP & WhatsApp OTP Dinamis (Pembaruan Draft)

Dokumen ini menjelaskan hasil perubahan alur verifikasi nomor WhatsApp secara dinamis dan perbaikan form verifikasi identitas (KTP) berbasis wizard bertahap pada halaman Profil Mitra (`MitraProfile.tsx`), serta penanganan fitur penyimpanan draft.

## 1. Daftar Perubahan

### [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)
1. **WhatsApp OTP Dinamis**:
   - Kolom input OTP disembunyikan secara default dan hanya dimunculkan secara dinamis jika nomor WhatsApp belum terverifikasi (`waOtpVerified === false`).
   - Apabila belum diverifikasi, form dinamis menyajikan panduan dan tombol "Kirim Kode OTP".
   - Setelah dikirim, kolom input 6-digit OTP muncul dengan timer kirim ulang (60 detik) dan developer sandbox OTP helper.
   - Setelah sukses diverifikasi, kolom input OTP otomatis menghilang, dan ikon centang hijau premium (`BadgeCheck` dari lucide-react) muncul langsung di dalam kolom input telepon serta di atasnya.
   - Jika nomor telepon diubah, status verifikasi otomatis direset (`waOtpVerified` diubah ke `false`) agar pengguna harus melakukan verifikasi OTP kembali.

2. **Relokasi Foto Profil (Opsional) ke Langkah 1**:
   - Menghapus tombol overlay unggah foto profil dari kartu atas (hero header).
   - Memindahkan input unggah foto profil ke dalam grid input Langkah 1 (Step 1) sebagai pilihan opsional, menyatukannya ke dalam satu alur pengeditan data utama.
   - Menyembunyikan kartu atas (Profile Hero / Header) sepenuhnya saat berada di mode pengeditan (`isEditing === true`) guna mengurangi redundansi visual dan hemat ruang layar.


3. **Wizard Flow Verifikasi Identitas (KTP)**:
   - Membagi proses edit menjadi alur bertahap (Langkah 1 & Langkah 2).
   - **Langkah 1**: Mengisi data utama (Nama Lengkap, No. WhatsApp - harus OTP verified, Alamat Email, Tempat Lahir, Tanggal Lahir, Alamat Domisili, dan Foto Profil).
   - **Munculnya Tombol Lanjut**: Tombol "LANJUT KE VERIFIKASI KTP" hanya akan muncul secara dinamis setelah seluruh data utama pada Langkah 1 diisi secara lengkap dan nomor WhatsApp berhasil diverifikasi via OTP (unggahan foto profil bersifat opsional).
   - **Langkah 2**: Mengisi data verifikasi KTP (Unggah Foto KTP, NIK 16 digit, Alamat KTP, dan RLS security notice).

4. **Pembatasan Akses Pasca-Verifikasi**:
   - Jika akun Mitra sudah berstatus **`verified`** (telah diajukan & disetujui), maka Langkah 2 (KTP) tidak dapat diakses dan disembunyikan secara penuh. Mitra hanya dapat mengubah data profil utama di Langkah 1, dan tombol bawah langsung bertuliskan "Simpan Semua Data".
   - Jika berstatus ditolak (**`rejected`**), Mitra diberikan kesempatan penuh untuk masuk kembali ke Langkah 1 & Langkah 2 guna mengevaluasi dan memperbaiki data KTP yang salah sebelum mengajukan kembali verifikasi.


4. **Perbaikan Penyimpanan Draft & Penanganan Error**:
   - Menambahkan penanganan error yang sebelumnya tertelan secara senyap (silent error) pada Supabase client dengan mendestruktur `{ error }` dan melemparnya (`throw error`). Jika draf gagal disimpan ke database (misalnya karena keterbatasan hak akses atau kolom database tidak sesuai), maka sistem akan menampilkan peringatan `alert` berupa detail pesan error.

### [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
- **Pemuatan Latar Belakang (Silent Loading)**: Mengubah fungsi `loadData` agar mendukung parameter `silent`. Panggilan sinkronisasi saat prop `user` diperbarui oleh event `RS_USER_UPDATED` kini dilakukan secara *silent* (tanpa memicu layar loading spinner penuh). Hal ini memperbaiki bug di mana komponen `MitraProfile` ter-unmount secara otomatis dan kehilangan seluruh state aktifnya (seperti `isEditing` dan `currentStep`) saat draf Step 1 berhasil disimpan.

### [supabase_schema.sql](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/supabase_schema.sql)
- Menambahkan pernyataan pembuatan kolom `whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE` ke skema/definisi tabel `public.users` dan juga perintah migrasi `ALTER TABLE` agar draf verifikasi nomor WhatsApp berhasil dipersisten ke database tanpa memicu error.

## 2. Hasil Pengujian
Proses pengujian build lokal berjalan dengan sukses. Compiler TypeScript (`tsc --noEmit`) dapat memvalidasi semua sintaks dan penanganan tipe data.

## 3. Petunjuk Deploy
Jalankan query SQL berikut di editor SQL Supabase Dashboard Anda sebelum menjalankan aplikasi:
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE;
```

Setelah query di atas berhasil dijalankan, jalankan perintah berikut untuk menguji frontend secara lokal:
```bash
# Masuk ke direktori public
cd functions/public

# Jalankan server pengembangan lokal
npm run dev
```

Untuk memvalidasi build produksi:
```bash
npm run build
```


