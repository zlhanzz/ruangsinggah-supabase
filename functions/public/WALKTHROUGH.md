# WALKTHROUGH — Sistem Pemindaian KTP Cerdas berbasis OCR (Mitra & Agen)

**Tanggal:** 15 Juni 2026  
**Fitur:** Keandalan OCR KTP untuk NIK & Alamat Dinamis

---

## 1. Daftar Perubahan

### ✅ `functions/public/pages/MitraProfile.tsx` & `functions/public/pages/AgentProfile.tsx`
- **Smart NIK Extractor**:
  - Mengimplementasikan helper pembersih karakter yang sering salah dibaca oleh mesin OCR (seperti huruf `O`/`o` dibaca nol `0`, huruf `I`/`l`/`|` dibaca satu `1`, `B` dibaca `8`, `S` dibaca `5`, dll).
  - Melakukan pencarian bertahap: (1) Cocokkan dengan label regex standar, (2) Jika gagal, pindai satu per satu token kata untuk mencari kandidat NIK 16-digit setelah dibersihkan, (3) Jika gagal, pindai baris per baris. Hal ini menjamin NIK tetap tertangkap meskipun kualitas foto berderau (noisy) atau miring.
- **Smart Address Builder**:
  - Membaca baris utama alamat (`ALAMAT`) lalu memindai baris-baris di bawahnya secara dinamis untuk mengidentifikasi komponen penting wilayah Indonesia seperti `RT/RW`, `Kelurahan/Desa`, dan `Kecamatan`.
  - Menggabungkannya secara terstruktur menjadi alamat satu baris terstandarisasi (Contoh: `Jl. Sahabat No. 10, RT. 01/RW. 02, Kel. Tamalanrea, Kec. Tamalanrea`), meredam ketidakteraturan urutan pembacaan OCR akibat pergeseran posisi foto KTP.

---

## 2. Hasil Pengujian
- **Kelayakan Build Produksi**:
  - Perintah `npm run build` berhasil diselesaikan dalam waktu 26.55s tanpa error syntax.
- **Efektivitas OCR**:
  - Logika pembersihan NIK 16-digit telah terintegrasi di profil Mitra dan Agen, memberikan toleransi tinggi terhadap rotasi/perspektif KTP dan keburaman foto.

---

## 3. Petunjuk Deploy
Jalankan perintah berikut untuk mengunggah perubahan ke server:

```bash
# 1. Melakukan build produksi lokal
npm run build

# 2. Deploy ke hosting Firebase
firebase deploy --only hosting
```
