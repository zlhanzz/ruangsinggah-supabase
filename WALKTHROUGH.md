
# Walkthrough: Restorasi & Penegasan Tampilan Kartu Peninjauan Pendataan KostManager Versi Modern

## 📌 Ringkasan Pekerjaan
Telah dilakukan audit menyeluruh dan pembuatan ulang paket produksi frontend (*fresh build*) untuk memastikan bahwa antarmuka menu **"KostManager Auto-Pilot"** pada panel Dashboard Admin (`/admin` menu `kostmanager`) 100% menggunakan arsitektur **Pipeline Status Card Grid** dan **Modal Peninjauan Komprehensif 3-Tab**, serta menyingkirkan sisa tampilan tabel lama akibat cache peramban.

---

## 💎 Fitur & Tampilan Versi Modern yang Aktif

### 1. Kartu Permohonan Interaktif (Card Grid Layout)
- **Header Profil Mitra**: Menampilkan avatar inisial berwarna oranye-amber, nama mitra, badge `Owner`, nomor kontak WhatsApp aktif dengan tautan direct-chat `wa.me`, serta status permohonan beranimasi *pulse*.
- **Identitas & Chips Properti**:
  - Badge tipe kost (`Campur`, `Putra`, `Putri`) dengan ikon murni vector SVG `Building2`.
  - Chip jumlah kamar (`X Total / Y Kosong`) dengan ikon `Bed`.
  - Alamat properti dengan ikon `MapPin` dan tombol navigasi koordinat titik lokasi Google Maps (`Compass`).
- **Box Evaluasi & Catatan Revisi**: Menampilkan catatan evaluasi atau alasan perbaikan dari peninjauan surveyor secara rapi dan terstruktur dengan ikon `AlertTriangle` / `FileText`.
- **Tombol Aksi Utama**:
  - 🟢 **`🔍 Tinjau Hasil Pendataan Lengkap`**: Tampil menonjol pada permohonan yang membutuhkan verifikasi (`PENDING_ONBOARDING`, `SUBMITTED`, atau `REVISION_REQUIRED`) dengan efek gradient emerald/amber dan animasi ping.
  - ⚙️ **`✏️ Kelola Agen & Drive`**: Untuk menetapkan agen survey atau memperbarui tautan Google Drive.
  - 👁️ **`Lihat Detail Listing & Data`**: Untuk properti yang telah aktif (`ACTIVE`).

### 2. Modal Peninjauan Komprehensif 3 Kategori (`ReviewKostManagerModal`)
Ketika tombol **`🔍 Tinjau Hasil Pendataan Lengkap`** diklik, modal modern 3 kategori terbuka:
1. 🏢 **Tab 1: Profil Gedung & Fasilitas**:
   - Hero photo carousel interaktif dengan thumbnail mini.
   - Slot foto fasad, ruang bersama, dan fasilitas umum terdata.
   - Live Google Maps integrasi estimasi jarak dan waktu tempuh ke kampus-kampus terdekat (jalan kaki dan berkendara).
   - Daftar fasilitas gedung terpadu dan tata tertib hunian.
2. 🛏️ **Tab 2: Data Kamar & Penghuni**:
   - Bar ringkasan statistik okupansi (Total Kamar, Kamar Terisi, Kamar Kosong Siap Huni).
   - Hierarki *Parent-Child* pengelompokan tipe kamar.
   - **Kamar Terisi**: Data penghuni lengkap (nama, nomor WA, tanggal mulai sewa, nominal sewa, skema tagihan, bukti sewa).
   - **Kamar Kosong**: Data kesiapan huni, skema tarif lengkap (harian, mingguan, bulanan, tahunan, deposit, biaya listrik/air).
   - Carousel foto unit kamar dinamis per-kamar dan sinkronisasi fasilitas.
3. 🤝 **Tab 3: Data Mitra & Legalitas**:
   - Profil lengkap pemilik kost dan kontak terverifikasi.
   - Dokumen MoU dan tanda tangan digital.
   - Formulir evaluasi & checklist minta revisi surveyor.
   - Tombol **Approval & Aktivasi Autopilot** final.

---

## 🧪 Hasil Verifikasi Kompilasi & Build

```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
✓ 2526 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 21.25s
The command exited with code 0 (SUCCESS).
```

---

## 🧭 Panduan Verifikasi Pengguna
1. Buka halaman Dashboard Admin RuangSinggah di peramban Anda (`/admin`).
2. Jika peramban Anda masih menyimpan tampilan lama, lakukan **Hard Refresh**:
   - Di Windows: Tekan **`Ctrl + F5`** atau **`Ctrl + Shift + R`**.
3. Klik menu **⚡ KostManager Auto-Pilot** pada sidebar kiri.
4. Anda akan langsung melihat tampilan kartu permohonan modern berbentuk grid dengan badge status berwarna, counter kamar, dan tombol utama **`🔍 Tinjau Hasil Pendataan Lengkap`**.
5. Klik tombol tersebut untuk membuka modal peninjauan 3-kategori yang komprehensif.

