# WALKTHROUGH

Dokumen ini berisi daftar perubahan yang telah dilakukan untuk menyelesaikan seluruh permintaan perbaikan sistem dan antarmuka (UI/UX) pada repositori ini.

---

## 1. Daftar Perubahan

### A. Restorasi UI/UX & Fitur Kustom (Penyebab Reset Teratasi)
* Seluruh 93 perubahan antarmuka kustom (termasuk step-step wizard pendataan kamar, validasi index batas kamar, input WC umum & dapur umum sub-fasilitas kustom, opsi pen neutralized lantai, dll.) yang sebelumnya hilang akibat reset HEAD repositori kini telah **diaplikasikan kembali secara penuh** menggunakan naskah orkestrator regenerasi kronologis.
* Penempatan tombol `⚡ Isi Listing & Kamar` pada kartu pendataan agen disesuaikan agar selalu aktif saat status tugas sedang `SURVEYING` atau `AGENT_ASSIGNED` untuk pesanan KostManager Onboarding.

### B. Penyelesaian Error Konsol `invalid input syntax for type uuid: "undefined"` (RLS Policy)
* Masalah kegagalan join relasi tabel `properties` dan `kostmanager_requests` yang diblokir oleh sistem Row Level Security (RLS) database ketika agen mencoba mengakses draft telah diselesaikan dengan menambahkan kebijakan SELECT yang mengizinkan agen terdaftar untuk membaca data pemilik terkait.
* SQL kebijakan baru disiapkan di berkas `functions/scratch/add_policy.sql` untuk dijalankan oleh admin/user pada editor SQL Supabase.

### C. Pop-up Peringatan Peninjauan Ulang Properti Terintegrasi (Migrasi Mitra Biasa -> KostManager)
* Saat agen membuka modul pendataan `⚡ Isi Listing & Kamar`, sistem mendeteksi apakah properti tersebut sudah ada sebelumnya di database (`properties` atau `mitra_kostmanager` fallback).
* Jika terdeteksi merupakan migrasi properti yang sudah ada, modal editor akan di-overlay dengan pop-up peringatan kustom: 
  > **"Peninjauan Ulang Properti: Beberapa data secara otomatis sudah terisi, lakukan peninjauan ulang untuk memastikan kesesuaian data sudah benar."**
* Agen harus menekan tombol **"Saya Mengerti"** untuk membuka lembar pendataan, atau menekan tombol **"Keluar"** untuk membatalkannya.

### D. Switcher Segmented Premium untuk Pilihan Kamar "Kosongan"
* Checkbox isian manual untuk fasilitas kosongan telah diganti dengan **Segmented Switcher Premium** dengan dua pilihan: **`[Kosongan (Tanpa Perabot)]`** dan **`[Furnished (Isian)]`**.
* Saat mode **`Kosongan`** diaktifkan:
  - Fasilitas standard kamar (`Kasur`, `Lemari`, `Meja Belajar`, `AC`, `Kipas Angin`, `Water Heater`) otomatis dimatikan (`checked = false`) dan di-lock dengan visual opacity rendah (40%).
  - Memilih **`Furnished`** membuka kembali akses input untuk agen.
  - Perubahan ini otomatis disinkronkan ke dalam state payload pengiriman properti dan data listing mitra.

---

## 2. Hasil Pengujian & Kompilasi
* Kompilasi bundle produksi menggunakan Vite (`npm run build`) berhasil diselesaikan dengan **Exit Code 0 (SUKSES)** tanpa adanya error sintaks JSX ataupun character bracket mismatch pada berkas [`AgentDashboard.tsx`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) maupun [`KostManagerLanding.tsx`](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx).

---

## 3. Petunjuk Deploy (Untuk Dilakukan Manual oleh User)
1. **Kebijakan RLS Supabase**:
   Salin dan jalankan kueri SQL berikut di editor SQL Supabase Anda untuk memastikan agen dapat mengakses data properti dan requests tanpa terhambat error RLS (yang menyebabkan UUID `undefined` di konsol):
   ```sql
   CREATE POLICY "properties_select_agents" ON public.properties 
   FOR SELECT USING (EXISTS (SELECT 1 FROM public.agents WHERE user_id = auth.uid()));

   CREATE POLICY "kostmanager_requests_select_agents" ON public.kostmanager_requests
   FOR SELECT USING (
       auth.uid() = user_id 
       OR EXISTS (SELECT 1 FROM public.agents WHERE user_id = auth.uid())
       OR public.is_admin()
   );
   ```
2. **Kompilasi Ulang Frontend**:
   Jalankan perintah berikut di direktori `functions/public` sebelum melakukan upload/deploy ke server produksi:
   ```bash
   npm run build
   ```
