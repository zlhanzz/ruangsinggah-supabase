# IMPLEMENTATION PLAN: Peningkatan Sistem Chat Berstandar Industri Proptech dengan Perlindungan Anti-Bypass

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini
Sistem chat saat ini ([ChatWindow.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/ChatWindow.tsx)) baru berada pada tahap dasar (MVP):
1. **Ketiadaan Konteks Kamar (No Listing Context)**:
   Saat calon penyewa membuka chat dari halaman kost, kotak obrolan hanya menampilkan teks header umum ("kost ryuta • Pemilik Kost") tanpa menyertakan informasi kamar atau harga yang sedang ditanyakan. Pemilik kost harus bertanya balik secara manual.
2. **Empty State Pasif & Mengetik Melelahkan**:
   Layar awal hanya menampilkan ikon abu-abu *"BELUM ADA PESAN"*. Tidak ada template pertanyaan cepat (*Quick Reply Chips*), sehingga calon penyewa harus mengetik semuanya sendiri dari nol di smartphone.
3. **Risiko Transaksi di Luar Aplikasi (*Platform Leakage*)**:
   Jika penyewa dan pemilik janjian secara manual, ada risiko terjadi kesepakatan tunai di luar sistem. Perlu edukasi dan penegasan bahwa transaksi sewa yang sah dan aman wajib melalui sistem resmi RuangSinggah.

### Kebutuhan Pengguna
1. **Kartu Konteks Kamar Tersemat (Pinned Room Card)**:
   Menampilkan kartu ringkas di bagian atas chat: thumbnail foto kamar/kost, nama kost, tipe/nomor kamar yang dipilih, harga sewa, dan tombol aksi cepat **[ Ajukan Sewa ]**.
2. **Template Pertanyaan Cepat (Quick Reply Chips)**:
   Tombol 1-klik untuk pertanyaan terpopuler yang terarah dan aman:
   - 💬 *"Apakah kamar ini masih tersedia?"*
   - ⚡ *"Berapa perkiraan biaya listrik & airnya?"*
   - 📜 *"Apakah ada peraturan jam malam atau tamu?"*
   - 📅 *"Apakah bisa survey lokasi resmi via RuangSinggah?"*
3. **Banner Jaminan Keamanan & Garansi Finansial**:
   Banner proteksi transaksi resmi berbunyi:
   🛡️ **Jaminan Keamanan Transaksi & Garansi Uang Kembali 100%**: *Lakukan pembayaran sewa hanya melalui sistem resmi RuangSinggah demi perlindungan transaksi penuh dan jaminan dana aman.*
4. **Alur Transaksi Cepat dari Chat**:
   Tombol *[ Ajukan Sewa ]* di dalam kartu chat langsung membuka formulir pemesanan resmi (`BookingModal`) tanpa membingungkan calon penyewa.

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
1. `functions/public/components/ChatWindow.tsx`:
   - Tambahkan props opsional: `propertyPhoto`, `roomNumber`, `roomType`, `roomPrice`, `propertyId`, `onRentClick`.
   - Render **Kartu Konteks Kamar Tersemat (Pinned Room Card)** yang kompak dan elegan di bawah header obrolan.
   - Render **Banner Jaminan Keamanan Transaksi & Garansi Uang Kembali 100%**.
   - Render **Quick Reply Chips** interaktif (dapat diklik untuk otomatis mengirimkan pesan pertanyaan terstandar).
   - Sambungkan aksi tombol *Ajukan Sewa* ke callback `onRentClick`.
2. `functions/public/pages/KostDetail.tsx`:
   - Meneruskan data konteks kamar aktif (foto properti, nomor/tipe kamar, harga sewa, dan handler sewa) ke komponen `ChatWindow`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Modifikasi Props dan Tampilan `ChatWindow.tsx`**:
   - Perluas interface `ChatWindowProps`.
   - Tambahkan state / handler untuk pengiriman pesan instan via Quick Reply Chips.
   - Susun desain kartu miniatur kamar yang ramping (*compact luxury*) dengan border halus, foto thumbnail, rincian harga, dan tombol oranye *Ajukan Sewa*.
   - Pasang banner jaminan keamanan transaksi dan garansi uang kembali 100% dengan ikon `ShieldCheck`.
   - Tampilkan chip pertanyaan cepat di area pesan awal (*empty state*) maupun di atas input pesan.
2. **Integrasi di `KostDetail.tsx`**:
   - Salurkan prop konteks kamar aktif ke `<ChatWindow ... />` saat modal dibuka dari halaman detail properti.
3. **Verifikasi Build**:
   - Jalankan build frontend: `cmd.exe /c "npm --prefix functions/public run build"`
   - Jalankan build backend: `cmd.exe /c "npm --prefix functions run build"`
4. **Dokumentasi & Git Synchronization**:
   - Catat riwayat progres **#464** di `functions/PROGRESS.md`.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kartu Konteks Kamar**:
   - Buka chat dari halaman kost $\rightarrow$ pastikan foto kamar, nomor/tipe kamar, dan harga sewa muncul tersemat di bagian atas chat.
2. **Uji Tombol Ajukan Sewa di Dalam Chat**:
   - Klik tombol [Ajukan Sewa] pada kartu chat $\rightarrow$ jendela chat tertutup dan form booking sewa resmi terbuka seketika.
3. **Uji Quick Reply Chips**:
   - Klik chip *"Apakah kamar ini masih tersedia?"* $\rightarrow$ pesan langsung terkirim secara instan ke dalam sesi obrolan tanpa perlu mengetik manual.
4. **Uji Tampilan Banner Keamanan**:
   - Pastikan teks *"Jaminan Keamanan Transaksi & Garansi Uang Kembali 100%"* tampil rapi dan meyakinkan calon penyewa.
5. **Uji Kelulusan Build**:
   - 0 error kompilasi pada Vite dan TypeScript.
