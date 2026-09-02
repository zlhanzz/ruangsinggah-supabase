# WALKTHROUGH: Konfigurasi Bahasa Default Google Maps API ke Bahasa Indonesia (ID) — Fitur #265
**Tanggal**: 2026-09-02 | **Branch**: `bukan-productions`

---

## 1. Ringkasan & Tujuan
Mengubah bahasa bawaan (*default language*) dan bias wilayah (*region bias*) Google Maps JavaScript API pada web app RuangSinggah.id menjadi **Bahasa Indonesia (`language=id`)** dan **Wilayah Indonesia (`region=ID`)**.

Hal ini menyelesaikan kendala di mana sebelumnya:
1. Pemindaian/scanning tempat terdekat (Google Places Service, Nearby Search, Geocoder) untuk mencari kampus, tempat ibadah, SPBU, dsb. terkadang menghasilkan nama/kategori berbahasa Inggris (*"State Polytechnic"*, *"Mosque"*) atau gagal mendeteksi kata kunci bahasa Indonesia lokal.
2. Kontrol pada antarmuka peta menampilkan tombol bahasa Inggris (*"Map"*, *"Satellite"*, *"Terms of Use"*).

---

## 2. Daftar Perubahan

### File: `functions/public/index.html`
Menambahkan parameter resmi Google Maps JavaScript API: `&language=id&region=ID`:

```diff
-   <!-- Google Maps API (includes Places, Routes, and Geometry libraries) -->
-   <script
-       src="https://maps.googleapis.com/maps/api/js?key=%VITE_GOOGLE_MAPS_API_KEY%&libraries=places,routes,geometry&loading=async"
-       defer></script>
+   <!-- Google Maps API (includes Places, Routes, Geometry libraries, with Indonesian language & region localization) -->
+   <script
+       src="https://maps.googleapis.com/maps/api/js?key=%VITE_GOOGLE_MAPS_API_KEY%&libraries=places,routes,geometry&language=id&region=ID&loading=async"
+       defer></script>
```

### File: `public/index.html` (Bundle Distribusi Vite)
Telah di-regenerasi secara otomatis melalui `npm run build`:
```html
<script
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBAsdbPynnAWSRZ_1iQ3hmoCUAnq5VrV7c&libraries=places,routes,geometry&language=id&region=ID&loading=async"
    defer></script>
```

---

## 3. Hasil Pengujian & Kompilasi

### Hasil Build Frontend Vite:
```text
✓ 2506 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.36 kB │ gzip:   2.23 kB
✓ built in 53.98s
Exit code: 0
```
- **Kompilasi TypeScript & Vite**: Lulus 100% dengan **0 error**.
- **Script Tag Verifikasi**: File `public/index.html` terverifikasi memuat `language=id&region=ID`.

---

## 4. Efek & Manfaat Perubahan
1. **Google Places Service & Nearby Search**:
   - Seluruh hasil query tempat, nama tempat, dan nama jalan akan diprioritaskan menggunakan penamaan resmi Bahasa Indonesia.
   - Deteksi kampus, masjid, gereja, minimarket, laundry, dan SPBU pada formulir pendataan kost lebih presisi dan konsisten dengan kata kunci lokal.
2. **Reverse Geocoding (Geocoder)**:
   - Komponen alamat (`address_components` & `formatted_address`) otomatis dikembalikan dalam format Bahasa Indonesia (misal: "Sulawesi Selatan", "Kota Makassar", "Kecamatan", dsb.).
3. **Kontrol UI Peta**:
   - Tombol kontrol peta di sudut atas kini menggunakan teks **"Peta"** dan **"Satelit"** (bukan lagi *"Map"* dan *"Satellite"*).
   - Tautan hukum dan kontrol aksesibilitas disajikan dalam Bahasa Indonesia (*"Persyaratan Penggunaan"*, *"Laporkan kesalahan peta"*).

---

## 5. Panduan Pengujian bagi Pengguna (User Testing Guide)

1. **Refresh Browser**: Buka web app RuangSinggah.id di browser (lakukan hard refresh `Ctrl + F5` atau buka incognito jika browser menyimpan cache script lama).
2. **Periksa Kontrol Peta**:
   - Buka halaman mana saja yang menampilkan peta (misal: Peta Lokasi di Formulir Pendaftaran Kost Mitra, Detail Kost, atau Dashboard).
   - Perhatikan tombol kontrol di pojok kiri/kanan atas peta: tombol bertuliskan **"Peta"** dan **"Satelit"** (Bahasa Indonesia).
3. **Uji Scanning Tempat Terdekat**:
   - Di formulir pendaftaran kost mitra (*Langkah 2: Lokasi & Fasilitas Terdekat*), geser pin peta atau cari alamat di kota yang Anda inginkan (misal: Makassar).
   - Klik atau tunggu proses deteksi landmark otomatis.
   - Amati daftar kampus dan fasilitas terdekat yang terdeteksi: nama-nama fasilitas kini tampil dalam format dan ejaan Bahasa Indonesia lokal.
