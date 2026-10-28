# IMPLEMENTATION PLAN: Standarisasi Menu Kost Saya & Tampilan Pengajuan Sewa Proptech Grade

Dokumen revisi ini memuat rencana kerja perbaikan dan standarisasi tampilan menu **Kost Saya** (khususnya tab **DIAJUKAN**), integrasi rating riil vs properti baru tanpa ulasan, pembatasan badge verifikasi khusus Mitra KostManager, serta penataan hierarki aksi sesuai standar industri proptech (**Mamikos, Rukita, Cove, Airbnb**).

---

## 1. Analisis Masalah & Kebutuhan

### A. Masalah & Koreksi Terbaru dari Pengguna:
1. **Rating Hardcode / Dummy 5 Bintang**:
   - Di tampilan saat ini, kartu kost merender 5 bintang penuh berwarna emas secara statis (`[1, 2, 3, 4, 5].map(...)`), padahal kost tersebut baru saja diunggah dan **belum memiliki ulasan sama sekali**.
   - Ini melanggar kejujuran sistem dan standar proptech. Jika belum ada ulasan, sistem harus menampilkan status riil: `Belum ada ulasan` (atau komponen `StarRatingDisplay` riil).
2. **Badge "Terverifikasi RuangSinggah" Muncul pada Mitra Biasa**:
   - Badge `Terverifikasi RuangSinggah` saat ini muncul secara permanen di seluruh properti, padahal badge kepercayaan ini **hanya eksklusif untuk Mitra KostManager** (yang propertinya dikelola dan diaudit oleh tim RuangSinggah).
   - Untuk properti Mitra Biasa/Reguler, badge ini tidak boleh dimunculkan (atau ditampilkan sebagai badge netral `Mitra Komunitas / Reguler`).
3. **Komponen Time Simulator Dipertahankan**:
   - Berdasarkan konfirmasi pengguna, `TimeSimulator` **tidak perlu disentuh** karena sangat berguna untuk kebutuhan pengujian dan simulasi perpanjangan sewa.

### B. Masalah Terdahulu yang Disepakati:
1. **Informasi Pengajuan Sewa yang Hilang (*Blind Booking Info*)**:
   - Pada tab **DIAJUKAN**, calon penyewa tidak dapat melihat parameter sewa (Tanggal Mulai Masuk, Durasi/Paket Sewa, Jumlah Penghuni, Estimasi Total Tagihan yang belum dibayar) karena blok ringkasan terkunci pada `isPaid &&`.
2. **Hierarki Tombol Aksi Terbalik**:
   - Tombol utama berwarna hitam paling mencolok saat ini adalah `RUTE KE KOST`, padahal pengajuan belum di-ACC dan belum ada pembayaran.
   - Tombol utama yang seharusnya aktif adalah **`Hubungi Pemilik`** dan **`Lihat Detail Kost`**.
3. **Ketiadaan Edukasi Waktu Respon Pemilik (SLA 1x24 Jam)**:
   - Calon penyewa butuh kepastian waktu tunggu agar tidak cemas (*user anxiety*).
4. **Subtitle Statis**:
   - Subtitle header saat ini kaku: *"⚡ Kelola hunian aktif Anda dengan mudah"* meski di tab pengajuan/riwayat.

---

## 2. Dampak Perubahan (File yang Disentuh)

1. [MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx):
   - Meneruskan data `rating` dan `reviewsCount` riil dari `properties` ke objek `kostsData` / `processedActive`.
   - Mengganti bintang dummy 5 menjadi **Rating Riil**:
     - Jika `rating > 0`: Tampilkan bintang sesuai nilai riil dan jumlah ulasan.
     - Jika belum ada rating: Tampilkan teks halus `⭐ Belum ada ulasan`.
   - Menjadikan badge **`Terverifikasi RuangSinggah`** kondisional hanya jika `kost.isManagedKost === true`.
   - Mengubah subtitle header menjadi dinamis sesuai tab aktif (`DIAJUKAN`, `AKTIF`, `RIWAYAT`).
   - Membuka blok **Ringkasan Pengajuan Sewa** untuk status `PENDING_APPROVAL` (Tanggal Check-in, Durasi Sewa, Penghuni, dan Estimasi Biaya Belum Bayar).
   - Menambahkan **Banner Edukasi SLA Respon Pemilik (1x24 Jam)**.
   - Menata ulang hierarki tombol aksi: `Hubungi Pemilik` sebagai Primary Action saat pending.
