# WALKTHROUGH - Milestone #490: Smart Orders Navigation, Resolusi Foto Kamar Riil, & Eliminasi Modal Thumbnail

**Tanggal:** 04 November 2026  
**Status:** Berhasil Diimplementasikan & Lulus Uji Kompilasi Build (0 Error)  
**Branch:** `bukan-productions`

---

## 1. Ringkasan Pekerjaan & Masalah yang Diselesaikan

Berdasarkan masukan dan persetujuan pengguna (*"okee jalankan"*), Milestone #490 berhasil menyelesaikan 3 aspek utama pada halaman Orders / Kost Saya (`/my-bookings`):

1. **Smart Context-Aware Default Tab Orders**:
   - **Sebelumnya:** Setiap kali pengguna mengunjungi menu Orders dari navbar bawah (`/my-bookings`), sistem selalu memaksa mendarat di tab "Diajukan" (`/my-bookings/diajukan`). Jika pengguna sudah memiliki sewa aktif dan tidak sedang mengajukan kost baru, layar menampilkan state kosong *"Belum Ada Pengajuan"* meskipun badge tab "Aktif" menunjukkan angka 1.
   - **Sesudah:** Sistem mengevaluasi data sewa pengguna secara cerdas. Jika pengguna memiliki sewa aktif (`residentStatus.length > 0`), navigasi ke `/my-bookings` secara otomatis langsung mengarahkan ke tab **AKTIF** (`/my-bookings/aktif`) sehingga penyewa langsung melihat kartu kost yang sedang disewanya. Tab "Diajukan" hanya dijadikan default jika pengguna tidak memiliki sewa aktif.

2. **Resolusi Foto Kamar Riil Sesuai Tipe Kamar / Nomor Kamar**:
   - **Sebelumnya:** Pada kartu pesanan/sewa, foto pratinjau yang muncul adalah foto gerbang / pagar depan kost ("Bangunan Depan"). Hal ini terjadi karena foto unit kamar disimpan di `properties.image_urls` dengan label tertentu (seperti `"Kamar: Standard"`), namun ketika `currentRoom.images` kosong, kode fallback secara eksplisit mencari foto berlabel `"bangunan depan"` (`frontBuildingImg`).
   - **Sesudah:** Diterapkan fungsi resolver hirarkis `resolveRoomPhotos` yang secara presisi mencocokkan foto dengan tipe kamar yang disewa (untuk Kost Biasa, e.g. `"Kamar: Standard"`) atau nomor kamar (untuk KostManager, e.g. `"Unit 101"` / `"Kamar 1"`), dengan memprioritaskan kategori kamar tidur/interior dibanding foto kamar mandi, dapur, atau fasad bangunan.

3. **Eliminasi Modal Pembesaran Thumbnail**:
   - **Sebelumnya:** Mengklik foto thumbnail kartu pesanan membuka modal galeri yang membesarkan gambar, yang dinilai pengguna kurang berguna (*"kurang berguna"*).
   - **Sesudah:** Handler `onClick`, kelas kursor pointer, dan pemicu modal galeri pada container foto thumbnail telah dieliminasi. Foto kini berfungsi sebagai thumbnail pratinjau yang bersih, elegan, dan statis tanpa memicu popup.

---

## 2. Rincian Perubahan Kode

### File: `functions/public/pages/MyKost.tsx`

1. **Penerapan Helper `normalizePhotoUrl` & `resolveRoomPhotos`**:
   - Didefinisikan di level modul untuk standardisasi penanganan URL storage dan pemetaan foto unit kamar.
   - Prioritas resolusi foto:
     1. `currentRoom.categorized_photos` / `categorizedPhotos` (kategori: interior, kasur, tempat tidur, kamar tidur).
     2. `currentRoom.images` array.
     3. Pencarian cerdas pada `properties.image_urls`:
        - KostManager: Mencocokkan label nomor kamar (`kamar: <no>`, `unit <no>`).
        - Kost Biasa: Mencocokkan label tipe kamar (`kamar: <type>`, e.g. "Kamar: Standard").
        - Memprioritaskan foto kamar tidur riil dan mengabaikan foto eksterior (`bangunan depan`, `fasad`, `parkir`).
     4. Fallback: Foto kamar tidur pertama yang tersedia, bukan foto fasad depan.

