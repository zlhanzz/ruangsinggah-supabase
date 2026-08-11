# IMPLEMENTATION PLAN — Restorasi UI/UX & Fungsi Input KostManager di Dashboard Agen (Survey Field App)

**Tanggal:** 3 Agustus 2026  
**Fitur:** Mengubah tampilan dan alur input pendataan properti KostManager oleh Agen Survey menjadi model Multi-Step Stepper (3 Langkah) sesuai desain mockup Google Stitch.

---

## 1. Analisis Masalah / Tujuan
Saat ini, pengisian data properti & kamar oleh Agen Survey menggunakan tab standard (Info Properti & Kamar). Desain baru membagi pengisian menjadi 3 langkah berurutan agar lebih terstruktur untuk surveyor lapangan:
1. **Langkah 1 (Properti):** Nama properti, tipe kos (Putra/Putri/Campur), alamat lengkap, koordinat GPS presisi, checkbox fasilitas umum (WiFi, Dapur, Parkir, Ruang Tamu, CCTV, Laundry) dengan fitur "+ Tambah Fasilitas", dokumentasi foto area umum (Depan, Koridor, Area Umum, Lingkungan), fasilitas & landmark terdekat (terintegrasi GPS), dan peraturan kos.
2. **Langkah 2 (Data Kamar):** Pengisian detail tipe kamar (nama, ukuran, harga, jumlah kamar, kapasitas, fasilitas, foto kamar).
3. **Langkah 3 (Review):** Pratinjau seluruh data sebelum disimpan dan dikirim.

---

## 2. Dampak Perubahan
File yang akan diubah:
* `functions/public/pages/AgentDashboard.tsx`
  - Memperbarui state `kmListingForm` untuk menyimpan data baru seperti `rules` (array), `image_urls` (array), `campuses` (array), `facilities` (array).
  - Menambahkan state `kmStep` (number: 1, 2, 3) untuk navigasi stepper.
  - Mengubah render modal `{isEditingKostManager && (...)}` agar menggunakan UI layout dari mockup Stitch (termasuk skema warna, ikon Material Symbols, layout grid, tombol navigasi bawah "Simpan Draft" & "Lanjut ke Step 2/3").
  - Menghubungkan fungsionalitas tombol upload foto area umum & kamar, penambahan fasilitas kustom, penambahan landmark, dan input peraturan dinamis.

---

## 3. Rencana Verifikasi
1. Jalankan `npm run build` untuk memverifikasi kebersihan kode TypeScript.
2. Buka Dashboard Agen -> Klik tombol "⚡ Isi Listing & Kamar" pada salah satu tugas KostManager.
3. Pastikan modal baru dengan Stepper muncul.
4. Lakukan pengisian data di Langkah 1 (coba ubah tipe kos, tambah fasilitas kustom, isi peraturan, klik tombol kunci koordinat).
5. Lanjut ke Langkah 2, kelola data tipe kamar, lalu lanjut ke Langkah 3 untuk review.
6. Klik "Simpan & Kirim Listing" dan pastikan data tersimpan dengan benar di tabel Supabase.
