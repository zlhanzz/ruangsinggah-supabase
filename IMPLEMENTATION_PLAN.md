# IMPLEMENTATION PLAN - Pratinjau 1:1 UI/UX Asli User Menggunakan KostDetail di Dalam Modal Mitra

## 1. Analisis Kebutuhan & Masalah

### Masukan & Keinginan Pengguna:
Pengguna melihat hasil pratinjau modal sebelumnya memiliki tata letak custom (menggunakan tabs Tipe Kamar, Fasilitas Umum, Peraturan) yang berbeda dari tampilan halaman publik (`KostDetail.tsx`):
> *"kenapa tidak merepresentasikan langsung ui/ux tampilan user kita? kenapa beda? saya ingin agar 1:1 tampilannya, tapi tanpa tombol booking atau chat"*

### Analisis Solusi:
1. **Mengapa Berbeda Sebelumnya?**:
   - Komponen modal sebelumnya (`MitraKostPreviewModal.tsx`) menggunakan layout tabs mandiri terpisah dari `KostDetail.tsx`.
2. **Solusi 1:1 Representasi Otentik**:
   - Alih-alih membuat tampilan tiruan yang terpisah, kita akan langsung merender komponen asli **[`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)** di dalam modal pratinjau mitra!
   - Dengan menambahkan properti `hideBookingAndChat?: boolean` pada `KostDetailProps`:
     - Seluruh UI/UX (grid galeri foto interaktif, header nama & lokasi, pilihan varian & sub-tipe kamar, fasilitas lengkap, peraturan, maps, dll.) akan **100% identik (1:1)** dengan apa yang dilihat calon penyewa di frontend publik.
     - Tombol **"Ajukan Sewa"** dan **"Chat Pemilik"** disembunyikan / digantikan dengan banner penanda ringkas bahwa listing sedang dalam pratinjau mitra.
     - Mitra tetap berada di dalam modal Dashboard Mitra tanpa me-redirect URL ke publik.

---

## 2. Solusi & Rencana Perubahan

### A. Penambahan Properti pada `KostDetail.tsx`
- Tambahkan prop `hideBookingAndChat?: boolean` ke interface `KostDetailProps`.
- Jika `hideBookingAndChat === true`:
  - Sembunyikan tombol **Ajukan Sewa** dan **Chat Pemilik** pada kartu booking sidebar desktop.
  - Tampilkan banner mini:
    *"Mode Pratinjau Mitra • Tombol booking & chat dinonaktifkan."*
  - Sembunyikan modal/tombol chat dan cegah penambahan metrik view publik (`incrementPropertyView`).

### B. Penyempurnaan `MitraKostPreviewModal.tsx`
- Ubah isi `MitraKostPreviewModal.tsx` agar langsung merender komponen `<KostDetail kost={kost} onBack={onClose} hideBookingAndChat={true} />`.
- Pertahankan **Bilah Kontrol Mitra (Sticky Topbar)** di bagian atas modal:
  - Status Badge: `⏳ Sedang Ditinjau Admin (1×24 Jam)` / `● Tayang Publik`
  - Tombol **`[ ✏️ Edit Kost ]`** (langsung membuka form edit mitra)
  - Tombol **`[ ✕ Tutup ]`** (dan handler tombol `Esc`)
- Bungkus `KostDetail` dalam modal scrollable berukuran penuh (`w-full max-w-7xl max-h-[95vh] bg-white rounded-3xl overflow-y-auto`) agar mitra dapat melihat tampilan web persis seperti pengguna desktop maupun mobile.

---

## 3. Dampak Perubahan

File yang akan disentuh:
1. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\pages\KostDetail.tsx`:
   - Menambahkan prop `hideBookingAndChat?: boolean` dan kondisional rendering untuk menyembunyikan tombol booking & chat.
2. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\components\mitra\MitraKostPreviewModal.tsx`:
   - Merender `<KostDetail kost={kost} onBack={onClose} hideBookingAndChat={true} />` secara 1:1 di dalam modal container.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Menunggu Persetujuan / ACC)

1. **Langkah 1**: Perbarui `KostDetail.tsx` dengan prop `hideBookingAndChat?: boolean`.
2. **Langkah 2**: Perbarui `MitraKostPreviewModal.tsx` untuk membungkus `KostDetail` dengan bilah kontrol mitra di atasnya.
3. **Langkah 3**: Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
4. **Langkah 4**: Catat ke `functions/PROGRESS.md`, perbarui `WALKTHROUGH.md`, dan lakukan `git push origin bukan-productions`.

---

## 5. Rencana Verifikasi

- **Uji Kompilasi**: `npm run build` lulus 100% tanpa error TypeScript.
- **Uji Visual 1:1**:
  - Buka menu **Kost Saya** pada Dashboard Mitra (`/dashboard-mitra`).
  - Klik tombol **`[ 👁️ Preview ]`**.
  - Modal akan terbuka menampilkan **halaman detail kost asli 1:1** persis seperti tampilan pengguna umum (galeri grid foto, rincian varian kamar, fasilitas, dll.).
  - Tombol "Ajukan Sewa" dan "Chat Pemilik" tidak ada / dinonaktifkan dengan tanda mode pratinjau.
  - Klik tombol "Edit Kost" untuk mengedit data, atau tekan "Tutup" / `Esc` untuk kembali ke daftar kost.
