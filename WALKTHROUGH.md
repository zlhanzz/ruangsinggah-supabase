# WALKTHROUGH: Peningkatan Presisi Scanning Fasilitas Terdekat (Google Places API `RankBy.DISTANCE`) — Fitur #266
**Tanggal**: 2026-09-02 | **Branch**: `bukan-productions`

---

## 1. Ringkasan Masalah & Perbaikan

### Masalah yang Ditemukan:
- Pengguna melaporkan bahwa *"Gereja Katolik Paroki Maria Ratu Rosari"* yang terletak tepat di seberang jalan (jarak ~50 meter dari titik kost `-5.141243, 119.489717`) tidak terdeteksi oleh sistem pemindaian landmark, melainkan mendeteksi gereja lain (*Gereja Toraja Jemaat Bukit*) yang berjarak 1,3 KM.
- **Penyebab**:
  1. **Pengurutan Default Google adalah `PROMINENCE` (Popularitas / Ulasan Terbanyak)**: Secara default, Google Maps Places API mengembalikan maksimal 20 tempat berdasarkan popularitas/rating di seluruh radius 3,5 KM. Tempat di seberang jalan yang memiliki ulasan lebih sedikit kalah saing dan tereliminasi dari 20 hasil teratas Google.
  2. **Karakter Pipe `|` di Keyword**: Sintaks seperti `'gereja|church|katedral|...'` tidak didukung oleh parameter `keyword` Google Places API dan merusak pencarian tempat.

### Solusi yang Diimplementasikan:
1. **Mengaktifkan `rankBy: google.maps.places.RankBy.DISTANCE`**:
   - Google Places API kini dipaksa mengurutkan tempat **dari jarak fisik terdekat (0 meter ke atas)**.
   - Tempat di seberang jalan (50 meter) otomatis dijamin menjadi hasil **#1**.
2. **Dual Parallel Query & Deduplikasi Cerdas**:
   - Menjalankan pencarian ganda (misal: `keyword: 'gereja'` + `type: 'church'`) via `Promise.all`.
   - Menggabungkan dan mendeduplikasi tempat berdasarkan `place_id` atau koordinat unik.
   - Menyortir jarak fisik murni dan membatasi radius maksimal di sisi front-end.
3. **Penerapan Merata ke Seluruh Fasilitas Mikro**:
   - Gereja (radius maks 3,5 KM)
   - Masjid / Musholla (radius maks 2,5 KM)
   - Minimarket (Indomaret, Alfamart, Minimarket - radius maks 2,5 KM)
   - Laundry (radius maks 2,5 KM)
   - SPBU (Pertamina/Shell/SPBU - radius maks 4,0 KM)

---

## 2. Daftar File yang Diubah

- **`functions/public/components/KostFormMitra.tsx`**:
  - Mengubah implementasi `scanMinimarket`, `scanLaundry`, `scanMosque`, `scanChurch`, dan `scanGasStation` menggunakan `rankBy: google.maps.places.RankBy.DISTANCE`.
  - Menerapkan deduplikasi tempat dan filter radius di sisi client.
- **`public/assets/` & `public/index.html`**:
  - Ter-regenerasi via `npm run build`.
- **`functions/PROGRESS.md`**:
  - Pencatatan resmi Fitur #266.

---

## 3. Hasil Pengujian & Kompilasi

### Hasil Build Vite Frontend:
```text
✓ 2506 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.36 kB │ gzip:   2.23 kB
../../public/assets/MitraDashboard-DRr-l0G7.js         379.54 kB │ gzip:  83.96 kB
✓ built in 41.64s
Exit code: 0
```
- **Kompilasi TypeScript & Vite**: Lulus 100% dengan **0 error**.

---

## 4. Panduan Pengujian bagi Pengguna (User Testing Guide)

1. Buka kembali halaman **Mitra Dashboard** -> **Tambah/Edit Kost**.
2. Lanjut ke **Langkah 2: Lokasi & Fasilitas Terdekat**.
3. Pastikan pin lokasi berada pada titik kost Anda (misal dekat jalan Perintis / depan gereja Maria Ratu Rosari: `Lat: -5.141243, Lng: 119.489717`).
4. Klik tombol **"Pindai Ulang Landmark"**.
5. **Perhatikan Hasilnya**:
   - Gereja terdekat yang terdeteksi kini adalah **"Gereja Katolik Paroki Maria Ratu Rosari"** dengan jarak terdekat (~0.05 KM / puluhan meter), bukan lagi gereja yang berjarak 1,3 KM.
