# IMPLEMENTATION PLAN - Penerapan URL Ramah SEO (Slug Nama Kost & Area) pada Seluruh Listing

## 1. Analisis Kebutuhan & Masalah

### Kondisi Saat Ini:
Saat ini, setiap halaman detail listing kost diakses menggunakan format URL berbasis UUID murni dari database:
```text
https://ruangsinggah.id/kost/bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f
```

### Keterbatasan URL Berbasis UUID:
1. **Kurang Ramah SEO (Search Engine Optimization)**: Google dan mesin pencari lainnya memprioritaskan kata kunci teks relevan (seperti nama kost, area/kecamatan, dan kota) di dalam URL untuk meningkatkan posisi ranking pencarian.
2. **Keterbacaan Rendah (*Low Readability*)**: Calon penyewa tidak dapat mengetahui nama atau lokasi kost hanya dengan melihat link yang dibagikan melalui WhatsApp atau media sosial.
3. **Potensi Masalah Nama Kembar**: Sistem membutuhkan arsitektur penamaan URL yang mampu mengantisipasi jika terdapat beberapa kost yang memiliki nama sama (misal *"Kost Melati"* atau *"Kost Pelangi"*).

### Solusi Terpilih (Opsi 1 - Standar Airbnb & Mamikos):
Format URL cerdas dan dinamis:
```text
https://ruangsinggah.id/kost/{nama-kost}-{area/kota}-{uuid}
```
**Contoh Nyata:**
- `/kost/kost-apalah-daya-tamalanrea-bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`
- `/kost/kost-putri-anggrek-panakkukang-7f8a12bc-...`

**Keunggulan Desain Ini:**
1. **100% Bebas Tabrakan Nama (Zero Collision)**: Jika terdapat 2 kost bernama sama di area yang sama, keduanya tetap memiliki URL unik karena pembeda ID di bagian akhir.
2. **Kekuatan SEO Maksimal**: Kata kunci penting seperti `kost`, `nama kost`, dan `lokasi/kecamatan` terbaca secara jelas oleh mesin pencari Google.
3. **Performa Instan Tanpa Mengubah Skema Database**: Tidak memerlukan penambahan kolom database atau query pencocokan string berat, sehingga query database tetap berjalan instan menggunakan primary key.
4. **Jaminan Kompatibilitas Mundur (Backward Compatibility)**: Tautan lama berbasis UUID murni yang sudah pernah dibagikan atau tersimpan di bookmark pengguna tetap berfungsi 100% dan secara otomatis di-update ke URL slug baru (*Canonical URL*).

---

## 2. Dampak Perubahan

File yang akan disentuh:
1. **File Baru** `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\utils\slugUtils.ts`:
   - Membuat modul helper `createKostSlug(kost)` untuk mengubah nama kost dan area menjadi slug bersih (kebab-case) bebas karakter aneh/emoji.
   - Membuat modul helper `extractKostId(param)` untuk mengekstrak UUID secara presisi dari parameter URL.
2. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\App.tsx`:
   - Memperbarui fungsi navigasi `handleKostSelect` agar mengarahkan rute ke URL slug baru `/kost/${createKostSlug(kost)}`.
   - Memperbarui `KostDetailWrapper` agar menggunakan `extractKostId(id)` dalam memuat data properti.
   - Memperbarui browser address bar (*Canonical URL replaceState*) saat link lama UUID diakses.
3. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\pages\KostDetail.tsx`:
   - Menyelaraskan meta tag `canonicalUrl` dan tombol bagikan/share WhatsApp agar menggunakan format slug baru.
4. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\pages\MitraDashboard.tsx`:
   - Memperbarui tombol **Preview** agar membuka pratinjau dengan format URL slug baru yang rapi.
5. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\components\admin\PropertyManagement.tsx` & `KostManagerPortal.tsx`:
   - Menyelaraskan tautan "Kunjungi Halaman Publik" agar mengarah ke format URL slug baru.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Menunggu Persetujuan / ACC)

### Langkah 1: Pembuatan Helper Slug Generator & Parser (`slugUtils.ts`)
- Fungsi `createKostSlug`:
  - Mengambil judul properti (`title` / `namaKost`) dan lokasi (`area` / `city`).
  - Menghapus simbol khusus, tanda kurung, dan emoji.
  - Mengonversi ke huruf kecil dan mengganti spasi berlebih dengan tanda hubung `-`.
  - Menggabungkan slug teks dengan UUID di bagian akhir.
- Fungsi `extractKostId`:
  - Menggunakan regex UUID `/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i` untuk mengambil UUID asli baik dari URL slug baru maupun URL UUID lama.

### Langkah 2: Integrasi Perutean di `App.tsx` & `KostDetailWrapper`
- Mengadaptasi `KostDetailWrapper`:
  ```typescript
  const { id } = useParams();
  const realPropertyId = extractKostId(id || '');
  ```
- Saat properti berhasil dimuat, sinkronkan URL browser jika URL saat ini masih menggunakan format UUID lama tanpa me-reload halaman (*smooth canonical replace*).
- Menyesuaikan `handleKostSelect` agar menghasilkan navigasi `/kost/${createKostSlug(kost)}`.

### Langkah 3: Penyelarasan di Komponen Tautan Terkait
- Perbarui navigasi tombol Preview di `MitraDashboard.tsx`.
- Perbarui tautan publik di `KostDetail.tsx` (SEO canonical & share URL).
- Perbarui tautan publik di portal admin (`PropertyManagement.tsx` & `KostManagerPortal.tsx`).

### Langkah 4: Uji Kompilasi & Pengujian
- Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi TypeScript/Vite.

### Langkah 5: Pencatatan Riwayat & Git Push
- Catat ke `functions/PROGRESS.md` sebagai **Fitur #268**.
- Terbitkan dokumen laporan `WALKTHROUGH.md`.
- Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Kompilasi**: `npm run build` selesai tanpa error.
- **Verifikasi Navigasi dari Katalog**:
  - Klik salah satu kost di halaman Beranda / Katalog.
  - Pastikan URL browser berubah menjadi:
    `http://localhost:5173/kost/nama-kost-area-bb6b0ccc-...`
- **Verifikasi Tombol Preview di Dashboard Mitra**:
  - Klik tombol **Preview** pada kartu kost di "Kost Saya".
  - Pastikan URL yang terbuka berformat slug ramah SEO.
- **Verifikasi Kompatibilitas Mundur (Backward Compatibility)**:
  - Akses URL langsung menggunakan format UUID lama: `http://localhost:5173/kost/bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`.
  - Halaman tetap terbuka dengan sukses dan URL di address bar otomatis diperbarui ke format slug baru.
- **Verifikasi Sanitasi Teks**:
  - Uji nama kost yang memiliki karakter khusus (seperti tanda petik, tanda kurung, garis miring) terkonversi rapi menjadi huruf kecil dan tanda hubung.
