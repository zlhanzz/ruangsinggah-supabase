# IMPLEMENTATION PLAN — Banner Campaign Referral Agen Survey

**Tanggal:** 17 Juni 2026  
**Fitur:** Banner Campaign "Ajak Pemilik Kost Bergabung, Bonus Rp 50.000" di Dashboard Agen

---

## 1. Analisis Masalah / Tujuan

Berdasarkan roadmap di `FOKUS_PENGEMBANGAN.md`, Tahap 1 adalah membangun sistem referral agen. Langkah pertama yang dieksekusi saat ini adalah **komponen UI kampanye** di dashboard agen agar agen termotivasi untuk mengajak pemilik kost mendaftar sebagai Mitra menggunakan kode referral unik mereka.

### Yang Ingin Dicapai:
- **Banner visual kampanye** yang menarik dan fungsional, ditempatkan di antara section "Aktivitas Survey 7 Hari Terakhir" dan "Ringkasan Performa" di tab Overview dashboard agen.
- Banner mengarah ke **artikel penjelasan kampanye** yang akan dibuat di `/artikel/program-referral-agen-ajak-mitra-bonus-50rb`.
- Di bawah banner terdapat **preview ticker satu baris** yang menampilkan nama-nama pemilik kost yang sudah bergabung menggunakan kode referral agen tersebut (hanya 3 huruf awal untuk privasi). Ticker ini bergulir otomatis dan jika diklik membuka riwayat lengkap.

---

## 2. Dampak Perubahan

| File | Jenis Perubahan |
|------|----------------|
| `functions/public/pages/Articles.tsx` | Tambah 1 artikel baru tentang program referral agen (slug `program-referral-agen-ajak-mitra-bonus-50rb`) |
| `functions/public/pages/AgentDashboard.tsx` | Tambah state `referralHistory`, fetch dari tabel `mitra` berdasarkan `referral_code`, render banner + ticker di `renderOverview()` antara baris 776 dan 777 |

---

## 3. Langkah Eksekusi

1. **Tambah artikel kampanye** di `Articles.tsx` — artikel baru di array `articles[]` dengan konten lengkap menjelaskan program referral.
2. **Tambah state + fetch data** referral history di `AgentDashboard.tsx` — query tabel `users` atau `mitra` di mana `referred_by = agentReferralCode`.
3. **Render banner + ticker** di `renderOverview()` — antara penutup `</div>` grid chart (baris 776) dan section Tanggapan Pengguna (baris 778).

---

## 4. Rencana Verifikasi

1. Login sebagai agen survey → tab Overview → banner campaign muncul dengan desain menarik.
2. Klik banner → masuk ke artikel `/artikel/program-referral-agen-ajak-mitra-bonus-50rb`.
3. Ticker menampilkan nama pemilik kost dengan 3 huruf awal.
4. Jalankan `npm run build` untuk pastikan tidak ada error TypeScript.
