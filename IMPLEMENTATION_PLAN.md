# Rencana Implementasi: Unggah Multi-Foto (Hingga 3 Foto) Bukti Kendala Kamar dengan Kompresi WebP Otomatis

Dokumen ini merancang pengembangan fitur pengunggahan multi-foto (hingga 3 foto) bukti kerusakan fasilitas kamar pada halaman **Kost Saya** (`MyKost.tsx`) dengan jaminan kompresi WebP di sisi klien (Client-Side Compression), serta pembaruan tampilan galeri multi-foto dan penerusan WhatsApp di **Portal KostManager** (`KostManagerPortal.tsx`).

---

## 1. Analisis Masalah & Kebutuhan

### Kebutuhan Pengguna:
1. *"tolong agar bisa upload lebih dari 1 foto, bisa 3 okeelah"*
   - Penghuni dapat mengunggah hingga 3 foto bukti kerusakan (misal: tampak dekat, tampak jauh, dan bagian pendukung).
   - Antarmuka formulir di `MyKost.tsx` harus mendukung pemilihan multi-file, pratinjau thumbnail per foto dengan tombol hapus individual, serta slot "Tambah Foto" jika jumlah foto masih di bawah 3.
2. *"dan juga pastikan masuk ke database kita dalam bentuk webp"*
   - Sesuai **Workspace Standard Baku Rule #5 (Manajemen Gambar & Konversi Wajib WebP)**: Seluruh file gambar yang diunggah wajib dikonversi dan dikompresi ke format modern **`.webp`** (resolusi maks 1920px, kualitas 0.82) di front-end menggunakan canvas HTML5 sebelum dikirim ke Supabase Storage (`complaints` bucket) dengan MIME type `image/webp`.
3. **Penyelarasan Portal KostManager (`KostManagerPortal.tsx`)**:
   - Menampilkan seluruh foto bukti (hingga 3 foto) dalam bentuk grid thumbnail interaktif dengan fitur klik untuk memperbesar (zoom modal).
   - Format pesan penerusan ke WhatsApp pemilik kost (`handleForwardComplaintToOwnerWhatsApp`) otomatis merinci seluruh tautan foto WebP yang dilampirkan.

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Mengubah state foto komplain menjadi array `File[]` & `string[]` (maks 3 foto), mengimplementasikan UI thumbnail multi-foto, tombol tambah/hapus foto per item, serta loop kompresi WebP saat upload. |
| 2 | [`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) | Menambahkan helper ekstraksi multi-foto `extractComplaintPhotos`, menampilkan galeri thumbnail multi-foto pada kartu tiket kendala, dan memuat seluruh link foto pada template WhatsApp pengelola. |
| 3 | `functions/PROGRESS.md` | Pencatatan riwayat fitur (Anti-Amnesia). |
| 4 | `WALKTHROUGH.md` | Dokumentasi walkthrough hasil pengujian. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

### Langkah 1: Upgrade Form Multi-Foto di `MyKost.tsx`
- Mengubah state `complaintPhoto` menjadi `complaintPhotos: File[]` dan `complaintPhotoPreviews: string[]`.
- Merancang UI input file `multiple` dengan batasan maksimal 3 foto:
  - Grid kartu pratinjau foto dengan penomoran badge (*Foto 1/3*, *Foto 2/3*, *Foto 3/3*).
  - Tombol hapus (*X*) pada masing-masing foto.
  - Tombol upload kotak putus-putus (*Tambah Foto*) yang tetap aktif selama jumlah foto `< 3`.
- Pada fungsi `submitComplaint`:
  - Iterasi setiap foto melalui `compressImageToWebP(file, 0.82, 1920)`.
  - Mengunggah file `.webp` ke Supabase Storage bucket `complaints` (atau fallback `documents`).
  - Menyimpan array URL dalam format terstruktur yang kompatibel (JSON array string / URL tunggal) pada kolom `photo_url`.

### Langkah 2: Upgrade Galeri & WhatsApp Forwarding di `KostManagerPortal.tsx`
- Membuat helper `extractComplaintPhotos(photoUrl)` yang dapat membaca format URL tunggal maupun JSON string array multi-foto secara aman.
- Merender grid galeri foto pada kartu tiket komplain sehingga tim admin dapat melihat seluruh foto dan mengkliknya untuk zoom modal.
- Memperbarui fungsi `handleForwardComplaintToOwnerWhatsApp` agar merinci seluruh tautan foto bukti WebP yang dikirim oleh penghuni.

### Langkah 3: Verifikasi Kompilasi & Build
- Jalankan `cmd /c npm run build` di direktori `functions/public/`.
- Memastikan 0 error kompilasi dan lulus 100%.

### Langkah 4: Pencatatan Progres & Git Push
- Catat riwayat pada `functions/PROGRESS.md` (Fitur #219).
- Terbitkan `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Frontend (Sisi Penghuni)**:
   - Buka modal "Lapor Kendala Kamar" di halaman `Kost Saya`.
   - Pilih 1, 2, atau 3 foto bukti secara bertahap atau sekaligus.
   - Verifikasi bahwa batas maksimal 3 foto ditegakkan dan foto dapat dihapus satu per satu.
   - Kirim laporan dan periksa inspect network bahwa file yang diunggah berekstensi `.webp` dengan MIME `image/webp`.
2. **Uji Portal KostManager (Sisi Pengelola)**:
   - Buka tab "Laporan Kendala" di Portal KostManager.
   - Verifikasi seluruh 3 foto muncul pada kartu tiket dan dapat diperbesar dengan modal zoom.
   - Klik "Teruskan ke Pemilik Kost (WhatsApp)" dan pastikan seluruh link foto WebP tertera rapi pada template pesan.
3. **Uji Build**:
   - Kompilasi `cmd /c npm run build` lulus 100% (0 error).
