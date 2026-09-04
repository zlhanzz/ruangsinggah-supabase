# Rencana Implementasi: Notifikasi Email ke Admin untuk Listing yang Diajukan Mitra dalam Tahap Peninjauan

Dokumen ini adalah **Implementation Plan (Fase 1)** untuk menambahkan sistem notifikasi email otomatis ke tim Administrator RuangSinggah ketika seorang mitra mendaftarkan kost baru atau mengajukan ulang perubahan listing yang masuk ke dalam **Tahap Peninjauan Admin (Review)**.

---

## 1. Analisis Masalah & Kebutuhan

### A. Konteks Masalah
- Ketika mitra mendaftarkan kost baru melalui formulir kelola properti (`KostFormMitra.tsx`), status awal properti disimpan sebagai `draft` dengan status peninjauan `is_verified: false`.
- Di antarmuka Dashboard Mitra, kartu listing menampilkan lencana **"SEDANG DITINJAU"** dan kartu panduan bertuliskan:
  > **TAHAP PENINJAUAN ADMIN (ESTIMASI 1×24 JAM)**  
  > *Listing Anda telah berhasil diajukan dan sedang diverifikasi oleh tim RuangSinggah. Listing akan otomatis tayang di pencarian publik setelah disetujui.*
- Hal yang sama terjadi ketika mitra mengedit listing kost yang belum pernah dipublikasikan atau yang sebelumnya diminta revisi oleh admin.
- Saat ini, **belum ada notifikasi email yang terkirim ke administrator** ketika peristiwa pengajuan ini terjadi. Admin harus secara manual membuka tab Pusat Moderasi Properti di Dashboard Admin untuk mengecek apakah ada listing baru yang masuk, sehingga berpotensi memperlambat waktu verifikasi (*turnaround time* > 24 jam).

### B. Kebutuhan Solusi
1. **Sistem Notifikasi Email Otomatis ke Admin**:
   - Mengirimkan email resmi ke seluruh email admin (ditarik dinamis dari tabel `users` dengan fallback ke admin utama `sulhan77777@gmail.com`) melalui FormSubmit AJAX.
2. **Payload Notifikasi Komprehensif & Kaya Konteks**:
   - Judul & Subjek: `🏠 Pengajuan Listing Kost Baru Menunggu Peninjauan: [Nama Kost]` (atau `Pengajuan Ulang Listing Kost` jika resubmission).
   - Data Properti: Nama Kost, Tipe (Putra/Putri/Campur), Alamat Lengkap, Kota/Area, Kisaran Harga Sewa Mulai (Rp/bulan), Jumlah Tipe Kamar & Unit Kamar Tersedia.
   - Data Mitra / Pemilik: Nama Lengkap, Alamat Email Akun, Nomor WhatsApp Aktif.
   - Media: URL Foto Cover Bangunan Depan / Fasad (sudah tersimpan di Supabase Storage).
   - Tindakan Admin: Panduan dan tautan langsung ke Pusat Moderasi Dashboard Admin (`https://ruangsinggah.id/dashboard`).
3. **Pemicu Non-Blocking & Tangguh**:
   - Pengiriman email tidak boleh memblokir atau memperlambat alur submit pengguna di antarmuka (dieksekusi secara asinkron dengan *error handling* aman).
   - Notifikasi in-app pelengkap ke tabel `notifications` untuk seluruh akun admin agar muncul di lonceng notifikasi Dashboard Admin.

---

## 2. Dampak Perubahan (Files Touched)

1. **`functions/public/emailService.ts`**:
   - Menambahkan fungsi baru `notifyAdminPropertyReview(details: ...)` untuk menyusun payload email resmi yang profesional, menarik daftar admin aktif, dan mengirimkan email via FormSubmit AJAX.
2. **`functions/public/components/KostFormMitra.tsx`**:
   - Mengimpor fungsi `notifyAdminPropertyReview`.
   - Pada handler `handleSubmit`:
     - Menangkap ID properti baru dari `addPropertyWithMedia`.
     - Mengirimkan notifikasi email admin saat pendaftaran kost baru berhasil.
     - Mengirimkan notifikasi email admin saat pembaruan draft/revisi berhasil diajukan ulang (`!isCurrentlyPublished`).
