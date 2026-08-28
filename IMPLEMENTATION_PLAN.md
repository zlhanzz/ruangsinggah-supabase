# Rencana Implementasi: Perbaikan Preview Foto Properti Terkelola KostManager

Dokumen ini merinci rencana perbaikan masalah tampilan preview foto properti terkelola KostManager yang tidak muncul / rusak (*broken image icon*) pada daftar **Properti & Visual** di [functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx).

---

## 1. Analisis Masalah & Kebutuhan

### A. Temuan Berdasarkan Screenshot & Investigasi Database
- Pada tabel daftar properti terkelola KostManager di kolom **Properti & Visual**:
  - Foto thumbnail kost (misal *"kost madani"*) mengalami kerusakan / gagal tampil dan hanya menampilkan teks alt `kost madani` dengan ikon gambar rusak.
- **Akar Masalah (*Root Cause*)**:
  1. Di database Supabase (`properties.image_urls`), data foto properti tersimpan dalam format objek berstruktur:
     `[{ "original": "https://...supabase.co/...webp" }, ...]`
  2. Pada `KostManagerPortal.tsx` (baris 1597), sistem mengambil foto utama dengan cara:
     `const primaryImage = (p.image_urls && p.image_urls.length > 0) ? p.image_urls[0] : '';`
     sehingga `primaryImage` menghasilkan nilai objek `{ original: "..." }` bukan string URL mentah.
  3. Ketika dioper ke tag `<img src={primaryImage} />`, browser menerima `src="[object Object]"` yang menyebabkan request gagal dan menghasilkan *broken image icon*.

---

## 2. Rencana Solusi & Perbaikan

1. **Normalisasi Data Foto pada `loadAllData()`**:
   - Memastikan `image_urls` dipetakan menggunakan `normalizePhotoList(...)` saat data properti dimuat dari database:
     `image_urls: normalizePhotoList(p.image_urls || p.imageUrls || p.images || p.metadata?.imageUrls || p.metadata?.photos || [])`
2. **Normalisasi Ekstraksi `primaryImage` pada Tabel**:
   - Menggunakan helper `normalizePhotoUrl(p.image_urls?.[0])` dengan fallback ke properti `thumbnail` / `image_url` / foto kamar pertama.
3. **Graceful Fallback & Error Handling**:
   - Menambahkan event handler `onError` pada elemen `<img>` agar jika URL gambar rusak atau tidak dapat dimuat, elemen otomatis beralih ke ikon fallback `<Building2 />` tanpa menampilkan glitch kotak gambar rusak browser.

---

## 3. Dampak Perubahan

### File yang Tersentuh:
- [functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx):
  - Normalisasi array `image_urls` pada `loadAllData`.
  - Normalisasi `primaryImage` dan penambahan error handler pada kolom Properti & Visual.
- [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Pencatatan riwayat progres Entry #143.

---

## 4. Langkah Eksekusi (Fase 2 Setelah ACC)

1. Perbarui logika pemuatan dan ekstraksi foto di `KostManagerPortal.tsx`.
2. Jalankan `npm run build` di `functions/public/` untuk memastikan lulus kompilasi 0 error.
3. Catat riwayat pekerjaan ke `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
4. Lakukan git commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- [ ] Buka menu **Admin KostManager** -> tab **Properti Terkelola**.
- [ ] Periksa kolom **Properti & Visual**: pastikan foto sampul Kost Madani dan properti lainnya muncul dengan jernih, tajam, dan tidak ada ikon gambar rusak (*broken image*).
