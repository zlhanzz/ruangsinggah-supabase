# Walkthrough: Penyelarasan Alur & Siklus KostManager (Pendataan, Approval Admin, Dashboard Mitra, hingga Listing Publik & Pemasaran Kamar Kosong)

Dokumen ini merangkum perbaikan holistik yang telah dilakukan untuk memastikan bahwa kost yang didata oleh surveyor KostManager, disetujui (*ACC*) oleh Admin, dan aktif di Portal KostManager, secara otomatis selaras statusnya di Dashboard Mitra sebagai **Tayang Publik**, serta langsung terbit di katalog publik (`/listings` dan halaman utama) lengkap dengan pemasaran kamar kosong yang siap huni.

---

## 1. Analisis & Akar Masalah yang Ditemukan

1. **Status Mismatch pada Handler Approval Admin (`KostManagerManagement.tsx`)**:
   - Saat Admin menekan tombol *"Setujui & Terbitkan Properti"*, fungsi `handleApproveAndActivate` sebelumnya menyetel status properti ke `'active'`.
   - Di sisi lain, seluruh fungsi query katalog publik pencari kost di `userService.ts` (`getPublishedProperties`, `getFilteredProperties`, dll.) menggunakan filter ketat `.eq('status', 'published')`.
   - Akibatnya, properti yang diaktifkan Admin masuk ke status `'active'`, sehingga secara sistem tereksklusi 100% dari listing pencari kost.

2. **Evaluasi Status pada Dashboard Mitra (`MitraDashboard.tsx`)**:
   - Tab properti mitra sebelumnya menghitung dan memeriksa `p.status === 'published'`. Karena nilainya `'active'`, sistem memasukkannya ke kategori draf/in-review dan menampilkan status *"Sedang Ditinjau"* beserta banner *"Tahap Peninjauan Admin (Estimasi 1x24 Jam)"*.

3. **Ketiadaan Invalidasi Cache saat Approval**:
   - Cache lokal `PROPERTIES_CACHE` belum di-invalidasi saat persetujuan Admin selesai, sehingga browser klien tetap mempertahankan respons query katalog lama.

4. **Pemasaran Kamar Kosong di Kartu Listing Publik (`KostCard.tsx`)**:
   - Kartu listing pada halaman pencarian belum memiliki indikator visual yang menonjolkan jumlah unit kamar kosong yang masih tersedia, padahal calon penyewa sangat membutuhkan kepastian ketersediaan kamar.

---

## 2. Detail Modifikasi Kode

### A. Penyelarasan Status Approval Admin & Invalidasi Cache ([KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerManagement.tsx))
- Mengubah mutasi status properti saat Admin menyetujui onboarding menjadi `status: 'published'`:
  ```typescript
  const { error: propErr } = await supabase
    .from('properties')
    .update({
      status: 'published',
      is_managed: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.property_id);
  ```
- Menambahkan pemanggilan `invalidatePropertiesCache()` setelah aktivasi sukses agar katalog publik langsung ter-refresh seketika.

### B. Penguatan Query Katalog Publik ([userService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts))
- Memperbarui fungsi `getPublishedProperties`, `getFilteredProperties`, `getAvailableFilterOptions`, dan `getPublishedPropertyDetails` dengan klausa query tangguh:
  ```typescript
  .or('status.eq.published,and(status.eq.active,is_managed.eq.true)')
  ```
- Menjamin properti berstatus KostManager yang aktif tidak akan pernah tertinggal dari katalog publik baik berstatus `'published'` maupun `'active'`.

### C. Penyelarasan Status & Tampilan Dashboard Mitra ([MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx))
- Memperbarui perhitungan jumlah tab `publishedCount` dan `inReviewCount`:
  ```typescript
  const isPubliclyPublished = p.status === 'published' || (p.isManaged && p.status === 'active');
  ```
- Menampilkan badge hijau *"Tayang Publik"* dengan ikon SVG pure vector `CheckCircle2`.
- Menyembunyikan banner peninjauan admin (*Tahap Peninjauan Admin*) jika properti sudah berstatus publik / managed-active.

### D. Pemasaran Kamar Kosong dengan Badge Dinamis ([KostCard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostCard.tsx))
- Menghitung unit kamar kosong secara otomatis (`vacantRoomsCount`):
  - Untuk managed kost: menyaring kamar yang `isAvailable !== false` dan statusnya bukan `'Terisi'`/`'Penuh'`.
  - Untuk non-managed: menjumlahkan `availableRoomCount`.
- Menampilkan badge hijau elegan pada kartu listing:
  ```tsx
  {vacantRoomsCount > 0 ? (
    <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      {vacantRoomsCount} Kamar Kosong
    </span>
  ) : (
    <span className="bg-rose-600 text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
      Penuh
    </span>
  )}
  ```

### E. Sinkronisasi Data Existing di Supabase
- Properti **Kost Apalah Daya** (`bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`) telah diperbarui langsung di tabel `properties` menjadi `status: 'published'`.
- Dari 10 unit kamar yang didata surveyor:
  - 8 Kamar berstatus *Terisi* (Kamar 1-7 dan Kamar 10).
  - 2 Kamar berstatus *Kosong* (Kamar 8 Tipe Premium & Kamar 9 Tipe Standard) langsung live dan dapat dipesan oleh penyewa.

---

## 3. Hasil Pengujian & Kompilasi

1. **Uji Kompilasi Vite & TypeScript (`npm run build`)**:
   - Menjalankan `npm.cmd run build` di direktori `functions/public`.
   - **Hasil**: **LULUS 100% (Exit Code 0)** dalam `43.97s`.
   - 2.512 modul tertransformasi tanpa ada error tipe TypeScript maupun Vite bundling.

2. **Verifikasi Database Supabase**:
   - Query verifikasi terhadap properti `bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f` mengonfirmasi:
     - `status`: `'published'`
     - `is_managed`: `true`
     - Jumlah kamar: 10 unit (2 kamar kosong siap huni).

---

## 4. Panduan Verifikasi bagi Pengguna

1. **Memeriksa Dashboard Mitra**:
   - Masuk ke akun Mitra pemilik kost terkait di menu **Dashboard Mitra** -> **Properti Saya** (`/dashboard-mitra/properties`).
   - Perhatikan kartu **Kost Apalah Daya**:
     - Status kini menampilkan badge hijau **Tayang Publik** dengan ikon centang.
     - Banner *"Tahap Peninjauan Admin"* sudah tidak muncul lagi.
     - Kartu masuk ke tab counter **Tayang (1)**.

2. **Memeriksa Halaman Publik (`/listings` dan Beranda)**:
   - Buka halaman utama atau halaman **Cari Kost** (`/listings`).
   - Kartu **Kost Apalah Daya** kini muncul di katalog pencarian.
   - Pada bagian atas foto terdapat badge:
     - **KOST PUTRA** (atau tipe gender kost).
     - **TERVERIFIKASI** (badge biru resmi KostManager).
     - **2 KAMAR KOSONG** (badge hijau dengan indikator titik berkedip).

3. **Memeriksa Halaman Detail Kost**:
   - Klik kartu **Kost Apalah Daya** untuk membuka halaman detail.
   - Perhatikan bahwa galeri foto kamar otomatis hanya menampilkan unit kamar yang kosong (Kamar 8 & Kamar 9).
   - Calon penyewa dapat memilih unit kamar kosong tersebut dan langsung melanjutkan ke proses pemesanan/sewa.

---

## 5. Prosedur Git & Deploy
Sesuai aturan baku workspace, seluruh commit tersimpan di branch `bukan-productions`. User dapat melakukan deploy manual ke production kapan saja.
