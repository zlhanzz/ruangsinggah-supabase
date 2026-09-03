# IMPLEMENTATION PLAN: Sistem Rating & Ulasan Riil Langsung dari Penghuni Kost

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Rating kost di kartu listing (`KostCard.tsx`) saat ini menggunakan fallback nilai statis `5.0` meskipun kost tersebut belum memiliki ulasan asli dari penyewa.
  - Penghuni aktif di portal **Anak Kost / Penghuni** (`MyKost.tsx`) belum memiliki modul interaktif untuk memberikan bintang rating (1-5) dan testimoni ulasan mengenai kost yang sedang mereka tempati.
  - Halaman detail kost (`KostDetail.tsx`) belum menampilkan seksian ulasan asli dari para penghuni.
- **Kebutuhan Pengguna**:
  1. **Penghapusan Rating Dummy**:
     - Rating kost harus **100% murni dan riil** berdasarkan ulasan penghuni.
     - Jika ada ulasan: Tampilkan nilai rata-rata riil (misal: `⭐ 4.8 (5 Ulasan)`).
     - Jika belum ada ulasan: Tampilkan badge informatif `⭐ Baru` atau `Belum ada ulasan` (bukan rating palsu 5.0).
  2. **Form Ulasan & Rating Langsung bagi Penghuni Aktif (`MyKost.tsx`)**:
     - Di portal penghuni kost (`MyKost.tsx`), sediakan card / modal interaktif **"Ulasan & Rating Kost Anda"**.
     - Penghuni dapat memilih rating bintang (1 - 5 ⭐) dan menulis komentar testimoni jujur (kebersihan, fasilitas, keamanan, kenyamanan).
     - Submit ulasan akan langsung menyimpan ke database Supabase via `addPropertyReview` dan menghitung ulang skor rata-rata properti.
  3. **Penyajian Seksian Ulasan di Halaman Detail Kost (`KostDetail.tsx`)**:
     - Menampilkan ringkasan skor rating riil dan daftar testimoni penghuni (nama penghuni, bintang rating, tanggal, dan komentar).

---

## 2. Arsitektur & Logika Perubahan

1. **Perhitungan Rating Riil di `KostCard.tsx`**:
   - Ekstraksi array ulasan: `reviews = kost.reviews || []`.
   - Jika `reviews.length > 0`:
     - `avgRating = (reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1)`
     - Tampilkan: `⭐ {avgRating} ({reviews.length})`
   - Jika `reviews.length === 0`:
     - Tampilkan: `⭐ Baru` (dengan styling badge abu-abu/oranye lembut tanpa angka rating fiktif).

2. **Modul Pemberian Ulasan Penghuni di `MyKost.tsx`**:
   - Menambahkan komponen/modal **"Beri Ulasan Kost"** di tab ringkasan kost penghuni.
   - Fitur pemilihan bintang interaktif (Hover & Click 1-5 bintang).
   - Textarea komentar ulasan dengan validasi minimal 5 karakter.
   - Integrasi penyimpanan ke backend `addPropertyReview(propertyId, { userId, userName, rating, comment })`.
   - Jika penghuni sudah pernah memberikan ulasan, tampilkan ulasan mereka saat ini dengan opsi edit / perbarui.

3. **Seksian Ulasan Penghuni di `KostDetail.tsx`**:
   - Menambahkan seksian `InfoSection` berjudul **"Ulasan Penghuni Kost"**.
   - Menampilkan total rating rata-rata riil, progress bar sebaran bintang (5⭐, 4⭐, 3⭐, 2⭐, 1⭐), serta kartu-kartu testimoni penghuni terverifikasi.

4. **Pembaruan Backend `userService.ts`**:
   - Memastikan `addPropertyReview` menghitung `newAverageRating` dengan tepat, mengupdate kolom `rating` dan `reviews` di tabel `properties`, serta mendukung update ulasan jika user yang sama mengedit ulasannya.

---

## 3. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**:
  - `functions/public/components/KostCard.tsx`
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/pages/KostDetail.tsx`
  - `functions/public/userService.ts`
- **Proteksi Logika**:
  - Menjaga data tagihan, sewa kamar, chat, komplain, dan layanan darurat di `MyKost.tsx` tetap utuh 100%.
  - Seluruh ikon menggunakan komponen SVG murni dari `lucide-react` (bebas FOUT 100%).

---

## 4. Langkah-Langkah Eksekusi
1. **Perbarui `KostCard.tsx`**:
   - Hapus fallback dummy `'5.0'`, gantikan dengan kalkulasi riil dari `reviews` atau badge `'Baru'`.
2. **Perbarui `userService.ts`**:
   - Optimalkan `addPropertyReview` (dukung upsert review per user).
3. **Tambahkan Fitur Review di `MyKost.tsx`**:
   - Pasang card/modal "Beri Ulasan Kost" di dashboard anak kost.
4. **Tambahkan Seksian Review di `KostDetail.tsx`**:
   - Render daftar review dan rating breakdown riil dari database.

---

## 5. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` (0 error).
2. **Uji Fungsionalitas**:
   - Lihat listing kartu kost tanpa review $\rightarrow$ Menampilkan badge `⭐ Baru` (bukan 5.0).
   - Buka `MyKost.tsx` $\rightarrow$ Kirim ulasan bintang 5 dengan komentar $\rightarrow$ Cek kembali kartu kost dan detail kost $\rightarrow$ Rating langsung terhitung dan komentar tampil.
3. **Pencatatan & Git Push**:
   - Catat di `functions/PROGRESS.md` (Nomor 293), perbarui `WALKTHROUGH.md`, dan push ke branch `bukan-productions`.
