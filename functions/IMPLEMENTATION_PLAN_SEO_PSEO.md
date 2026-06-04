# IMPLEMENTATION PLAN - Programmatic SEO (pSEO) untuk Halaman Kampus & Area Makassar

Dokumen ini disusun untuk mengimplementasikan strategi Programmatic SEO pada platform `ruangsinggah.id` agar situs muncul di papan teratas Google untuk pencarian non-spesifik seperti "kost murah makassar", "kost dekat unhas", "kos dekat unm", "kost area jl sahabat", dan kata kunci lokal lainnya.

## 1. Analisis Masalah
* **Tantangan Utama**: Halaman pencarian saat ini menggunakan format *query parameters* (seperti `/listings?campus=Unhas`), yang kurang ramah untuk dirayapi dan diindeks oleh robot pencari (search engine crawler).
* **Solusi**:
  1. Membuat struktur URL yang bersih, statis, dan berorientasi SEO:
     - `/kost-dekat/:campusSlug` (misalnya: `/kost-dekat/unhas`, `/kost-dekat/unm`, dll.)
     - `/kost-area/:areaSlug` (misalnya: `/kost-area/jl-sahabat`, `/kost-area/tamalanrea`, dll.)
  2. Mengintegrasikan komponen `<Helmet>` dari `react-helmet-async` pada halaman `Listings.tsx` secara dinamis guna menghasilkan Meta Title, Description, dan Canonical URL yang disesuaikan secara khusus dengan kata kunci yang ditargetkan.
  3. Memperluas pembuatan peta situs dinamis (`sitemap` Cloud Function) agar secara berkala menelusuri data properti aktif dan mendaftarkan URL `/kost-dekat/*` serta `/kost-area/*` ke dalam berkas `sitemap.xml`.
  4. Menambahkan bagian tautan internal (Internal Linking) pada `Footer.tsx` untuk kampus dan wilayah populer di Makassar agar mempermudah transfer otoritas (PageRank) dan mempercepat penjelajahan robot pencari.

## 2. Dampak Perubahan
File yang akan diubah meliputi:
* `functions/public/App.tsx`: Menambahkan definisi rute React Router untuk `/kost-dekat/:campusSlug` dan `/kost-area/:areaSlug`.
* `functions/public/pages/Listings.tsx`: Sinkronisasi parameter rute ke dalam state filter, penyempurnaan query filter area pada database lokal/frontend, dan penambahan injeksi metadata dinamis via `<Helmet>`.
* `functions/public/components/Footer.tsx`: Menambahkan daftar tautan internal menggunakan `<Link>` ke rute-rute SEO populer.
* `functions/src/index.ts`: Memperbarui fungsi generator sitemap dinamis untuk mengueri list kampus & area aktif dari properti yang dipublikasikan dan menambahkannya ke XML.

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Routing di `App.tsx`**:
   - Daftarkan rute `/kost-dekat/:campusSlug` dan `/kost-area/:areaSlug` untuk me-render komponen `Listings`.
2. **Penyempurnaan Filter & Metadata di `Listings.tsx`**:
   - Ekstrak parameter `campusSlug` dan `areaSlug` menggunakan `useParams()`.
   - Tambahkan fungsi pembantu `slugify` untuk membandingkan slug dengan data kampus/area yang ada.
   - Sinkronkan slug tersebut ke dalam filter state.
   - Buat fungsi komputasi meta deskripsi dan judul SEO berdasarkan kampus/area aktif.
   - Masukkan tag `<Helmet>` yang memuat Title, Description, Canonical URL, Open Graph (og:title, og:description), dan Twitter Card.
3. **Pemberian Tautan Internal di `Footer.tsx`**:
   - Buat modul navigasi SEO horizontal di atas bagian copyright kaki situs yang memetakan rute-rute utama secara rapi.
4. **Pembaruan Cloud Function `sitemap` di `functions/src/index.ts`**:
   - Ubah kueri properti untuk menyertakan kolom `campuses` dan `area`.
   - Ekstrak seluruh daftar kampus dan area aktif unik.
   - Loop dan tambahkan URL `/kost-dekat/:slug` dan `/kost-area/:slug` ke dalam output XML sitemap.
5. **Kompilasi & Pengujian**:
   - Jalankan `npm run build` pada folder `functions` untuk memvalidasi kompatibilitas TypeScript.
   - Uji sitemap dinamis secara lokal atau verifikasi skrip sitemap.

## 4. Rencana Verifikasi
* **Verifikasi Routing**: Akses rute `/kost-dekat/unhas` dan `/kost-area/jl-sahabat` untuk memastikan halaman Listing memuat data kost yang sesuai tanpa kesalahan perutean.
* **Verifikasi Metadata**: Periksa tag `<title>` dan `<meta name="description">` pada inspect element (DOM) untuk memastikan deskripsi SEO dinamis terisi dengan benar sesuai kata kunci.
* **Verifikasi Sitemap**: Jalankan server fungsi Firebase local atau verifikasi sitemap setelah build untuk memastikan format XML tetap valid dan rute-rute baru terdaftar secara dinamis.
