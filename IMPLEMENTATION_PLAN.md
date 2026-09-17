# Implementation Plan - Penyelarasan Holistik Siklus Listing Kamar Kosong KostManager (Survey Lapangan -> ACC Admin -> Dashboard Mitra -> Publikasi Katalog User)

Dokumen ini disusun untuk menganalisis dan menyelesaikan secara tuntas kendala di mana properti KostManager yang telah disurvei oleh agen dan disetujui (ACC) oleh admin sudah aktif di Portal KostManager, namun di Dashboard Mitra masih berstatus *'Sedang Ditinjau'* dan kamar kosongnya belum muncul sama sekali di katalog pencarian user.

---

## 1. Analisis Masalah & Investigasi Mendalam

Berdasarkan pemeriksaan komprehensif pada database Supabase, kode backend, dan antarmuka frontend:

### A. Temuan Kondisi Saat Ini (Berdasarkan 4 Bukti Tangkapan Layar)
1. **Screenshot 1 (Moderasi Onboarding Admin)**:
   - Permintaan pendaftaran onboarding KostManager (ID `#F8E426DC` / `f8e426dc-b9be-4c74-b41b-e3c1099b9a76`) untuk **"Kost Apalah Daya"** berstatus `AKTIF (AUTO-PILOT)` setelah admin menekan tombol persetujuan *"Setujui & Aktifkan"*.
2. **Screenshot 2 (Portal KostManager)**:
   - Kost Apalah Daya tercatat sebagai properti terkelola aktif (10 unit kamar: 8 terisi, 2 kosong siap huni) dengan tingkat okupansi 80%.
3. **Screenshot 3 (Dashboard Mitra - Kost Saya)**:
   - Pemilik kost (Sulhan) melihat kartu kostnya masih berstatus badge oranye `SEDANG DITINJAU`, header menampilkan `0 PROPERTI TAYANG • 1 MENUNGGU REVIEW`, dan terdapat banner evaluasi: `TAHAP PENINJAUAN ADMIN (ESTIMASI 1×24 JAM)`.
4. **Screenshot 4 (Katalog Pencarian User `/listings`)**:
   - Katalog publik hanya menampilkan 9 unit properti mitra lain. **Kost Apalah Daya sama sekali tidak muncul**, sehingga 2 kamar kosong yang siap disewa tidak dapat ditemukan maupun dipesan oleh mahasiswa/pencari kost.

---

### B. Akar Masalah Utama (Root Causes)

1. **Inkonsistensi Nilai Status Properti pada Eksekusi ACC Admin (`KostManagerManagement.tsx` baris 654)**:
   - Ketika Admin menekan tombol *"Setujui seluruh hasil pendataan dan aktifkan layanan Auto-Pilot"* di fungsi `handleApproveAndActivate`, kode memperbarui tabel `properties` dengan:
     ```typescript
     await supabase.from('properties').update({
         status: 'active', // <--- BUG UTAMA: Menyetel 'active' alih-alih 'published'
         is_managed: true,
         owner_uid: req.user_id || prop?.owner_uid,
         updated_at: new Date().toISOString()
     }).eq('id', propId);
     ```
   - Di database Supabase saat ini, properti `Kost Apalah Daya` (`bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`) tercatat dengan nilai `status = 'active'`.

2. **Penyaringan Ketat Query Katalog Publik (`userService.ts` baris 421 & 468)**:
   - Fungsi penarik data katalog publik `getPublishedProperties()` dan `getFilteredProperties()` melakukan filter ketat:
     ```typescript
     query = query.eq('status', 'published');
     ```
   - Karena `Kost Apalah Daya` berstatus `'active'`, query database PostgreSQL secara otomatis mengecualikan properti ini. Listing tidak pernah dikirimkan ke browser user.

3. **Logika Penentuan Status di Dashboard Mitra (`MitraDashboard.tsx` baris 1555, 1699, 1858)**:
   - Komponen `MitraDashboard.tsx` hanya menganggap properti tayang publik jika `p.status === 'published'`:
     ```tsx
     const publishedCount = properties.filter(p => p.status === 'published').length;
     const inReviewCount = properties.filter(p => p.status !== 'published' && p.status !== 'suspended').length;
     ...
     {p.status === 'published' ? <CheckCircle2 /> Tayang Publik : ... : <Clock /> Sedang Ditinjau}
     ```
   - Karena properti bernilai `'active'`, kartu properti secara keliru mengasumsikan properti masih menunggu verifikasi admin.

4. **Kesiapan Pemasaran Kamar Kosong di Antarmuka User**:
   - Di database, data kamar kosong (`Kamar 8` dan `Kamar 9` berstatus `Kosong`, `isAvailable: true`, dengan foto dan fasilitas lengkap) sudah ada.
   - Halaman detail `KostDetail.tsx` sudah siap menampilkan grup tipe kamar dan unit kamar kosong yang dapat dipilih dan dibooking.
   - Namun, kartu katalog `KostCard.tsx` belum memiliki indikator visual yang menonjolkan ketersediaan kamar kosong (misal: badge `2 Kamar Kosong` siap huni), padahal informasi ini sangat penting untuk menarik minat pencari kost.

