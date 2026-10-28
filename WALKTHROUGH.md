# WALKTHROUGH - Standarisasi Menu Kost Saya (Tab Diajukan)

## Ringkasan Perubahan
Menindaklanjuti audit antarmuka calon penyewa pada menu **Kost Saya (Tab Diajukan)**, kami telah merestrukturisasi kartu sewa dan hierarki aksi agar 100% selaras dengan standar proptech industri (Mamikos, Rukita, Airbnb) serta menghilangkan kontradiksi data/elemen visual:

1. **Rating Riil Transparan vs 'Belum Ada Ulasan'**:
   - Menghilangkan hardcoded 5 bintang dummy pada kartu sewa.
   - Jika properti belum memiliki ulasan (rating = 0 atau belum ada review), sistem menampilkan label jujur dan elegan: `⭐ Belum ada ulasan`.
   - Jika sudah memiliki ulasan, sistem menampilkan bintang proporsional bersanding dengan angka desimal rating dan jumlah ulasan.

2. **Pembatasan Badge Verifikasi Khusus Mitra KostManager**:
   - Badge `🛡️ Terverifikasi RuangSinggah` kini menjadi eksklusif hanya untuk properti yang dikelola langsung oleh mitra **KostManager** (`kost.isManagedKost === true`).
   - Untuk properti Mitra Biasa (`!kost.isManagedKost`), sistem menampilkan badge netral `Mitra Komunitas`.

3. **Ringkasan Parameter Pengajuan Sewa (*Booking Parameter Summary*)**:
   - Membuka Info Grid 4 kolom untuk status `PENDING_APPROVAL` dan `AWAITING_PAYMENT`, sehingga calon penyewa dapat meninjau ulang parameter yang telah mereka ajukan:
     - ⏱️ **Paket Sewa**: Durasi sewa (misal: 1 Bulan).
     - 📅 **Rencana Masuk**: Tanggal rencana check-in yang dipilih.
     - 👥 **Penghuni**: Jumlah penghuni yang diajukan.
     - 💰 **Est. Tagihan**: Total tagihan yang diajukan bersanding dengan badge status `Belum Bayar` / `Siap Bayar`.

4. **Banner Edukasi SLA Respon Pemilik 1x24 Jam**:
   - Menambahkan banner informatif di bawah status pengajuan:
     > *"Pemilik kost sedang meninjau ketersediaan kamar. Pembayaran baru dilakukan **setelah** pengajuan Anda disetujui. (Estimasi respon: 1x24 Jam)"*

5. **Restrukturisasi Tombol Aksi Kontekstual (Proptech Grade)**:
   - **Status `PENDING_APPROVAL`**:
     - **Primary Action (CTA Terbesar)**: `[ 💬 Hubungi Pemilik Kost / Bantuan KostManager ]` dengan visual emerald gradient yang menenangkan dan mendorong komunikasi.
     - **Secondary Actions (Grid 2 Kolom)**: `[ 📄 Detail Kost ]` dan `[ 📍 Rute Lokasi ]` sebagai tombol penunjang.
     - **Subtle Action**: `[ ❌ Batalkan Pengajuan ]` diletakkan di bagian paling bawah dengan styling halus agar tidak mendominasi.
   - **Status Aktif / Lunas**: Tombol `RUTE KE KOST` (hitam pekat), `Lapor Kendala`, dan `Beri Ulasan` tetap aktif seperti semula.

6. **Subtitle Dinamis Header Kost Saya**:
   - Tab DIAJUKAN: *"Pantau status persetujuan pengajuan sewa Anda"*
   - Tab AKTIF: *"Kelola hunian aktif & perpanjangan sewa Anda"*
   - Tab RIWAYAT: *"Daftar riwayat sewa dan transaksi terdahulu"*

7. **Integritas Fitur Simulasi**:
   - Komponen `TimeSimulator` tetap dipertahankan utuh dan fungsional di lingkungan dev/testing untuk keperluan simulasi perpanjangan sewa di masa mendatang.

---

## Verifikasi & Pengujian

### 1. Uji Kompilasi Frontend
- **Perintah**: `cmd.exe /c "npm --prefix functions/public run build"`
- **Hasil**: **Lulus 100% (Exit code 0)**.
  - Bundling Vite v6.4.1 selesai tanpa error TypeScript maupun JSX.

### 2. Uji Kompilasi Backend Functions
- **Perintah**: `cmd.exe /c "npm --prefix functions run build"`
- **Hasil**: **Lulus 100% (Exit code 0)**.
  - TypeScript compiler (`tsc`) berhasil tanpa error.

---

## Panduan Pengujian Pengguna (Verifikasi di UI)

1. Buka halaman **Kost Saya** (`/my-kost` atau melalui navigasi profil).
2. Perhatikan tab **Diajukan**:
   - Subtitle header kini berbunyi: *"Pantau status persetujuan pengajuan sewa Anda"*.
   - Kartu pengajuan sewa baru:
     - Jika properti baru belum memiliki ulasan, badge rating menampilkan `⭐ Belum ada ulasan` (bukan 5 bintang dummy).
     - Jika bukan Mitra KostManager, badge verifikasi menampilkan `Mitra Komunitas` (bukan klaim sepihak *Terverifikasi RuangSinggah*).
     - Muncul **Banner Edukasi SLA Respon Pemilik** yang menegaskan bahwa pembayaran dilakukan setelah pemilik menyetujui.
     - Muncul **Info Grid 4 Kolom**: Paket Sewa, Rencana Masuk, Penghuni, dan Est. Tagihan (Belum Bayar).
     - Tombol aksi utama kini adalah **`[ 💬 Hubungi Pemilik Kost ]`**, bukan `Rute Ke Kost`.
     - Tombol **`Detail Kost`** dan **`Rute Lokasi`** bersanding rapi di bawahnya.
     - Tombol **`Batalkan Pengajuan`** berada di bagian bawah dengan tampilan bersih.
3. Beralih ke tab **Aktif**:
   - Subtitle header berubah menjadi: *"Kelola hunian aktif & perpanjangan sewa Anda"*.
   - Kartu sewa lunas/aktif tetap menampilkan tombol `Rute Ke Kost`, `Terima Kunci`, `Perpanjang Sewa`, `Lapor Kendala Kamar`, dan `Beri Ulasan`.
