# Walkthrough: Fitur Unggah Multi-Foto (Hingga 3 Foto) Bukti Kendala dengan Kompresi Otomatis WebP & Galeri di Portal KostManager

Dokumentasi ini merangkum penyelesaian pengembangan **Fitur #219**, yaitu implementasi pengunggahan hingga 3 foto bukti kendala kamar dengan jaminan kompresi WebP di sisi klien pada halaman **Kost Saya** (`MyKost.tsx`) serta sinkronisasi galeri multi-foto dan penerusan WhatsApp di **Portal KostManager** (`KostManagerPortal.tsx`).

---

## 1. Ringkasan Perubahan

### A. Sisi Penghuni (`MyKost.tsx`)
- **Unggah Hingga 3 Foto Bukti Kerusakan**:
  - Penghuni dapat memilih hingga 3 file foto sekaligus (`multiple`) atau menambahkannya satu per satu.
  - Terdapat counter dinamis: `{complaintPhotos.length} / 3 Foto`.
  - Grid pratinjau thumbnail 3-kolom yang dilengkapi label nomor (*Foto 1*, *Foto 2*, *Foto 3*) dan tombol hapus individual (*X*) pada masing-masing foto.
  - Slot *"Tambah Foto"* tetap muncul selama jumlah foto masih `< 3`.
- **Kompresi Wajib WebP Sebelum Upload (Rule #5)**:
  - Setiap foto dikompresi dan dikonversi menjadi format modern `.webp` (kualitas 0.82, resolusi maks 1920px) melalui canvas HTML5.
  - File yang di-upload ke Supabase Storage berekstensi `.webp` dengan MIME type `image/webp`.
  - Payload multi-foto disimpan secara terstruktur dan aman pada kolom `photo_url`.

### B. Sisi Portal KostManager (`KostManagerPortal.tsx`)
- **Galeri Multi-Foto pada Kartu Tiket Kendala**:
  - Helper `extractComplaintPhotos` mem-parse URL gambar tunggal maupun JSON array string secara mulus.
  - Kartu tiket kendala kini merender galeri seluruh foto bukti kerusakan berdampingan.
  - Setiap thumbnail dapat diklik untuk memperbesar gambar pada modal zoom layar penuh (`previewPhotoUrl`).
- **Penerusan WhatsApp Terstruktur ke Pemilik Properti**:
  - Fitur 1-klik *"📲 Teruskan ke Pemilik Kost (WhatsApp)"* otomatis mencantumkan seluruh tautan foto bukti WebP yang dilampirkan:
    ```text
    📸 *Foto Bukti Kerusakan (X Foto WebP):*
    • Foto 1: https://.../photo_0.webp
    • Foto 2: https://.../photo_1.webp
    • Foto 3: https://.../photo_2.webp
    ```

---

## 2. Hasil Pengujian & Kompilasi

### Uji Build Frontend (Vite)
```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 2531 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 38.47s
```
*Hasil:* **100% Lulus (0 Error, 0 Broken Link, Bebas FOUT icon SVG pure bundle)**.

---

## 3. Panduan Pengujian bagi Pengguna

1. Buka menu **Kost Saya** (`/my-bookings/aktif` atau `/my-kost`).
2. Klik tombol **"🚨 Lapor Kendala Kamar"** pada kartu kamar yang sedang aktif.
3. Pada bagian **"Foto Bukti Kerusakan"**, pilih 1 sampai 3 foto dari galeri atau kamera HP.
4. Verifikasi bahwa thumbnail foto muncul dengan label *Foto 1*, *Foto 2*, *Foto 3*, dan tombol *+ Tambah Foto* menyesuaikan sisa slot.
5. Klik **"Kirim Laporan Kendala"**.
6. Buka **Portal KostManager** (`/dashboard-admin/km_complaints`) dan periksa tiket kendala yang masuk:
   - Seluruh foto bukti kerusakan muncul dalam grid galeri.
   - Klik salah satu foto untuk memverifikasi modal zoom gambar besar.
   - Klik **"📲 Teruskan ke Pemilik Kost (WhatsApp)"** untuk memverifikasi draft pesan WhatsApp memuat seluruh daftar URL foto WebP.
