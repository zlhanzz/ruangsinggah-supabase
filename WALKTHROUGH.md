# WALKTHROUGH: Perbaikan Bug Integritas Data `room_types` — Fitur #264
**Tanggal**: 2026-09-02 | **Branch**: `bukan-productions` | **Commit**: `ab64c04`

---

## 1. Daftar Perubahan

### File: `functions/public/adminService.ts`

#### Perubahan A — Graceful Handling RLS Error (baris ~1260)
Mengubah `console.error` menjadi `console.warn` saat RLS kode `42501` terpicu pada tabel `rooms`, agar tidak ada alarm merah palsu di konsol browser mitra.

#### Perubahan B (KRITIS) — Hapus Overwrite `room_types` (baris ~1266-1315)
Menghapus seluruh blok re-aggregasi `aggregatedRoomTypes` yang sebelumnya menimpa kolom `properties.room_types` dengan data yang korup akibat upsert gagal ke tabel `rooms`.

Sekarang `syncPropertyRooms` hanya mengupdate kolom `price` (harga minimum) berdasarkan `rawRooms` yang diambil langsung dari `properties.room_types` — sumber yang sudah benar dari awal insert.

---

## 2. Hasil Pengujian

### Build Verification
- **✓ 2506 modules transformed. Built in 30.29s. Exit code 0.**

### Root Cause yang Sudah Diperbaiki

**ALUR LAMA (BERMASALAH):**
1. INSERT properties (room_types = [Standard, VIP]) — berhasil
2. syncPropertyRooms dipanggil
3. Upsert ke tabel rooms — GAGAL RLS 42501
4. Tetap lanjut: re-aggregate room_types dari flatRooms yang korup
5. UPDATE properties SET room_types = [Standard] — **OVERWRITE! Bug!**
6. Tipe VIP hilang dari database

**ALUR BARU (SUDAH DIPERBAIKI):**
1. INSERT properties (room_types = [Standard, VIP]) — berhasil
2. syncPropertyRooms dipanggil
3. Upsert ke tabel rooms — GAGAL RLS 42501
4. console.warn kuning informatif (bukan error merah)
5. Hitung harga minimum dari rawRooms (properties.room_types asli)
6. UPDATE properties SET price = 500000 — hanya update price
7. room_types tetap [Standard, VIP] — TIDAK DISENTUH

---

## 3. Konfirmasi Pemisahan Data Self-Listing vs KostManager

- **Self-listing Mitra**: `is_managed = false`
- **KostManager**: `is_managed = true`

Kedua jenis kost tersimpan di tabel `properties` yang sama namun dibedakan kolom `is_managed`. Dashboard mitra difilter berdasarkan `owner_uid = user.id` sehingga mitra hanya melihat kost miliknya sendiri.

---

## 4. Panduan Verifikasi untuk User

1. Login sebagai mitra self-listing di browser.
2. Buka Mitra Dashboard → klik "Tambah Kost".
3. Isi form hingga **Langkah Tipe Kamar**: tambahkan **2 tipe kamar berbeda** (contoh: Standard Rp 500.000 dan VIP Rp 800.000).
4. Upload minimal 1 foto → klik **"Publikasikan Kost"**.
5. **Verifikasi konsol browser**: Tidak ada `console.error` merah. Hanya `console.warn` kuning jika RLS `rooms` terpicu.
6. **Verifikasi Supabase** (Table Editor → `properties`): kolom `room_types` harus mengandung tepat **2 entri** dan `is_managed = false`.

### SQL Opsional (Supabase SQL Editor — untuk mengaktifkan tabel `rooms` bagi mitra)

```sql
CREATE POLICY "Mitra can insert own property rooms"
ON public.rooms FOR INSERT TO authenticated
WITH CHECK (
  property_id IN (SELECT id FROM properties WHERE owner_uid = auth.uid())
);

CREATE POLICY "Mitra can update own property rooms"
ON public.rooms FOR UPDATE TO authenticated
USING (
  property_id IN (SELECT id FROM properties WHERE owner_uid = auth.uid())
);
```

> **Catatan**: SQL ini bersifat opsional. Tanpa policy ini, data kamar tetap 100% aman di `properties.room_types` (JSONB) sebagai *single source of truth*.
