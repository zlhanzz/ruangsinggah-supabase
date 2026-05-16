# Walkthrough - Migrasi Kategori Survey "Testimoni Penghuni" ke "Kondisi Lingkungan Sekitar Kost"

Dokumen ini merangkum seluruh perubahan yang dilakukan untuk mengubah kategori survey dari **"Testimoni Penghuni"** menjadi **"Kondisi Lingkungan Sekitar Kost"**.

## Daftar Perubahan

### 1. Pembaruan Interface Data (`types.ts`)
- Menambahkan field `environmental_conditions` dan `environmental_conditions_photos` ke dalam interface `SurveyRequest`.
- Menandai field lama `resident_testimonial` dan `resident_testimonial_photos` sebagai `@deprecated`.
- Hal ini dilakukan untuk menjaga keamanan tipe data (type safety) sambil tetap mendukung data lama.

### 2. Pembaruan Dashboard Agen (`AgentDashboard.tsx`)
- Mengubah label input dari "Testimoni Penghuni" menjadi **"Kondisi Lingkungan Sekitar Kost"**.
- Mengubah key penyimpanan data dari `resident_testimonial` menjadi `environmental_conditions`.
- Survey baru yang dikirimkan oleh agen sekarang akan menggunakan key yang baru.

### 3. Pembaruan Dashboard Admin (`SurveyManagement.tsx`)
- Memperbarui konfigurasi kategori survey agar menampilkan label **"Kondisi Lingkungan"** dan menggunakan ID `environmental_conditions`.
- Memastikan admin dapat melihat dan mengelola data survey dengan kategori yang baru.

### 4. Pembaruan UI Penyewa (`MyKost.tsx`)
- Menambahkan logika *fallback* pada tampilan detail survey.
- Sistem akan mencoba membaca data dari key baru (`environmental_conditions`). Jika tidak ada, sistem akan membaca dari key lama (`resident_testimonial` atau typo `environment_conditions`) untuk memastikan data historis tetap tampil.
- Label tampilan diubah secara konsisten menjadi **"Kondisi Lingkungan Sekitar Kost"**.

## Hasil Pengujian & Verifikasi
- **Data Baru**: Pengiriman survey melalui Dashboard Agen berhasil menggunakan key `environmental_conditions`.
- **Data Lama**: Data survey lama yang masih menggunakan `resident_testimonial` tetap dapat ditampilkan di halaman My Kost berkat logika fallback.
- **Konsistensi Label**: Seluruh UI (Agen, Admin, dan User) sekarang menampilkan istilah yang sama.

## Petunjuk Deploy
Jalankan perintah berikut untuk menyebarkan perubahan ke hosting:
```bash
firebase deploy --only hosting
```

---
**Status: Selesai**
**Tanggal: 13 Mei 2026**