2. **Smart Tab Redirection pada `useEffect` & `fetchMyKosts`**:
   ```typescript
   // Sync state with URL
   useEffect(() => {
       if (tabParam) {
           const validTabs = ['diajukan', 'aktif', 'riwayat'];
           if (validTabs.includes(tabParam)) {
               setActiveTab(tabParam as any);
           } else {
               navigate(`${Page.MY_BOOKINGS}/diajukan`, { replace: true });
           }
       } else if (!loading) {
           // Smart context-aware default tab when landing on /my-bookings
           const hasActive = residentStatus.length > 0;
           const target = hasActive ? 'aktif' : 'diajukan';
           setActiveTab(target);
           navigate(`${Page.MY_BOOKINGS}/${target}`, { replace: true });
       }
   }, [tabParam, loading, residentStatus.length, navigate]);
   ```
   - Di akhir fungsi `fetchMyKosts`: Ditambahkan sinkronisasi langsung saat data sewa aktif (`uniqueActive`) berhasil dimuat dari database.
   - Pada `handleTabChange`: Ditambahkan `setActiveTab(tab)` untuk respon navigasi instan (optimistic UI update).

3. **Integrasi Resolver ke Seluruh Alur Data**:
   - Pemetaan pesanan `kostsData` (baris ~903-939).
   - Pemetaan sewa aktif `mapResidentStatus` (baris ~1125-1154).
   - Fallback `rawClaim` untuk sewa terkelola (baris ~1430-1437).

4. **Pembersihan Container Foto Thumbnail Kartu Pesanan (baris ~2538-2565)**:
   - Dihapus: `onClick={() => heroImage && handleOpenGallery(...)}`
   - Dihapus: `cursor-pointer`, `group/img`, `title="Klik untuk melihat foto kamar & hunian"`
   - Dihapus: `transform hover:scale-[1.02]`, `group-hover/img:scale-105`, `group-hover/img:opacity-100`

---

## 3. Hasil Pengujian & Kompilasi

### A. Uji Kompilasi Frontend Vite (`npm run build`)
Perintah: `npm.cmd --prefix functions/public run build`
Hasil:
```
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
../../public/assets/MyKost-RlZUYopQ.js                 192.06 kB │ gzip:  46.17 kB
✓ built in 33.33s
```
**Status: 0 Error, Berhasil 100%.**

### B. Hasil Simulasi Pencocokan Foto Unit Kamar
- Data properti Kost Ryuta diuji dengan tipe kamar "Standard":
  - Label `properties.image_urls`: `"Kamar: Standard"`, `"Kamar Mandi: Standard"`, `"Bangunan Depan"`.
  - Hasil resolver: Foto yang terpilih sebagai `heroImage` dan `displayImg` adalah foto `Kamar: Standard` (`1793157885194_cuz1sg...webp`), bukan foto gerbang `"Bangunan Depan"`.

---

## 4. Panduan Verifikasi Pengguna (User Testing Guide)

Untuk menguji perubahan ini langsung di antarmuka web:

1. **Pengujian Default Tab Orders**:
   - Pastikan akun Anda memiliki 1 penyewaan aktif (misal: Kost Ryuta).
   - Klik menu navigasi **Orders** di navbar bawah.
   - **Hasil yang Diharapkan:** Halaman otomatis langsung membuka tab **AKTIF** (`/my-bookings/aktif`) dan langsung memperlihatkan kartu sewa Anda (tidak lagi membuka tab "Diajukan" yang kosong).
   - Coba klik manual tab "Diajukan" atau "Riwayat": Sistem tetap mengizinkan Anda berpindah tab secara normal.

2. **Pengujian Foto Pratinjau Kamar**:
   - Perhatikan kartu sewa Kost Ryuta pada tab **AKTIF**.
   - **Hasil yang Diharapkan:** Gambar pratinjau kamar kini menampilkan foto interior kamar tipe Standard (kamar tidur dengan kasur/lemari), bukan lagi foto gerbang/pagar depan kost.

3. **Pengujian Eliminasi Modal Pembesaran**:
   - Klik foto thumbnail kamar pada kartu sewa tersebut.
   - **Hasil yang Diharapkan:** Foto tidak memunculkan popup modal yang membesar, kartu tetap rapi dan tidak mengganggu alur interaksi pengguna.
