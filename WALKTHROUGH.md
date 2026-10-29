# WALKTHROUGH: Perbaikan Batas Waktu Pembayaran (Hard Cap 24 Jam) & Penguncian Timestamp Persetujuan

## Ringkasan Pekerjaan
Pada tugas ini, kita meneliti dan menyelesaikan permasalahan di mana kartu **Batas Waktu Pembayaran (1x24 Jam)** pada tab Diajukan (**Kost Saya / MyKost.tsx**) menampilkan `769 JAM : 09 MNT : 45 DTK` bukannya maksimal 24 jam.

Penyebab utamanya adalah desinkronisasi antara waktu persetujuan transaksi di database (29 Oktober 2026) dengan waktu simulasi lama (`RS_MOCK_TIME`) di browser penyewa (28 September 2026), yang menghasilkan selisih eksak milidetik sebesar 769 jam. Selain itu, kami juga menemukan risiko kritis bagi pengguna riil di produksi (*Timer Reset Bug*): di mana sistem lama menggunakan `updated_at`, sehingga setiap kali ada pembaruan transaksi (misal: memilih metode pembayaran Midtrans), batas waktu 24 jam bisa ter-reset kembali ke 24 jam dari awal.

---

## Daftar Perubahan Detail

### 1. `functions/public/userService.ts` (Penguncian Timestamp `approved_at`)
- Pada fungsi `updateBookingStatus`, ketika status bertransisi ke `AWAITING_PAYMENT` (pemilik menyetujui pesanan), sistem kini secara otomatis menyematkan timestamp permanen `approved_at: nowIso` ke dalam metadata tabel `transactions` dan `resident_status`.
- **Dampak Nyata**: Waktu 24 jam kini terkunci permanen sejak detik pertama disetujui. Mutasi data transaksi berikutnya (seperti pembuatan token Midtrans atau pembaruan tagihan) **tidak akan pernah lagi me-reset jendela pembayaran penyewa**.

### 2. `functions/public/pages/MyKost.tsx` (Hard Cap Guardrail & Live Ticker)
- **Prioritas Sumber Waktu**: Memprioritaskan pembacaan `kMeta.approved_at || kost.approved_at || kost.updated_at || kost.created_at`.
- **Proteksi Desinkronisasi Jam**: Menambahkan logika `effectiveNow = Math.max(now, baseTime)`. Jika jam lokal perangkat tertinggal di masa lalu dibanding waktu approval, sisa waktu dihitung maksimal 24 jam penuh tanpa pernah melonjak ke ratusan jam.
- **SLA 24-Hour Hard Cap Guardrail**:
  ```typescript
  const MAX_WINDOW_MS = BOOKING_EXPIRY_HOURS * 60 * 60 * 1000; // 24 jam
  const safeMs = Math.min(MAX_WINDOW_MS, Math.max(0, remainingMs));
  ```
  Dengan pembatas matematis ini, nilai `hours` dijamin 100% selalu berada dalam rentang `0 <= hours <= 24`.
- **Live Real-time Ticker**: State `nowTick` kini memperbarui waktu per 1 detik (`Date.now()`), sehingga detik pada kartu timer digital berdetik mulus secara real-time.

### 3. `functions/public/pages/MitraDashboard.tsx` (Proteksi Dashboard Pemilik Kost)
- Pada fungsi `getBookingSlaInfo`, diterapkan guardrail proteksi yang sama (`Math.min(MAX_SLA_MS, Math.max(0, diffMs))`).
- Menjamin kartu SLA konfirmasi pemilik kost juga tidak akan pernah menampilkan angka jam berlebih jika jam perangkat penyewa atau pemilik mengalami deviasi.

---

## Hasil Pengujian & Kompilasi

### 1. Kompilasi Front-End Vite (`functions/public`)
- Perintah: `npm.cmd --prefix functions/public run build`
- Hasil: **LULUS (Code 0)**
- Bukti log kompilasi:
  ```text
  vite v6.4.1 building for production...
  transforming...
  ✓ 2512 modules transformed.
  rendering chunks...
  computing gzip size...
  ../../public/assets/MyKost-mZaDoyDA.js                 183.62 kB │ gzip:  44.10 kB
  ../../public/assets/MitraDashboard-oD7QIo8m.js         456.57 kB │ gzip:  99.57 kB
  ✓ built in 40.43s
  ```

### 2. Kompilasi Backend Cloud Functions (`functions`)
- Perintah: `npm.cmd --prefix functions run build`
- Hasil: **LULUS (Code 0)**
- Bukti log kompilasi:
  ```text
  > build
  > tsc
  ```

---

## Panduan Pengujian bagi Pengguna

1. Buka halaman **Kost Saya** (`/my-kost`) dengan akun penyewa (`userbiasa1`).
2. Masuk ke tab **Diajukan**.
3. Perhatikan kartu **BATAS WAKTU PEMBAYARAN**:
   - Badge menunjukkan `1x24 Jam`.
   - Baris informasi batas menunjukkan `Batas: [Tanggal], [Jam:Menit] WITA`.
   - Timer digital di bawahnya menunjukkan countdown presisi: misal `23 JAM : 5x MNT : xx DTK`.
   - Detik berkurang mulus setiap 1 detik.
   - Bahkan jika Time Simulator disetel ke tanggal masa lalu, angka jam **tidak akan pernah lagi melonjak ke 769 Jam**.
