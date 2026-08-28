# Rencana Implementasi: Auto-Detection & Persistensi Provinsi serta Penonaktifan Peringatan Evaluasi Pasca Kirim Ulang

Dokumen ini merinci solusi untuk 2 masalah yang dilaporkan pengguna pada `AgentDashboard.tsx`:
1. **Persistensi Provinsi**: Isian Provinsi masih kosong saat membuka kembali data properti (sedangkan Kota dan Kecamatan sudah tersimpan).
2. **Peringatan Evaluasi Belum Hilang Pasca Kirim Ulang**: Badge `REVISI` dan border evaluasi masih muncul meskipun agen sudah mengirim ulang data ke admin.

---

## 1. Analisis Akar Masalah

### A. Kenapa Isian Provinsi Masih Kosong saat Dibuka Kembali?
1. **Draft Lokal Lama**: Saat membuka data properti (`openKostManagerListing`), sistem memprioritaskan draft lokal `localStorage` (`parsed.kmListingForm`). Jika draft tersebut tersimpan sebelum perbaikan atau bernilai kosong/falsy, nilai `province` tetap kosong.
2. **Ketiadaan Fallback Auto-Detection dari String Alamat**: Pada data properti di database (`dbPropertyRecord`), kolom `metadata` awal masih bernilai `{}` (belum ada key `province`). Jika `dbPropertyRecord.metadata?.province` kosong, kode tidak mengekstrak provinsi dari teks alamat `address` (yang sebenarnya sudah memuat *"Sulawesi Selatan"*).
3. **Solusi**:
   - Tambahkan helper `detectProvinceFromAddress(address)` yang cerdas mengekstrak nama provinsi (Sulawesi Selatan, DKI Jakarta, Jawa Barat, dll.) dari string alamat atau default ke `"Sulawesi Selatan"`.
   - Di seluruh titik pemuatan data (`openKostManagerListing`): draft localStorage, `dbKmProp`, `dbPropertyRecord`, dan clean slate, pastikan `province` **selalu terisi secara otomatis** jika nilainya kosong/falsy.
   - Di fungsi simpan (`handleSaveDraftDirectly` dan `handleSaveKostManagerListing`), pastikan `province` yang tersimpan di `metadata.province` tidak pernah bernilai string kosong.

### B. Kenapa Peringatan Evaluasi / Badge Revisi Masih Muncul Pasca Kirim Ulang?
1. **Parser Hanya Membaca String Notes Tanpa Cek Status**: Fungsi `parseEvaluationData(notesText)` sebelumnya hanya memeriksa apakah teks catatan memuat kata `"[revisi"`. Karena teks catatan admin yang lama masih tersimpan di kolom `notes` pada database, `hasRevision` selalu bernilai `true` selamanya.
2. **Pengabaian Status `SUBMITTED`**: Setelah agen menekan tombol *"Kirim Ulang Hasil Revisi ke Admin"*, status pengajuan berubah menjadi `SUBMITTED` / `PENDING_ONBOARDING`. Namun karena komponen tidak memeriksa status saat memanggil `parseEvaluationData`, UI tetap menganggap form berada dalam mode `REVISION_REQUIRED` (memunculkan badge `REVISI` dan border animasi kelap-kelip).
3. **Solusi**:
   - Perbarui fungsi `parseEvaluationData(notesText, status)`:
     ```typescript
     const containsRevisionTag = lower.includes('[revisi') || lower.includes('evaluasi admin') || lower.includes('perlu diperbaiki');
     const isSubmittedOrApproved = status === 'SUBMITTED' || status === 'APPROVED' || status === 'COMPLETED' || status === 'PENDING_ONBOARDING';
     const hasRevision = Boolean(containsRevisionTag && !isSubmittedOrApproved);
     ```
   - Berikan argumen `status` pada seluruh pemanggilan `parseEvaluationData(isEditingKostManager?.notes, isEditingKostManager?.status)`.
   - Ketika status adalah `SUBMITTED`, badge `REVISI` dan border kelap-kelip otomatis **dinonaktifkan**, digantikan dengan banner status hijau/emerald: *"✨ Data Revisi Telah Dikirim ke Admin (Menunggu Verifikasi & Persetujuan)"*.

---

## 2. Dampak Perubahan File

| File | Komponen / Fungsi | Rencana Modifikasi |
|---|---|---|
| [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) | `detectProvinceFromAddress`, `openKostManagerListing`, `reverseGeocodeAndApply` | Penambahan deteksi otomatis nama provinsi dari teks alamat & penjaminan fallback non-kosong |
| [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) | `parseEvaluationData`, `handleSaveKostManagerListing`, Step Badges & Banners | Penyelarasan status `hasRevision = false` saat status `SUBMITTED` dan penambahan banner konfirmasi pengiriman |
| [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) | Entry #139 | Pencatatan riwayat progres |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

1. **Implementasi Auto-Detect & Fallback Provinsi**:
   - Buat fungsi `detectProvinceFromAddress`.
   - Terapkan di `openKostManagerListing` untuk draft localStorage, `dbKmProp`, `dbPropertyRecord`, dan geocoder.
   - Pastikan `metadata.province` selalu terisi nilai valid saat menyimpan.
2. **Penyempurnaan Parser Evaluasi & Penonaktifan Alarm Pasca-Submit**:
   - Update `parseEvaluationData` agar menerima parameter `status`.
   - Update seluruh pemanggilan `parseEvaluationData` di `AgentDashboard.tsx` agar menyertakan `status`.
   - Tampilkan banner hijau *"Data Revisi Telah Dikirim"* saat `isEditingKostManager?.status === 'SUBMITTED'`.
3. **Uji Kompilasi Build**:
   - Jalankan `npm run build` di `functions/public/` dan pastikan 0 error.
4. **Dokumentasi & Push**:
   - Catat di `functions/PROGRESS.md` dan `WALKTHROUGH.md`, lalu commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Uji Buka Kembali Form**: Membuka form pendataan survei; pastikan input **Provinsi** otomatis terisi (misal: *"Sulawesi Selatan"*) bersama dengan Kota dan Kecamatan.
- [ ] **Uji Kirim Ulang & Hilangnya Peringatan Revisi**: Mengirim ulang data survei revisi; pastikan badge `REVISI` di tab step hilang, border kelap-kelip hilang, dan banner status beralih menjadi *"Data Revisi Telah Dikirim ke Admin"*.
