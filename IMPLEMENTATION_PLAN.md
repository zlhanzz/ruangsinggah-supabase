# Rencana Implementasi: Standarisasi Relasional (room_id & room_type) dan Perbaikan Error PGRST204

Dokumen ini merinci rencana final arsitektur data pemesanan sewa untuk menyelaraskan sistem dengan standar industri proptech (relasi `room_id` untuk KostManager, kategori `room_type` untuk Mitra Biasa, dan JSON `metadata` untuk catatan unit fleksibel), serta menghilangkan error database PostgREST `PGRST204`.

---

## 1. Analisis Masalah & Keputusan Arsitektur Standar Industri

### A. Akar Masalah Error `PGRST204`
Pada [userService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts) baris 902:
```typescript
room_type: bookingData.metadata?.roomType || '-',
room_number: bookingData.metadata?.roomNumber || bookingData.metadata?.variantName || null, // <-- INVALID COLUMN
```
PostgREST melempar error:
`Could not find the 'room_number' column of 'resident_status' in the schema cache` karena skema tabel `resident_status` di Supabase memang **tidak memiliki kolom fisik bernama `room_number`**.

### B. Keputusan Desain Berstandar Industri Proptech
Sesuai prinsip normalisasi basis data proptech:
1. **Nomor Kamar Bukan Kolom di Tabel Kontrak (`resident_status`)**:
   - Nomor kamar fisik adalah milik tabel **`rooms`** (`rooms.room_number`).
   - Tabel `resident_status` cukup menyimpan relasi **`room_id`** (Foreign Key ke tabel `rooms`).
2. **Mitra Biasa vs Mitra KostManager**:
   - **Mitra Biasa**:
     - `room_type`: `"Standard"` (nama tipe kamar yang disewa).
     - `room_id`: `null` (karena tidak mengelola inventori per unit fisik di tabel `rooms`).
     - Jika saat serah terima kunci pemilik menetapkan nomor kamar secara manual, catatan tersebut disimpan di dalam kolom JSON **`metadata.assigned_room_number`**.
   - **Mitra KostManager**:
     - `room_type`: `"Standard"`.
     - `room_id`: `"uuid-kamar-101"` (terhubung ke tabel `rooms`).
     - Nomor kamar otomatis didapatkan dari `rooms.room_number`.

---

## 2. Rincian Perubahan Kode

### A. Modifikasi `functions/public/userService.ts`
Pada fungsi `createBookingRequest`:
1. Hapus baris `room_number` dari root payload `resident_status.insert([...])`.
2. Pastikan kolom yang dikirim ke `resident_status` hanya kolom resmi:
   ```typescript
   const isKm = Boolean(bookingData.metadata?.is_managed_kost || bookingData.metadata?.isManaged);
   
   const residentStatusPayload = {
     user_id: bookingData.userId,
     kost_id: bookingData.productId,
     room_id: isKm ? (bookingData.metadata?.roomId || null) : null,
     room_type: bookingData.metadata?.roomType || bookingData.metadata?.variantName || '-',
     status: 'PENDING',
     start_date: bookingData.metadata?.startDate || getCurrentDate().toISOString().split('T')[0],
     end_date: bookingData.metadata?.endDate || getCurrentDate().toISOString().split('T')[0],
     metadata: {
       ...bookingData.metadata,
       booking_session_id: bookingSessionId,
       created_via: 'booking_request',
       is_managed: isKm,
       room_assignment_type: isKm ? 'specific_unit' : 'category_only',
       assigned_room_number: isKm ? (bookingData.metadata?.roomNumber || null) : null
     }
   };
   ```
3. Menjamin fungsi `confirmCheckIn` dapat menerima catatan alokasi kamar opsional dari pemilik Mitra Biasa dan menyimpannya ke `metadata.assigned_room_number`.

### B. Modifikasi Antarmuka Penyewa `functions/public/pages/MyKost.tsx`
1. Membedakan penyajian unit:
   - Jika `metadata.room_assignment_type === 'category_only'` atau `room_id === null` (Mitra Biasa):
     - Tampilkan: **"Tipe [Nama Tipe]"** (misal: "Tipe Standard").
     - Tampilkan catatan edukatif: *"Nomor kamar fisik akan diinformasikan oleh pemilik saat Anda tiba & serah terima kunci."*
   - Jika memiliki `room_id` atau `assigned_room_number` (KostManager / Unit Terdaftar):
     - Tampilkan: **"Tipe [Nama Tipe] • Kamar [Nomor]"** (misal: "Tipe Standard • Kamar 102").

---

## 3. Dampak Perubahan File

1. [userService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts): Koreksi payload `resident_status` & pembersihan kolom invalid.
2. [MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx): Penyesuaian label hunian ramah pengguna.
3. [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md): Pencatatan progres #468.
4. [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md): Dokumentasi hasil uji.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

1. Terapkan koreksi pada `functions/public/userService.ts`.
2. Terapkan penyesuaian label pada `functions/public/pages/MyKost.tsx`.
3. Jalankan pengujian build frontend `npm --prefix functions/public run build` dan backend `npm --prefix functions run build`.
4. Catat progres di `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
5. Lakukan git commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- **Verifikasi Booking Mitra Biasa**: Mengajukan booking di listing Mitra Biasa (Kost Ryuta), memastikan response 200/201 tanpa error `PGRST204`.
- **Verifikasi Data Database**: Record `resident_status` tersimpan dengan `status = 'PENDING'`, `room_type = 'Standard'`, `room_id = null`, dan `metadata` terstruktur.
- **Verifikasi Build**: Lulus 100% tanpa error TypeScript/Vite.
