# WALKTHROUGH - Programmatic SEO (pSEO) untuk Halaman Kampus & Area Makassar

Dokumen ini berisi rangkuman perubahan dan panduan deployment untuk peningkatan SEO RuangSinggah.id melalui rute dinamis (clean URL paths) yang berfokus pada kampus dan wilayah populer di Makassar.

## 1. Daftar Perubahan Secara Mendetail

### A. Konfigurasi Routing Frontend (`functions/public/App.tsx`)
* Menambahkan dua rute baru untuk Listings page agar mesin pencari dapat langsung merayapi dan mendarat pada rute spesifik kampus atau wilayah:
  * `/kost-dekat/:campusSlug` -> Menampilkan daftar kost di dekat kampus tertentu.
  * `/kost-area/:areaSlug` -> Menampilkan daftar kost di wilayah tertentu.
* Rute ini dipetakan langsung ke komponen `<Listings />` agar tetap mempertahankan filter dinamis dan interaktivitas pencarian.

### B. Sinkronisasi State & Filter Pencarian (`functions/public/pages/Listings.tsx`)
* Mengimpor `useParams` dari `react-router-dom` dan `Helmet` dari `react-helmet-async`.
* Menambahkan fungsi utilitas `slugify` untuk melakukan konversi nama kampus/area menjadi string slug yang ramah SEO.
* Mengupdate `useEffect` sinkronisasi filter agar:
  * Jika `campusSlug` terdeteksi, program secara case-insensitive mencocokkan slug dengan daftar kampus aktif yang tersedia di data properti. Jika tidak ditemukan kecocokan langsung, program menggunakan pemetaan fallback ke kampus-kampus besar (Unhas, UNM, UMI, UIN, dll).
  * Jika `areaSlug` terdeteksi, program mencocokkannya dengan properti `area` kost atau menerjemahkan tanda pisah `-` menjadi spasi untuk dijadikan kata kunci pencarian.
* Memperbarui memo `filteredKosts` agar kolom `k.area` kost ikut diperiksa saat pencarian teks dijalankan, sehingga pencarian area ("jl sahabat", "tamalanrea", dll) menghasilkan daftar yang sangat akurat.

### C. Injeksi Metadata SEO Dinamis via React Helmet (`functions/public/pages/Listings.tsx`)
* Menghitung Title, Description, dan Canonical URL yang dinamis dan relevan secara real-time berdasarkan slug kampus/area atau filter aktif:
  * **Contoh Title /kost-dekat/unhas**: `Kost Dekat Unhas (Universitas Hasanuddin) Makassar Murah Terverifikasi - RuangSinggah.id`
  * **Contoh Description /kost-dekat/unhas**: `Cari kost dekat kampus Unhas (Universitas Hasanuddin) Makassar murah dan terverifikasi 100% bebas zonk. Dapatkan pilihan kost putra, putri, dan campur terbaik dengan fasilitas lengkap di RuangSinggah.id.`
  * **Contoh Title /kost-area/jl-sahabat**: `Kost Area Jl Sahabat Makassar Murah Terverifikasi - RuangSinggah.id`
  * **Contoh Description /kost-area/jl-sahabat**: `Daftar kost murah terdekat di area Jl Sahabat Makassar. Temukan hunian kos putra, putri, campur dengan fasilitas lengkap dan terverifikasi lapangan di RuangSinggah.id.`
* Menggunakan `<Helmet>` untuk menyuntikkan data tersebut ke `<head>` dokumen beserta properti Open Graph (og:title, og:description, og:url) dan Twitter Card.

### D. Tautan Internal SEO pada Footer (`functions/public/components/Footer.tsx`)
* Mengimpor `<Link>` dari `react-router-dom` agar navigasi berjalan secara instan di sisi klien (Single Page Application) tanpa memicu reload halaman penuh, sementara robot perayap Google tetap dapat menemukan tautan fisik (`href`).
* Menambahkan baris tautan horizontal untuk kategori populer di Makassar tepat di atas bagian copyright kaki situs:
  * **Kampus Populer**: Unhas, UNM, UMI, UIN Alauddin, Unibos, PNUP, Unismuh.
  * **Area Populer**: Jl Sahabat, Tamalanrea, Panakkukang, Rappocini, Paropo.

### E. Integrasi Peta Situs Dinamis (`functions/src/index.ts`)
* Memperbarui Cloud Function `sitemap` untuk menyertakan pengambilan properti `campuses` dan `area` dari tabel `properties` Supabase.
* Membuat fungsi pembantu `slugify` di sisi server.
* Mengekstrak seluruh nama kampus dan nama area unik yang memiliki status `'published'` di database.
* Memasukkan URL dinamis berikut ke dalam XML `/sitemap.xml`:
  * `/kost-dekat/:campusSlug`
  * `/kost-area/:areaSlug`
* Pengubahan ini menjamin sitemap.xml selalu menyajikan data kampus & area terupdate secara dinamis kepada Google Search Console.

---

## 2. Hasil Pengujian & Kompilasi
1. **Verifikasi Backend TypeScript**:
   * Menjalankan build tsc di folder `functions`: Berhasil terkompilasi tanpa error.
2. **Verifikasi Frontend Bundler**:
   * Menjalankan build Vite production di folder `public`: Berhasil mem-bundle dan menghasilkan file build `dist/assets/Listings-9iQH2-FM.js` dan aset-aset lainnya tanpa kesalahan.

---

## 3. Petunjuk Deploy

User/Admin dapat mendeploy pembaruan ini dengan langkah berikut:

1. **Deploy Firebase Cloud Functions (Sitemap XML Update)**:
   Jalankan perintah berikut di folder root proyek untuk mendeploy pembaruan pada fungsi sitemap:
   ```bash
   firebase deploy --only functions:sitemap
   ```

2. **Deploy Frontend (Cloudflare Pages)**:
   Karena repositori terhubung ke GitHub, perubahan pada frontend cukup di-push ke branch utama (`main` atau `master`) untuk memicu build otomatis di Cloudflare Pages:
   ```bash
   git add .
   git commit -m "feat(seo): implement programmatic SEO routes and dynamic sitemap integration"
   git push origin main
   ```
