# IMPLEMENTATION PLAN: Migrasi Filter, Pencarian, dan Paginasi Listing Kost ke Backend (Mitra Biasa & Mitra KostManager)

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Filter dan pencarian katalog kost saat ini masih diproses di browser (*Client-Side Filtering*) setelah seluruh data diambil via `getPublishedProperties()`.
- **Kebutuhan Pengguna**:
  - Memindahkan seluruh proses filter, pencarian teks, dan paginasi langsung ke **Backend Database Supabase PostgreSQL**.
  - **Jaminan Inklusivitas Properti**: Filter dan pencarian backend **WAJIB bekerja secara mulus untuk kedua jenis listing**:
    1. **Listing Mitra Biasa** (`is_managed: false`)
    2. **Listing Mitra KostManager** (`is_managed: true`)
    - Seluruh properti dengan status `published` (baik dikelola mandiri oleh mitra maupun di bawah manajemen KostManager) akan difilter secara konsisten berdasarkan judul, alamat, kota, kampus terdekat, tipe hunian, dan rentang tarif.

---

## 2. Arsitektur & Logika Query Backend
1. **Fungsi Query Backend `getFilteredProperties` di `userService.ts`**:
   - Query dasar: `from('properties').select('*', { count: 'exact' }).eq('status', 'published')`.
   - **Pencarian Teks Multi-Kolom**: `.or('title.ilike.%${term}%,address.ilike.%${term}%,area.ilike.%${term}%')` (mencari judul kost, nama jalan/alamat, maupun nama area/kelurahan/kecamatan).
   - **Filter Tipe Kost**: `.eq('type', typeFilter)` (*Putra, Putri, Campur*).
   - **Filter Kota**: `.eq('city', selectedCity)` (*Makassar, Gowa, dll.*).
   - **Filter Kampus**: Matching nama kampus pada properti (*Unhas, UNM, UMI, UIN, Unibos, PNUP, Unismuh, dll.*).
   - **Filter Harga Maksimal**: `.lte('price', maxPrice)` (memeriksa tarif dasar atau varian kamar terendah).
   - **Paginasi Server-Side**: `.range((page - 1) * limit, page * limit - 1)` dan `{ count: 'exact' }`.
   - Mengembalikan data terformat `Kost[]` lengkap dengan flag `isManaged: row.is_managed ?? false`, varian kamar `roomTypes`, foto `imageUrls`, koordinat `location`, fasilitas, dan total record `totalCount`.

2. **Dukungan Opsi Filter Dinamis (`getFilterOptions`)**:
   - Mengambil daftar unik kota (`city`) dan kampus (`campuses`) yang aktif di database untuk mengisi dropdown filter secara otomatis.

3. **Integrasi di `Listings.tsx`**:
   - Menghubungkan form filter dan search bar ke `getFilteredProperties`.
   - Memasang *Debounce 300ms* pada input teks pencarian untuk performa optimal dan bebas lag.
   - Paginasi 9 unit per halaman menggunakan `totalCount` dari backend.
   - Tetap mendukung route pSEO (`/kost-dekat/:campusSlug` dan `/kost-area/:areaSlug`).

---

## 3. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**:
  - `functions/public/userService.ts`
  - `functions/public/pages/Listings.tsx`
- **Proteksi Logika**:
  - Menjaga keutuhan data untuk listing mitra biasa (`is_managed: false`) dan mitra kostmanager (`is_managed: true`).
  - Menjaga fungsi detail modal / navigasi `/kost/:id`.
  - Seluruh ikon menggunakan komponen SVG murni dari `lucide-react` (bebas FOUT 100%).

---

## 4. Langkah-Langkah Eksekusi
1. **Implementasi Query Backend di `userService.ts`**:
   - Tulis `getFilteredProperties(params)` dan `getFilterOptions()`.
2. **Pembaruan `Listings.tsx`**:
   - Integrasikan state filter dengan fetch backend ber-debounce.
   - Tampilkan skeleton loader saat backend sedang merespons query.
   - Render paginasi berdasarkan `totalCount` server.

---

## 5. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
2. **Uji Fungsionalitas di Browser**:
   - Verifikasi bahwa listing **Mitra Biasa** dan **Mitra KostManager** sama-sama muncul pada hasil pencarian dan filter backend.
   - Uji filter Tipe (*Putra, Putri, Campur*), Kota, Kampus, Slider Harga, dan Pencarian teks.
   - Uji Paginasi Halaman 1, 2, ...
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md` (Nomor 289), memperbarui `WALKTHROUGH.md`, dan push ke branch `bukan-productions`.
