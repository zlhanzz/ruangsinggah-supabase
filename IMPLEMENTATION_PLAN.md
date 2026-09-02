# IMPLEMENTATION PLAN: Perbaikan Tampilan Foto Listing pada Sesi Admin & Sinkronisasi Data Real-Time di Halaman Detail

## 1. Analisis Masalah

### A. Gejala yang Ditemukan
- Pengguna melaporkan bahwa foto listing kost ("Kost Apalah Daya") **muncul sempurna** ketika diakses oleh pengguna biasa (real user), pada perangkat mobile, maupun dalam kondisi belum login (guest).
- Namun, ketika diakses oleh akun **Administrator** yang membuka pratinjau / halaman publik dari Desktop, foto utama dan thumbnail tampil sebagai kotak gelap dengan broken image icon (`Thumbnail 1`, `Thumbnail 2`, dst.).

### B. Investigasi Akar Masalah
1. **Stale State Caching di `KostDetailWrapper` (`App.tsx`)**:
   - Di `App.tsx:573-585`, `KostDetailWrapper` mengambil data awal dari state `listings.find(...)` yang dimuat saat aplikasi pertama kali dibuka.
   - Terdapat kondisi penahan:
     ```typescript
     if (!kost || kost.id !== realPropertyId) {
       // getPublishedPropertyDetails hanya dipanggil jika kost belum ada di listings
     }
     ```
   - Akun Admin di desktop yang sudah membuka website sejak awal menyimpan snapshot `listings` lama di memori tab. Ketika admin membuka `/kost/...`, `KostDetailWrapper` mendeteksi bahwa properti sudah ada di `listings`, sehingga **melewatkan pemanggilan `getPublishedPropertyDetails(realPropertyId)`**.
   - Sebaliknya, pada HP / tab incognito / guest, aplikasi dimuat dari nol sehingga langsung mengambil data properti terbaru dari server.
2. **Ketiadaan Resolver `getDisplayImageUrl` & Metadata di `getAdminProperties` (`adminService.ts`)**:
   - Pada `adminService.ts:394-403`, pembacaan data properti admin (`getAdminProperties`) memetakan `image_urls` mentah tanpa melalui `getDisplayImageUrl` / `getDisplayImageObject`, serta belum menyertakan `photosMeta`, `photoCategories`, dan `categorizedPhotos`.
   - Jika admin melakukan navigasi internal atau membuka review modal, objek properti membawa URL yang belum teresolusi ke CDN proxy `media.ruangsinggah.id`.
3. **Penyelarasan `photosMeta` & Verifikasi Role Admin di `userService.ts`**:
   - Di `getPublishedProperties` dan `getPublishedPropertyDetails`, pemetaan `photosMeta` sebelumnya hanya memetakan `rawImages` dan belum memprioritaskan `row.metadata?.photos_meta`.
   - Pemeriksaan admin pada mode preview draft perlu dipastikan membaca role admin dari database secara akurat.

---

## 2. Dampak Perubahan File

1. **`functions/public/App.tsx`**:
   - Menerapkan pola **Stale-While-Revalidate** pada `KostDetailWrapper`: menggunakan data dari `listings` untuk render instan 0ms pertama, namun **selalu melakukan background fetch `getPublishedPropertyDetails(realPropertyId)`** agar data foto dan harga langsung tersinkronisasi ke versi paling mutakhir tanpa terhalang stale state.
2. **`functions/public/adminService.ts`**:
   - Memperbarui `getAdminProperties` agar menggunakan `getDisplayImageUrl` dan `getDisplayImageObject`, serta memetakan `photosMeta`, `photoCategories`, dan `categorizedPhotos`.
3. **`functions/public/userService.ts`**:
   - Memperbarui `getPublishedProperties` dan `getPublishedPropertyDetails` agar konsisten memetakan `photosMeta` dari `row.metadata?.photos_meta || rawImages`.
   - Memperkuat verifikasi role admin pada mode preview draft properti.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

### Langkah 1: Pembaruan `KostDetailWrapper` di `App.tsx`
- Mengubah `useEffect` di `KostDetailWrapper` agar selalu mengeksekusi `getPublishedPropertyDetails(realPropertyId)`:
  ```typescript
  useEffect(() => {
    async function loadKost() {
      if (!realPropertyId) return;
      try {
        const data = await getPublishedPropertyDetails(realPropertyId);
        if (data) {
          setKost(data);
        }
      } catch (e) {
        console.error('Failed to refresh property details:', e);
      } finally {
        setLoading(false);
      }
    }
    loadKost();
  }, [realPropertyId]);
  ```

### Langkah 2: Penyempurnaan `getAdminProperties` di `adminService.ts`
- Mengimpor `getDisplayImageUrl` dan `getDisplayImageObject` dari `userService.ts`.
- Memetakan field `imageUrls: images`, `photosMeta`, `photoCategories`, dan `categorizedPhotos` pada objek yang dikembalikan oleh `getAdminProperties`.

### Langkah 3: Penyelarasan `getPublishedPropertyDetails` di `userService.ts`
- Memastikan `photosMeta` memprioritaskan `row.metadata?.photos_meta || rawImages`.
- Memastikan pemeriksaan admin pada mode preview mencakup pemeriksaan tabel `users`.

### Langkah 4: Uji Kompilasi & Build
- Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
- Memperbarui `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
- Melakukan git commit dan git push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

| Skenario Pengujian | Hasil yang Diharapkan |
|---|---|
| **Admin Membuka Halaman Publik `/kost/...`** | Foto tampil 100% sempurna di sesi Admin Desktop tanpa broken image. |
| **User Guest / Mobile Membuka `/kost/...`** | Foto tetap tampil normal dan cepat. |
| **Navigasi Internal dari Admin Panel** | Halaman detail kost selalu menampilkan data foto dan harga terupdate. |
| **Kompilasi TypeScript** | `npm run build` lulus 100% dengan exit code 0. |

---

> **Status:** Menunggu persetujuan (*Proceed / ACC*) dari Pengguna sebelum eksekusi kode (Fase 2).
