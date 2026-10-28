# WALKTHROUGH - Standarisasi Syarat Foto Minimum Sesuai Standar Industri & Penguncian Caption Pakem Kausalitas

## 📌 Ringkasan Pekerjaan
Pekerjaan ini menstandarisasi alur unggah foto pada formulir pendaftaran/edit kost mitra (*Wizard Langkah 5: Foto Properti & Kamar* di [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)) agar selaras dengan praktik terbaik industri platform listing properti (Mamikos, Cove, Airbnb) dan rasionalitas sistem RuangSinggah:

1. **Standarisasi Syarat Foto Minimum Kelayakan Industri**:
   - **Minimal 3 Foto Kumulatif Listing**: Sebuah properti wajib memiliki minimal 3 foto total agar layak tampil di pencarian dan menarik minat calon penyewa.
   - **Kategori Pokok Wajib (`required: true`)**:
     - Minimal 1 Foto **Bangunan Depan (Fasad)**.
     - Minimal 1 Foto **Kamar Tidur** per masing-masing tipe kamar.
     - Minimal 1 Foto **Kamar Mandi Dalam** (apabila tipe kamar memiliki fasilitas kamar mandi dalam / `hasInsideBath`).
   - **Kategori Fasilitas Dinamis (`Dianjurkan` / Recommended)**:
     - Kategori yang muncul dari fasilitas umum (Dapur Bersama, Ruang Tamu, Area Parkir, WC Umum) berstatus *Dianjurkan* agar tidak memblokir mitra yang belum sempat memotret seluruh sudut fasilitas saat pendaftaran awal.
2. **Penguncian Caption Pakem Kausalitas (Read-Only / Fixed)**:
   - Menghapus tombol pensil `<Edit3 />` dan modal dialog edit caption teks bebas.
   - Caption foto kini 100% terkunci secara otomatis mengikuti nama kategori pakem slot foto (`cat.label`). Kausalitas asal-usul foto menjadi jelas, data pencarian penyewa menjadi konsisten, dan beban kognitif mitra berkurang.
3. **UI/UX Header Card Indikator Standar Industri**:
   - Menghadirkan widget indikator di bagian atas Langkah 5 dengan:
     - Counter total foto: `📸 Total: X / 3 Foto Minimal` (hijau jika $\ge 3$, oranye jika $< 3$).
     - Checklist chips interaktif status kategori pokok (Bangunan Depan, Kamar Tidur, KM Dalam) dengan ikon centang hijau jika terunggah atau ikon peringatan merah jika belum.
     - Status kelayakan: `Lengkap & Siap Lanjut` vs `Belum Lengkap (Kurang X foto lagi / X kategori wajib belum diisi)`.
   - Menampilkan badge visual `Wajib` (merah/rose) pada kategori pokok dan `Dianjurkan` (slate/abu-abu) pada kategori pendukung.

---

## 🛠️ Detail Perubahan File

### 1. [functions/public/components/KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)
- **Kategori Dinamis Kamar Mandi Dalam Wajib**:
  ```typescript
  // Pada computeActivePhotoCategories:
  if (hasInsideBath) {
      categories.push({
          id: `Kamar Mandi: ${roomName}`,
          label: `Kamar Mandi: ${roomName}`,
          desc: `Foto kamar mandi dalam untuk tipe ${roomName}. Wajib diunggah bila tipe kamar memiliki kamar mandi dalam.`,
          required: true,
          roomName
      });
  }
  ```
- **Validasi Langkah 5 & Validasi Submit (`validateCurrentStep` & `handleSubmit`)**:
  ```typescript
  for (const cat of activeCategories) {
      if (cat.required) {
          const existingCount = existingWithCats.filter(p => p.cat === cat.id).length;
          const newCount = newPhotoItems.filter(p => p.category === cat.id).length;
          if (existingCount + newCount < 1) {
              return `Kategori foto '${cat.label}' wajib diunggah minimal 1 foto sebelum melanjutkan.`;
          }
      }
  }

  // Syarat Standar Kualitas Industri: Total foto kumulatif minimal 3 foto
  const totalPhotosCount = existingWithCats.length + newPhotoItems.length;
  if (totalPhotosCount < 3) {
      return `Total foto properti saat ini baru ${totalPhotosCount} foto. Wajib mengunggah minimal 3 foto secara keseluruhan untuk memenuhi standar kelayakan listing properti.`;
  }
  ```
