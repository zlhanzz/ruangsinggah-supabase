# Rencana Implementasi: Menampilkan Data Wilayah (Provinsi, Kota/Kabupaten, Kecamatan) pada Modal Peninjauan Admin

Dokumen ini merinci rencana penambahan rincian data wilayah (Provinsi, Kota/Kabupaten, dan Kecamatan) pada **Modal Peninjauan & Evaluasi Admin (*Admin Review & Audit Modal*)** di [functions/public/components/admin/KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx).

---

## 1. Analisis Masalah & Kebutuhan

### A. Temuan Berdasarkan Screenshot User
Sesuai screenshot yang dikirimkan oleh User dari **Modal Peninjauan Admin (Tab 1: DATA PROPERTI UMUM -> ALAMAT & TITIK KOORDINAT)**:
- Saat ini di bawah teks alamat hanya terdapat 3 kotak:
  1. `KOTA / WILAYAH` (Makassar)
  2. `LATITUDE` (-5.1316798648518205)
  3. `LONGITUDE` (119.48123216629028)
- Data **Provinsi** (`Sulawesi Selatan`) dan **Kecamatan / Area** (`Tamalanrea`) belum ditampilkan secara terpisah dan terstruktur sebagai kotak data administratif tersendiri.

### B. Tujuan & Peningkatan
Memperbarui tampilan pada seksi **Alamat & Titik Koordinat** di Modal Peninjauan Admin agar menampilkan 5 kotak informasi terstruktur yang lengkap:
1. **🏛️ PROVINSI**: `reviewProperty?.province` (dengan helper auto-detect fallback jika properti lama: *"Sulawesi Selatan"*)
2. **🏙️ KABUPATEN / KOTA**: `reviewProperty?.city` (misal: *"Makassar"*)
3. **📍 KECAMATAN / AREA**: `reviewProperty?.area` (misal: *"Tamalanrea"*)
4. **🌐 LATITUDE**: Titik koordinat garis lintang
5. **🌐 LONGITUDE**: Titik koordinat garis bujur

Juga menyertakan badge wilayah serupa pada kartu simulasi evaluasi titik GPS properti (*Audit Card: property_gps*).

---

## 2. Rencana Desain & Tata Letak

### A. Seksi Alamat & Titik Koordinat pada Modal Peninjauan Admin:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📍 ALAMAT & TITIK KOORDINAT                                                 │
│ VF9J+7GM, Jl. Politeknik, Tamalanrea Indah, Kec. Tamalanrea, Kota Makassar  │
├───────────────┬───────────────────┬───────────────────┬──────────┬──────────┤
│ PROVINSI      │ KABUPATEN / KOTA  │ KECAMATAN / AREA  │ LATITUDE │ LONGITUDE│
│ Sulawesi Sel. │ Makassar          │ Tamalanrea        │ -5.1316..│ 119.481..│
└───────────────┴───────────────────┴───────────────────┴──────────┴──────────┘
```

---

## 3. Dampak Perubahan

### File yang Tersentuh:
- [functions/public/components/admin/KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx):
  - Menambahkan helper auto-detection provinsi `detectProvinceFromAddress`.
  - Memperbarui kotak data di bawah teks alamat pada Tab 1 (*Data Properti Umum*) agar memuat Provinsi, Kota/Kabupaten, dan Kecamatan/Area.
  - Memperbarui kartu simulasi audit GPS (`property_gps`).
- [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Pencatatan riwayat progres Entry #142.

---

## 4. Langkah Eksekusi (Fase 2 Setelah ACC)

1. Terapkan helper dan pembaruan markup kotak wilayah di `KostManagerManagement.tsx`.
2. Jalankan `npm run build` di `functions/public/` untuk memastikan lulus kompilasi 0 error.
3. Catat riwayat pekerjaan ke `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
4. Lakukan git commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- [ ] Buka dashboard Admin KostManager dan klik tombol **Tinjau Berkas / Kelola** pada salah satu pengajuan survei.
- [ ] Buka **Tab 1: DATA PROPERTI UMUM**.
- [ ] Periksa seksi **Alamat & Titik Koordinat**: pastikan terdapat kotak **Provinsi**, **Kabupaten / Kota**, dan **Kecamatan / Area** bersama dengan Latitude dan Longitude.
