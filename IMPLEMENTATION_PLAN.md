# IMPLEMENTATION PLAN: Perbaikan Bug Countdown Batas Waktu Pembayaran (1x24 Jam) di Kost Saya (MyKost.tsx)

## 1. Analisis Masalah & Kebutuhan

### Konteks & Gejala
Setelah pemilik kost menyetujui pengajuan sewa, status transaksi berubah menjadi `AWAITING_PAYMENT` (Menunggu Pembayaran). Pada halaman penyewa (**Kost Saya / MyKost.tsx**), muncul kartu informasi:
- **Judul**: `BATAS WAKTU PEMBAYARAN`
- **Badge**: `1x24 Jam`
- **Tanggal Batas**: `Batas: 30 Okt 2026, 09:09 WITA`
- **Timer Countdown**: `769 JAM : 09 MNT : 45 DTK`

Pengguna bingung karena kartu menyatakan batas waktu adalah **1x24 Jam**, namun timer digital di bawahnya justru menampilkan **769 Jam** (setara 32 hari).

---

### Akar Masalah Teknis (Root Cause Analysis)
1. **Desinkronisasi Antara Timestamp Transaksi dan Waktu Sistem Mock (`RS_MOCK_TIME`)**:
   - Di database Supabase, transaksi disetujui pada **29 Oktober 2026 pukul 09:09:45 WITA**.
   - Batas waktu dihitung dengan:
     $$\text{deadline} = \text{baseTime} + (24 \times 60 \times 60 \times 1000) = \text{30 Oktober 2026, 09:09:45 WITA}$$
   - Namun, pada browser penyewa (`userbiasa1`), `localStorage` menyimpan waktu simulasi (`RS_MOCK_TIME`) dari sesi pengujian sebelumnya yang diset pada **28 September 2026 pukul 00:00:00 UTC** (pukul **08:00:00 WITA**).
   - Saat menghitung sisa waktu:
     $$\text{remainingMs} = \text{deadline} - \text{now}$$
     $$\text{selisih} = \text{30 Okt 2026, 09:09:45} - \text{28 Sep 2026, 08:00:00} = 32\text{ hari } 1\text{ jam } 9\text{ menit } 45\text{ detik}$$
     $$32 \times 24\text{ jam} + 1\text{ jam} = \mathbf{769\text{ Jam, } 09\text{ Menit, } 45\text{ Detik}}$$
   - Nilai $769$ jam tersebut adalah **selisih eksak milidetik** antara tanggal 30 Oktober dan 28 September!

2. **Ketiadaan Batas Maksimum (Absence of Hard Cap / SLA Guardrail)**:
   - Komponen menghitung `hours = Math.floor(safeMs / (1000 * 60 * 60))` tanpa membatasi bahwa durasi pembayaran adalah **1x24 Jam**.
   - Jika ada perbedaan jam perangkat (clock drift) atau tanggal simulasi masa lalu (`now < baseTime`), waktu yang ditampilkan membengkak tidak wajar hingga ratusan jam.

3. **Ticker Detik Membaca Tanggal Statis**:
   - `useEffect` interval 1 detik memanggil `setNowTick(getCurrentDate().getTime())`. Jika `RS_MOCK_TIME` berupa tanggal tanggalan mentah (`YYYY-MM-DD`), nilainya tidak berdetik dan waktu countdown menjadi kaku/beku.

4. **Timestamp `approved_at` Belum Terkunci Permanen**:
   - Saat status diubah ke `AWAITING_PAYMENT`, `updateBookingStatus` belum menyematkan `approved_at` eksplisit di metadata transaksi, melainkan mengandalkan `updated_at` yang rentan tergeser oleh query atau mutasi lain di masa mendatang.

---

## 2. Dampak Perubahan (Files Touched)

