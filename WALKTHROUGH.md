# WALKTHROUGH - Pemisahan Syarat & Ketentuan (MoU) dan Ringkasan Pembayaran KostManager

## Ringkasan Pekerjaan
Pemisahan alur pendaftaran dan aktivasi KostManager pada [KostManagerLanding.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx) telah selesai diimplementasikan. Sebelumnya, Tahap 3 menggabungkan Syarat & Ketentuan Layanan (MoU) dan Ringkasan Biaya Pendaftaran dalam satu tampilan. Sekarang, alur telah dipisahkan menjadi 4 langkah berurutan yang terstruktur, rapi, dan mudah dipahami oleh mitra pemilik kost.

---

## 1. Daftar Perubahan Kode

### A. Struktur Alur 4 Tahap Terpisah (`KostManagerLanding.tsx`)
1. **Tahap 1: Pilih Metode (`method`)**:
   - Pemilihan sumber data: *"Pilih dari Kost Saya"* vs *"Daftar Kost Baru (Manual)"*.
2. **Tahap 2: Data Properti (`form`)**:
   - Pemilihan kartu properti eksisting (tanpa form input redundan) atau formulir input data kost baru.
   - Tombol navigasi: *"Lanjut: Syarat & Ketentuan"*.
3. **Tahap 3: Syarat & Ketentuan / MoU (`mou`)**:
   - Menampilkan dokumen kesepakatan kemitraan KostManager secara eksklusif (poin 1-4).
   - Checkbox persetujuan interaktif: *"Saya menyatakan telah membaca, memahami, dan menyetujui seluruh Ketentuan Berlangganan KostManager serta bersedia menerima kunjungan tim surveyor lokasi."*.
   - Tombol Kiri: *"Kembali ke Data Properti"*.
   - Tombol Kanan: *"Lanjut: Ringkasan Biaya"* (terkunci otomatis jika checkbox belum dicentang).
4. **Tahap 4: Ringkasan Pendaftaran & Pembayaran (`summary`)**:
   - Kartu Rincian Properti Kost: Nama properti, tipe (Putra/Putri/Campur), total kamar, dan alamat.
   - Kartu Paket Langganan: Nama paket (Tahunan/Bulanan) dan durasi.
   - Kartu Transparansi Biaya: Total biaya langganan, info survey & foto profesional gratis (Rp 0).
   - Badge status: *"Syarat & Ketentuan Layanan telah disetujui"*.
   - Tombol Kiri: *"Kembali ke Syarat & MoU"*.
   - Tombol Kanan: *"Bayar & Aktifkan Langganan"* (memicu pembukaan modal `PaymentGateway`).

### B. Pembaruan Header Progress Stepper Indicator
- Header indikator tahapan diperbarui menjadi 4 langkah:
  `Metode (1)` ➔ `Properti (2)` ➔ `Syarat & MoU (3)` ➔ `Ringkasan (4)`
- Menggunakan ikon SVG bundel murni (`<Check />` dari `lucide-react`) untuk tahapan yang sudah selesai, lingkaran aktif dengan efek ring oranye menyala, dan garis pembatas dinamis.

### C. Pembaruan Anti-Amnesia (`functions/PROGRESS.md`)
- Catatan entri progres **#375** telah ditambahkan ke `functions/PROGRESS.md`.

---

## 2. Hasil Pengujian & Kompilasi
- **Kompilasi TypeScript (`tsc`)**: `Exit Code 0` (0 error).
- **Build Frontend Vite**: `Exit Code 0` (`✓ 2511 modules transformed, built in 32.64s`).

---

## 3. Panduan Pengujian untuk Pengguna
1. Buka halaman landing KostManager (klik tombol *"Daftar KostManager"*).
2. **Tahap 1**: Pilih salah satu metode (*Pilih dari Kost Saya* atau *Daftar Kost Baru*), lalu klik *"Lanjut ke Data Properti"*.
3. **Tahap 2**: Pilih kost atau lengkapi data properti, lalu klik *"Lanjut: Syarat & Ketentuan"*.
4. **Tahap 3**: 
   - Tampilan akan fokus menampilkan **Syarat & Ketentuan Layanan KostManager**.
   - Tombol *"Lanjut: Ringkasan Biaya"* akan dalam kondisi *disabled* sampai checkbox persetujuan dicentang.
   - Centang checkbox persetujuan lalu klik *"Lanjut: Ringkasan Biaya"*.
5. **Tahap 4**:
   - Tinjau **Ringkasan Pendaftaran & Biaya Langganan** (rincian properti, paket, dan total biaya).
   - Klik *"Kembali ke Syarat & MoU"* untuk memastikan navigasi mundur bekerja tanpa mereset data.
   - Klik *"Bayar & Aktifkan Langganan"* untuk membuka dialog pembayaran.
