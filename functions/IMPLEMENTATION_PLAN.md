# IMPLEMENTATION PLAN: Optimasi UX Pesanan (MyKost) Sesuai Standar Industri Global (Airbnb / Booking.com / Traveloka)

Dokumen ini disusun berdasarkan **Pasal 8 Protokol Workspace (Evaluasi Objektif Standar Industri Anti-Bias Konfirmasi)** untuk merombak arsitektur navigasi, akurasi visual, dan micro-interaction pada modul **Kost Saya** (`MyKost.tsx`).

---

## 1. Analisis Masalah & Kebutuhan Pengguna

Pengguna memberikan 3 masukan konkrit dari hasil pengujian nyata:
1. **Navigasi Default Masih Tertahan di "Diajukan"**:
   - Saat pengguna membuka menu *Orders*, sistem selalu mendaratkan pengguna ke tab `diajukan` meskipun pengguna memiliki sewa aktif yang sedang berjalan dan tidak memiliki pengajuan baru yang tertunda.
   - Pengguna disuguhi halaman kosong (*"Belum Ada Pengajuan"*) padahal tab `aktif` memiliki badge `1`.
2. **Foto Preview Menampilkan Fasad Luar / Gerbang, Bukan Unit Kamar**:
   - Pada kartu sewa aktif (Kost Ryuta tipe Standard), foto yang tampil adalah foto gerbang/pagar depan kost (*"Bangunan Depan"*), bukan foto interior kamar yang disewa.
   - Pada data `properties`, foto kamar Standard tersimpan di `image_urls` dengan label `"Kamar: Standard"`. Karena array `currentRoom.images` kosong, algoritma lama langsung jatuh ke fallback pencarian kata kunci *"bangunan depan"*.
3. **Modal Pembesaran Foto Dinilai Kurang Berguna (*Modal Trap*)**:
   - Mengklik thumbnail memicu modal dialog besar yang hanya menampilkan ulang foto yang sama (1 foto), menginterupsi alur pengguna tanpa nilai tambah fungsional.

---

## 2. Komparasi & Evaluasi Objektif Standar Industri (Anti-Bias Konfirmasi)

Mengacu pada arsitektur platform proptech & hospitality terkemuka di dunia (**Airbnb Trips**, **Booking.com Manage Booking**, **Traveloka Pesanan**, **Mamikos Kos Saya**):

| Dimensi Evaluasi | Implementasi Saat Ini | Standar Industri Terkemuka (Airbnb / Booking.com / Traveloka) | Status Klasifikasi | Alasan Teknis & Rekomendasi Solusi |
| :--- | :--- | :--- | :--- | :--- |
| **Routing & Default Tab Hierarchy** | Hardcoded static routing: default selalu ke tab `diajukan` tanpa memperhitungkan status kepemilikan sewa pengguna. | **Context-Aware Intent Routing**: Platform mendeteksi reservasi yang membutuhkan perhatian tertinggi pengguna. Pengguna dengan reservasi aktif/berjalan secara otomatis diprioritaskan mendarat di **Active Stay**, karena kebutuhan operasional harian penghuni adalah mengelola kamar aktifnya (WiFi, kunci, tagihan, komplain). | ⚠️ *Below Industry Standard* | Terapkan resolusi tab berbasis prioritas status: jika `activeCount > 0` dan tidak ada instruksi rute spesifik, otomatis arahkan ke `/my-bookings/aktif` dengan `replace: true`. |
| **Unit Photo Binding & Taxonomy Resolution** | Fallback primitif: jika `currentRoom.images` kosong, langsung mencari foto bertuliskan "bangunan depan" / fasad luar. | **Hierarchical Unit Asset Matching**: Penyewa harus melihat foto unit kamar yang mereka tempati untuk mencegah disonansi kognitif (*"Apakah saya menyewa gerbang atau kamar?"*). Sistem memindai metadata foto dengan hirarki: (1) Foto unit fisik spesifik, (2) Foto tipe kamar berlabel `Kamar: [Tipe]`, (3) Foto interior kamar tidur pertama, baru (4) Eksterior properti. | ⚠️ *Below Industry Standard* | Bangun fungsi resolver multi-tier `resolveRoomCoverPhoto` yang memindai `image_urls` dan `categorized_photos` dengan prioritas kamar tidur utama. |
| **Card Micro-Interactions & Ergonomics** | Membuka modal galeri besar saat thumbnail di-tap, memicu *Modal Trap* yang menutupi aksi operasional sewa. | **Task-Focused Active Dashboard**: Pada dashboard sewa aktif, kartu hunian adalah panel kendali operasional (bukan katalog belanja). Thumbnail foto berfungsi sebagai *visual anchor* statis. Interaksi klik difokuskan pada aksi cepat: Serah Terima Kunci, Chat Pemilik, Bayar Tagihan, dan Ajukan Kendala. | 🌟 *Industry Standard* (setelah disederhanakan) | Eliminasi event `onClick` modal pembesaran foto pada kartu pesanan, optimalkan thumbnail sebagai preview berkualitas tinggi yang bersih dan terintegrasi. |

---

## 3. Desain Teknis & Spesifikasi Solusi

