# IMPLEMENTATION PLAN - Pendaftaran KostManager Cerdas, Pelacakan Rute GPS, & Peta Interaktif Onboarding

## 1. Analisis Masalah
Mitra yang mendaftarkan kost eksisting ke KostManager ingin agar alamat titik lokasi GPS yang sudah mereka tetapkan (melalui latitude & longitude) digunakan kembali secara otomatis tanpa perlu menginput ulang atau mencari koordinat baru. Selain itu, admin pada dashboard admin dan agen survey pada dashboard agen harus dapat memantau, melacak, serta melakukan navigasi langsung ke titik lokasi GPS tersebut guna efisiensi operasional.
Di samping itu, untuk verifikasi visual langsung saat pendaftaran, kita perlu merender peta Google Maps interaktif (iframe) di dalam form pendaftaran saat kost eksisting dipilih, serta menonaktifkan kolom isian manual agar terhindar dari salah ketik.

## 2. Dampak Perubahan
1. `functions/public/pages/KostManagerLanding.tsx` (Render peta Google Maps embed & menonaktifkan kolom Maps link jika kost eksisting dipilih)
2. `functions/public/adminService.ts` & `functions/src/index.ts` (Meneruskan URL maps ke database survey_requests.notes)
3. `functions/public/components/admin/KostManagerManagement.tsx` (Tampilan tombol lacak rute di Dashboard Admin)
4. `functions/public/pages/AgentDashboard.tsx` (Tampilan tombol navigasi GPS di Dashboard Agen)

## 3. Langkah-Langkah Eksekusi
1. **Peta Interaktif & Autofill GPS**: Pada `KostManagerLanding.tsx`, jika mitra memilih kost eksisting, sistem merender komponen `<iframe src={embedUrl} />` tepat di bawah dropdown pilihan kost dan menyetel kolom `googleMapsLink` sebagai `readOnly` (terarsir).
2. **Penyimpanan notes di Backend**: Pada sinkronisasi data sukses (di client `adminService.ts` dan cloud function `index.ts`), sisipkan teks penunjuk `📍 Link GPS: [URL]` ke dalam kolom `notes` pada baris `survey_requests`.
3. **Tombol Lacak di Portal Admin**: Tambahkan query kolom `metadata` pada database transaksi di `KostManagerManagement.tsx` dan tampilkan tombol *"📍 Lacak Rute GPS"* di bawah alamat kost.
4. **Navigasi di Dashboard Agen**: Di `AgentDashboard.tsx`, gunakan regex untuk mendeteksi `📍 Link GPS:` di dalam kolom catatan tugas survey. Jika terdeteksi, tampilkan tombol hijau bersinar *"📍 Buka Rute GPS / Maps"* agar agen langsung bisa membuka navigasi Google Maps.

## 4. Rencana Verifikasi
- Menguji pengisian form kost eksisting untuk memastikan peta Google Maps terender dengan titik lokasi yang tepat.
- Memastikan kolom Link Google Maps tidak dapat diubah (read-only) ketika memilih opsi kost eksisting.
- Memastikan kolom Link Google Maps tetap terbuka untuk diisi manual ketika memilih opsi daftar baru (manual).
