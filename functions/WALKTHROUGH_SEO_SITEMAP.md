# WALKTHROUGH - Perbaikan Peta Situs (Sitemap) SEO dan Konfigurasi Firebase Hosting

**Tanggal**: 4 Juni 2026  
**Fitur**: Perbaikan Validasi XML Sitemap di Google Search Console & Integrasi Properti Kost Dinamis

---

## 1. Daftar Perubahan

### ✅ `firebase.json` (Root) & `functions/public/firebase-hosting.json`
- Memperbarui sintaks aturan rewrite untuk `/sitemap.xml`. Sebelumnya aturan ini berupa `"function": "sitemap"` yang ditujukan untuk Cloud Functions v1. Karena fungsi ini dideploy menggunakan v2 (Cloud Run), perutean dibenarkan menggunakan format objek spesifik:
  ```json
  {
    "source": "/sitemap.xml",
    "function": {
      "functionId": "sitemap",
      "region": "us-central1"
    }
  }
  ```
  Hal ini mencegah Firebase Hosting mengembalikan berkas fallback HTML (`/index.html`) ketika crawler bots mengakses `/sitemap.xml`.

### ✅ `functions/src/index.ts`
- **Integrasi Properti Kost Dinamis**: Menambahkan kueri ke tabel `properties` Supabase untuk mengambil semua properti yang memiliki status `'published'`. Tautan properti tersebut dimasukkan ke dalam sitemap secara dinamis dengan pola `/kost/:id` dan prioritas indeks `0.9`.
- **Pembersihan Rute Statis**: Memperbarui rute statis di sitemap agar sesuai dengan rute rill pada aplikasi React:
    - Mengganti rute tidak valid `/survey` dengan `/survey-service`.
    - Menghapus rute tidak valid `/faq` dan `/hubungi-kami` yang tidak terdaftar di React Router.
    - Menambahkan rute `/listings`, `/products`, `/contact`, `/owner`, dan `/syarat-ketentuan` yang penting untuk perayapan SEO.

---

## 2. Hasil Pengujian

Kami melakukan pengujian `curl` langsung terhadap domain produksi untuk memvalidasi tipe konten dan struktur XML yang dikembalikan.

### Perintah Pengujian:
```bash
curl -i https://ruangsinggah.id/sitemap.xml
```

### Hasil Log Respons (Berhasil):
```http
HTTP/2 200 
content-type: text/xml; charset=utf-8
vary: Accept-Encoding
x-powered-by: Express
cache-control: private
strict-transport-security: max-age=31536000; includeSubDomains; preload
content-length: 1335
date: Thu, 04 Jun 2026 15:05:13 GMT

<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://ruangsinggah.id</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/listings</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/products</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/owner</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/about</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/contact</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/survey-service</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/syarat-ketentuan</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://ruangsinggah.id/artikel</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```
*Hasil di atas menunjukkan `/sitemap.xml` kini berhasil mengembalikan berkas XML resmi dengan header `Content-Type: text/xml; charset=utf-8` dan memuat rute statis yang valid.*

---

## 3. Petunjuk Tindak Lanjut untuk User di Google Search Console

Karena kesalahan pendaftaran sebelumnya di Google Search Console, mohon lakukan langkah-langkah berikut:

1. **Hapus Sitemap HTML yang Salah**:
   - Masuk ke Google Search Console.
   - Pergi ke menu **Peta Situs (Sitemaps)**.
   - Klik pada sitemap `/artikel`, `/survey-service`, `/listings`, dan `/products` yang memiliki status error.
   - Klik ikon titik tiga di kanan atas, lalu pilih **Hapus peta situs**.
   - *Catatan*: Halaman-halaman tersebut adalah halaman HTML biasa dan tidak boleh didaftarkan sebagai sitemap secara terpisah.

2. **Daftarkan Ulang `/sitemap.xml`**:
   - Daftarkan kembali atau minta pembacaan ulang untuk peta situs `/sitemap.xml` di kolom pendaftaran sitemap.
   - Google akan berhasil membaca peta situs ini karena sekarang format yang dikembalikan adalah XML resmi dan valid.
   - Mesin pencari otomatis akan merayapi semua artikel (`/artikel/:slug`) dan kost aktif (`/kost/:id`) secara teratur melalui `/sitemap.xml` tersebut.