### A. Context-Aware Tab Routing Engine (`MyKost.tsx`)
1. **Prioritas Alur Mendarat (Landing Precedence)**:
   - **Tingkat 1 (Prioritas Tertinggi)**: Jika URL secara eksplisit menyebutkan sub-path valid (`/my-bookings/aktif`, `/my-bookings/diajukan`, `/my-bookings/riwayat`), hormati pilihan pengguna.
   - **Tingkat 2 (Konteks Sewa Berjalan)**: Jika pengguna masuk ke root `/my-bookings` (misal dari Bottom Navigation Bar) dan memiliki **Sewa Aktif** (`residentStatus.length > 0`), arahkan langsung ke tab **`aktif`** (`/my-bookings/aktif`).
   - **Tingkat 3 (Pengajuan Menunggu)**: Jika tidak memiliki sewa aktif tetapi memiliki pengajuan menunggu persetujuan / tunggu bayar (`pendingCount > 0`), arahkan ke tab **`diajukan`** (`/my-bookings/diajukan`).
   - **Tingkat 4 (Fallback Riwayat / Default)**: Jika tidak ada sewa aktif maupun pengajuan, default ke **`diajukan`** atau **`riwayat`** secara cerdas.
2. **Pencegahan FOUT & Double-Mounting**:
   - Gunakan `replace: true` saat sinkronisasi URL agar history back button browser pengguna tidak terjebak dalam loop redirect.

### B. Algoritma Multi-Tier Room Asset Matching (`resolveRoomCoverPhoto`)
Membangun hirarki pencarian foto yang deterministik:
$$\text{Matched Photo} = \text{Tier 1} \to \text{Tier 2} \to \text{Tier 3} \to \text{Tier 4} \to \text{Tier 5}$$
- **Tier 1 (KostManager Specific Room Unit)**:
  - Jika sewa memiliki nomor kamar fisik (misal: `"Unit 101"`, `"Kamar 2"`):
  - Cari foto di `currentRoom.images` atau `image_urls` yang label/kategorinya cocok dengan `unit [nomor]` atau `kamar [nomor]`.
- **Tier 2 (Kost Biasa Category Matching)**:
  - Cari foto di `prop.image_urls` yang label/kategorinya mengandung `Kamar: [roomType]` (misal: `"Kamar: Standard"`).
  - Beri bobot tertinggi pada foto kamar tidur (mengandung `"kamar"` dan BUKAN `"mandi"` / `"dapur"`).
- **Tier 3 (Room Type Array Inspection)**:
  - Periksa `currentRoom.images` atau `currentRoom.categorized_photos.kamar`.
- **Tier 4 (Any Bedroom in Property)**:
  - Cari foto apa saja di properti yang berkategori `"Kamar"` atau `"Kamar Tidur"`.
- **Tier 5 (Fallback Cover)**:
  - Gunakan `prop.image_urls[0]`.

### C. Eliminasi Modal Trap Thumbnail
- Hilangkan atribut `onClick={() => handleOpenGallery(...)}` pada thumbnail kartu di `MyKost.tsx`.
- Hilangkan efek hover scale berlebih dan cursor pointer yang menyesatkan.
- Pertahankan badge jumlah foto sebagai info pelengkap statis atau integrasikan ke tombol detail jika diperlukan.

---

## 4. Dampak Perubahan (Affected Files)

1. `functions/public/pages/MyKost.tsx`:
   - Implementasi Context-Aware Tab Router pada `useEffect` inisialisasi tab dan penyelesaian loading data.
   - Implementasi fungsi `resolveRoomCoverPhoto` untuk memetakan foto kamar Standard / Premium secara akurat.
   - Pembersihan event handler klik thumbnail pada kartu pesanan.

---

## 5. Langkah-Langkah Eksekusi (Fase 2)

1. **Langkah 1**: Perbarui `MyKost.tsx` dengan helper resolusi foto kamar spesifik (`resolveRoomCoverPhoto`) pada pemetaan `residentStatus` dan `activeKosts`.
2. **Langkah 2**: Perbarui logika pemilihan tab otomatis: ketika data selesai dimuat dari Supabase, jika rute adalah `/my-bookings` atau default dan pengguna memiliki sewa aktif (`residentStatus.length > 0`), otomatis aktifkan tab `aktif`.
3. **Langkah 3**: Hapus interaksi klik modal pembesaran thumbnail foto di kartu sewa.
4. **Langkah 4**: Uji kelulusan build kompilasi TypeScript & Vite (`npm.cmd --prefix functions/public run build`).
5. **Langkah 5**: Perbarui `functions/PROGRESS.md` (Milestone #490) dan `WALKTHROUGH.md`.
6. **Langkah 6**: Commit dan push ke branch `bukan-productions`.

---

## 6. Rencana Verifikasi

1. **Uji Kompilasi**: Build `functions/public` sukses dengan 0 error.
2. **Uji Alur Navigasi Tab**:
   - Buka `/my-bookings` pada akun penyewa aktif -> Halaman langsung mendarat di tab **AKTIF** (`/my-bookings/aktif`) tanpa perlu klik tab.
3. **Uji Foto Kamar**:
   - Kartu Kost Ryuta tipe Standard menampilkan foto interior kamar tidur Standard (kasur, lemari, meja), **bukan** gerbang pagar depan.
4. **Uji Interaksi Foto**:
   - Mengklik foto thumbnail tidak memunculkan modal dialog pembesaran gambar.

---

> [!IMPORTANT]
> **Menunggu Persetujuan Pengguna (Approval Required)**:
> Sesuai Protokol Kerja Workspace Pasal 1 (Siklus Kerja 2-Fase), modifikasi kode **TIDAK AKAN DILAKUKAN** sebelum dokumen rencana ini ditinjau dan disetujui (*ACC / Proceed*) oleh User. Silakan tekan tombol persetujuan atau beri masukan revisi.
