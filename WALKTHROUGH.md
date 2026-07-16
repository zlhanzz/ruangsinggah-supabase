# WALKTHROUGH - Pendaftaran KostManager Cerdas (Smart Onboarding)

## 1. Daftar Perubahan
Berikut adalah detail perubahan yang telah dilakukan pada kode program:

### A. Frontend (`KostManagerLanding.tsx`)
- Menambahkan pemuatan properti aktif milik pemilik yang belum dikelola (`is_managed = false`) dari database Supabase (`userKosts`).
- Menambahkan state `isManualInput` dan `selectedKostId` untuk melacak preferensi input user.
- Menyediakan UI pemilih metode pendaftaran ("Pilih dari Kost Saya" vs "Manual") jika pemilik terdeteksi memiliki kost yang sudah terdaftar.
- Menyediakan searchable-like select dropdown untuk memilih kost lama.
- Memproses autofill detail kost (Nama, Tipe, Alamat, Total Kamar) ketika kost lama dipilih.
- Menyertakan parameter `propertyId` ke dalam objek metadata transaksi pembayaran Midtrans/Pakasir.

### B. Database & Client Sync (`adminService.ts`)
- Memperbarui fungsi `syncKostManagerRequest` agar pada status pembayaran `isPaid` (Sukses/PAID):
  1. Jika terdapat `meta.propertyId`, sistem otomatis mengupdate properti terkait di tabel `public.properties` dengan mengubah kolom `is_managed = true`.
  2. Meng-upgrade status langganan pemilik di tabel `public.mitra` menjadi `'kostmanager'` (`subscription_status = 'kostmanager'`).

## 2. Hasil Pengujian & Verifikasi
- Pengujian kompilasi dengan `npm run build` selesai dengan **sukses** (100% aman tanpa error lint/tipe data).
- Kode siap dijalankan di production.

## 3. Petunjuk Deploy
Deploy dapat langsung dilakukan oleh pemilik dengan mem-push ke production server seperti biasa (seluruh perubahan sudah dipush ke GitHub origin/main).
