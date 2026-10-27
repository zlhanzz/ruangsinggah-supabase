# Rencana Implementasi: Pemindahan Indikator Loading ke Kartu Foto & Otomasi 100% Sensor Spanduk Tanpa Klik Manual

## 1. Analisis Masalah

Berdasarkan pengujian pengguna dan tangkapan layar antarmuka:

### A. Mengapa Loading Terjadi di Kotak Sampingnya (Bukan Pada Foto yang Diupload)?
1. **Penggantian Slot "+ Tambah Foto" oleh State `uploadingCategory`**:
   - Di `KostFormMitra.tsx` (baris 6039 dan 6254), slot tombol `+ Tambah Foto` dibungkus kondisi ternary:
     `uploadingCategory === cat.id ? (<div ...>Memproses... Mohon tunggu</div>) : (<label ...>+ Tambah Foto</label>)`.
   - Karena slot `+ Tambah Foto` terletak tepat di sebelah kanan foto yang baru masuk, slot tersebut berubah menjadi kotak oranye putus-putus bertuliskan *"Memproses... Mohon tunggu"*.
   - Akibatnya, pengguna melihat animasi loading ganda yang membingungkan: indikator loading justru muncul di slot samping tempat tombol tambah foto, bukan terpusat pada kartu foto itu sendiri.

### B. Mengapa Sensor Spanduk Tidak Langsung Tampil Otomatis dan Terkesan Harus Di-klik Manual?
1. **Menunggu Upload Cloud Storage Sebelum Memperbarui Tampilan Gambar**:
   - Pada `handleCategoryFilesUpload`, urutan eksekusi sebelumnya adalah:
     1. `processPhotoWithAutoSensor` berjalan di kanvas lokal (1–2 detik) dan menghasilkan WebP tersensor.
     2. Sistem kemudian menunggu `uploadDraftPhotoToStorage` (mengirim WebP ke cloud storage Supabase via jaringan internet, butuh beberapa detik).
     3. **Hanya setelah upload cloud selesai**, fungsi `setNewPhotoItems` dipanggil untuk mengganti `preview` ke gambar yang telah disensor.
   - Akibatnya, selama upload cloud berlangsung, kartu foto di layar **masih menampilkan ObjectURL foto mentah asli yang belum disensor**.
2. **Tombol Perisai Manual Muncul Terlalu Dini**:
   - Di pojok kanan atas kartu, tombol perisai pemindaian manual (`handleReScanBanner`) langsung tampil karena kondisi `!item.isBlurred` bernilai `true` selama proses upload berlangsung.
   - Pengguna melihat foto belum tertutup sensor dan melihat tombol perisai aktif, sehingga pengguna berasumsi proses otomatis tidak berjalan dan mengklik tombol tersebut secara manual.
   - Ketika tombol perisai diklik, pemindaian ulang dipaksa berjalan dan sensor pun muncul, sehingga timbul kesan bahwa sensor hanya bekerja lewat klik manual.

---

## 2. Rencana Solusi & Perubahan

```
+-----------------------------------------------------------------------------------------+
| ALUR BARU: AUTO-SENSOR INSTAN & LOADING TERPUSAT DI KARTU FOTO                          |
|                                                                                         |
| 1. Pengguna Memilih Foto                                                                |
|    |                                                                                    |
|    +--> Slot "+ Tambah Foto" TETAP UTUH & BERSIH (Tidak berubah jadi kotak loading)     |
|    |                                                                                    |
|    +--> Kartu Foto Muncul Seketika (<50ms) dengan Overlay Loading di Atas Foto:         |
|         [ Dark Glass Overlay + Spinner + "Memindai Spanduk..." ]                        |
|         (Tombol perisai manual DISEMBUNYIKAN selama proses berlangsung)                 |
|                                                                                         |
| 2. `processPhotoWithAutoSensor` Selesai (1-2 Detik)                                     |
|    |                                                                                    |
|    +--> SEKETIKA ITU JUGA UI DIPERBARUI:                                                |
|         - Preview foto langsung berganti ke WebP tersensor                              |
|         - Overlay loading dihilangkan                                                   |
|         - Badge `● ruangsinggah.id` langsung muncul otomatis di atas foto               |
|                                                                                         |
| 3. Upload ke Supabase Storage Berlangsung Hening di Background                          |
|    |                                                                                    |
|    +--> Menyimpan `storagePath` dan URL permanen tanpa kedipan visual di layar          |
+-----------------------------------------------------------------------------------------+
```

### A. Modifikasi `functions/public/components/KostFormMitra.tsx`
1. **Pembaruan State UI Instan pada `handleCategoryFilesUpload`**:
   - Begitu `processPhotoWithAutoSensor(originalFile)` selesai di kanvas lokal, **langsung perbarui item di state**:
     `preview: URL.createObjectURL(webpFile)`, `file: webpFile`, `isBlurred`, `isProcessing: false`.
   - Pengguna langsung melihat hasil sensor dan badge `● ruangsinggah.id` dalam 1–2 detik secara otomatis.
   - Panggilan `uploadDraftPhotoToStorage` dijalankan setelahnya untuk memperbarui `storagePath` dan URL cloud secara hening di latar belakang.
2. **Hapus Kotak Loading Samping di Slot "+ Tambah Foto"**:
   - Hapus pengecekan `uploadingCategory === cat.id` pada baris 6039 dan 6254.
   - Tombol `+ Tambah Foto` tetap tampil sebagai tombol penambahan foto standar yang stabil, tidak lagi berubah menjadi kotak *"Memproses... Mohon tunggu"*.
3. **Penyematan Overlay Loading Terpusat di Kartu Foto**:
   - Jika `item.isProcessing === true`, render overlay semi-transparan elegan (`absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 z-20`) tepat di atas kartu foto yang sedang diproses.
   - Dilengkapi spinner animasi oranye dan teks *"Memindai Spanduk..."*.
4. **Sembunyikan Tombol Re-Scan Selama Pemrosesan Otomatis**:
   - Ubah kondisi render tombol perisai manual menjadi `!item.isBlurred && !item.isProcessing && isBannerProneCategory(...)`.
   - Tombol manual hanya muncul jika proses otomatis telah selesai dan foto terbukti bersih (tidak ada spanduk), sehingga tidak memicu salah paham pengguna.

---

## 3. Dampak Perubahan (Files to Modify)
- `functions/public/components/KostFormMitra.tsx`

---

## 4. Rencana Verifikasi (Testing Plan)
1. **Kompilasi Frontend (Build Test)**:
   - Menjalankan `npm --prefix functions/public run build` untuk memastikan 0 kesalahan kompilasi TypeScript.
2. **Verifikasi Alur UI**:
   - Memastikan tombol `+ Tambah Foto` tidak lagi berubah menjadi kotak loading di samping foto.
   - Memastikan overlay loading muncul terpusat di atas foto yang sedang diproses.
   - Memastikan hasil sensor spanduk dan badge `● ruangsinggah.id` langsung aktif secara otomatis tanpa memerlukan klik manual.
3. **Dokumentasi & Git Commit**:
   - Mencatat hasil pekerjaan ke `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.
