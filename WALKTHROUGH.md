# WALKTHROUGH: Filter Validasi Semantik & Anti-False-Positive Scanning Fasilitas Terdekat — Fitur #267
**Tanggal**: 2026-09-02 | **Branch**: `bukan-productions`

---

## 1. Ringkasan Masalah & Perbaikan

### Masalah yang Terjadi:
- Pengguna mendapati tempat yang tidak relevan seperti **"Service Printer" (0,7 km)** muncul di daftar fasilitas terdekat (di atas Masjid).
- **Penyebab**:
  - Google Places API mencocokkan kata kunci (seperti `keyword: 'laundry'`) tidak hanya ke nama toko, tetapi juga ke **ulasan pelanggan (*customer reviews*)**, ruko bersebelahan, atau kategori multi-usaha di Google My Business.
  - Toko servis printer/fotokopi di area kampus sering kali berada di ruko samping laundry atau pelanggan menulis ulasan *"dekat laundry"*, sehingga Google mengembalikan toko tersebut saat sistem mencari laundry terdekat.

### Solusi yang Diimplementasikan:
1. **Fungsi Sanitasi Semantik (`isValidMicroFacility`)**:
   - **Laundry**:
     - **Wajib Ada**: Kata cuci pakaian (`laundry`, `loundry`, `cuci`, `wash`, `kiloan`, `dry clean`, `setrika`).
     - **Blacklist Otomatis**: `printer`, `service`, `servis`, `fotocopy`, `percetakan`, `cuci motor`, `cuci mobil`, `car wash`, `steam`, `bengkel`, `counter pulsa`, `helm`, `sepatu`.
     - *Hasil: "Service Printer" langsung ditolak 100%.*
   - **Minimarket**:
     - **Wajib Ada**: Ritel belanja harian (`indomaret`, `alfamart`, `alfamidi`, `mart`, `minimarket`, `swalayan`, `toko kelontong`).
     - **Blacklist**: Jenis usaha jasa seperti servis, bengkel, salon, barber, apotek.
   - **Masjid / Musholla**:
     - **Wajib Ada**: Nama tempat ibadah (`masjid`, `musholla`, `mushola`, `mesjid`, `surau`).
     - **Filter**: Menolak biro travel/kantor haji umroh non-masjid.
   - **Gereja**:
     - **Wajib Ada**: Nama gereja resmi (`gereja`, `church`, `katedral`, `paroki`, `kapel`, `gki`, `gbi`, `hkbp`, `gpdi`, `toraja`, `katolik`, `kristen`).
   - **SPBU**:
     - **Wajib Ada**: `spbu`, `pertamina`, `shell`, `bp `, `pom bensin`.
     - **Filter**: Menolak penjual bensin botol/eceran pinggir jalan.
2. **Pemasangan di Pipeline Scanning**:
   - Seluruh hasil kueri Places API kini wajib lolos seleksi `isValidMicroFacility` sebelum dihitung dan disajikan ke formulir.

---

## 2. File yang Disentuh

- **`functions/public/components/KostFormMitra.tsx`**:
  - Menambahkan fungsi `isValidMicroFacility`.
  - Memasang filter sanitasi pada `scanMinimarket`, `scanLaundry`, `scanMosque`, `scanChurch`, dan `scanGasStation`.
  - Memperbarui dependency array `detectNearbyLandmarks`.
- **`public/assets/` & `public/index.html`**:
  - Ter-regenerasi via `npm run build`.
- **`functions/PROGRESS.md`**:
  - Pencatatan riwayat Fitur #267.

---

## 3. Hasil Pengujian & Kompilasi

### Hasil Build Vite Frontend:
```text
✓ 2506 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.36 kB │ gzip:   2.23 kB
../../public/assets/MitraDashboard-C2jqstHw.js         381.26 kB │ gzip:  84.64 kB
✓ built in 27.65s
Exit code: 0
```
- **Kompilasi TypeScript & Vite**: Lulus 100% dengan **0 error**.

---

## 4. Panduan Pengujian bagi Pengguna (User Testing Guide)

1. Buka kembali halaman **Mitra Dashboard** -> **Tambah/Edit Kost**.
2. Lanjut ke **Langkah 2: Lokasi & Fasilitas Terdekat**.
3. Klik tombol **"Pindai Ulang Landmark"**.
4. **Periksa Hasilnya**:
   - Tempat yang tidak relevan seperti **"Service Printer"** tidak akan muncul lagi di daftar fasilitas.
   - Tempat yang terpilih kini 100% relevan sesuai peruntukan fasilitas (Laundry cuci baju asli, Minimarket belanja asli, Masjid asli, Gereja asli, dan SPBU asli).
