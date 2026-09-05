# Rencana Implementasi (Implementation Plan): Optimasi Scroll Listing (Penghapusan Lazy Load Kartu) & Maksimalisasi Caching Database (SWR / Cache-First)

## 1. Analisis Masalah & Kebutuhan Pengguna

### A. Masalah Scroll Kasar / Stutter pada Listing
1. **Penyebab Scroll Kasar**:
   - Pada kartu properti (`KostCard.tsx`), gambar listing menggunakan atribut `loading="lazy"` dengan transisi opacity dinamis dan state `imageLoaded`.
   - Ketika pengguna menggulir (scroll) halaman listing di mobile/desktop, browser memicu *deferred image decoding* dan React memicu re-render individual saat gambar masuk ke viewport. Hal ini menyebabkan *frame drop* / micro-stutter pada saat scroll.
   - Karena katalog kost saat ini sudah menerapkan **Pagination (9 unit per halaman)**, mekanisme `loading="lazy"` untuk 9 gambar menjadi tidak diperlukan dan justru memperlambat kelancaran visual saat scrolling.

### B. Maksimalisasi Caching Database (Cache-First / SWR)
1. **Pencegahan Over-Fetching & Akses Instan (0ms)**:
   - Saat ini, setiap perpindahan halaman (Halaman 1 ➔ 2 ➔ 1), filter pencarian, atau saat pengguna kembali dari halaman detail kost (`/kost/:id`) ke listing (`/listings`), sistem melakukan query ulang mentah ke Supabase.
   - Pengguna meminta agar **caching dimaksimalkan** untuk menjamin navigasi instan, responsif, dan hemat kuota database.
2. **Strategi Caching**:
   - Menerapkan **In-Memory & SessionStorage Caching** dengan TTL terukur (5 menit) pada `getFilteredProperties` dan `getAvailableFilterOptions` di `userService.ts`.
   - Menggunakan Cache Key deterministik berdasarkan kombinasi parameter (`page`, `searchTerm`, `city`, `district`, `campus`, `type`, `maxPrice`).

---

## 2. Dampak Perubahan (File yang Terpengaruh)

| No | File | Perubahan |
|---|---|---|
| 1 | `functions/public/components/KostCard.tsx` | Menghapus `loading="lazy"` dan transisi re-render berat pada gambar; memuat gambar secara langsung (`loading="eager"`) dengan container aspect ratio yang stabil untuk scroll 60fps tanpa jank. |
| 2 | `functions/public/userService.ts` | Mengimplementasikan strategi **Cache-First (SWR)** dengan in-memory cache map & sessionStorage untuk `getFilteredProperties` dan `getAvailableFilterOptions`. |
| 3 | `functions/public/pages/Listings.tsx` | Mengoptimalkan rendering daftar kartu dan sinkronisasi cache saat paginasi/filter. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Pasca-Approval)

1. **Optimasi Gambar pada `KostCard.tsx`**:
   - Menghapus atribut `loading="lazy"` dari tag `<img>` dan menggunakan pemuatan langsung (`decoding="async"`, `loading="eager"`).
   - Menjaga rasio dimensi container tetap stabil (`h-48 sm:h-52`) dengan background dasar `bg-slate-100` untuk mencegah layout shift.
   - Menyederhanakan handler load agar tidak memicu re-render React berlebihan saat scroll.
2. **Implementasi Caching Maksimal pada `userService.ts`**:
   - Menambahkan struktur `propertiesCache = new Map<string, { data: any; timestamp: number }>()` dengan TTL 5 menit.
   - Pada `getFilteredProperties`, cek apakah ada cache valid untuk key query yang sama. Jika ada, langsung kembalikan data dari cache (0ms).
   - Pada `getAvailableFilterOptions`, cache opsi dropdown lokasi/kampus agar tidak berulang kali memanggil database.
   - Menyediakan fungsi `invalidatePropertiesCache()` untuk membersihkan cache ketika ada penambahan/edit properti.
3. **Kompilasi & Pengujian**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan kompilasi 100% bebas error.
4. **Pencatatan Progres & Walkthrough**:
   - Menambahkan catatan progres ke `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Kompilasi**: `npm run build` berhasil 100%.
- [ ] **Uji Kelancaran Scroll**: Menguji scroll pada halaman `/listings` di perangkat mobile dan desktop untuk memastikan rendering kartu mulus (60fps) tanpa stutter.
- [ ] **Uji Caching**: Berpindah dari Halaman 1 ke Halaman 2 lalu kembali ke Halaman 1, memastikan data tampil instan 0ms dari cache lokal tanpa jeda loading berulang.
