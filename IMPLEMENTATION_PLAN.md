# IMPLEMENTATION PLAN - Perbaikan Tampilan Teks Fasilitas & Eliminasi Kamar Mandi Luar Redundan pada Fasilitas Kamar

Dokumen ini adalah rencana kerja Fase 1 untuk menyelesaikan dua permasalahan pada Langkah 4 (Fasilitas) di formulir pendaftaran/edit kost mitra ([KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)):
1. Memperbaiki teks label fasilitas yang terpotong (*truncated*) pada kartu pilihan fasilitas.
2. Mengeliminasi opsi input *Kamar Mandi Luar* yang redundan pada daftar fasilitas kamar tidur (karena kamar mandi luar secara alami tergolong sebagai **Fasilitas Umum / Gedung** di bawah item `WC Umum`).

---

## 1. Analisis Masalah & Kebutuhan Pengguna

### A. Masalah 1: Teks Nama Fasilitas Terpotong (*Truncation Issue*)
- **Penyebab**:
  Pada komponen `HierarchicalPublicFacilityInput`, `HierarchicalRoomFacilityInput`, dan checklist cakupan biaya tambahan, elemen teks label dibungkus dengan kelas Tailwind `truncate`.
  Di layar mobile (lebar 360px - 430px), grid 2-kolom memberikan lebar kartu yang terbatas (~140px - 160px). Setelah dikurangi padding kartu, checkbox, dan icon emoji, sisa ruang hanya ~80px - 100px.
  Hal ini menyebabkan nama-nama fasilitas panjang (seperti *"Kamar Mandi Dalam"*, *"Security 24 Jam"*, *"Cleaning Service"*, *"Kulkas Bersama"*, *"Wastafel Cuci Piring"*, *"Dispenser Air"*, dll.) terpotong menjadi *"Kamar Mandi..."*, *"Security 24..."*.
- **Solusi**:
  - Hapus kelas `truncate` dari span label dan ganti dengan penataan multi-line responsif: `text-xs font-bold leading-snug break-words flex-1`.
  - Berikan `min-h-[44px]` dan penyesuaian padding (`p-2 sm:p-2.5`) pada kontainer kartu label agar teks 2-baris tersusun rapi, simetris, dan tetap memenuhi standar *touch target* mobile minimal 44x44px.
  - Tambahkan `min-w-0` pada field input kustom fasilitas agar tidak mendorong tombol `+ Tambah` keluar dari kontainer pada layar sempit.

---

### B. Masalah 2: Redundansi Opsi "Kamar Mandi Luar" pada Fasilitas Kamar
- **Penyebab**:
  - Fasilitas kamar tidur mewakili sarana yang berada **di dalam ruangan privat kamar** (seperti Kasur, Lemari, AC, TV, Meja, Kursi, Balkon, Kamar Mandi Dalam, Dapur Dalam).
  - Opsi *"Kamar Mandi Luar"* sebelumnya disertakan di `ALL_ROOM_FACILITY_PRESETS`. Padahal, jika kamar mandi berada di luar kamar, fasilitas tersebut adalah fasilitas bersama yang sudah dikelola secara terpusat pada **Fasilitas Gedung / Umum** (item `WC Umum / Luar`).
  - Adanya *"Kamar Mandi Luar"* di fasilitas kamar menimbulkan kebingungan pengguna (apakah harus centang di fasilitas kamar, di fasilitas umum, atau dua-duanya).
