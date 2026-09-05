# Rencana Implementasi (Implementation Plan): Pemulihan Tampilan Klasik Halaman Kontak & Penyelarasan Akses Pusat Bantuan

## 1. Analisis Masalah & Kebutuhan Pengguna

### A. Masalah & Konteks
1. **Preferensi Desain**: Pengguna secara eksplisit menyatakan lebih menyukai desain lama/klasik dari halaman `Contact.tsx` (yang menampilkan Card tunggal elegan dengan panel kiri hitam/dark "Informasi Kontak" dan panel kanan putih "Kirim Pesan Cepat").
2. **Kebutuhan Inti**: Pengguna hanya menginginkan **kesamaan akses/target**:
   - Menu **"Pusat Bantuan"** di Footer membuka halaman kontak tersebut.
   - Tombol **"Pusat Bantuan 24/7"** di Profile Hub membuka halaman kontak yang sama tersebut.
3. **Penyelarasan**: Mengembalikan markup dan styling `Contact.tsx` 100% ke bentuk desain klasik aslinya (clean split-card layout), namun menggunakan pure bundled SVG icon `lucide-react` untuk mencegah FOUT.

---

## 2. Dampak Perubahan (File yang Terpengaruh)

| No | File | Perubahan |
|---|---|---|
| 1 | `functions/public/pages/Contact.tsx` | Memulihkan tampilan klasik/lama (Hero title "Hubungi Kami" & Single split-card: Dark Left Info Panel + Clean White Right Form Panel) dan memastikan tombol kembali & ikon `lucide-react` terpasang rapi. |
| 2 | `functions/public/components/Footer.tsx` | Memastikan menu navigasi footer tetap mengarah ke `Page.CONTACT`. |
| 3 | `functions/public/pages/Profile.tsx` | Memastikan menu "Pusat Bantuan 24/7" tetap mengarah ke `Page.CONTACT`. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Pasca-Approval)

1. **Pemulihan `Contact.tsx` ke Tampilan Klasik**:
   - Mengembalikan layout `min-h-screen bg-white py-24` dengan grid 2 kolom di dalam card `bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden`.
   - Panel kiri: `p-10 bg-gray-900 text-white flex flex-col justify-between` (WhatsApp CS, Email, Headquarters, icon media sosial).
   - Panel kanan: `p-10 bg-white` (Kirim Pesan Cepat: Nama Lengkap, Nomor WhatsApp, Keperluan, Pesan, Tombol Oranye Kirim Pesan).
   - Menambahkan tombol navigasi kembali `← Kembali` yang ringkas di bagian atas.
   - Menggunakan icon pure vector `lucide-react` (`Phone`, `Mail`, `MapPin`, `ArrowLeft`).
2. **Kompilasi & Verifikasi Build**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan kompilasi 100% lulus.
3. **Pencatatan Progres & Walkthrough**:
   - Menambahkan catatan di `functions/PROGRESS.md` dan memperbarui `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Kompilasi**: `npm run build` lulus tanpa error.
- [ ] **Verifikasi Visual**: Tampilan `/contact` kembali ke desain klasik split card (dark panel + white form) persis seperti tangkapan layar referensi pengguna.
- [ ] **Verifikasi Akses Terpadu**: Baik klik dari footer maupun klik dari menu profil membuka halaman klasik yang sama.
