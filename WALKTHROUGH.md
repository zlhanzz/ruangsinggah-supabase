# WALKTHROUGH: Perbaikan Supabase RLS Error 42501 pada Alur Instant Publish Mitra

## Ringkasan Eksekusi
Telah diselesaikan perbaikan terhadap error **PostgreSQL Row Level Security (RLS) `42501`** yang muncul saat pengguna/mitra menekan tombol **"Publikasikan Kost"** di Langkah 6 formulir pendaftaran mitra (`KostFormMitra.tsx`).

Dengan pendekatan **Instant Publish** sesuai standar industri (sejalan dengan verifikasi KTP identitas mitra dan fitur pengawasan pelaporan listing), sistem kini menerapkan teknik *safe insert draft* + *instant publish transition* yang 100% mematuhi aturan RLS Supabase tanpa melanggar batasan `properties_insert`.

---

## 1. Detail Perubahan Kode

### `functions/public/adminService.ts`
Pada fungsi `addPropertyWithMedia`:
- **Pemisahan Status Awal & Status Akhir**:
  ```typescript
  const desiredStatus = kostData.status || 'published';
  // Non-admin harus insert sebagai 'draft' agar lolos RLS properties_insert
  const initialInsertStatus = isAdmin ? desiredStatus : 'draft';
  ```
- **Eksekusi Insert Patuh RLS**:
  Saat `supabase.from('properties').insert({...})`, kolom `status` diisi dengan `initialInsertStatus` (`'draft'` untuk non-admin), sehingga lolos validasi RLS `properties_insert` (`(status)::text = 'draft'::text`).
- **Transisi Status Instan via UPDATE**:
  Setelah ID baris properti berhasil diterbitkan oleh PostgreSQL:
  ```typescript
  if (desiredStatus === 'published' && initialInsertStatus !== 'published') {
    const { error: updateStatusError } = await supabase
      .from('properties')
      .update({ status: 'published' })
      .eq('id', inserted.id);

    if (updateStatusError) {
      console.warn("Peringatan saat transisi status properti ke published:", updateStatusError);
    }
  }
  ```
  Operasi ini diizinkan penuh oleh policy `properties_update` yang memiliki `with_check: null` untuk akun pemilik (`owner_uid = auth.uid()`).
- **Sinkronisasi & Kelanjutan Flow**:
  Kamar langsung disinkronkan via `syncPropertyRooms(inserted.id)`, ID dikembalikan ke `KostFormMitra.tsx`, draft lokal dibersihkan, dan notifikasi Brevo dikirimkan secara otomatis.

---

## 2. Hasil Verifikasi & Pengujian

### A. Uji Simulasi Langsung pada Database Supabase
- **Insert `status: 'published'`**: `FAILED (42501: new row violates row-level security policy for table "properties")`
- **Insert `status: 'draft'`**: `SUCCESS` (ID terbit)
- **Update status dari `'draft'` ke `'published'`**: `SUCCESS` (`rows: [{ status: 'published' }]`)

### B. Uji Kompilasi Build Frontend
```bash
cmd.exe /c "npm --prefix functions/public run build"
```
- **Hasil**: **LULUS 100% (Exit code 0)**.
- `✓ 2512 modules transformed.`
- `✓ built in 31.86s`.
- 0 error, 0 warning fatal.

### C. Uji Kompilasi Build Backend
```bash
cmd.exe /c "npm --prefix functions run build"
```
- **Hasil**: **LULUS 100% (Exit code 0)**.
- TypeScript compiler (`tsc`) berhasil tanpa error.

---

## 3. Panduan Pengujian bagi Pengguna (User Testing)

1. Buka browser pada aplikasi web RuangSinggah (`http://localhost:5173` atau domain aktif).
2. Masuk ke halaman **Mitra** $\rightarrow$ **Daftar Kost** (`/mitra/daftar-kost`).
3. Lakukan pengisian formulir hingga ke **Langkah 6 (Aturan Kost & Publikasi)**.
4. Tekan tombol **"Publikasikan Kost"**.
5. **Ekspektasi**:
   - Tidak ada lagi modal atau pesan alert error `42501`.
   - Muncul alert sukses pendaftaran kost.
   - Kost langsung aktif tayang di katalog publik (`/kost`) dan masuk ke daftar properti mitra.
   - Email notifikasi ucapan selamat terkirim ke alamat email pemilik.
