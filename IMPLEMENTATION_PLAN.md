# Rencana Implementasi: Perbaikan Pin Lokasi Minimize, Sinkronisasi Wilayah Database & Indikator Evaluasi (`AgentDashboard.tsx`)

Dokumen ini disusun untuk menjawab dan menyelesaikan 3 kendala yang dialami pengguna pada form pendataan survei KostManager di `AgentDashboard.tsx`:
1. Titik lokasi GPS tidak dapat ditetapkan saat peta dalam tampilan minimize (inline).
2. Data Provinsi dan Kota/Kabupaten hilang saat kembali membuka form karena kegagalan simpan ke database (Supabase schema mismatch) dan ketiadaan pembacaan kembali `province` dari database record.
3. Penjelasan dan penyempurnaan alur indikator kelap-kelip penunjuk evaluasi (revisi) saat data telah dikirim ulang oleh agen.

---

## 1. Analisis Masalah Mendalam

### A. Lokasi Tidak Dapat Ditetapkan pada Tampilan Minimize
- **Penyebab**: Event listener `click` dan `dragend` pada mini-map (`kmMapRef`) di `AgentDashboard.tsx` (baris 1383–1397) hanya memanggil `setPendingLocationChange({ lat, lng })` tanpa mengeksekusi fungsi update `kmListingForm.location` dan tanpa memicu *Google Maps Reverse Geocoding*. Marker langsung dikembalikan ke posisi lama karena state form tidak pernah diperbarui.
- **Solusi**: Terapkan fungsi terpadu `updateFormLocationAndGeocode(lat, lng)` yang langsung memperbarui koordinat form, menggerakkan marker, dan memicu reverse geocoder untuk mengisi otomatis Alamat, Provinsi, Kota/Kabupaten, dan Kecamatan/Area saat user mengklik atau menggeser pin di peta minimize.

### B. Provinsi & Kota/Kabupaten Hilang Setelah Pengiriman Data
- **Penyebab**:
  1. **Supabase Schema Cache Error**: Pada fungsi `handleSaveDraftDirectly` dan `handleSaveKostManagerListing`, payload `propertyPayload` menyertakan `province: currentForm.province || ''` sebagai kolom tabel langsung. Karena tabel PostgreSQL `properties` tidak memiliki kolom `province` terpisah, Supabase menolak query update/insert dengan error: `Could not find the 'province' column of 'properties' in the schema cache`. Akibatnya penyimpanan ke database **gagal**.
  2. **Pembacaan Balik `province` Tidak Ada**: Saat membuka kembali survei (`openKostManagerListing`), data diambil dari `properties` / `mitra_kostmanager`, namun properti `province` tidak dimasukkan ke dalam objek inisialisasi `setKmListingForm`.
  3. **Anomali Nilai Kota**: Anomali lama di mana nama kecamatan (seperti *"Kecamatan Tamalanrea"*) tersimpan di kolom `city` belum ternormalisasi saat pembacaan database lama.
- **Solusi**:
  1. Simpan `province` ke dalam kolom `metadata: { ...metadata, province }` pada tabel `properties` dan `mitra_kostmanager` sehingga 100% aman dan tidak memicu error schema.
  2. Saat memuat data di `openKostManagerListing`, baca `province` dari `dbPropertyRecord.province || dbPropertyRecord.metadata?.province || ''`.
  3. Tambahkan sanitasi otomatis: jika `city` terisi teks *"Kecamatan ..."*, otomatis pindahkan ke `area` dan bersihkan prefiksnya.

### C. Alur Indikator Evaluasi (Kelap-Kelip / Animasi Revisi)
- **Penyebab & Klarifikasi**:
  - Animasi kelap-kelip (glowing border, bouncing badge, ring pulse) aktif saat status permohonan adalah `REVISION_REQUIRED` atau catatan memuat tag `[REVISI ...]`.
  - Saat agen menekan tombol **"Kirim Ulang Hasil Revisi ke Admin"**, status pengajuan di database diperbarui menjadi `SUBMITTED` / `PENDING_ONBOARDING` (karena agen telah menyelesaikan revisi dan kini giliran Admin meninjau).
  - Ketika form dibuka kembali dalam status `SUBMITTED`, kita pastikan ringkasan catatan evaluasi tetap dapat dilihat dalam status *"Riwayat Evaluasi (Telah Direvisi & Menunggu Verifikasi Admin)"* secara rapi dan profesional tanpa membingungkan agen.

---

## 2. Dampak Perubahan File

| File | Komponen / Bagian | Rencana Modifikasi |
|---|---|---|
| [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) | Mini Map Listener & Geocoder (`kmMapRef`) | Menghubungkan klik/drag mini-map langsung ke `updateFormLocationAndGeocode` |
| [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) | `handleSaveDraftDirectly` & `handleSaveKostManagerListing` | Memindahkan `province` ke dalam `metadata.province` agar aman dari error Supabase schema cache |
| [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) | `openKostManagerListing` | Menambahkan pembacaan `province` dari metadata serta normalisasi otomatis `city`/`area` lama |
| [functions/public/adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) | `addPropertyWithMedia` & `updatePropertyWithMedia` | Memastikan `province` disimpan ke `metadata.province` tanpa menembak kolom non-eksisten |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

1. **Implementasi Interaktivitas Peta Minimize**:
   - Buat fungsi reverse geocoding terpadu yang dapat dipanggil oleh mini-map maupun modal popup.
   - Pasang listener `click` dan `dragend` pada mini-map Google Maps instance agar langsung mengunci titik dan memperbarui form wilayah secara real-time.
2. **Perbaikan Penyimpanan & Pembacaan Database**:
   - Perbaiki konstruksi payload `propertyPayload` di `handleSaveDraftDirectly` dan `handleSaveKostManagerListing` agar `province` disimpan di `metadata.province`.
   - Update `openKostManagerListing` di `AgentDashboard.tsx` agar memuat `province` dari `dbPropertyRecord.metadata?.province` atau `dbKmProp.metadata?.province`.
   - Lakukan pembersihan otomatis jika `city` lama berisi nilai kecamatan.
3. **Penyelarasan Tampilan Evaluasi**:
   - Pastikan banner dan catatan evaluasi menampilkan status yang jelas baik saat `REVISION_REQUIRED` (mode revisi aktif ber-indikator interaktif) maupun saat `SUBMITTED` (mode menunggu tinjauan admin).
4. **Uji Build Kompilasi**:
   - Jalankan `npm run build` di `functions/public/` untuk memastikan 0 error TypeScript / JSX.
5. **Dokumentasi & Push**:
   - Catat di `functions/PROGRESS.md` dan `WALKTHROUGH.md`, lalu commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Uji Pin Minimize**: Mengklik dan menggeser marker pada peta mini tanpa membuka pop-up; pastikan koordinat terkunci dan Provinsi, Kota, Kecamatan terisi otomatis.
- [ ] **Uji Simpan & Buka Kembali**: Mengisi data properti lengkap, simpan/kirim, lalu buka kembali dari daftar tugas; pastikan Provinsi, Kota, dan Kecamatan tetap terisi penuh dan akurat.
- [ ] **Uji Supabase Mutation**: Memastikan respon database Supabase berstatus 200 OK (0 error schema cache).
- [ ] **Uji Status Evaluasi**: Memverifikasi banner evaluasi tampil dengan indikator yang tepat sebelum dan sesudah pengiriman ulang.
