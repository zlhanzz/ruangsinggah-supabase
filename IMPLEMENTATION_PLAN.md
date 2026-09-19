# Rencana Implementasi: Fleksibilitas Skema Sewa (Bulanan Bebas / Tidak Wajib) & Tombol Kalkulasi Kelipatan Otomatis

## 1. Analisis Masalah & Kebutuhan

### Konteks Saat Ini
Pada formulir tipe kamar ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx) Langkah 3: Periode Sewa & Tarif):
1. **Opsi Bulanan Dikunci Sebagai "Wajib"**:
   - Opsi `Bulanan` saat ini selalu aktif secara permanen (`const isMonthly = key === 'bulanan'; if (isMonthly) return;`).
   - Terdapat badge `WAJIB` warna oranye dan kursor tidak bisa diklik (*disabled toggle*).
   - Pemilik kost tidak dapat memilih skema sewa murni harian, mingguan, atau tahunan saja tanpa melibatkan bulanan.
2. **Pengisian Nominal Periode Panjang Masih Manual**:
   - Jika pemilik kost menawarkan sewa Bulanan, 6 Bulan, dan Tahunan, pemilik kost harus menghitung dan mengetik nominal 6 bulan dan tahunan secara manual satu per satu.
   - Belum ada fitur bantuan kalkulasi kelipatan otomatis dari harga dasar bulanan.

### Kebutuhan Baru Pengguna
1. **Opsi Bulanan Menjadi Tidak Wajib (Bebas / Fleksibel)**:
   - Pemilik kost bebas menentukan skema sewa apa saja yang ingin ditawarkan (misal: hanya Harian, hanya Mingguan, hanya Tahunan, atau kombinasi bebas).
   - Chip `Bulanan` dapat di-klik untuk diaktifkan atau dinonaktifkan seperti opsi lainnya.
   - Syarat minimal: memilih minimal 1 skema periode sewa apapun.
2. **Tombol Kalkulasi Kelipatan Otomatis untuk Periode Bulanan ke Atas**:
   - Hanya berlaku untuk skema bulanan ke atas: **Bulanan (1 bulan)**, **3 Bulan (3 bulan)**, **6 Bulan (6 bulan)**, dan **Tahunan (12 bulan)**.
   - **Harian dan Mingguan TIDAK termasuk** (harus diinput secara manual sesuai ketentuan pengguna).
   - Jika pemilik kost memilih lebih dari 1 opsi bulanan ke atas (misal: Bulanan + 6 Bulan + Tahunan, atau 3 Bulan + Tahunan):
     - Sistem mendeteksi opsi masa sewa bulanan terendah yang dipilih sebagai acuan dasar (*Base Period*).
     - Pada kartu input masa sewa yang lebih tinggi, sediakan tombol khusus (misal: `⚡ Hitung 6x Bulanan`, `⚡ Hitung 12x Bulanan`, atau `⚡ Hitung 4x (3 Bulan)`).
     - Ketika tombol diklik:
       - **Jika harga periode acuan dasar belum diisi (masih Rp 0 / kosong)**: tampilkan pesan peringatan ramah bahwa pemilik kost harus mengisi harga periode terendah yang telah dipilih terlebih dahulu agar kalkulasi otomatis dapat bekerja.
       - **Jika harga periode acuan dasar sudah terisi**: nominal langsung terisi otomatis sesuai kelipatan (misal: Rp 1.000.000 x 6 = Rp 6.000.000). Pemilik kost tetap dapat mengedit nominal tersebut jika ingin memberikan potongan harga promo khusus.
     - Sediakan juga tombol pintas global di atas grid: `⚡ Hitung Semua Kelipatan dari [Periode Dasar]` untuk mengisi semua kelipatan yang lebih tinggi dalam 1 kali klik.

---

## 2. Dampak Perubahan (Files Touched)

