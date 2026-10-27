# IMPLEMENTATION PLAN: Penyesuaian Teks Loading Foto ("Sedang diproses...") dan Edukasi Keamanan Sensor Spanduk

## 1. Analisis Masalah & Kebutuhan

### A. Konteks & Permintaan Pengguna
1. **Teks Indikator Loading**: Saat foto baru diunggah, teks loading di kartu foto sebelumnya menampilkan *"Memindai Spanduk..."*. Pengguna meminta agar teks tersebut diganti menjadi lebih netral dan umum, yaitu: **`"Sedang diproses..."`**.
2. **Penjelasan Alasan Keamanan saat Sensor Terjadi**: Jika pada foto yang diunggah terdeteksi adanya spanduk/banner nomor kontak dan sensor bekerja menyamarkannya, pengguna ingin disematkan keterangan penjelasan yang jelas dan mendidik kepada pemilik kost bahwa penyamaran tersebut dilakukan **demi alasan keamanan transaksi dan perlindungan data privasi**.

### B. Manfaat bagi Pengguna / Mitra Kost
- Tampilan loading menjadi lebih universal dan tidak menimbulkan kebingungan saat mengunggah foto selain spanduk.
- Mitra kost memahami secara transparan bahwa stempel sensor `ruangsinggah.id` bukan merusak foto mereka, melainkan bentuk perlindungan proaktif platform dari potensi penipuan di luar sistem, transaksi liar (*bypass* tanpa jaminan), dan penyalahgunaan nomor pribadi oleh pihak ketiga.

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
1. **`functions/public/components/KostFormMitra.tsx`**:
   - Memperbarui teks overlay loading kartu foto dari `{isBannerProneCategory(cat.id) ? 'Memindai Spanduk...' : 'Memproses Foto...'}` menjadi **`"Sedang diproses..."`** pada kedua lokasi render (Fasilitas Umum & Kamar Tidur).
   - Memperkaya teks notifikasi `bannerNotice` dengan narasi keamanan komprehensif.
   - Menambahkan tombol interaktif/badge informasi keamanan (ikon `Info` dari `lucide-react`) pada kartu foto yang tersensor (`isBlurred === true`), sehingga mitra dapat mengklik untuk melihat modal/popover penjelasan alasan keamanan.
2. **`functions/PROGRESS.md`**:
   - Mencatat pekerjaan pada entri #449.
3. **`WALKTHROUGH.md`**:
   - Dokumentasi perubahan dan panduan uji verifikasi UI.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 setelah di-ACC)

1. **Langkah 1: Perubahan Teks Loading Overlay Kartu Foto**
   - Di `KostFormMitra.tsx` pada baris ~5990 (Location 1: Fasilitas Umum) dan ~6191 (Location 2: Kamar Tidur):
     ```tsx
     <p className="text-[10px] font-bold text-white tracking-wide leading-tight">
         Sedang diproses...
     </p>
     ```

2. **Langkah 2: Penyempurnaan Banner Edukasi Keamanan (`bannerNotice`)**
   - Memperbarui teks `bannerNotice` saat spanduk terdeteksi:
     ```tsx
     setBannerNotice(
         'Sistem mendeteksi adanya spanduk atau informasi kontak langsung pada foto yang diunggah. ' +
         'Demi alasan keamanan transaksi, pencegahan penipuan di luar platform, serta perlindungan data privasi pemilik kost, ' +
         'bagian kontak tersebut telah disamarkan secara otomatis dengan watermark resmi ruangsinggah.id.'
     );
     ```

3. **Langkah 3: Komponen Edukasi Keamanan Interaktif pada Kartu Foto Tersensor**
   - Menambahkan state modal info keamanan (misal `securityExplanationOpen: boolean`).
   - Pada kartu foto yang `item.isBlurred === true`, menambahkan tombol kecil info keamanan (`Info` icon dari `lucide-react`) di samping badge `ruangsinggah.id`.
   - Ketika diklik, membuka pop-up modal penjelasan yang menjelaskan:
     - 🛡️ **Pencegahan Penipuan**: Menghindarkan pemilik & pencari kost dari transaksi liar di luar sistem resmi.
     - 🔒 **Perlindungan Privasi**: Mencegah nomor pribadi disalahgunakan oleh pihak ketiga/scammer.
     - 🤝 **Jaminan Transaksi**: Memastikan seluruh proses sewa terlindungi oleh sistem garansi resmi RuangSinggah.id.

4. **Langkah 4: Kompilasi & Build Test**
   - Menjalankan `cmd.exe /c "npm --prefix functions/public run build"` untuk memastikan 0 error kompilasi TypeScript/Vite.

5. **Langkah 5: Pencatatan Progres, Walkthrough, dan Push ke GitHub**
   - Menulis entri #449 di `functions/PROGRESS.md`.
   - Menulis dokumen `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Tampilan Loading**:
  - Saat memilih foto baru, pastikan teks yang tampil di tengah kartu foto adalah `"Sedang diproses..."` dengan sub-teks `"Mohon tunggu sebentar"`.
- **Verifikasi Penjelasan Keamanan**:
  - Saat foto memuat spanduk disensor, pastikan banner di bagian atas foto menyajikan penjelasan alasan keamanan yang komprehensif.
  - Klik ikon info pada foto yang tersensor untuk memastikan dialog/modal edukasi keamanan muncul dengan rapi, ramah seluler, dan informatif.
- **Verifikasi Kelulusan Build**:
  - Memastikan proses `npm run build` selesai dengan exit code 0 tanpa peringatan tipe.
