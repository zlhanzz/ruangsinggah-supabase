# IMPLEMENTATION PLAN: Timer Countdown Scarcity & Hangus Otomatis (Auto-Expire) Pengajuan Sewa Kost

Dokumen ini berisi rencana implementasi untuk menerapkan **Live Timer Countdown (Strategi Scarcity / Urgensi)** pada kartu pengajuan sewa di halaman **Kost Saya** serta sistem **Hangus Otomatis (Auto-Expire)** jika pembayaran tidak diselesaikan dalam 1x24 jam.

---

## 1. Analisis Kebutuhan & Konsep Scarcity

### A. Strategi Scarcity & Urgensi Visual
1. **Live Scarcity Countdown Banner**:
   - Calon penyewa yang telah disetujui pengajuannya (`AWAITING_PAYMENT`) akan melihat banner/kotak hitung mundur waktu pembayaran yang **berdetak secara live per detik** (`Jam : Menit : Detik`).
   - Teks persuasif psikologi kelangkaan (Scarcity):
     > *"⚡ Segera selesaikan pembayaran! Kamar ini hanya di-hold untuk Anda selama waktu tersisa sebelum dilepas kembali ke calon penyewa lain."*
   - Desain visual menonjol:
     - Badge digital countdown dengan visual jam berkedip lembut (`animate-pulse`).
     - Indikator warna dinamis:
       - **Kuning/Oranye** (> 6 jam tersisa): Waktu normal.
       - **Merah Berdenyut** (≤ 6 jam tersisa): *"Waktu Hampir Habis! Prioritas kamar akan segera dibatalkan"*.
2. **Transisi Otomatis Saat Timer Habis (00:00:00)**:
   - Ketika countdown menyentuh `00:00:00`, kartu secara otomatis bertransisi ke mode **"Pengajuan Hangus / Kedaluwarsa"**.
   - Tombol **"BAYAR SEKARANG"** ditutup dan digantikan tombol **"Ajukan Ulang Sewa"**.
   - Kartu dialihkan ke tab **Riwayat**, dan status transaksi di database Supabase disinkronkan ke `'EXPIRED'`.

---

## 2. Dampak Perubahan File

1. **[`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx)**:
   - Membuat komponen / hook timer lokal (`useLiveCountdown`) yang berdetak setiap 1 detik menghitung sisa waktu terhadap `deadlineTime` (24 jam dari waktu persetujuan/transaksi).
   - Menambahkan blok visual **Scarcity Countdown Box** di atas tombol `BAYAR SEKARANG` pada kartu pengajuan di tab **Diajukan**.
   - Menambahkan state dan styling kartu **Hangus (Expired)** dengan tombol **Ajukan Ulang**.
   - Sinkronisasi otomatis ke Supabase saat terdeteksi kedaluwarsa.
2. **[`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)**:
   - Menampilkan badge **`Hangus (Kedaluwarsa)`** pada baris booking yang telah melewati 24 jam belum dibayar.
   - Mengosongkan reservasi kamar agar unit kamar tetap tersedia di katalog publik.
3. **[`functions/public/userService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/userService.ts)**:
   - Helper `expireBookingTransaction` untuk memperbarui status transaksi dan status penghuni menjadi `'EXPIRED'`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah Persetujuan)

### Langkah 1: Utilitas Waktu & Database (`userService.ts`)
- Menetapkan `BOOKING_EXPIRY_HOURS = 24`.
- Membuat fungsi `expireBookingTransaction(trxId)` untuk meng-update `transactions` dan `resident_status`.

### Langkah 2: Komponen Live Ticking Timer & UI Scarcity di `MyKost.tsx`
- Menambahkan state timer `currentTime` yang ter-update per detik atau hook countdown.
- Merender blok **Scarcity Countdown Card** di kartu pengajuan sewa:
  ```tsx
  {/* Scarcity Countdown Card */}
  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-200/80 rounded-2xl p-3.5 space-y-2">
      <div className="flex items-center justify-between text-orange-800">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-orange-600 animate-pulse" /> Sisa Waktu Pembayaran
          </div>
          <span className="text-[9px] font-bold text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-full">
              Kamar Di-Hold
          </span>
      </div>
      <div className="flex items-center justify-center gap-1.5 font-mono text-center">
          <div className="bg-white px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-sm font-black text-sm text-gray-900">
              {hours} <span className="text-[8px] font-sans text-gray-400 block font-normal">JAM</span>
          </div>
          <span className="font-bold text-orange-500">:</span>
          <div className="bg-white px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-sm font-black text-sm text-gray-900">
              {minutes} <span className="text-[8px] font-sans text-gray-400 block font-normal">MENIT</span>
          </div>
          <span className="font-bold text-orange-500">:</span>
          <div className="bg-white px-2.5 py-1.5 rounded-xl border border-orange-200 shadow-sm font-black text-sm text-rose-600 animate-pulse">
              {seconds} <span className="text-[8px] font-sans text-gray-400 block font-normal">DETIK</span>
          </div>
      </div>
      <p className="text-[8.5px] font-medium text-gray-500 text-center leading-tight">
          Selesaikan pembayaran sebelum waktu habis agar kamar tidak dilepas ke pemesan lain.
      </p>
  </div>
  ```

### Langkah 3: Penanganan Kondisi Expired (Hangus)
- Ketika waktu habis (`isExpired`):
  - Kartu menampilkan badge merah: `Pengajuan Hangus / Waktu Habis`.
  - Tombol aksi: `Ajukan Ulang Sewa` (redirect ke detail kost).
  - Pindah ke tab **Riwayat** secara otomatis.

### Langkah 4: Penyelarasan di Portal KostManager (`KostManagerPortal.tsx`)
- Status pengajuan yang melewati 24 jam ditampilkan sebagai `Hangus (Kedaluwarsa)`.

### Langkah 5: Kompilasi & Verifikasi Build
- Jalankan `npm run build` di `functions/public/` (0 error).
- Catat di `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
- Push ke branch non-production `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan & Detak Timer (Live Ticking)**:
   - Buka `/my-bookings/diajukan` di browser.
   - Periksa apakah blok Scarcity Countdown muncul dengan format `[Jam] : [Menit] : [Detik]` yang berdetak setiap detik.
2. **Uji Simulasi Waktu Menggunakan `TimeSimulator`**:
   - Buka widget `TimeSimulator` di pojok kanan bawah.
   - Majukan waktu +1 hari / +2 hari.
   - Periksa kartu langsung berubah menjadi **Hangus (Waktu Habis)** dan tombol berubah menjadi **Ajukan Ulang Sewa**.
3. **Uji Admin Portal**:
   - Buka `/dashboard-admin/km_bookings`, pastikan booking yang lewat waktu memiliki badge **Hangus**.
