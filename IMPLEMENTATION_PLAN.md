# Rencana Implementasi: Redesain UI/UX Modal Pengajuan Sewa (Standar Industri Proptech, Fit & Friendly, Anti-AI Slope)

Dokumen ini merinci rencana transformasi tampilan formulir pengajuan sewa ([BookingModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/BookingModal.tsx)) agar tampil pas di layar (*fit*), ramah pengguna (*friendly*), berstandar industri proptech terkemuka (Mamikos, Airbnb, Traveloka), dan terbebas dari kesan *AI slope* (desain generik kaku dengan penomoran berlebih dan banner boros ruang).

---

## 1. Analisis Masalah UI/UX Berdasarkan Tangkapan Layar Pengguna

Berdasarkan screenshot dari antarmuka pengguna:
1. **Masalah Kesesuaian Layar (*Layout Fit & Cut-off*)**:
   - **Di Tampilan Mobile**: Modal melayang di tengah dan bagian bawahnya **terpotong/tertutup oleh Bottom Navigation Bar** (`Home`, `Search`, `Chat`, `Orders`, `Profile`). Akibatnya, calon penyewa tidak dapat melihat ringkasan harga dan tombol aksi utama (*CTA Submit*) tersembunyi di balik bilah menu.
   - **Di Tampilan Desktop**: Modal berukuran terlalu panjang (*tall & bulky*), dengan padding raksasa dan jarak antar elemen yang renggang, memicu vertical scrollbar yang canggung.
2. **Kesan "AI Slope" & Kurang Bersahabat (*Friendly*)**:
   - **Penomoran Kaku**: Menggunakan judul numbered list kaku (`1. PILIH PAKET SEWA`, `2. JUMLAH PENGHUNI (MAKS. 2 ORANG)`, `3. PILIH TANGGAL MASUK (CHECK-IN)`) seperti soal ujian, bukan bahasa antarmuka aplikasi konsumen yang elegan.
   - **Komponen Stepper Boros Ruang**: Bilah alur `1 Ajukan Sewa -> 2 Persetujuan Pemilik -> 3 Bayar Resmi` memakan 55px vertikal dengan warna gradien yang kaku (*clunky*).
   - **Badge Generik**: Badge `✨ PENGAJUAN SEWA RESMI` terasa artifisial dan tidak memberikan nilai konteks properti.
   - **Header Tanpa Visual**: Header hanya menampilkan teks nama kost dan tipe standard tanpa foto thumbnail kamar, sehingga terasa dingin dan tidak personal.
   - **Grid Paket Sewa yang Tidak Seimbang**: Pemilihan durasi menghasilkan 3 kolom di baris pertama dan 1 kartu sendirian di baris kedua dengan border tebal dan checkbox besar.

---

## 2. Konsep Desain Standar Industri Proptech (Mamikos & Airbnb Grade)

Untuk menghasilkan UI yang *clean*, *warm*, *fit*, dan *human-crafted*:

### A. Arsitektur Modal Responsif (Desktop Centered & Mobile Bottom Sheet)
- **Z-Index Tinggi (`z-[90]`)**: Memastikan modal dan backdrop berada di atas Bottom Navigation Bar aplikasi.
- **Mobile Bottom Sheet (`inset-x-0 bottom-0 rounded-t-3xl max-h-[90vh]`)**:
  - Di layar HP, modal meluncur dari bawah (*bottom drawer*), mengikuti standar native mobile Airbnb/Traveloka.
  - Dilengkapi *drag handle indicator* tipis di bagian paling atas.
- **Desktop Floating Dialog (`sm:max-w-lg sm:rounded-3xl sm:my-auto`)**:
  - Di layar desktop, modal tetap proporsional dan ringkas di tengah layar tanpa membuang ruang.

### B. Header Properti Personal & Reasuransi Transaksi
- **Header Terintegrasi**:
  - Thumbnail foto kamar/kost asli (`w-12 h-12 rounded-xl object-cover`).
  - Nama kost dalam *Title Case* yang rapi + Tipe Kamar (`badge` netral elegan).
  - Lokasi ringkas kost (misal kota / area).
  - Tombol tutup (X) yang nyaman ditekan (*touch-friendly*).
- **Subtle Reassurance Bar**:
  - Menggantikan stepper 3-tahap yang boros ruang dengan bar info edukatif tipis dan tenang:
    `🛡️ Pengajuan Gratis • Pembayaran baru dilakukan setelah disetujui pemilik`.

