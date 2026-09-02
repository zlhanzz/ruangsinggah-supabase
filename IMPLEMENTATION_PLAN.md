# IMPLEMENTATION PLAN: Interactive In-App Route Preview pada Mini Peta Halaman Detail Kost (`KostDetail.tsx`)

## 1. Analisis Kebutuhan & Masalah

### A. Latar Belakang & Kebutuhan Pengguna
- **Kondisi Saat Ini**:
  - Pada bagian *"Lokasi & Lingkungan"* di `KostDetail.tsx`, terdapat mini map preview (iframe Google Maps) yang menampilkan titik lokasi kost.
  - Di bawahnya terdapat daftar *"Kampus Terdekat"* dan *"Fasilitas Publik Terdekat"* dengan tombol *"Rute"*.
  - Ketika tombol *"Rute"* diklik, sistem membuka tab baru ke website/aplikasi Google Maps eksternal (`window.open` / `target="_blank"`), yang membuat pengguna terlempar keluar dari website RuangSinggah.
- **Tujuan Pengembangan**:
  - Pengguna ingin agar ketika tombol *"Rute"* pada kampus atau fasilitas publik diklik, pengguna **tidak perlu keluar dari aplikasi**.
  - Mini preview peta di bagian atas akan **langsung beralih fungsi menjadi layar visualisasi rute interaktif** (arah jalan dari Kost $\rightarrow$ Destinasi yang dipilih).
  - Pengguna tetap disediakan tombol opsi jika sewaktu-waktu ingin membuka navigasi GPS penuh di Google Maps.

---

## 2. Arsitektur & Desain Solusi (Interactive In-App Route Preview)

### A. State Management & Dynamic URL Builder
1. **State `activeRouteDestination`**:
   ```typescript
   interface RouteDestination {
     name: string;
     lat: number;
     lng: number;
     type: 'campus' | 'facility';
     distance?: string;
     walkDuration?: string;
     motoDuration?: string;
     carDuration?: string;
   }
   const [activeRouteDestination, setActiveRouteDestination] = useState<RouteDestination | null>(null);
   ```

2. **Dinamisasi Source Iframe Google Maps**:
   - **Mode Standar (Pin Kost Tunggal)**:
     `https://maps.google.com/maps?q=${kost.location.lat},${kost.location.lng}&z=16&output=embed`
   - **Mode Rute Aktif (Directions Origin $\rightarrow$ Destination)**:
     `https://maps.google.com/maps?saddr=${kost.location.lat},${kost.location.lng}&daddr=${activeRouteDestination.lat},${activeRouteDestination.lng}&output=embed`

### B. UI/UX Enhancements & Feedback Visual
1. **Banner Info Rute Interaktif di Atas Mini Map**:
   - Ketika rute aktif, di atas iframe peta muncul *floating header bar*:
     - 🧭 **Rute Aktif**: Nama Tempat (Badge Jarak `± 2.1 km`).
     - Estimasi Waktu Tempuh: 🚶 Jalan Kaki • 🏍️ Motor • 🚗 Mobil.
     - Tombol **"✕ Reset ke Titik Kost"** untuk mengembalikan peta ke posisi pin kost awal.
2. **Highlight Item Aktif pada List Kampus & Fasilitas**:
   - Kartu tempat yang rutenya sedang aktif mendapatkan penanda visual (border oranye/biru tebal + badge *"Rute Ditampilkan ✓"*).
3. **Smooth Auto-Scroll**:
   - Saat tombol *"Rute"* pada list diklik, layar dengan mulus (*smooth scroll*) menggulir ke arah mini preview peta agar pengguna langsung melihat jalurnya di layar.
4. **Tombol Navigasi Sekunder**:
   - Tombol di bawah peta bertransformasi secara dinamis:
     - Jika mode pin tunggal: *"Buka Google Maps"* (melihat titik kost).
     - Jika mode rute aktif: *"Buka Navigasi Google Maps ↗"* (membuka rute di app Google Maps eksternal sebagai opsi tambahan).

---

## 3. Dampak Perubahan File

- **`functions/public/pages/KostDetail.tsx`**:
  - Menambahkan state `activeRouteDestination` dan ref target peta `mapPreviewRef`.
  - Mengintegrasikan dynamic embed URL (Directions vs Single Pin).
  - Menambahkan banner status rute aktif dengan tombol reset.
  - Memperbarui event onClick tombol *"Rute"* pada item kampus & fasilitas publik untuk memicu `handleSelectRouteDestination`.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

### Langkah 1: Penambahan State & Handler di `KostDetail.tsx`
- Menambahkan state `activeRouteDestination`.
- Membuat handler `handleSelectRoute(item)` yang menyetel destinasi dan memicu smooth scroll ke elemen peta.
- Membuat handler `handleResetRoute()` untuk kembali ke pin lokasi awal.

### Langkah 2: Pembaruan Render Komponen Mini Map Preview
- Mengganti `embedMapsUrl` statis menjadi fungsi reaktif berbasis `activeRouteDestination`.
- Menambahkan badge banner info rute di atas iframe.
- Menyesuaikan tombol aksi utama di bawah peta.

### Langkah 3: Penyesuaian Tombol "Rute" pada List Kampus & Fasilitas
- Mengubah elemen `<a>` eksternal menjadi button interaktif yang memanggil `handleSelectRoute`.
- Menambahkan highlight styling pada item yang sedang terpilih.

### Langkah 4: Uji Kompilasi & Dokumentasi
- Menjalankan `cmd /c npm run build` untuk memvalidasi kelulusan build (0 error).
- Mencatat riwayat di `functions/PROGRESS.md`.
- Memperbarui `WALKTHROUGH.md`.
- Melakukan git push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

| Skenario Pengujian | Hasil yang Diharapkan |
|---|---|
| **Klik Tombol "Rute" pada Kampus/Fasilitas** | Layar scroll mulus ke mini map, iframe langsung merender rute arah jalan tanpa berpindah halaman / tanpa membuka tab baru. |
| **Klik Tombol "Reset ke Titik Kost"** | Peta kembali menampilkan pin tunggal lokasi Kost. |
| **Klik "Buka Navigasi Google Maps ↗"** | Tetap tersedia sebagai opsi alternatif bagi user yang ingin membuka GPS Google Maps penuh di tab baru. |
| **Kompilasi TypeScript** | `npm run build` lulus 100% dengan exit code 0. |

---

> **Status:** Menunggu persetujuan (*Proceed / ACC*) dari Pengguna sebelum eksekusi kode (Fase 2).
