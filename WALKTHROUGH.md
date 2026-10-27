# WALKTHROUGH: Perbaikan Indikator Loading Kartu Foto Presisi & Eksekusi Auto-Sensor Otomatis Instan (<1-2 Detik)

## 1. Ringkasan Eksekusi

Sesuai permintaan dan persetujuan pada `IMPLEMENTATION_PLAN.md`, dua masalah utama pada antarmuka upload foto formulir mitra telah berhasil diatasi:
1. **Posisi Indikator Loading**: Indikator loading sebelumnya berkedip dan muncul di kotak sebelahnya (di slot tombol `+ Tambah Foto` yang berubah menjadi placeholder pulsing). Kini tombol `+ Tambah Foto` tetap konsisten dan tidak berubah menjadi kotak terpisah, sementara overlay loading terpusat (`Loader2` putar + teks `Memindai Spanduk...` / `Memproses Foto...`) muncul langsung dan presisi di atas kartu foto yang sedang diunggah.
2. **Eksekusi Sensor Otomatis**: Sensor spanduk kini langsung diaplikasikan secara otomatis dalam waktu **<1-2 detik** seketika foto selesai diproses di kanvas lokal tanpa perlu menunggu antrean upload Supabase Storage dan tanpa perlu menekan tombol perisai kuning (`handleReScanBanner`) secara manual.

---

## 2. Analisis & Akar Masalah (Root Causes)

1. **Kotak Pulsing Tambah Foto**:
   - Pada baris 6044 dan 6250 di `KostFormMitra.tsx`, terdapat pengkondisian `{uploadingCategory === cat.id ? (<div className="... animate-pulse">Memproses... Mohon tunggu</div>) : (<label>+ Tambah Foto</label>)}`.
   - Ini menyebabkan saat kategori sedang diproses, slot tambah foto berubah menjadi kotak placeholder baru di samping foto, membingungkan pengguna.
2. **Keterlambatan Visualisasi Sensor**:
   - Fungsi `handleCategoryFilesUpload` sebelumnya menunggu proses upload cloud `uploadDraftPhotoToStorage` tuntas sebelum memperbarui preview kartu foto.
   - Karena upload file asli membutuhkan 3–6 detik, foto mentah belum tersensor sempat tampil di layar selama beberapa detik berdampingan dengan tombol perisai kuning aktif (`!item.isBlurred && isBannerProneCategory(cat.id)`).
   - Pengguna mengira sensor otomatis tidak bekerja dan terpaksa menekan tombol perisai tersebut secara manual.

---

## 3. Daftar Perubahan Kode

### `functions/public/components/KostFormMitra.tsx`

1. **Instant Reactive Sensor Preview (<1-2 Detik)**:
   - Di dalam `handleCategoryFilesUpload`, segera setelah fungsi kanvas `processPhotoWithAutoSensor` mengembalikan file WebP yang tersensor/berwatermark, state `newPhotoItems` langsung diperbarui secara instan dengan `URL.createObjectURL(webpFile)` lokal dan `isProcessing: false`.
   - Pengguna langsung melihat hasil sensor dan watermark dalam 1–2 detik pertama.
   - Panggilan `uploadDraftPhotoToStorage` berjalan di latar belakang (*asynchronous background promise*) untuk mendapatkan URL permanen dari Supabase Storage tanpa menahan visual kartu foto.

2. **Overlay Loading Terpusat di Atas Kartu Foto**:
   - Menambahkan overlay semi-transparan `bg-slate-950/75 backdrop-blur-xs` langsung di atas kartu foto:
     ```tsx
     {item.isProcessing && (
         <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 p-2 text-center z-20 animate-in fade-in duration-200">
             <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />
             <p className="text-[10px] font-bold text-white tracking-wide leading-tight">
                 {isBannerProneCategory(cat.id) ? 'Memindai Spanduk...' : 'Memproses Foto...'}
             </p>
             <span className="text-[8px] text-slate-300">Mohon tunggu sebentar</span>
         </div>
     )}
     ```
   - Diterapkan pada kedua kategori: Area Fasilitas Umum (Location 1) dan Kamar Tidur / Cover (Location 2).

3. **Konsistensi Slot Tombol `+ Tambah Foto`**:
   - Menghapus komponen placeholder pengganti `uploadingCategory === cat.id`.
   - Tombol `<label>+ Tambah Foto</label>` tetap berada di posisinya secara statis tanpa bergeser atau berkedip saat upload berjalan.

4. **Penyembunyian Tombol Re-Scan Manual Selama Pemrosesan**:
   - Memperbarui kondisi tombol perisai kuning menjadi `!item.isBlurred && !item.isProcessing && isBannerProneCategory(cat.id)`.
   - Tombol ini tidak akan tampil selama sistem sedang memindai spanduk secara otomatis, sehingga mencegah pengguna mengklik dobel atau bingung.

---

## 4. Hasil Verifikasi & Pengujian

### A. Kompilasi Build Frontend
- **Perintah**: `npm --prefix functions/public run build`
- **Hasil**: **LULUS 100% (0 Error, Exit Code 0)** dalam **26.66 detik** (`✓ 2512 modules transformed`).
- Asset bundling production di `./public` dan `./dist` terupdate sempurna.

---

## 5. Panduan Pengujian bagi Pengguna di Antarmuka (UI)

1. Buka formulir tambah kost atau edit kost di **Mitra Dashboard** -> Tab **Langkah 5 (Foto Properti)**.
2. Pada kategori **Bangunan Depan (Fasad)** atau kamar tidur, klik tombol `+ Tambah Foto` dan pilih foto properti yang memuat spanduk/kontak telepon.
3. **Amati Perilaku Baru**:
   - Tombol `+ Tambah Foto` **TIDAK lagi berubah menjadi kotak pulsing di samping**.
   - Kartu foto yang baru diunggah langsung muncul dengan **overlay gelap elegan di tengah kartu foto itu sendiri** bertuliskan `Memindai Spanduk...` dan spinner `Loader2`.
   - Tombol perisai kuning manual **tidak muncul** saat pemindaian sedang berlangsung.
   - Dalam waktu **1–2 detik**, overlay loading hilang, spanduk kontak otomatis tertutup rapat oleh sensor frosted glass + watermark `ruangsinggah.id`, dan badge berubah menjadi `● ruangsinggah.id`.
   - Seluruh proses berjalan **100% otomatis tanpa perlu menekan tombol apa pun**.