| File | Perubahan Utama |
|---|---|
| `functions/public/pages/MyKost.tsx` | - Menerapkan **SLA 24-Hour Hard Cap Guardrail**: `safeMs` dibatasi maksimal $24 \times 3600 \times 1000$ ms.<br>- Mengatasi kondisi `now < baseTime` (waktu lokal di masa lalu) agar sisa waktu dihitung maksimal 24 jam penuh.<br>- Memperbaiki live ticking countdown agar berdetik mulus per detik.<br>- Memprioritaskan pembacaan timestamp: `metadata.approved_at` > `kost.approved_at` > `kost.updated_at`. |
| `functions/public/userService.ts` | - Di fungsi `updateBookingStatus`: ketika status bertransisi ke `AWAITING_PAYMENT`, simpan timestamp `approved_at: nowIso` ke dalam `metadata` transaksi dan `resident_status` agar terkunci permanen. |
| `functions/public/pages/MitraDashboard.tsx` | - Di fungsi `getBookingSlaInfo`: terapkan guardrail proteksi yang sama (`Math.min(24 * 3600 * 1000, Math.max(0, diffMs))`) agar dashboard pemilik kost juga bebas dari bug jam ratusan jika terjadi desinkronisasi waktu. |

---

## 3. Langkah-Langkah Eksekusi (Incremental Execution)

### Langkah 1: Kunci Timestamp `approved_at` di `userService.ts`
1. Buka `functions/public/userService.ts`.
2. Pada fungsi `updateBookingStatus`:
   ```typescript
   const isApproving = status === 'AWAITING_PAYMENT';
   const updatedMeta = {
     ...existingMeta,
     ...(typeof extra === 'object' && extra !== null ? extra : {}),
     ...(isApproving && !existingMeta.approved_at ? { approved_at: nowIso } : {}),
     ...(rejectionReason ? { rejection_reason: rejectionReason, rejected_at: nowIso } : {})
   };
   ```

### Langkah 2: Perbaiki Penghitungan & Guardrail di `MyKost.tsx`
1. Buka `functions/public/pages/MyKost.tsx`.
2. Di fungsi `getBookingExpiryInfo(kost)`:
   - Ambil `baseTimeStr` dengan prioritas: `kMeta.approved_at || kost.approved_at || kost.updated_at || kost.created_at || kMeta.createdAt`.
   - Tentukan `MAX_WINDOW_MS = BOOKING_EXPIRY_HOURS * 60 * 60 * 1000` (24 Jam = 86.400.000 ms).
   - Tentukan `effectiveNow = Math.max(now, baseTime)` (mencegah kondisi waktu sistem lebih lampau dari waktu persetujuan transaksi).
   - Hitung `rawRemaining = deadline - effectiveNow`.
   - Batasi: `safeMs = Math.min(MAX_WINDOW_MS, Math.max(0, rawRemaining))`.
   - Dengan guardrail ini, nilai `hours` dijamin berada dalam rentang `0 <= hours <= 24`. Nilai 769 jam **mustahil terjadi lagi**.
3. Pastikan interval live timer (`useEffect` `1000ms`) memperbarui state secara kontinu sehingga detik berkurang mulus dari 59 ke 00.

### Langkah 3: Proteksi Serupa di `MitraDashboard.tsx`
1. Buka `functions/public/pages/MitraDashboard.tsx`.
2. Pada `getBookingSlaInfo(createdAtStr)`:
   - Terapkan guardrail:
     ```typescript
     const safeDiffMs = Math.min(24 * 60 * 60 * 1000, Math.max(0, diffMs));
     ```
   - Menjamin countdown konfirmasi pemilik kost juga tidak akan pernah menampilkan angka > 24 jam.

---

## 4. Rencana Verifikasi

1. **Uji Matematis & Tampilan UI**:
   - Simulasi dengan tanggal `RS_MOCK_TIME` apa pun di masa lalu: pastikan timer di kartu `BATAS WAKTU PEMBAYARAN` **hanya menampilkan maksimal 24 Jam** (misal: `23 JAM : 58 MNT : 12 DTK`).
   - Verifikasi detik berkurang setiap 1 detik secara real-time.
2. **Uji Kompilasi TypeScript / Vite**:
   - Jalankan `npm --prefix functions/public run build` untuk memastikan 0 error kompilasi.
   - Jalankan `npm --prefix functions run build` untuk memverifikasi backend functions.
3. **Pencatatan Riwayat**:
   - Dokumentasikan perubahan ke `functions/PROGRESS.md` sebagai **Progres #475**.
   - Buat dokumen `WALKTHROUGH.md` dan lakukan push ke branch `bukan-productions`.