- **Header Card & Checklist Kelayakan Listing**:
  - Menyajikan ringkasan kelayakan dengan chip checklist real-time untuk setiap kategori wajib.
- **Pembersihan Modal Caption & Ikon Pensil**:
  - Menghapus tombol pensil `<button onClick={() => setEditingCaptionTarget(...)}><Edit3 ... /></button>` pada Section A dan Section B.
  - Menghapus modal dialog `editingCaptionTarget` (60+ baris kode JSX).
  - Menghapus state `editingCaptionTarget`, helper functions `updateNewPhotoCaption` dan `updateExistingPhotoCaption`.
  - Menghapus import `Edit3` dari `lucide-react`.
  - Memastikan thumbnail bottom-bar menampilkan label kategori pakem: `<p className="font-bold truncate">{cat.label}</p>`.

---

## 🧪 Hasil Verifikasi & Pengujian Build

1. **Uji Kompilasi Frontend (`functions/public`)**:
   ```powershell
   cmd.exe /c "npm --prefix functions/public run build"
   ```
   - **Hasil**: **Exit Code 0 (Sukses 100%)**.
   - `✓ 2512 modules transformed.`
   - `✓ built in 37.98s`
   - Tidak ada error TypeScript (`tsc`) atau bundler Vite.
2. **Uji Kompilasi Backend (`functions`)**:
   ```powershell
   cmd.exe /c "npm --prefix functions run build"
   ```
   - **Hasil**: **Exit Code 0 (Sukses 100%)**.
   - `tsc` kompilasi backend tanpa error.

---

## 📋 Panduan Verifikasi Pengguna (User Testing Guide)

1. **Buka Dashboard Mitra & Klik Tambah / Edit Kost**:
   - Buka formulir `KostFormMitra`.
   - Isi Langkah 1 (Info), Langkah 2 (Lokasi), Langkah 3 (Fasilitas), Langkah 4 (Tipe Kamar).
   - Pastikan pada salah satu tipe kamar dicentang opsi `Kamar Mandi Dalam`.
2. **Uji Langkah 5 (Foto Properti & Kamar)**:
   - Perhatikan **Header Card**:
     - Tertera counter: `📸 Total: 0 / 3 Foto Minimal`.
     - Terdapat checklist chip: `Bangunan Depan`, `Kamar: [Nama Tipe]`, dan `Kamar Mandi: [Nama Tipe]` berstatus merah/belum lengkap.
     - Terdapat status `Belum Lengkap (Kurang 3 foto lagi)`.
   - Coba klik **Lanjut**: sistem menolak dengan pesan validasi edukatif bahwa Bangunan Depan wajib diunggah.
   - Unggah 1 foto Bangunan Depan: chip `Bangunan Depan` otomatis berubah menjadi hijau dengan ikon centang.
   - Coba klik **Lanjut**: sistem menolak karena foto Kamar Tidur wajib diunggah.
   - Unggah foto Kamar Tidur dan Kamar Mandi Dalam: total foto menjadi $\ge 3$. Status berubah menjadi hijau `Lengkap & Siap Lanjut`.
   - Tombol **Lanjut** kini berhasil membawa mitra ke langkah berikutnya (*Peraturan Kost*).
3. **Uji Ketiadaan Edit Caption (Pakem)**:
   - Arahkan kursor ke foto yang telah diunggah: tombol pensil edit caption sudah tidak ada lagi.
   - Baris teks di bagian bawah foto secara konsisten menampilkan nama kategori pakemnya (misal: *Bangunan Depan*, *Kamar: Standard*, dll.).