3. **`functions/PROGRESS.md`**:
   - Mencatat penambahan fitur notifikasi email admin untuk review listing kost pada entri baru **#335**.
4. **`WALKTHROUGH.md`**:
   - Menerbitkan panduan pengujian dan ringkasan implementasi setelah eksekusi Fase 2 selesai.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

### Tahap 1: Pembuatan Service Notifikasi Email Admin (`emailService.ts`)
- Mendefinisikan antarmuka parameter `PropertyReviewNotificationPayload`:
  - `propertyId: string`
  - `propertyName: string`
  - `propertyCity?: string`
  - `propertyAddress?: string`
  - `propertyPrice?: number`
  - `propertyType?: string`
  - `ownerName?: string`
  - `ownerEmail?: string`
  - `ownerPhone?: string`
  - `totalRoomTypes?: number`
  - `totalUnits?: number`
  - `coverPhotoUrl?: string`
  - `isResubmission?: boolean`
- Mengimplementasikan fungsi `notifyAdminPropertyReview` yang memanfaatkan `notifyAdminTransaction` dengan format pesan terstruktur dan subjek email yang jelas.
- Memicu pembuatan entri notifikasi in-app ke tabel `notifications` untuk setiap admin ID.

### Tahap 2: Integrasi Pemicu di Formulir Pengajuan Mitra (`KostFormMitra.tsx`)
- Pada blok `handleSubmit`:
  - Pendaftaran Baru (`addPropertyWithMedia`):
    ```typescript
    const newPropertyId = await addPropertyWithMedia(...);
    // Non-blocking call
    notifyAdminPropertyReview({
      propertyId: newPropertyId,
      propertyName: form.title || 'Kost Tanpa Nama',
      propertyCity: form.city || '',
      propertyAddress: form.address || '',
      propertyPrice: finalPrice,
      propertyType: form.type || 'Campur',
      ownerName: user?.displayName || user?.name || form.omnichannelContactName || 'Mitra RuangSinggah',
      ownerEmail: user?.email || '',
      ownerPhone: user?.phone || form.omnichannelContactPhone || '',
      totalRoomTypes: (form.roomTypes || []).length,
      totalUnits: (form.roomTypes || []).reduce((acc, r) => acc + (r.availableRoomCount ?? 1), 0),
      coverPhotoUrl: allImagesList[0]?.url || allImagesList[0]?.original || '',
      isResubmission: false
    }).catch(err => console.warn('Gagal memicu email review admin:', err));
    ```
  - Pengajuan Ulang Draft/Revisi (`updatePropertyWithMedia` dengan `!isCurrentlyPublished`):
    ```typescript
    notifyAdminPropertyReview({
      propertyId: editingKost.id,
      propertyName: form.title || editingKost.title,
      // ...
      isResubmission: true
    }).catch(err => console.warn('Gagal memicu email review admin:', err));
    ```

### Tahap 3: Uji Kompilasi & Build
- Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi dan bundler Vite berhasil membangun bundle production.
- Menjalankan `cmd /c npm run build` di `functions/` untuk memastikan backend `tsc` 0 error.

### Tahap 4: Pencatatan Progres & Deployment
- Mencatat riwayat ke `functions/PROGRESS.md` (entri #335).
- Membuat dokumen `WALKTHROUGH.md`.
- Melakukan commit dan push git ke branch non-production `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**:
   - `npm run build` di `functions/public/` lulus tanpa peringatan/error TypeScript (`0 error`).
   - `tsc` di `functions/` lulus tanpa error.
2. **Uji Simulasi Alur**:
   - Memastikan saat mitra menekan tombol **"Publikasikan Kost"**, fungsi `notifyAdminPropertyReview` dipanggil dengan data properti, nomor WhatsApp pemilik, dan tautan foto cover.
   - Memastikan proses penyimpanan form tidak terganggu/terhambat meskipun jaringan pengiriman email lambat (non-blocking).
   - Memverifikasi log konsol browser menampilkan keberhasilan pengiriman notifikasi via FormSubmit ke email admin.

---

> [!IMPORTANT]
> **Menunggu Persetujuan (Approval) User**:  
> Sesuai protokol siklus kerja 2-fase, kami tidak akan memodifikasi kode sampai dokumen perencanaan ini disetujui (ACC / Proceed) oleh Anda.
