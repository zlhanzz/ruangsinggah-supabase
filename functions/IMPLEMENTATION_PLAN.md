# IMPLEMENTATION PLAN - Peningkatan Keandalan & Sistem Cerdas OCR KTP (Mitra & Agen)

Rencana ini dibuat untuk mengimplementasikan algoritma pemindaian OCR cerdas pada verifikasi KTP untuk menangkap NIK 16-digit dan Alamat secara akurat, terlepas dari perbedaan posisi foto, presisi, atau kesalahan bacaan OCR (misalnya karakter `O` dibaca `0` dan sebaliknya).

## 1. Analisis Masalah
- **Masalah Pemindaian KTP**:
  Sistem OCR saat ini menggunakan pencocokan regex sederhana yang sensitif terhadap kesalahan bacaan karakter (noise) dan tata letak teks yang bergeser.
  - NIK sering kali salah terbaca dengan huruf seperti `O`, `o`, `I`, `l`, `b`, atau tanda baca di dalamnya, sehingga gagal melewati filter angka.
  - Alamat sering kali terbagi dalam beberapa baris (Alamat, RT/RW, Kel/Desa, Kecamatan). Regex saat ini hanya mengambil satu baris atau terpotong apabila posisinya tidak persis berurutan.
- **Solusi Cerdas**:
  - **Smart NIK Extractor**: Mengimplementasikan kamus koreksi digit (misal: `O/o` -> `0`, `I/l/|` -> `1`, `B` -> `8`, `S/s` -> `5`) dan memindai semua token kata untuk mencari kecocokan NIK 16-digit yang dibersihkan.
  - **Smart Address Builder**: Membaca baris alamat utama secara bergantian, menelusuri baris berikutnya untuk mencari data komponen wilayah (RT/RW, Kelurahan, Kecamatan), lalu menggabungkannya ke dalam format alamat terstandarisasi Indonesia.

## 2. Dampak Perubahan
Berkas yang akan diubah:
1. `functions/public/pages/MitraProfile.tsx`:
   - Memperbarui fungsi `performOcr` dengan menerapkan `extractNikSmart` dan `extractAddressSmart`.
2. `functions/public/pages/AgentProfile.tsx`:
   - Memperbarui fungsi `performOcr` dengan menerapkan logika parsing cerdas yang sama untuk keseragaman sistem.

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan `MitraProfile.tsx`**:
   - Ganti isi fungsi `performOcr` (baris ~286 s.d. ~326) dengan logika pembersihan data cerdas yang tangguh.
2. **Pembaruan `AgentProfile.tsx`**:
   - Ganti isi fungsi `performOcr` (baris ~82 s.d. ~132) dengan logika pembersihan data cerdas yang sama.
3. **Validasi Kompilasi**:
   - Jalankan `cmd.exe /c npm run build` untuk memverifikasi tidak ada kesalahan sintaksis.

## 4. Rencana Verifikasi
- Melakukan unggah KTP pada mode edit Mitra dan Agen.
- Memastikan NIK dan Alamat KTP terisi otomatis dengan format rapi (misal NIK bersih 16-digit, Alamat berformat: `Jl. X, RT. Y/RW. Z, Kel. A, Kec. B`).
- Memastikan build Vite selesai dengan sukses.
