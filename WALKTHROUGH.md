# WALKTHROUGH: Perbaikan Pin Peta Minimize, Sinkronisasi Wilayah Database & Indikator Evaluasi

Dokumen ini merangkum penyelesaian implementasi perbaikan pada form pendataan survei `AgentDashboard.tsx`, `adminService.ts`, dan `KostManagerPortal.tsx`.

---

## 1. Ringkasan Perubahan

### A. Interaktivitas Penuh Pin Peta pada Tampilan Minimize (Mini-Map)
- **Sebelumnya**: Mengklik peta mini atau menyeret pin di mode minimize hanya memanggil `setPendingLocationChange` tanpa memperbarui form dan tanpa memicu reverse geocoding, sehingga marker kembali ke lokasi awal.
- **Sekarang**: Diterapkan helper terpadu `reverseGeocodeAndApply(lat, lng)`. Ketika pengguna mengklik peta atau menggeser pin di mode minimize, koordinat form langsung terkunci, marker berpindah, peta bergeser, dan Google Maps Geocoder langsung mengisi otomatis:
  - **🏛️ Provinsi** (contoh: *"Sulawesi Selatan"*).
  - **🏙️ Kota / Kabupaten** (contoh: *"Makassar"* tanpa kata *"Kota "*).
  - **📍 Kecamatan / Area** (contoh: *"Tamalanrea"* tanpa kata *"Kecamatan "*).
  - **Alamat Lengkap Detail**.

### B. Penyimpanan Aman Wilayah ke Supabase (`metadata.province`) & Pemuatan Balik
- **Sebelumnya**: Mutasi database gagal tersimpan karena payload menyertakan `province` sebagai kolom tabel langsung pada tabel `properties` (yang tidak memiliki kolom terpisah `province` di skema PostgreSQL), memicu error `Could not find the 'province' column of 'properties' in the schema cache`. Akibatnya, saat form dibuka kembali, data provinsi dan kota/kabupaten hilang.
- **Sekarang**:
  - `province` disimpan ke dalam objek `metadata: { ...metadata, province }` pada `handleSaveDraftDirectly` dan `handleSaveKostManagerListing` di `AgentDashboard.tsx`, `addPropertyWithMedia` dan `updatePropertyWithMedia` di `adminService.ts`, serta `KostManagerPortal.tsx`.
  - Fungsi `openKostManagerListing` kini memuat kembali `province` dari `dbPropertyRecord.metadata?.province` atau `dbKmProp?.metadata?.province`.
  - Dilakukan normalisasi otomatis: jika nilai `city` lama memuat teks *"Kecamatan ..."*, nilai dipindahkan ke `area` dan `city` di-reset ke *"Makassar"*.

### C. Alur Status & Indikator Evaluasi Revisi
- Animasi kelap-kelip / glowing amber aktif ketika permohonan berstatus `REVISION_REQUIRED` untuk memandu agen memperbaiki bagian yang diminta admin.
- Saat agen mengirimkan hasil revisi melalui tombol *"🔄 Kirim Ulang Hasil Revisi ke Admin"*, status pengajuan berpindah menjadi `SUBMITTED` (Menunggu Verifikasi Admin) sehingga tugas agen telah terselesaikan dan form siap ditinjau kembali oleh Super Admin.

---

## 2. File yang Dimodifikasi

| File | Komponen / Fungsi | Deskripsi Modifikasi |
|---|---|---|
| [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) | `kmMapRef` listener, `reverseGeocodeAndApply`, `openKostManagerListing`, `handleSaveDraftDirectly`, `handleSaveKostManagerListing` | Interaktivitas pin peta minimize, pemetaan `metadata.province`, normalisasi `city`/`area`, dan pemuatan kembali data dari database |
| [functions/public/adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) | `addPropertyWithMedia` & `updatePropertyWithMedia` | Menyimpan `province` secara aman ke dalam `metadata.province` |
| [functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) | `handleSaveManagedProperty` & `handleEditProperty` | Menyimpan dan memuat `province` via `metadata.province` |
| [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) | Entry #138 | Dokumentasi riwayat progres anti-amnesia |

---

## 3. Hasil Pengujian & Verifikasi

### ⚡ Uji Kompilasi (Build Test)
Perintah kompilasi frontend `npm.cmd run build` dijalankan pada folder `functions/public/`:
- **Status**: **LULUS (Code 0)**
- **Waktu**: 28.82 detik
- **Modul**: 2,526 modul ter-bundle dengan rapi
- **Error / Warning Fatal**: 0 Error

---

## 4. Panduan Verifikasi Pengguna (User Testing Guide)

1. Buka Portal Surveyor / Agen di dashboard dan buka tugas survei KostManager.
2. **Uji Pin Peta Minimize**:
   - Di Step 1 (Info Properti & Lokasi GPS), klik titik mana saja pada peta mini atau seret marker GPS tanpa membuka modal pop-up.
   - Pastikan marker berpindah dan input **Provinsi**, **Kota / Kabupaten**, serta **Kecamatan / Area** terisi otomatis secara real-time.
3. **Uji Simpan & Buka Kembali**:
   - Isi form data survei, klik simpan / lanjut / kirim ulang data.
   - Tutup atau muat ulang halaman, lalu buka kembali form survei yang sama.
   - Pastikan isian **Provinsi**, **Kota / Kabupaten**, dan **Kecamatan / Area** tetap terisi lengkap tanpa hilang.
4. **Uji Alur Evaluasi**:
   - Periksa bahwa catatan revisi dari admin memandu bagian yang perlu diperbaiki, dan setelah dikirim ulang, status pengajuan berpindah menjadi `SUBMITTED` untuk peninjauan admin.