### C. Pemilih Paket Durasi Kompak (*Segmented Duration Control*)
- Menata opsi paket sewa (Harian, Mingguan, Bulanan, dst.) menjadi kartu seleksi horizontal atau grid proporsional yang kompak:
  - Nama durasi (`Bulanan`) + Harga ringkas (`Rp 1.000.000`) + unit (`/bln`).
  - Active state menggunakan aksen oranye khas RuangSinggah yang hangat dengan latar belakang *tint* lembut (bukan border tebal yang kasar).

### D. Input Booking Terpadu (Tanggal Masuk + Jumlah Tamu)
- Menyatukan Tanggal Masuk dan Jumlah Penghuni dalam baris/grup berdampingan yang rapi (mirip arsitektur kartu reservasi Airbnb):
  - **Tanggal Masuk**: Dilengkapi label ramah, badge batas dinamis (`Maks. H+5` atau `H+30`) yang halus, dan seleksi tanggal.
  - **Jumlah Penghuni**: Input selektor orang yang pas tanpa ikon panah menempel canggung.

### E. Integrasi Sewa Harian & ETA Kedatangan
- Informasi check-in 14:00 & check-out 12:00 ditampilkan dalam box info netral minimalis.
- Dropdown ETA jam kedatangan disajikan secara ringkas dan bersih.

### F. Sticky Bottom Action Bar (Solusi Anti-Cutoff)
- **Footer Melekat (*Sticky Bottom*)**:
  - Sisi Kiri: Ringkasan Total Tagihan (`Rp 1.000.000`) + Subteks (`/bulan • Estimasi Total`).
  - Sisi Kanan: Tombol CTA Utama `[ Lanjut Ajukan Sewa → ]`.
  - **Hasil**: Tombol aksi SELALU terlihat dan mudah dijangkau dengan jempol pengguna di perangkat mobile tanpa perlu di-scroll.

---

## 3. Dampak Perubahan

File yang akan dimodifikasi:
1. `functions/public/components/BookingModal.tsx`
   - Rekonstruksi struktur DOM: Mobile Bottom Sheet + Desktop Centered Dialog.
   - Penyederhanaan tipografi (hapus nomor list `1.`, `2.`, `3.`, hapus generic sparkle badge).
   - Penambahan thumbnail kamar di header.
   - Desain ulang selektor paket sewa menjadi segmented control yang pas.
   - Desain ulang input tanggal & tamu menjadi grup reservasi yang rapi.
   - Pembuatan Sticky Bottom Action Bar agar CTA tidak pernah tertutup oleh Bottom Navigation Bar.
   - Mempertahankan seluruh logika kalkulasi harga, durasi, dinamis limit H+5/H+30, dan payload `onConfirm`.
2. `functions/PROGRESS.md`
   - Pencatatan progres pembaruan UI/UX standar proptech.
3. `WALKTHROUGH.md`
   - Dokumentasi hasil sebelum dan sesudah redesain.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

1. **Refaktor Struktur Layout & Z-Index [BookingModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/BookingModal.tsx)**:
   - Atur kontainer luar dengan `z-[90]` dan layout split mobile (`items-end`) vs desktop (`sm:items-center`).
2. **Implementasi Header Properti yang Ramah**:
   - Render foto thumbnail properti / kamar di samping nama kost dan badge tipe kamar.
   - Tambahkan banner reasuransi tenang tanpa font ligature eksternal.
3. **Penyempurnaan Form Konten**:
   - Hapus penomoran kaku.
   - Buat pemilih paket sewa menjadi kartu-kartu ringkas yang elegan.
   - Gabungkan Tanggal Masuk & Jumlah Penghuni dalam grid proporsional.
   - Tampilkan jadwal operasional harian dan ETA dengan styling minimalis.
4. **Penerapan Sticky Bottom Action Bar**:
   - Pasang footer `sticky bottom-0 bg-white border-t p-4 pb-safe` dengan total harga di kiri dan tombol submit di kanan.
5. **Uji Kompilasi & Responsivitas**:
   - Jalankan `cmd.exe /c "npm --prefix functions/public run build"` untuk memastikan 0 error kompilasi.
   - Verifikasi tampilan responsif (desktop & mobile viewport) bebas cut-off.
6. **Commit & Push**:
   - Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- **Kompilasi**: Memastikan build Vite lulus 100% tanpa error TypeScript maupun CSS.
- **Uji Mobile (Bottom Sheet)**: Memastikan form di HP muncul sebagai bottom sheet dengan sticky CTA bar yang tidak tertutup oleh bottom navigation bar.
- **Uji Fungsionalitas**: Memastikan data payload booking (`period`, `startDate`, `endDate`, `total`, `checkInEta`, dll.) tetap terkirim secara akurat ke halaman pembayaran/konfirmasi.
- **Uji Kepatuhan Ikon**: 100% bundled SVG `lucide-react`, 0% Google Fonts ligature.
