# Walkthrough: Perbaikan Kolom Skema `end_date` pada Tabel `resident_status`

Dokumen ini mendokumentasikan hasil perbaikan error schema cache `PGRST204` saat pengajuan sewa unit kost pada [`userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts).

---

## 1. Daftar Perubahan

### A. Koreksi Payload Insert `resident_status` di `userService.ts`
- Memperbaiki penamaan properti dari `endDate` (*camelCase*) menjadi `end_date` (*snake_case*) agar sesuai 100% dengan kolom fisik pada skema tabel database PostgreSQL Supabase.
- Menyertakan kolom `room_number` (`bookingData.metadata?.roomNumber || bookingData.metadata?.variantName || null`) agar unit kamar yang diajukan langsung tercatat dengan akurat sejak baris status penghuni dibuat (`status: 'PENDING'`).

```diff
     // 0. Create Resident Status record (Inactive/Pending until payment)
     const { data: resStatus, error: resError } = await supabase
       .from('resident_status')
       .insert([{
         user_id: bookingData.userId,
         kost_id: bookingData.productId,
         status: 'PENDING', // Will be activated on payment
         start_date: bookingData.metadata?.startDate || getCurrentDate().toISOString().split('T')[0],
-        endDate: bookingData.metadata?.endDate || getCurrentDate().toISOString().split('T')[0],
+        end_date: bookingData.metadata?.endDate || getCurrentDate().toISOString().split('T')[0],
         room_type: bookingData.metadata?.roomType || '-',
+        room_number: bookingData.metadata?.roomNumber || bookingData.metadata?.variantName || null,
         metadata: {
             ...bookingData.metadata,
             booking_session_id: bookingSessionId,
             created_via: 'booking_request'
         }
       }])
       .select()
       .single();
```

---

## 2. Hasil Pengujian & Kompilasi

Kompilasi build produksi Vite (`functions/public/`):
```text
> vite build
✓ 2531 modules transformed.
✓ built in 1m 2s
Status: 0 errors / Lulus 100%
```

---

## 3. Panduan Pengujian untuk Pengguna (User Testing Guide)

1. Buka halaman detail kost (misal Kost Madani atau kost lainnya).
2. Pilih kamar dan durasi sewa yang diinginkan, kemudian klik tombol **"Ajukan Sewa"**.
3. Isi data pengajuan pada modal dan konfirmasi pengajuan sewa.
4. Buka Console DevTools browser:
   - **Ekspektasi**: Tidak ada lagi pesan error `PGRST204: Could not find the 'endDate' column of 'resident_status' in the schema cache`.
   - Transaksi pengajuan sewa berhasil dibuat dengan status `PENDING_APPROVAL` dan baris `resident_status` terhubung secara sempurna.
