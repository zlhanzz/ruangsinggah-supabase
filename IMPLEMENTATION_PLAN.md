# Rencana Implementasi: Publikasi Instan Listing Kost & Notifikasi Email Ucapan Selamat ke Mitra via Brevo

Dokumen ini adalah **Implementation Plan (Fase 1)** untuk merevisi alur publikasi listing properti sesuai arahan terbaru dari pengguna:
1. **Tidak Ada Lagi Sistem Hambatan Persetujuan Admin (Instant Direct Publish)**: Ketika mitra mengisi data kost, listing langsung berstatus `published` dan langsung tayang di katalog pencarian publik untuk calon penyewa, dengan tampilan yang normal dan sama persis dengan listing lainnya.
2. **Fungsi Peninjauan Admin Menjadi Audit Pasca-Tayang (Post-Publish Quality & Safety Audit)**: Listing baru tetap tercatat dalam antrean peninjauan admin (`is_verified: false`) untuk memastikan keaslian data dan mendeteksi apakah ada indikasi kecurangan/penipuan yang memerlukan tindakan pembekuan (*suspend/ban*). Jika admin melakukan ACC, artinya listing dinyatakan lolos verifikasi resmi tanpa ada kecurigaan.
3. **Email Ucapan Selamat Resmi dari RuangSinggah via Brevo**: Begitu mitra mempublikasikan kost miliknya, sistem otomatis mengirimkan email resmi ucapan selamat ke email mitra melalui layanan **Brevo REST API**.

---

## 1. Analisis Alur & Kebutuhan

### A. Alur Publikasi Langsung (Instant Publish)
- **Sebelumnya**: Listing baru disimpan dengan `status: 'draft'` dan `is_verified: false`. Calon penyewa tidak dapat melihat listing di katalog publik hingga admin menekan tombol publikasikan.
- **Pembaruan**:
  - Listing baru disimpan dengan `status: 'published'` dan `is_verified: false`.
  - Properti langsung dapat dicari dan dilihat oleh calon penyewa di katalog (`/listings`, `/kost/:id`).
  - Tidak ada badge peringatan "SEDANG DITINJAU" yang ditampilkan di sisi publik (calon penyewa melihat listing biasa yang aktif dan siap disewa).

### B. Audit Pasca-Tayang di Sisi Admin
- Admin di Pusat Moderasi Listing (`PropertyManagement.tsx`) tetap dapat melihat daftar properti yang belum diverifikasi (`is_verified === false`).
- Jika data kost sesuai dan tidak ada indikasi penipuan, admin menekan tombol Verifikasi / ACC (`is_verified: true`).
- Jika ditemukan pelanggaran berat, penipuan, atau indikasi mencurigakan, admin dapat membekukan listing (`status: 'suspended'`).

### C. Email Ucapan Selamat Otomatis via Brevo
- Dikirimkan segera setelah mitra berhasil mempublikasikan kost (baik kost baru maupun setelah pembaruan data).
- **Pengirim Resmi**: `RuangSinggah.id <system@ruangsinggah.id>` via Brevo REST API (`https://api.brevo.com/v3/smtp/email`).
- **Subjek**: `🎉 Selamat! Listing Kost "${propertyName}" Berhasil Dipublikasikan di RuangSinggah.id`
- **Template HTML**:
  - Banner Selebrasi Hijau Zamrud & Oranye RuangSinggah yang elegan.
  - Salam hangat personal kepada mitra.
  - Konfirmasi bahwa kost sudah **Resmi Aktif & Tayang** di katalog RuangSinggah.
  - Rincian Properti: Nama Kost, Alamat/Kota, Harga Mulai, Tipe Kost.
  - Tombol Aksi Utama: **"LIHAT LISTING KOST ANDA"** (`https://ruangsinggah.id/kost/${propertyId}`) dan **"BUKA DASHBOARD MITRA"** (`https://ruangsinggah.id/dashboard-mitra/properties`).
  - Catatan Integritas: Keterangan bahwa tim RuangSinggah melakukan peninjauan berkala untuk memastikan keamanan dan kenyamanan komunitas sewa kost.

---

## 2. Dampak Perubahan (Files Touched)

