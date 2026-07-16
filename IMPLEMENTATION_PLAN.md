# IMPLEMENTATION PLAN - Pendaftaran KostManager Cerdas & Pelacakan Rute GPS

## 1. Analisis Masalah
Mitra yang mendaftarkan kost eksisting ke KostManager ingin agar alamat titik lokasi GPS yang sudah mereka tetapkan (melalui latitude & longitude) digunakan kembali secara otomatis tanpa perlu menginput ulang atau mencari koordinat baru. Selain itu, admin pada dashboard admin dan agen survey pada dashboard agen harus dapat memantau, melacak, serta melakukan navigasi langsung ke titik lokasi GPS tersebut guna efisiensi operasional.

## 2. Dampak Perubahan
1. `functions/public/pages/KostManagerLanding.tsx` (Autofill Google Maps link menggunakan koordinat lat/lng kost eksisting)
2. `functions/public/adminService.ts` & `functions/src/index.ts` (Meneruskan URL maps ke database survey_requests.notes)
3. `functions/public/components/admin/KostManagerManagement.tsx` (Tampilan tombol lacak rute di Dashboard Admin)
4. `functions/public/pages/AgentDashboard.tsx` (Tampilan tombol navigasi GPS di Dashboard Agen)

## 3. Langkah-Langkah Eksekusi
1. **Autofill GPS Link dari Koordinat**: Pada `handleKostSelection` di `KostManagerLanding.tsx`, jika properti eksisting memiliki `location.lat` dan `location.lng`, buat Google Maps URL (`https://www.google.com/maps?q=lat,lng`) dan masukkan otomatis ke kolom input `googleMapsLink`.
2. **Penyimpanan notes di Backend**: Pada sinkronisasi data sukses (di client `adminService.ts` dan cloud function `index.ts`), sisipkan teks penunjuk `📍 Link GPS: [URL]` ke dalam kolom `notes` pada baris `survey_requests`.
3. **Tombol Lacak di Portal Admin**: Tambahkan query kolom `metadata` pada database transaksi di `KostManagerManagement.tsx` dan tampilkan tombol *"📍 Lacak Rute GPS"* di bawah alamat kost.
4. **Navigasi di Dashboard Agen**: Di `AgentDashboard.tsx`, gunakan regex untuk mendeteksi `📍 Link GPS:` di dalam kolom catatan tugas survey. Jika terdeteksi, tampilkan tombol hijau bersinar *"📍 Buka Rute GPS / Maps"* agar agen langsung bisa membuka navigasi Google Maps.

## 4. Rencana Verifikasi
- Menguji pengisian form kost eksisting untuk memastikan googleMapsLink terisi URL maps koordinat dengan benar.
- Menguji sinkronisasi ke tabel survey_requests untuk memastikan format catatan GPS tersimpan.
- Memverifikasi tampilan tombol di portal admin dan dashboard agen.