File yang akan dimodifikasi:
- [`functions/public/components/KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)
  - Membuka kunci `isMonthly`: menghapus larangan toggle dan badge `WAJIB`, menjadikan Bulanan dapat di-toggle bebas.
  - Memperbarui inisialisasi `pricing: []` pada `startAddRoom` agar semua periode berstatus netral/bebas saat tambah kamar baru.
  - Menambahkan konfigurasi bobot bulan untuk skema bulanan ke atas (`bulanan: 1`, `3bulanan: 3`, `6bulanan: 6`, `tahunan: 12`).
  - Menambahkan fungsi helper `calculateMultiplier(targetPeriod, basePeriod)` dan handler `handleApplyMultiplier`.
  - Menambahkan tombol aksi kalkulasi kelipatan otomatis pada kartu input periode sewa bulanan ke atas yang lebih tinggi, serta tombol global "Hitung Semua Kelipatan".
  - Menambahkan validasi peringatan jika tombol kelipatan diklik saat periode dasar belum diisi.
  - Menyesuaikan penentuan harga acuan kamar (`draftRoom.price` dan `finalPrice`) agar fallback secara dinamis ke periode apapun yang aktif jika Bulanan tidak dipilih.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

### Langkah 1: Membuka Kunci Opsi Bulanan (Bebas & Netral)
1. Di `KostFormMitra.tsx`:
   - Pada render chips pilihan periode (`PRICING_PERIODS.map`):
     - Hapus `if (isMonthly) return;` pada `onClick`, sehingga tombol Bulanan dapat di-toggle aktif/non-aktif.
     - Hapus badge teks `WAJIB` dari chip Bulanan.
     - Ganti styling chip Bulanan agar konsisten dengan chip lainnya (`cursor-pointer` dengan indikator `✓` saat aktif dan `+` saat belum aktif).
   - Pada `toggleDraftRoomPricingPeriod`:
     - Izinkan toggle on/off bebas untuk seluruh periode.
   - Pada `startAddRoom`:
     - Inisialisasi `pricing: []` (netral, tidak memaksa bulanan sejak awal).

### Langkah 2: Logika Pendeteksian Periode Bulanan Acuan & Rasio Kelipatan
1. Definisikan pemetaan bulan untuk periode bulanan ke atas:
   ```tsx
   const MONTH_BASED_PERIODS: { key: PricingPeriod; months: number; label: string }[] = [
       { key: 'bulanan', months: 1, label: 'Bulanan' },
       { key: '3bulanan', months: 3, label: '3 Bulan' },
       { key: '6bulanan', months: 6, label: '6 Bulan' },
       { key: 'tahunan', months: 12, label: 'Tahunan' },
   ];
   ```
2. Filter periode bulanan ke atas yang sedang aktif di `draftRoom.pricing`:
   ```tsx
   const activeMonthBased = MONTH_BASED_PERIODS.filter(m => (draftRoom.pricing || []).some(p => p.period === m.key));
   const baseMonthPeriod = activeMonthBased.length >= 2 ? activeMonthBased[0] : null;
   ```
3. Hitung rasio pengali untuk setiap periode di atas `baseMonthPeriod`:
   - `multiplier = currentMonthPeriod.months / baseMonthPeriod.months;`
   - Misal: Dasar `bulanan` (1 bulan) -> 6 Bulan = 6x, Tahunan = 12x.
   - Misal: Dasar `3bulanan` (3 bulan) -> Tahunan = 4x.

### Langkah 3: Antarmuka Tombol Kalkulasi Kelipatan Otomatis
1. Pada setiap kartu input harga sewa periode bulanan ke atas yang lebih tinggi (`key !== baseMonthPeriod.key`):
   - Tambahkan tombol aksi visual di samping label input:
     ```tsx
     <button
         type="button"
         onClick={() => applyMultiplier(key, baseMonthPeriod)}
         className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer shadow-2xs"
         title={`Hitung kelipatan otomatis ${multiplier}x dari ${baseMonthPeriod.label}`}
     >
         <Zap size={11} className="text-orange-500 fill-orange-500" />
         <span>Hitung {multiplier}x {baseMonthPeriod.label}</span>
     </button>
     ```
2. Logika saat tombol diklik (`applyMultiplier`):
   - Ambil harga saat ini dari `baseMonthPeriod`:
     `const basePrice = draftRoom.pricing?.find(p => p.period === baseMonthPeriod.key)?.price || 0;`
   - **Jika `basePrice <= 0`**:
     Tampilkan alert:
     > *"Harap isi harga ${baseMonthPeriod.label} terlebih dahulu dari opsi yang telah Anda pilih agar bisa menggunakan tombol kalkulasi kelipatan otomatis pada ${targetLabel}."*
   - **Jika `basePrice > 0`**:
     Hitung `calculatedPrice = basePrice * multiplier;`
     Update nilai input via `updDraftRoomPrice(targetPeriodKey, calculatedPrice);`
3. Tambahkan tombol pintas global jika ada lebih dari 1 periode lebih tinggi yang aktif:
   - Banner tombol ringkas: `⚡ Hitung Semua Kelipatan dari ${baseMonthPeriod.label}` di atas grid input harga.

### Langkah 4: Validasi dan Penyesuaian Penyimpanan Kamar
1. Di `saveDraftRoom`:
   - Validasi minimal 1 skema sewa:
     `if (!draftRoom.pricing || draftRoom.pricing.length === 0) { alert('Silakan pilih minimal satu skema periode sewa.'); setRoomSubStep(3); return; }`
   - Validasi bahwa semua skema yang dipilih memiliki harga > 0.
   - Penentuan harga acuan kamar (`finalizedRoom.price`):
     Gunakan harga bulanan jika ada, atau fallback ke harga periode pertama yang aktif.

---

## 4. Rencana Verifikasi (Testing Plan)

1. **Uji Kompilasi Front-End**:
   - Jalankan `cmd.exe /c npm run build` di root workspace untuk menjamin 0 error TypeScript dan Vite bundle sukses.
2. **Uji Fleksibilitas Skema Sewa**:
   - Buka form kamar Langkah 3: pastikan tombol Bulanan tidak lagi bertuliskan "WAJIB" dan dapat di-klik untuk non-aktif.
   - Coba simpan kamar hanya dengan skema Harian saja atau hanya Tahunan saja -> pastikan berhasil disimpan.
3. **Uji Tombol Kelipatan Otomatis**:
   - Pilih skema: Bulanan, 6 Bulan, dan Tahunan.
   - Biarkan harga Bulanan masih Rp 0, lalu klik tombol kelipatan di 6 Bulan atau Tahunan -> pastikan alert muncul meminta mengisi harga Bulanan terlebih dahulu.
   - Isi harga Bulanan Rp 1.000.000.
   - Klik tombol kelipatan di 6 Bulan -> nominal langsung berubah menjadi Rp 6.000.000.
   - Klik tombol kelipatan di Tahunan -> nominal langsung berubah menjadi Rp 12.000.000.
   - Pastikan Harian dan Mingguan TIDAK memiliki tombol kelipatan (tetap input manual).
   - Uji skema tanpa Bulanan (misal: pilih 3 Bulan dan Tahunan) -> tombol di Tahunan menghitung 4x dari 3 Bulan.
4. **Pencatatan Progres & Sinkronisasi Git**:
   - Catat progres ke `functions/PROGRESS.md`.
   - Buat dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---
> 🛑 **Sesuai Protokol Baku**: Modifikasi kode HANYA akan dieksekusi setelah rencana implementasi ini disetujui / di-ACC oleh User.