1. **`functions/src/index.ts` (Backend Cloud Functions)**:
   - Menambahkan Cloud Function `sendPropertyPublishedEmail` yang memproses pengiriman email ucapan selamat resmi ke mitra via Brevo REST API menggunakan template HTML premium.
2. **`functions/public/adminService.ts` (Core Property Service)**:
   - Menyesuaikan `addPropertyWithMedia`: mengizinkan properti baru dari mitra langsung berstatus `status: 'published'` (dengan `is_verified: false`).
   - Menyesuaikan `updatePropertyWithMedia`: menjaga status tetap `published` (kecuali jika sedang berstatus `suspended` oleh admin).
   - Menambahkan fungsi helper `sendMitraPublishedEmailBrevo` untuk memanggil endpoint Cloud Function Brevo secara asinkron (*non-blocking*).
3. **`functions/public/components/KostFormMitra.tsx` (Formulir Mitra)**:
   - Mengubah status saat `addPropertyWithMedia` menjadi `status: 'published'`.
   - Mengganti teks alert sukses: *"Selamat! Listing kost Anda berhasil dipublikasikan dan sudah langsung tayang di katalog pencarian RuangSinggah.id!"*.
   - Memicu pengiriman email Brevo ucapan selamat ke mitra seketika setelah listing tersimpan.
4. **`functions/PROGRESS.md`**:
   - Mencatat penyesuaian alur Instant Publish dan integrasi email selamat Brevo pada entri **#336**.
5. **`WALKTHROUGH.md`**:
   - Dokumentasi alur baru, panduan deploy function, dan panduan pengujian pengguna.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

### Tahap 1: Backend Cloud Function Brevo (`functions/src/index.ts`)
- Membuat endpoint `sendPropertyPublishedEmail`:
  - Menerima payload: `{ email, name, propertyName, propertyId, city, address, price, type, coverUrl }`.
  - Mengambil `brevoApiKey = brevoApiKeyParam.value()`.
  - Menyusun template HTML responsif dengan desain modern RuangSinggah.
  - Mengirimkan POST ke `https://api.brevo.com/v3/smtp/email`.

### Tahap 2: Penyesuaian Service Listing & Trigger Frontend (`functions/public/adminService.ts`)
- Di `addPropertyWithMedia`:
  - Mengatur `const targetStatus = kostData.status || 'published';`.
  - Memastikan properti langsung tersimpan sebagai `published`.
- Di `sendMitraPublishedEmailBrevo`:
  - Mengirimkan payload ke endpoint `sendPropertyPublishedEmail` secara non-blocking.

### Tahap 3: Pembaruan Formulir Mitra (`functions/public/components/KostFormMitra.tsx`)
- Pada saat submit pendaftaran kost baru:
  - Panggil `addPropertyWithMedia({ ...data, status: 'published', isVerified: false }, pendingUploadPayload, [])`.
  - Pemicuan otomatis `sendMitraPublishedEmailBrevo` ke email mitra pemilik.
  - Notifikasi admin peninjauan tetap berjalan di background agar admin dapat melakukan audit mutu/keamanan.

### Tahap 4: Uji Kompilasi & Build
- Menjalankan `cmd /c npm run build` di `functions/public/` (memastikan frontend lulus kompilasi Vite 0 error).
- Menjalankan `cmd /c npm run build` di `functions/` (memastikan backend TypeScript `tsc` 0 error).

### Tahap 5: Dokumentasi & Git Push
- Memperbarui `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
- Melakukan git commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**:
   - Build frontend dan backend lulus 100% dengan 0 error.
2. **Verifikasi Publikasi Instan**:
   - Saat mitra mendaftarkan kost baru, status langsung tersimpan sebagai `published`.
   - Listing langsung dapat ditemukan di halaman katalog publik (`/listings`) dan detail kost (`/kost/:id`) tanpa ada blokir "Tahap Peninjauan Admin".
3. **Verifikasi Pengiriman Email Brevo**:
   - Email ucapan selamat resmi dari RuangSinggah berhasil dipicu dan dikirimkan ke alamat email mitra yang terdaftar.

---

> [!IMPORTANT]
> **Menunggu Persetujuan (Approval) User**:  
> Sesuai protokol baku siklus kerja 2-fase repositori ini, kami tidak akan memodifikasi file kode sampai dokumen perencanaan ini disetujui (ACC / Proceed) oleh Anda.
