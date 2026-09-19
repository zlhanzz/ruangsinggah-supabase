# Walkthrough: Fleksibilitas Skema Sewa Kamar & Tombol Kalkulasi Kelipatan Otomatis

Dokumen ini mendokumentasikan hasil implementasi pembebasan opsi sewa bulanan dan penambahan fitur tombol kalkulasi kelipatan otomatis pada formulir tipe kamar Mitra (`KostFormMitra.tsx`).

---

## 1. Ringkasan Pekerjaan
1. **Pembebasan Opsi Sewa Bulanan**:
   - Skema sewa "Bulanan" tidak lagi dikunci atau diwajibkan secara sepihak.
   - Pemilik kost bebas memilih atau tidak memilih periode bulanan, maupun mengombinasikannya dengan periode lain (Harian, Mingguan, Bulanan, 3 Bulan, 6 Bulan, Tahunan; minimal 1 opsi).
   - Nilai default periode sewa saat menambah kamar baru adalah netral (`pricing: []`), sehingga pemilik kost leluasa menentukan skema mana yang sesuai dengan model bisnis kostnya.
2. **Tombol Kalkulasi Kelipatan Otomatis (Bulanan ke Atas)**:
   - Berlaku untuk skema berbasis bulan: `bulanan` (1 bulan), `3bulanan` (3 bulan), `6bulanan` (6 bulan), dan `tahunan` (12 bulan).
   - Skema Harian dan Mingguan dieksklusikan (tetap diinput manual).
   - Periode bulanan ke atas terendah yang dipilih pemilik kost secara otomatis menjadi **Acuan Dasar** (`basePeriod`).
   - Pada kartu masa sewa yang lebih tinggi, tersedia tombol kalkulasi kelipatan otomatis (misal: `⚡ Hitung 6x Bulanan`, `⚡ Hitung 12x Bulanan`, atau `⚡ Hitung 4x 3 Bulan`).
   - Tersedia pula tombol pintas banner `⚡ Hitung Semua Kelipatan` jika ada 2 atau lebih periode bulanan ke atas yang dipilih.
3. **Peringatan / Alert Validasi**:
   - Jika pemilik kost langsung menekan tombol kalkulasi kelipatan pada masa sewa yang lebih tinggi sementara harga periode sewa terendah yang dipilih masih kosong / Rp 0, sistem menampilkan dialog peringatan:
     > *"Harap isi harga [basePeriod] terlebih dahulu dari opsi yang telah Anda pilih agar bisa menggunakan tombol kalkulasi kelipatan otomatis pada [targetPeriod]."*
4. **Kepatuhan Standar UI/UX**:
   - Menggunakan ikon vector SVG murni `Zap` dari package `lucide-react` (0ms delay, 100% bebas kedipan FOUT).

---

## 2. Detail Perubahan Berkas

### `functions/public/components/KostFormMitra.tsx`
- **Import Vector SVG**: Menambahkan komponen pure SVG `Zap` dari `lucide-react`.
- **Konstanta `MONTH_BASED_CONFIG`**:
  ```ts
  const MONTH_BASED_CONFIG: { key: PricingPeriod; label: string; months: number }[] = [
      { key: 'bulanan',  label: 'Bulanan',  months: 1 },
      { key: '3bulanan', label: '3 Bulan',  months: 3 },
      { key: '6bulanan', label: '6 Bulan',  months: 6 },
      { key: 'tahunan',  label: 'Tahunan',  months: 12 },
  ];
  ```
- **State `draftRoom` & `startAddRoom`**: Menetralkan `pricing: []` agar tidak ada periode yang otomatis terpilih saat pertama kali menambah kamar baru.
- **`toggleDraftRoomPricingPeriod`**: Membuka kunci `bulanan` agar bisa di-toggle on/off bebas.
- **Helper `getMultiplierInfo`, `applyMultiplierPrice`, dan `applyAllMultipliers`**: Menghitung rasio pengali otomatis dan menampilkan peringatan jika harga periode dasar belum diisi.
- **Validasi `saveDraftRoom`**: Memvalidasi minimal 1 periode sewa dipilih dan semua periode terpilih memiliki nominal `price > 0`.
- **Antarmuka Sub-Wizard Tahap 3**:
  - Menghapus badge "Wajib" dan atribut `cursor-default` pada tombol chip "Bulanan".
  - Menambahkan banner ringkas *"Kalkulasi Otomatis Berbasis Kelipatan [Base Label]"* dengan tombol *"Hitung Semua Kelipatan"*.
  - Menambahkan badge *"Acuan Dasar"* pada kartu periode sewa terendah.
  - Menambahkan tombol individual *"Hitung [N]x [Base Label]"* dengan ikon `Zap` pada kartu masa sewa yang lebih tinggi.
- **Ikhtisar Kartu Kamar & Submit**: Menyesuaikan penentuan tarif sewa pokok pada kartu ringkasan dan `finalPrice` properti jika pemilik kost tidak mengaktifkan skema bulanan.

---

## 3. Hasil Pengujian & Kompilasi

Perintah build dijalankan di root workspace:
```bash
cmd.exe /c npm run build
```
**Hasil**:
- Exit code: `0` (Kompilasi Sukses 100%).
- Modul `zap-B6hHoPjB.js` ter-bundle secara lokal.
- 0 error TypeScript, 0 warning kritis.

---

## 4. Panduan Verifikasi Pengguna di Antarmuka Mitra

1. Buka formulir Tambah Kost atau Edit Kost di Mitra Dashboard.
2. Navigasi ke **Langkah 3 (Kamar)** -> klik **Tambah Tipe Kamar Baru** (atau Edit Kamar).
3. Isi Langkah 1 (Nama & Ukuran) dan Langkah 2 (Kapasitas).
4. Di **Langkah 3 (Periode Sewa & Harga)**:
   - Perhatikan bahwa opsi **Bulanan** kini bebas dipilih atau tidak dipilih (tidak lagi bertuliskan "Wajib").
   - Coba centang misalnya **Bulanan**, **6 Bulan**, dan **Tahunan**.
   - Perhatikan munculnya badge *"Acuan Dasar"* pada kartu Bulanan dan tombol *"Hitung 6x Bulanan"* pada kartu 6 Bulan serta *"Hitung 12x Bulanan"* pada kartu Tahunan.
   - Tanpa mengisi harga Bulanan, klik tombol *"Hitung 6x Bulanan"*: dialog peringatan akan muncul meminta Anda mengisi harga Bulanan terlebih dahulu.
   - Masukkan nominal pada Bulanan (contoh: `1.000.000`), lalu klik *"Hitung 6x Bulanan"* -> kolom 6 Bulan otomatis terisi `6.000.000`.
   - Klik tombol banner *"Hitung Semua Kelipatan"* -> kolom Tahunan juga langsung terisi `12.000.000`.
   - Coba skema tanpa Bulanan (misal: uncheck Bulanan, centang **3 Bulan** dan **Tahunan**): sistem secara cerdas menjadikan 3 Bulan sebagai acuan dasar dan menyediakan tombol kelipatan 4x pada Tahunan.