- **Solusi**:
  1. Hapus preset `{ label: 'Kamar Mandi Luar', icon: '🚪', isPerabot: false }` dari `ALL_ROOM_FACILITY_PRESETS`.
  2. Pertahankan saklar **"Kamar Mandi Dalam"** (dengan sub-panel kelengkapan WC: Kloset Duduk, Kloset Jongkok, Shower, Water Heater, Wastafel, Bak Mandi, Ember & Gayung).
  3. **Logika Otomatisasi Status Kamar Mandi**:
     - Jika **"Kamar Mandi Dalam"** dicentang $\rightarrow$ kamar berstatus *Kamar Mandi Dalam*, data `bathroomFacilities: ['Kamar Mandi Dalam', ...kelengkapan]` dan `bathroomType: 'Kamar Mandi Dalam'`.
     - Jika **"Kamar Mandi Dalam"** TIDAK dicentang $\rightarrow$ kamar otomatis berstatus *Kamar Mandi Luar*, data `bathroomFacilities: ['Kamar Mandi Luar']` dan `bathroomType: 'Kamar Mandi Luar'`.
  4. Perbarui fungsi `validateCurrentStep(3)`: Hapus pesan validasi yang mewajibkan memilih opsi kamar mandi luar secara manual. Jika kamar mandi dalam tidak dicentang, sistem langsung mengenali tipe kamar tersebut menggunakan fasilitas WC Umum/Luar tanpa menampilkan error.

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
- **[KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)**:
  1. Membersihkan preset `ALL_ROOM_FACILITY_PRESETS` dari entri `Kamar Mandi Luar`.
  2. Memperbarui handler `handleToggleFacility` dan state default kamar mandi di `HierarchicalRoomFacilityInput`.
  3. Menghapus kelas `truncate` dan menerapkan `break-words leading-snug flex-1` serta `min-h-[44px]` pada seluruh kartu opsi fasilitas (Fasilitas Umum, Fasilitas Kamar, dan Cakupan Biaya Tambahan).
  4. Mengoptimalkan flex layout dan input kustom dengan `min-w-0`.
  5. Menyesuaikan logika validator `validateCurrentStep(3)` untuk skema kamar mandi yang lebih ringkas dan otomatis.

> [!NOTE]
> Kompatibilitas data ke database Supabase dan halaman detail listing tetap 100% terjaga karena format data `bathroomFacilities` dan `roomFacilities` tetap konsisten.

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Modifikasi Definisi Preset & Handler di `KostFormMitra.tsx`
- Hapus `Kamar Mandi Luar` dari `ALL_ROOM_FACILITY_PRESETS`.
- Sesuaikan toggle `Kamar Mandi Dalam`:
  - Saat aktif: Tambahkan `'Kamar Mandi Dalam'` ke `roomFacilities` dan `bathroomFacilities`.
  - Saat nonaktif: Hapus `'Kamar Mandi Dalam'`, set `bathroomFacilities` menjadi `['Kamar Mandi Luar']` secara default, dan bersihkan sub-pilihan WC dalam.

### Langkah 2: Perbaikan Styling Teks Bebas Potong (*Anti-Truncate*)
- Pada `HierarchicalPublicFacilityInput`:
  - Ganti `truncate` dengan `text-xs font-bold leading-snug break-words flex-1`.
  - Tambahkan `min-h-[44px] items-center` pada kontainer label kartu.
  - Tambahkan `min-w-0` pada input kustom fasilitas umum.
- Pada `HierarchicalRoomFacilityInput`:
  - Ganti `truncate` dengan `text-xs font-bold leading-snug break-words flex-1`.
  - Tambahkan `min-h-[44px] items-center` pada kontainer label kamar.
  - Tambahkan `min-w-0` pada input kustom fasilitas kamar dan kelengkapan WC.
- Pada bagian *Cakupan Biaya Tambahan Fasilitas*:
  - Ganti `truncate` dengan `text-xs font-bold leading-snug break-words flex-1`.

### Langkah 3: Penyesuaian Validator Formulir
- Di fungsi `validateCurrentStep(currentStep = 3)`:
  - Validasi kamar mandi disederhanakan: Jika `hasInsideBath` aktif, wajib pilih minimal 1 kelengkapan WC. Jika tidak aktif, kamar secara otomatis valid sebagai pengguna WC Luar/Umum.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi Build Frontend**:
   ```bash
   cmd /c npm run build
   ```
   Memastikan 0 error TypeScript, JSX, dan bundling Vite pada `functions/public`.
2. **Uji Kompilasi Backend Functions**:
   ```bash
   cmd /c npm run build
   ```
   Memastikan 0 error `tsc` pada `functions`.
3. **Verifikasi Visual UI & Logika di Browser**:
   - Membuka Langkah 4 (Fasilitas) pada formulir mitra.
   - Memastikan tidak ada teks fasilitas yang terpotong `...` di layar mobile maupun desktop.
   - Memastikan pada daftar Fasilitas Kamar hanya ada opsi **Kamar Mandi Dalam** (dan tidak ada lagi opsi redundan *Kamar Mandi Luar*).
   - Memastikan saat *Kamar Mandi Dalam* dicentang, sub-panel kelengkapan WC terbuka, dan saat tidak dicentang, kamar otomatis tersimpan sebagai kamar dengan kamar mandi luar tanpa error validasi.