---

## 2. Dampak Perubahan (File yang Tersentuh)

Perubahan dilakukan secara terukur, komprehensif, dan bertahap:

1. **`functions/public/components/admin/KostManagerManagement.tsx`**:
   - Mengubah `status: 'active'` menjadi `status: 'published'` pada fungsi `handleApproveAndActivate`.
   - Menambahkan pemanggilan `invalidatePropertiesCache()` agar cache data katalog publik langsung diperbarui saat admin melakukan ACC.

2. **`functions/public/userService.ts`**:
   - Memperkuat filter query `getPublishedProperties` dan `getFilteredProperties` dengan mekanisme fail-safe:
     `.or('status.eq.published,and(status.eq.active,is_managed.eq.true)')`.
   - Menjamin bahwa setiap properti kelolaan KostManager yang aktif akan selalu otomatis lolos dan tampil di katalog publik, bahkan jika di masa lalu ada data dengan nilai status `'active'`.

3. **`functions/public/pages/MitraDashboard.tsx`**:
   - Menyelaraskan perhitungan `publishedCount`, `inReviewCount`, badge kartu properti, serta banner peringatan peninjauan agar mengenali properti KostManager (`p.status === 'published' || (p.isManaged && p.status === 'active')`).
   - Hasilnya, pemilik kost langsung melihat status hijau `Tayang Publik` dan kotak "Tahap Peninjauan Admin" otomatis hilang saat properti telah disetujui.

4. **`functions/public/components/KostCard.tsx`**:
   - Menghitung jumlah kamar kosong riil (`vacantRoomsCount`) dari kamar-kamar yang berstatus kosong (`isAvailable: true`).
   - Menambahkan badge dinamis di kartu listing (misal: badge hijau `2 Kamar Kosong` dengan animasi pulse halus, atau badge `Penuh` jika seluruh kamar terisi) untuk memaksimalkan daya tarik pemasaran.

5. **Sinkronisasi Database Supabase**:
   - Memperbarui status data baris `Kost Apalah Daya` (`bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`) dari `status = 'active'` menjadi `status = 'published'` secara langsung di Supabase.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

1. **Langkah 1: Sinkronisasi Status Data di Database Supabase**:
   - Menjalankan perintah update langsung pada database untuk mengubah `Kost Apalah Daya` menjadi `status: 'published'`.

2. **Langkah 2: Perbaikan Logika Persetujuan Admin (`KostManagerManagement.tsx`)**:
   - Mengubah penetapan status pada saat Admin menekan "Setujui & Aktifkan" menjadi `status: 'published'`.
   - Mengimpor dan memanggil `invalidatePropertiesCache()`.

3. **Langkah 3: Penguatan Query Publik (`userService.ts`)**:
   - Memperbarui query katalog agar mendukung `or('status.eq.published,and(status.eq.active,is_managed.eq.true)')`.

4. **Langkah 4: Penyelarasan Status di Dashboard Mitra (`MitraDashboard.tsx`)**:
   - Memperbarui pengecekan status kartu, badge, dan counter properti tayang.

5. **Langkah 5: Pemasaran Visual Kamar Kosong di Kartu Listing (`KostCard.tsx`)**:
   - Menambahkan perhitungan kamar kosong dan menampilkan badge ketersediaan kamar pada setiap kartu properti.

6. **Langkah 6: Pengujian Build & Kompilasi**:
   - Menjalankan `npm.cmd run build` di `functions/public` untuk memastikan 0 error kompilasi TypeScript.

7. **Langkah 7: Dokumentasi & Git Push**:
   - Mencatat progres di `functions/PROGRESS.md` (Entri 405).
   - Menyusun laporan di `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Verifikasi Database**:
   - Memastikan properti `bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f` di tabel `properties` telah berstatus `'published'`.
2. **Verifikasi Dashboard Mitra (`/dashboard-mitra/properties`)**:
   - Header menampilkan: `1 Properti Tayang • 0 Menunggu Review`.
   - Kartu `Kost Apalah Daya` menampilkan badge hijau `TAYANG PUBLIK` (bukan *Sedang Ditinjau*).
   - Banner *Tahap Peninjauan Admin (Estimasi 1x24 Jam)* tidak lagi muncul.
   - Box ketersediaan unit menampilkan `2 dari 10 Kamar Kosong`.
3. **Verifikasi Katalog Publik User (`/listings` & Home)**:
   - `Kost Apalah Daya` muncul di hasil pencarian publik (total bertambah dari 9 unit menjadi 10 unit).
   - Menampilkan badge `TERVERIFIKASI`, `2 TIPE`, badge ketersediaan `2 Kamar Kosong`, serta rentang harga `Rp 800.000 - Rp 1.300.000 /bln`.
4. **Verifikasi Detail Kost (`/kost/kost-apalah-daya`)**:
   - Seksian fasilitas menampilkan 2 tipe kamar kosong yang siap huni (Tipe Standard dan Tipe Premium) dengan ketersediaan masing-masing 1 kamar kosong.
   - Form booking dan tombol chat siap menerima transaksi sewa kamar kosong dari calon penyewa.
