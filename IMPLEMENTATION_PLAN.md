# IMPLEMENTATION PLAN - Pendaftaran KostManager Cerdas (Smart Onboarding)

## 1. Analisis Masalah
Sebelumnya, form pendaftaran layanan KostManager mengharuskan mitra menginput detail data kost secara manual. Hal ini tidak efisien untuk mitra lama yang sudah memiliki data listing di web (Case 1). Kita ingin agar sistem secara otomatis mendeteksi properti yang sudah terdaftar oleh mitra dan mengizinkan mereka memilih salah satu properti tersebut untuk langsung didaftarkan ke layanan KostManager. Jika mitra belum memiliki data listing apa pun (Case 2), form akan tetap meminta penginputan secara manual.

## 2. Dampak Perubahan
File yang termodifikasi:
1. `functions/public/pages/KostManagerLanding.tsx` (Frontend pendaftaran)
2. `functions/public/adminService.ts` (Sinkronisasi status transaksi di backend client)

## 3. Langkah-Langkah Eksekusi
1. **Ambil Data Properti Pengguna**: Menambahkan kueri di frontend untuk mendeteksi properti milik mitra yang saat ini belum dikelola (`is_managed = false`).
2. **UI Pemilihan**: Menyediakan toggle pilihan metode pendaftaran di modal ("Pilih dari Kost Saya" vs "Input Manual").
3. **Autofill Data**: Saat properti dipilih, form akan otomatis terisi dengan data yang sesuai.
4. **Metadata Transaksi**: Menyertakan `propertyId` ke dalam metadata transaksi pembayaran.
5. **Aktivasi Otomatis (Fulfillment)**: Ketika transaksi berubah status menjadi `PAID` di backend client (`syncKostManagerRequest`), sistem secara otomatis mengupdate properti terkait menjadi dikelola (`is_managed = true`) dan mengubah status langganan mitra terkait di tabel `mitra` menjadi `'kostmanager'`.

## 4. Rencana Verifikasi
- Menguji alur pemuatan paket pendaftaran KostManager.
- Memastikan pilihan "Pilih dari Kost Saya" tampil jika mitra memiliki listing tidak terkelola, dan otomatis terisi dengan benar.
- Memverifikasi transaksi pembayaran menyertakan `propertyId` pada metadata.
- Memastikan kompilasi build frontend berhasil tanpa error.