2. [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
   - Pencatatan riwayat progres fitur baru (#469).
3. [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md):
   - Dokumentasi hasil perubahan dan panduan verifikasi.

---

## 3. Langkah-Langkah Eksekusi (Bertahap)

### Langkah 1: Normalisasi Data Rating & Review Riil
- Pada pembacaan data `kostsData` dan `processedActive` di `MyKost.tsx`, sertakan:
  - `rating: Number(prop?.rating || 0)`
  - `reviewsCount: Array.isArray(prop?.reviews) ? prop.reviews.length : Number(prop?.metadata?.reviewsCount || 0)`

### Langkah 2: Evaluasi Visual Rating & Pembatasan Badge Verifikasi
- Mengganti blok hardcode line 2508-2517:
  - **Rating**:
    - Jika `kost.rating > 0`: Render bintang riil + angka rating (misal: `⭐ 4.8 (12)`).
    - Jika `kost.rating == 0` atau belum ada: Render `⭐ Belum ada ulasan` (warna abu-abu netral).
  - **Badge Verifikasi**:
    - Jika `kost.isManagedKost`: Render badge hijau `🛡️ Terverifikasi RuangSinggah`.
    - Jika Mitra Biasa (`!kost.isManagedKost`): Tampilkan badge netral `Mitra Komunitas` atau sembunyikan badge verifikasi RuangSinggah.

### Langkah 3: Subtitle Dinamis Header Sesuai Tab
- **Tab DIAJUKAN**: *"Pantau status persetujuan pengajuan sewa Anda"*
- **Tab AKTIF**: *"Kelola hunian berjalan & perpanjangan sewa Anda"*
- **Tab RIWAYAT**: *"Daftar riwayat sewa dan transaksi terdahulu"*

### Langkah 4: Ringkasan Pengajuan Sewa (*Booking Parameter Summary*)
- Membuka grid informasi sewa pada status `PENDING_APPROVAL` & `AWAITING_PAYMENT`:
  - 📅 **Mulai Masuk**: Tanggal rencana check-in.
  - ⏱️ **Durasi Sewa**: Paket sewa (misal: *1 Bulan*).
  - 👥 **Penghuni**: Jumlah penghuni yang diajukan.
  - 💰 **Estimasi Biaya**: Total tagihan yang diajukan dengan status `(Menunggu ACC - Belum Bayar)`.

### Langkah 5: Banner Edukasi Respon Pemilik (SLA 1x24 Jam)
- Menambahkan banner penenang ramah di atas ringkasan pengajuan:
  > 💡 *"Pemilik kost biasanya merespons dalam 1x24 jam. Saldo Anda aman dan belum ada pembayaran yang ditagihkan sebelum pemilik menyetujui kamar."*

### Langkah 6: Restrukturisasi Hierarki Tombol Aksi Kontekstual
- **Untuk Status `PENDING_APPROVAL`**:
  1. **Primary Button**: `[ 💬 Hubungi Pemilik ]` (Tombol hijau emerald modern, membuka jendela chat).
  2. **Secondary Button**: `[ 📄 Lihat Detail Kost ]` (Membuka detail listing kost).
  3. **Tertiary Button (Subtle)**: `[ ❌ Batalkan Pengajuan ]` (Tombol teks outline netral di bagian bawah).
  4. *Tombol `Rute ke Kost`* hanya menjadi tombol utama jika sewa sudah lunas / hari check-in tiba.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi Kode**:
   - `npm --prefix functions/public run build` (Memastikan frontend Vite lulus 100% tanpa error).
   - `npm --prefix functions run build` (Memastikan TypeScript backend lulus 100% tanpa error).
2. **Uji Antarmuka Pengguna (UI/UX)**:
   - Memeriksa tampilan kartu pengajuan pada tab **DIAJUKAN**:
     - Kost baru tampil dengan label `Belum ada ulasan` (bukan 5 bintang dummy).
     - Kost Mitra Biasa tidak lagi menampilkan badge `Terverifikasi RuangSinggah` (hanya muncul di properti KostManager).
     - Ringkasan tanggal mulai masuk, durasi, dan estimasi biaya tampil jelas dan rapi.
     - Banner edukasi respon 1x24 jam tampil elegan.
     - Tombol `Hubungi Pemilik` menjadi tombol utama yang aktif.
     - `TimeSimulator` tetap utuh dan berfungsi normal.

---

> [!NOTE]
> Sesuai aturan baku **Siklus Kerja 2-Fase**, AI Agent akan berhenti dan menunggu persetujuan (*ACC*) dari pengguna sebelum melakukan modifikasi kode.
