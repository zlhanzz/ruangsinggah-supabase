# IMPLEMENTATION PLAN: Perbaikan RLS Error 42501 pada Alur Instant Publish Properti Mitra

## 1. Analisis Masalah & Kebutuhan

### Masalah
Saat mitra menekan tombol **"Publikasikan Kost"** di Langkah 6 pendaftaran kost (`KostFormMitra.tsx`), muncul pesan error:
```text
Supabase Insert Error: {code: '42501', details: null, hint: null, message: 'new row violates row-level security policy for table "properties"'}
```

### Konteks Bisnis & Standar Industri yang Dipilih: **Instant Publish**
Mitra RuangSinggah telah melewati proses verifikasi identitas (KYC/KTP) saat registrasi awal dan platform telah dilengkapi dengan sistem pengawasan pasca-tayang (*post-moderation*) serta tombol pelaporan kost (*Report Listing*). Oleh karena itu, diputuskan alur publikasi adalah **Instant Publish** (kost langsung aktif tayang di katalog publik seketika tombol ditekan, tanpa perlu menunggu persetujuan manual admin).

### Akar Masalah Teknis (PostgreSQL RLS)
1. Kebijakan `properties_insert` pada Supabase PostgreSQL mewajibkan:
   ```sql
   ((auth.uid() IS NOT NULL) AND ((owner_uid = auth.uid()) OR is_admin()) AND (is_admin() OR ((status)::text = 'draft'::text)))
   ```
   Setiap akun non-admin yang melakukan operasi `INSERT` langsung dengan `status: 'published'` ditolak oleh PostgreSQL RLS (kode `42501`).
2. Namun kebijakan `properties_update`:
   ```sql
   qual: ((auth.uid() IS NOT NULL) AND ((owner_uid = auth.uid()) OR is_admin()))
   with_check: null
   ```
   mengizinkan pemilik properti (`owner_uid = auth.uid()`) untuk mengubah status propertinya menjadi `'published'` tanpa batasan `with_check`.
3. Simulasi SQL telah membuktikan 100%:
   - Insert dengan `status: 'draft'` $\rightarrow$ **Berhasil**
   - Update berikutnya dari `'draft'` ke `'published'` oleh akun pemilik $\rightarrow$ **Berhasil**

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
1. `functions/public/adminService.ts`:
   - Pada fungsi `addPropertyWithMedia`:
     - Tentukan status awal insert: jika `isAdmin` gunakan status yang diminta (atau `'published'`). Jika non-admin, gunakan status awal `'draft'` untuk mematuhi RLS `properties_insert`.
     - Setelah baris properti berhasil di-insert (`inserted.id`), jika status yang diinginkan pemanggil adalah `'published'` (alur instant publish): lakukan update instan ke status `'published'` via `supabase.from('properties').update({ status: 'published' }).eq('id', inserted.id)`.
     - Lanjutkan sinkronisasi kamar (`syncPropertyRooms`) dan kembalikan ID properti.
2. `functions/public/components/KostFormMitra.tsx`:
   - Verifikasi penanganan alur tombol "Publikasikan Kost" agar transisi UI dan pembersihan draft lokal berjalan mulus tanpa error.
3. Pembersihan:
   - Hapus file sementara `test_policies.sql`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Modifikasi `adminService.ts`**:
   - Terapkan alur 2-tahap (safe insert `draft` + instant transition to `published`) di `addPropertyWithMedia`.
2. **Pembersihan Scratch File**:
   - Hapus file `test_policies.sql`.
3. **Verifikasi Build**:
   - Build frontend: `cmd.exe /c "npm --prefix functions/public run build"`
   - Build backend: `cmd.exe /c "npm --prefix functions run build"`
4. **Dokumentasi & Git Push**:
   - Catat progres entri **#459** di `functions/PROGRESS.md`.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi TypeScript / Vite**:
   - Frontend dan backend bebas dari error kompilasi.
2. **Uji Transisi Database Supabase**:
   - Memastikan properti baru tersimpan di database dengan `status: 'published'`, `is_verified: false`, dan langsung terambil oleh query listing publik.
3. **Uji Fungsional Form**:
   - Tombol "Publikasikan Kost" di Langkah 6 berhasil menyelesaikan pendaftaran kost tanpa error RLS 42501.
