# Rencana Implementasi: Perbaikan Preview Foto Kost & Kamar di Menu "Kost Saya"

Dokumen perencanaan ini dibuat untuk menganalisis dan memperbaiki masalah preview foto kost / kamar yang tidak muncul (hanya menampilkan logo/placeholder *RuangSinggah*) pada kartu pengajuan sewa di halaman **Kost Saya** (`MyKost.tsx`).

---

## 1. Analisis Masalah & Akar Penyebab

### Gejala Masalah:
- Pada halaman **Kost Saya** (`/my-kost`), khususnya tab **Diajukan** (seperti pengajuan sewa Kost Madani Kamar 4), kartu pengajuan berhasil muncul dengan status *"Menunggu Pembayaran"*, namun thumbnail foto kost/kamar tidak menampilkan gambar properti/kamar yang sebenarnya, melainkan hanya kotak gelap dengan logo/ikon *RuangSinggah* dan teks *"Kost"*.

### Akar Masalah (Root Cause):
1. **Kegagalan Query Tabel `properties` Akibat Kolom Non-Eksisten (`subscription_status`)**:
   - Di [MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx#L521-L524), terdapat query batch fetching properti:
     ```typescript
     const { data: propertiesData } = await supabase
         .from('properties')
         .select('id, title, address, image_urls, owner_uid, city, area, additional_fee_name, additional_fee_price, additional_fee_starts_from, room_types, location, facilities, rules, metadata, is_managed, subscription_status')
         .in('id', productIds);
     ```
   - Kolom `subscription_status` berada pada tabel `mitra`, **bukan pada tabel `properties`**.
   - Akibatnya, Supabase mengembalikan error PostgreSQL: `code: 42703, message: column properties.subscription_status does not exist`.
   - Query tersebut gagal secara total (`propertiesData = null`), sehingga `propMap` bernilai objek kosong `{}`.
2. **Dampak Ikutan**:
   - Objek `prop` bernilai `undefined`.
   - `prop?.room_types` dan `prop?.image_urls` tidak ditemukan.
   - Variabel `roomPhotos` menjadi `[]` dan `displayImg` bernilai `null`.
   - Komponen fallback thumbnail otomatis menampilkan placeholder ikon *RuangSinggah*.

---

## 2. Dampak Perubahan

File yang akan disentuh:
- [functions/public/pages/MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx):
  - Memperbaiki string query `.select(...)` pada tabel `properties` dengan menghapus kolom non-eksisten `subscription_status`.
  - Menambahkan *fallback* pencarian ke tabel `mitra_kostmanager` apabila properti dikelola khusus KostManager dan belum termuat.
  - Memperkuat mekanisme ekstraksi foto kamar (`roomPhotos`) dan foto properti (`image_urls`) agar mendukung path storage lokal maupun URL publik Supabase secara tangguh (*resilient*).

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah Persetujuan)

1. **Langkah 1: Perbaikan Query Properti di `MyKost.tsx`**
   - Hapus kolom `subscription_status` dari `.select(...)` tabel `properties`.
   - Tambahkan *fallback query* ke tabel `mitra_kostmanager` jika terdapat properti KostManager yang ID-nya tercatat khusus di tabel mitra.

2. **Langkah 2: Optimasi Resolusi URL Gambar Kamar & Properti**
   - Pastikan setiap item URL di `roomPhotos` dan `image_urls` dinormalisasi dengan benar (mendukung objek `{ url, original, webp }`, string publik `https://...`, maupun path storage lokal).
   - Memastikan `heroImage` pada komponen kartu dapat memilih foto kamar utama (Interior Kamar / Tempat Tidur / Kamar Mandi) atau foto depan gedung (*Bangunan Depan*) secara presisi.

3. **Langkah 3: Kompilasi & Pengujian**
   - Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error TypeScript.
   - Catat progres pekerjaan ke `functions/PROGRESS.md` (Entry #211).
   - Buat dan sajikan dokumen `WALKTHROUGH.md`.
   - Lakukan commit dan push ke remote branch `bukan-productions` sesuai aturan baku.

---

## 4. Rencana Verifikasi

- **Verifikasi Skrip/Simulasi**: Menjalankan simulasi query `fetchMyKosts` di terminal untuk memastikan `propertiesData` sukses di-load dan `displayImg` / `roomPhotos` menghasilkan URL foto Kamar 4 / Foto Bangunan Kost Madani.
- **Uji Kompilasi**: `npm run build` berhasil tanpa error.
- **Verifikasi Visual UI**: Membuka halaman **Kost Saya** tab **Diajukan** dan memastikan kartu Kost Madani menampilkan foto kamar / properti yang jernih dan tajam dengan badge jumlah foto yang sesuai.
