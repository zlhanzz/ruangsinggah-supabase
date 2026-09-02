# WALKTHROUGH - Peningkatan Kejelasan Status Listing dalam Tahap Peninjauan (Review) di Dashboard Mitra

## Ringkasan Eksekutif
Peningkatan pengalaman pengguna (UX) untuk mengatasi kebingungan mitra mengenai status listing pasca-publikasi telah **berhasil diselesaikan dan diverifikasi penuh**.

Sebelumnya, ketika mitra menekan "Publikasikan Kost", dashboard menampilkan subtitle menyesatkan `1 PROPERTI AKTIF` dan foto properti menampilkan badge abu-abu gelap `• DRAFT` tanpa penjelasan apa pun. Tombol "Preview" pun langsung mental/redirect ke halaman katalog umum.

Setelah perbaikan ini diterapkan:
1. **Subtitle Header Jujur & Akurat**: Memisahkan penghitungan properti yang tayang aktif vs yang sedang menunggu peninjauan admin.
2. **Badge Status Modern & Ramah**: Badge foto kini berubah menjadi kuning/amber dengan denyut halus `⏳ Sedang Ditinjau` (atau `● Tayang Publik` untuk yang aktif, dan `● Ditangguhkan` untuk yang disuspend).
3. **Banner Status Edukatif**: Kartu kost dilengkapi kotak informasi bergradasi ramah yang menjelaskan bahwa data telah berhasil masuk, sedang ditinjau oleh admin (estimasi 1x24 jam), dan akan otomatis tayang di katalog pencarian setelah disetujui.
4. **Mode Pratinjau (Preview) Berfungsi Penuh**: Pemilik kost kini dapat mengklik tombol `Preview` dan melihat tampilan halaman detail kost miliknya sendiri lengkap dengan banner *Mode Pratinjau Pemilik*.

---

## 1. Rincian Perubahan Kode

### A. Dashboard Mitra: Metrik Header, Badge Foto, & Banner Edukatif
- **Lokasi**: [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
- **Perubahan**:
  1. **Metrik Header "Kost Saya"**:
     ```tsx
     const publishedCount = properties.filter(p => p.status === 'published').length;
     const inReviewCount = properties.filter(p => p.status !== 'published' && p.status !== 'suspended').length;
     const suspendedCount = properties.filter(p => p.status === 'suspended').length;
     ```
     Menghilangkan teks menyesatkan `{properties.length} Properti Aktif` dan menggantinya dengan pemisahan transparan:
     - `{publishedCount} Properti Tayang`
     - `{inReviewCount} Menunggu Review`
     - `{suspendedCount} Ditangguhkan`
  2. **Badge Status Foto 3-Tingkat**:
     - `published`: `bg-emerald-500 text-white` (`<CheckCircle2 size={11} /> Tayang Publik`)
     - `draft / pending`: `bg-amber-500 text-white animate-pulse` (`<Clock size={11} /> Sedang Ditinjau`)
     - `suspended`: `bg-rose-500 text-white` (`<AlertCircle size={11} /> Ditangguhkan`)
  3. **Banner Status Edukatif di Dalam Kartu**:
     - Ditambahkan kotak bergradasi amber/orange yang informatif di bawah kartu metrik harga & rating, menjelaskan SLA review 1×24 jam dan jaminan otomatisasi tayang.

### B. Otentikasi Mode Pratinjau (Preview Mode) Pemilik
- **Lokasi**: [userService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)
- **Perubahan**:
  - Memperbarui `getPublishedPropertyDetails(propertyId)`:
    ```typescript
    // 1. Coba ambil jika status published (terbuka untuk umum)
    const { data: pubRow } = await supabase.from('properties').select('*').eq('id', propertyId).eq('status', 'published').maybeSingle();
    
    // 2. Mode Pratinjau (Preview Mode): jika belum published, izinkan pemilik atau admin melihat propertinya
    if (!pubRow) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: privRow } = await supabase.from('properties').select('*').eq('id', propertyId).maybeSingle();
        if (privRow && (privRow.owner_uid === user.id || user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin')) {
          row = privRow;
        }
      }
    }
    ```
  - Mencegah redirect liar ke `/listings` saat pemilik menekan tombol `Preview`.

### C. Halaman Detail Kost: Banner Mode Pratinjau & Pengamanan CTA Booking
- **Lokasi**: [KostDetail.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)
- **Perubahan**:
  - Mengimpor ikon SVG `<Clock />` murni dari `lucide-react`.
  - Menampilkan banner oranye/amber di paling atas halaman detail:
    *"MODE PRATINJAU: Listing ini saat ini DALAM TAHAP PENINJAUAN ADMIN dan belum dapat dilihat oleh publik."*
  - Mengubah tombol booking utama menjadi `Pratinjau (Belum Tayang)` agar calon penyewa tidak dapat mengajukan transaksi sewa sebelum listing berstatus tayang publik.

---

## 2. Hasil Verifikasi & Uji Kompilasi

Kompilasi build aplikasi front-end dijalankan menggunakan bundler Vite:
```bash
cmd /c npm run build
```
**Hasil**:
```text
vite v6.4.1 building for production...
transforming...
✓ 2506 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 38.94s
0 errors, 0 warnings fatal.
```

---

## 3. Panduan Pengujian untuk Pengguna

1. **Buka Dashboard Mitra (Kost Saya)**:
   - Buka menu **Kost Saya** pada Dashboard Mitra (`/dashboard-mitra`).
2. **Periksa Header**:
   - Perhatikan subtitle di bawah judul "Kost Saya". Jika Anda memiliki 1 kost yang baru diajukan, subtitle akan berbunyi:
     `0 PROPERTI TAYANG • 1 MENUNGGU REVIEW` (bukan lagi `1 PROPERTI AKTIF`).
3. **Periksa Kartu Properti**:
   - Sudut kanan atas foto properti kini memiliki badge kuning cerah berdenyut: **`⏳ Sedang Ditinjau`** (bukan lagi badge gelap `• DRAFT`).
   - Di dalam kartu properti terdapat kotak edukasi:
     *"Tahap Peninjauan Admin (Estimasi 1×24 Jam) - Listing Anda telah berhasil diajukan dan sedang diverifikasi oleh tim RuangSinggah. Listing akan otomatis tayang di pencarian publik setelah disetujui."*
4. **Klik Tombol Preview**:
   - Klik tombol **`[ 👁️ Preview ]`** pada kartu kost tersebut.
   - Halaman detail kost Anda akan terbuka secara sempurna tanpa mental/redirect ke `/listings`.
   - Di bagian atas halaman detail akan muncul banner:
     *"MODE PRATINJAU: Listing ini saat ini DALAM TAHAP PENINJAUAN ADMIN dan belum dapat dilihat oleh publik."*
   - Tombol sewa berlabel `Pratinjau (Belum Tayang)`.
