# Walkthrough: Netralisasi Pilihan Default Formulir Properti & Kamar Mitra

## 1. Ringkasan Perubahan

Sesuai permintaan pengguna, seluruh opsi tombol pada formulir pendaftaran dan pengelolaan properti serta kamar mitra ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)) yang sebelumnya memiliki nilai default yang otomatis terpilih (*pre-selected*) kini telah diubah menjadi **100% NETRAL** (*unselected*). Pemilik kost kini memegang kendali penuh untuk menentukan setiap pilihan secara sadar dan eksplisit tanpa ada opsi yang terpilih diam-diam oleh sistem.

---

## 2. Rincian Perubahan Kode

### A. Form Tipe Kamar - Tahap 2: Aturan & Kapasitas Kamar
1. **Biaya Sewa Tambahan Penghuni Ekstra (`hasExtraFee`)**:
   - Tipe state `hasExtraFee` diubah menjadi `boolean | null` dengan nilai awal `null` saat menambah kamar baru (`startAddRoom`).
   - Tombol **"Tidak, Biaya Tetap Sama"**: aktif **HANYA** jika `hasExtraFee === false`.
   - Tombol **"Ya, Ada Biaya Tambahan"**: aktif **HANYA** jika `hasExtraFee === true`.
   - Ketika `hasExtraFee === null`: kedua tombol tampil netral (border abu-abu, background putih, teks abu-abu).
   - Validasi navigasi *"Lanjut ke Harga"* & `saveDraftRoom`: jika kapasitas kamar > 1 orang dan pemilik kost belum menentukan opsi ini (`hasExtraFee === null`), sistem menampilkan pesan konfirmasi ramah:
     > *"Silakan tentukan apakah ada biaya sewa tambahan jika kamar dihuni lebih dari 1 orang (Pilih 'Tidak, Biaya Tetap Sama' atau 'Ya, Ada Biaya Tambahan')."*
   - Pada Tahap 3 (Harga Sewa), form input nominal biaya tambahan per orang HANYA muncul jika `hasExtraFee === true`.

2. **Kapasitas Maksimal Kamar (`draftRoom.maxOccupants`)**:
   - Nilai awal `maxOccupants` untuk kamar baru diinisialisasi `0` (netral).
   - Tombol kapasitas (1 Orang, 2 Orang, 3 Orang) kini hanya aktif jika dipilih secara eksplisit (`draftRoom.maxOccupants === item.cap`).
   - Sebelum pemilik memilih kapasitas, area di bawahnya menyajikan panduan netral:
     > *"Silakan tentukan kapasitas maksimal penghuni kamar di atas (1, 2, atau 3 Orang) untuk mengatur ketentuan sewa dan penghuni tambahan."*
   - Validasi navigasi memastikan pemilik telah menentukan kapasitas kamar sebelum melangkah ke harga.

### B. Form Properti - Step 3: Fasilitas & Biaya Tambahan Bulanan
1. **Biaya Tambahan Fasilitas Bulanan Properti (`isAdditionalFeeActive`)**:
   - Tipe state diubah menjadi `boolean | null` (default: `null` untuk pendaftaran properti baru).
   - Tombol **"✕ Tidak Ada"**: aktif **HANYA** jika `isAdditionalFeeActive === false`.
   - Tombol **"✓ Ada Biaya Tambahan"**: aktif **HANYA** jika `isAdditionalFeeActive === true`.
   - Sebelum dipilih (`isAdditionalFeeActive === null`): kedua tombol tampil netral, dan area bawah menampilkan panduan netral untuk memilih opsi.
   - Pilihan Ketentuan Penagihan (`additionalFeeStartsFrom`):
     - Tombol *"Mulai dari Bulan Awal Sewa Pertama"* hanya aktif jika `form.additionalFeeStartsFrom === 'month_1'`.
     - Tombol *"Promo Bebas Tagihan di Bulan Pertama"* hanya aktif jika `form.additionalFeeStartsFrom === 'month_2'`.
     - Nilai default diinisialisasi `undefined` sehingga tidak ada yang otomatis aktif.

### C. Form Properti - Step 0: Informasi Dasar
1. **Tipe Kost (`form.type`)**:
   - Nilai awal `type` pada `initialForm` diubah dari hardcoded `'Campur'` menjadi `undefined`.
   - Tombol pilihan **"♂ Putra"**, **"♀ Putri"**, dan **"⚡ Campur"** tampil netral saat form dibuka pertama kali.
   - Validator `validateCurrentStep(0)` tetap menjaga integritas data dengan mewajibkan pemilik memilih salah satu tipe sebelum lanjut ke langkah lokasi.

---

## 3. Hasil Pengujian & Kompilasi

Kompilasi build produksi front-end dijalankan menggunakan Vite:
```bash
cmd.exe /c npm run build
```
**Hasil:**
- ✓ `2512 modules transformed.`
- ✓ `✓ built in 37.49s`
- Exit Code: **0** (0 TypeScript / TSX error, 0 bundle error).

---

## 4. Panduan Verifikasi Pengguna (User Testing)

1. **Buka Dashboard Mitra**:
   - Klik menu **"Tambah Kost Baru"**.
2. **Cek Step 0 (Informasi Dasar)**:
   - Perhatikan bagian **Tipe Kost**: ketiga tombol (*Putra*, *Putri*, *Campur*) berstatus netral (belum ada yang berwarna oranye).
3. **Cek Modal Tipe Kamar (Langkah 3 Form Properti)**:
   - Klik **"+ Tambah Tipe Kamar"**.
   - Isi Nama Kamar dan Ukuran Kamar di Langkah 1, lalu klik **"Lanjut ke Kapasitas"**.
   - Di Langkah 2, perhatikan tombol **Kapasitas Penghuni**: ketiga tombol (*1 Orang*, *2 Orang*, *3 Orang*) berstatus netral.
   - Klik opsi **"2 Orang"** atau **"3 Orang"**.
   - Perhatikan kotak **"Biaya Sewa Tambahan Penghuni Ekstra"**:
     - Tombol **"Tidak, Biaya Tetap Sama"** dan **"Ya, Ada Biaya Tambahan"** kini berstatus **NETRAL** (keduanya berlatar putih dengan border abu-abu, tidak ada tombol hitam yang langsung terpilih otomatis).
   - Klik tombol **"Lanjut ke Harga"** tanpa memilih opsi:
     - Sistem akan menampilkan pesan panduan ramah agar menentukan pilihan terlebih dahulu.
   - Klik **"Tidak, Biaya Tetap Sama"**: tombol berubah menjadi hitam aktif.
   - Klik **"Ya, Ada Biaya Tambahan"**: tombol berubah menjadi oranye aktif dan pesan panduan nominal muncul.
4. **Cek Step Fasilitas & Biaya Tambahan Bulanan (Langkah 4 Form Properti)**:
   - Perhatikan kartu **"Biaya Tambahan Fasilitas Bulanan (Opsional)"**:
     - Tombol *"✕ Tidak Ada"* dan *"✓ Ada Biaya Tambahan"* berada dalam status netral.
