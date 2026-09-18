# Walkthrough: Pembersihan Diksi Internal ("Instan") & Standarisasi Evaluasi Protokol AI Verifikasi Mitra

Dokumen ini mencatat penyesuaian copywriting dan alur respon verifikasi identitas pemilik kost (mitra) di RuangSinggah. Seluruh terminologi teknis dapur internal (*"instan/kilat/auto-acc"*) telah dibersihkan dari antarmuka pengguna, dan digantikan oleh bahasa resmi berbasis evaluasi protokol AI & keamanan.

---

## 1. Ringkasan Perubahan

### A. Pembersihan Diksi Dapur Internal pada `MitraProfile.tsx`
- **Tombol Pengajuan Formulir KTP (Langkah 2)**:
  - Diubah dari `"SIMPAN & VERIFIKASI INSTAN"` menjadi **`"SIMPAN & AJUKAN VERIFIKASI"`**.
- **Konfirmasi Dialog / Alert Sukses**:
  - Diubah dari *"🎉 Selamat! Identitas Anda berhasil diverifikasi secara instan oleh sistem..."* menjadi:
    > *"🎉 Verifikasi Identitas Berhasil! Dokumen dan nomor kontak Anda telah sesuai dengan protokol verifikasi RuangSinggah. Akun mitra Anda kini aktif dan siap untuk mempublikasikan unit kost."*
- **Catatan Status di Database (`verification_notes`)**:
  - Diubah dari `'Terverifikasi Otomatis (Validasi AI KTP & WhatsApp OTP)'` menjadi **`'Identitas Terverifikasi'`**.
- **Tombol & Teks Banner Status Peninjauan (Pending)**:
  - Tombol aksi diubah dari `"Periksa / Verifikasi Instan"` menjadi **`"Periksa Kelengkapan Data"`**.
  - Deskripsi disempurnakan menjadi: *"Data identitas KTP Anda sedang dalam proses peninjauan sistem. Silakan periksa kembali kelengkapan dokumen apabila ada data yang perlu disesuaikan."*

### B. Penyelarasan Banner Overview pada `MitraDashboard.tsx`
- **Tombol Aksi Banner**:
  - Diubah dari `"Periksa / Verifikasi Instan"` menjadi **`"Periksa Kelengkapan Data"`**.
- **Deskripsi Status**:
  - Dibersihkan dari kata "kilat otomatis" menjadi deskripsi resmi yang profesional dan edukatif bagi mitra.

---

## 2. Hasil Verifikasi Kompilasi (Build Test)

Uji kompilasi frontend Vite dijalankan dengan `cmd.exe /c npm run build`:
```bash
cmd.exe /c npm run build
```

**Output Log**:
```
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.92 kB │ gzip:   2.29 kB
../../public/assets/index-b4n6kHuq.css                 299.59 kB │ gzip:  35.95 kB
../../public/assets/MitraDashboard-8erkrq31.js         428.03 kB │ gzip:  93.38 kB
✓ built in 29.15s
```
*Hasil*: **0 Error Kompilasi, Lulus 100%**.

---

## 3. Hasil Pemindaian Teks (Scan Diksi "Instan" / "Kilat")

Pemindaian teks menggunakan `grep_search` pada berkas `MitraProfile.tsx` dan `MitraDashboard.tsx`:
- Kata kunci `"instan"` pada konteks verifikasi identitas: **0 temuan (bersih total)**.
- Kata kunci `"kilat"` pada konteks verifikasi identitas: **0 temuan (bersih total)**.

---

## 4. Panduan Pengujian bagi Pengguna (User Testing)

1. Buka dashboard mitra (`/dashboard-mitra`).
2. Jika akun belum terverifikasi atau berada dalam status review, perhatikan banner status di overview maupun menu Profil:
   - Tombol kini berlabel profesional: **"Periksa Kelengkapan Data"**.
   - Tidak ada lagi kata "instan" atau "kilat".
3. Masuk ke formulir verifikasi KTP (Langkah 2):
   - Tombol simpan kini bertuliskan **"SIMPAN & AJUKAN VERIFIKASI"**.
4. Klik tombol simpan setelah mengisi data dan OTP:
   - Muncul dialog resmi: *"🎉 Verifikasi Identitas Berhasil! Dokumen dan nomor kontak Anda telah sesuai dengan protokol verifikasi RuangSinggah. Akun mitra Anda kini aktif dan siap untuk mempublikasikan unit kost."*
   - Akun langsung aktif dengan status **Terverifikasi ✓**.
