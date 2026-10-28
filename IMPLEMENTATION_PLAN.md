# IMPLEMENTATION PLAN: Pengurutan Durasi Sewa dari yang Tersingkat ke yang Terlama

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini
Pada tampilan calon penyewa di halaman Detail Kost (`KostDetail.tsx`), tombol pemilihan durasi sewa di bawah label **"PILIH DURASI SEWA"** saat ini dirender sesuai urutan data mentah di database tanpa dilakukan pengurutan durasi waktu.
- Contoh pada tampilan saat ini:
  `[Per Bulan]` `[Per Hari]` `[Per 6 Bulan]`
  `[Per Tahun]`
- Urutan ini tidak kronologis (durasi 30 hari muncul sebelum 1 hari, lalu lompat ke 6 bulan dan 1 tahun).

### Kebutuhan Pengguna
Mengatur komposisi urutan durasi sewa secara konsisten agar **selalu berurutan dari rentang waktu yang tersingkat hingga yang terlama**:
1. **Per Hari** (`harian` - 1 hari)
2. **Per Minggu** (`mingguan` - 7 hari, jika diaktifkan pemilik)
3. **Per Bulan** (`bulanan` - 30 hari / 1 bulan)
4. **Per 3 Bulan** (`3bulanan` - 90 hari / 3 bulan, jika diaktifkan pemilik)
5. **Per 6 Bulan** (`6bulanan` - 180 hari / 6 bulan, jika diaktifkan pemilik)
6. **Per Tahun** (`tahunan` - 365 hari / 1 tahun, jika diaktifkan pemilik)

---

## 2. Dampak Perubahan

File yang akan disentuh:
1. `functions/public/pages/KostDetail.tsx`:
   - Menambahkan konstanta bobot durasi waktu `periodWeights` (misal: `harian: 1`, `mingguan: 7`, `bulanan: 30`, `3bulanan: 90`, `6bulanan: 180`, `tahunan: 365`).
   - Melakukan pengurutan (`sort`) pada array `selectedRoom.pricing` sebelum me-render tombol-tombol pada blok *"Pilih Durasi Sewa"*.
2. `functions/public/components/BookingModal.tsx`:
   - Memastikan daftar `availableOptions` pada modal pengajuan sewa ("Pilih Paket Sewa") juga diurutkan berdasarkan `periodWeights` dari tersingkat ke terlama agar konsisten di seluruh flow transaksi pengguna.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Modifikasi `KostDetail.tsx`**:
   - Definisikan kamus bobot periode sewa:
     ```typescript
     const periodWeights: Record<string, number> = {
       'harian': 1,
       'mingguan': 7,
       'bulanan': 30,
       '3bulanan': 90,
       '6bulanan': 180,
       'tahunan': 365
     };
     ```
   - Pada baris 2835, ubah mapping array:
     ```tsx
     {[...selectedRoom.pricing]
       .sort((a, b) => (periodWeights[a.period] || 999) - (periodWeights[b.period] || 999))
       .map((scheme) => {
         ...
       })
     }
     ```
2. **Modifikasi `BookingModal.tsx`**:
   - Pada `availableOptions`, lakukan `.sort((a, b) => (periodWeights[a] || 999) - (periodWeights[b] || 999))` agar kartu durasi sewa di modal booking juga tersusun rapi dari hari ke tahun.
3. **Verifikasi Build**:
   - Jalankan kompilasi frontend: `cmd.exe /c "npm --prefix functions/public run build"`
   - Jalankan kompilasi backend: `cmd.exe /c "npm --prefix functions run build"`
4. **Dokumentasi & Git Synchronization**:
   - Catat riwayat progres **#460** di `functions/PROGRESS.md`.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan & Urutan**:
   - Memastikan tombol durasi sewa pada kamar yang memiliki opsi harian, bulanan, 6 bulanan, dan tahunan tampil dengan urutan:
     `[Per Hari] -> [Per Minggu] -> [Per Bulan] -> [Per 3 Bulan] -> [Per 6 Bulan] -> [Per Tahun]`.
2. **Uji Fungsionalitas Tombol**:
   - Mengklik tiap tombol durasi sewa tetap memperbarui `selectedPeriod`, harga aktif, badge diskon hemat, dan label tombol aksi utama `AJUKAN SEWA (PER ...)`.
3. **Uji Kelulusan Build**:
   - Memastikan build TypeScript/Vite sukses 100% tanpa error.
