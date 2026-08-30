# Rencana Implementasi: Perbaikan Kolom Skema `end_date` pada Tabel `resident_status` (`userService.ts`)

Dokumen ini menganalisis akar penyebab error `PGRST204: Could not find the 'endDate' column of 'resident_status' in the schema cache` yang terjadi saat calon penghuni melakukan pengajuan sewa dan menyusun langkah perbaikan sistematis.

---

## 1. Analisis Masalah

### Kondisi & Masalah Saat Ini:
1. Saat pengguna mengklik **"Ajukan Sewa"** pada halaman detail kost ([`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx) / [`BookingModal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/BookingModal.tsx)), fungsi `createBookingRequest()` di [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts) dieksekusi.
2. Pada tahap inisialisasi awal, fungsi tersebut membuat baris record `resident_status` berstatus `PENDING`:
   ```typescript
   // userService.ts:347-359
   const { data: resStatus, error: resError } = await supabase
     .from('resident_status')
     .insert([{
       user_id: bookingData.userId,
       kost_id: bookingData.productId,
       status: 'PENDING',
       start_date: bookingData.metadata?.startDate || getCurrentDate().toISOString().split('T')[0],
       endDate: bookingData.metadata?.endDate || getCurrentDate().toISOString().split('T')[0], // <-- TYPO: camelCase 'endDate'
       room_type: bookingData.metadata?.roomType || '-',
       metadata: { ... }
     }])
     .select()
     .single();
   ```
3. **Akar Masalah**:
   - Kolom tanggal mulai menggunakan `start_date` (*snake_case*), namun kolom tanggal selesai tertulis `endDate` (*camelCase*).
   - Pada tabel PostgreSQL Supabase `resident_status`, nama kolom fisik yang terdaftar di schema cache adalah `end_date` (bukan `endDate`).
   - Akibatnya PostgREST melempar error:
     ```text
     code: "PGRST204"
     message: "Could not find the 'endDate' column of 'resident_status' in the schema cache"
     ```
   - Record `resident_status` awal gagal dibuat sehingga `residentStatusId` bernilai `null` pada transaksi pesanan.

---

## 2. Solusi yang Direncanakan

1. **Koreksi Kolom Payload `resident_status` di [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)**:
   - Mengubah properti `endDate` menjadi `end_date`.
   - Menambahkan kolom `room_number` (`bookingData.metadata?.roomNumber || bookingData.metadata?.variantName || null`) agar nomor unit kamar tercatat secara presisi sejak tahap pengajuan sewa.
2. **Penyelarasan Nilai Default Tanggal**:
   - Memastikan `start_date` dan `end_date` terisi dengan string tanggal format ISO (`YYYY-MM-DD`) yang valid.

---

## 3. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts) | Memperbaiki penamaan properti insert tabel `resident_status` dari `endDate` menjadi `end_date` dan menyertakan `room_number`. |
| 2 | `functions/PROGRESS.md` | Pencatatan riwayat penyelesaian bug (Anti-Amnesia). |
| 3 | `WALKTHROUGH.md` | Penerbitan dokumentasi walkthrough dan hasil pengujian. |

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Langkah 1: Modifikasi `userService.ts`**
   - Mengubah payload insert `resident_status` pada `createBookingRequest`:
     ```typescript
     {
       user_id: bookingData.userId,
       kost_id: bookingData.productId,
       status: 'PENDING',
       start_date: bookingData.metadata?.startDate || getCurrentDate().toISOString().split('T')[0],
       end_date: bookingData.metadata?.endDate || getCurrentDate().toISOString().split('T')[0],
       room_type: bookingData.metadata?.roomType || '-',
       room_number: bookingData.metadata?.roomNumber || bookingData.metadata?.variantName || null,
       metadata: {
         ...bookingData.metadata,
         booking_session_id: bookingSessionId,
         created_via: 'booking_request'
       }
     }
     ```
2. **Langkah 2: Uji Kompilasi & Build**
   - Menjalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 0 error kompilasi.
3. **Langkah 3: Dokumentasi & Git Push**
   - Mencatat progres ke `functions/PROGRESS.md` dan memperbarui `WALKTHROUGH.md`.
   - Melakukan `git commit` dan `git push` ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- **Verifikasi Eksekusi Booking**:
  - Simulasi submit formulir booking kamar.
  - Memastikan tidak ada lagi error `PGRST204: Could not find the 'endDate' column of 'resident_status' in the schema cache` di console browser.
  - Memastikan baris `resident_status` berhasil dibuat dengan `status: 'PENDING'` serta `start_date`, `end_date`, dan `room_number` yang lengkap.
- **Verifikasi Build**: `npm run build` lulus 100% dengan 0 error.
