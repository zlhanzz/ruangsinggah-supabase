# Rencana Implementasi: Netralisasi Pilihan Default Formulir Properti & Kamar Mitra

## 1. Analisis Masalah & Kebutuhan

### Konteks & Masalah
Saat ini, pada formulir pendaftaran dan pengelolaan properti maupun tipe kamar mitra ([`KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)), terdapat beberapa pilihan/opsi tombol (*radio-like buttons* atau *toggles*) yang secara otomatis langsung terpilih (*pre-selected*) sejak awal form/modal dibuka.

Secara khusus, seperti yang disampaikan pengguna melalui tangkapan layar:
- **Biaya Sewa Tambahan Penghuni Ekstra (Form Kamar Langkah 2)**:
  Pertanyaan *"Apakah ada biaya sewa tambahan jika kamar dihuni lebih dari 1 orang?"* langsung mengaktifkan tombol hitam **"Tidak, Biaya Tetap Sama"** secara default karena state `hasExtraFee` diinisialisasi dengan nilai `false` dan pengecekan kelas CSS `!hasExtraFee && draftRoom.additionalCostPerPerson === 0` langsung bernilai `true`.
- **Biaya Tambahan Fasilitas Bulanan Properti (Form Properti Langkah 3/4)**:
  Pertanyaan *"Biaya Tambahan Fasilitas Bulanan (Opsional)"* langsung mengaktifkan tombol **"✕ Tidak Ada"** secara default karena `!isAdditionalFeeActive` bernilai `true`.
- **Ketentuan Penagihan Biaya Tambahan Bulanan**:
  Opsi ketentuan penagihan langsung otomatis memilih *"Mulai dari Bulan Awal Sewa Pertama"* (`month_1`) secara default karena kondisi `form.additionalFeeStartsFrom !== 'month_2'`.
- **Tipe Kost Properti (Form Properti Langkah 0)**:
  `initialForm.type` di-set ke `'Campur'`, sehingga tombol *"⚡ Campur"* langsung terpilih sejak awal pendaftaran baru.
- **Kapasitas Maksimal Kamar (Form Kamar Langkah 2)**:
  `draftRoom.maxOccupants` diinisialisasi 1, sehingga opsi *"1 Orang (Single)"* langsung aktif sebelum pemilik menentukan kapasitas kamarnya.

### Kebutuhan Pengguna
Sesuai arahan pengguna:
> *"pada pilihan apapun itu, secara default jangan ada yang langsung terpilih buat menjadi netral dan biarkan pemilik kost yang menentukan . misalnya pada input apakah ada biaya tambahan atau tidak"*

Sistem harus membuat seluruh opsi pilihan tersebut berstatus **NETRAL** (*unselected* / tidak ada yang ter-highlight) saat form baru dibuka. Pemilik kost wajib dan berhak menentukan pilihannya sendiri secara eksplisit tanpa asumsi sepihak dari sistem. Jika pemilik belum menentukan pilihan dan menekan tombol navigasi lanjutkan, sistem akan memberikan notifikasi panduan yang ramah dan tepat sasaran.

---

## 2. Dampak Perubahan

File yang akan disentuh:
- [`functions/public/components/KostFormMitra.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)
  - Mengubah tipe state `hasExtraFee` dari `boolean` menjadi `boolean | null` (default: `null`).
  - Mengubah tipe state `isAdditionalFeeActive` dari `boolean` menjadi `boolean | null` (default: `null` untuk pendaftaran baru).
  - Mengubah default `initialForm.type` menjadi `undefined` (netral, tidak otomatis 'Campur').
  - Mengubah default `initialForm.additionalFeeStartsFrom` menjadi `undefined` (netral).
  - Mengubah default `draftRoom.maxOccupants` saat tambah kamar baru menjadi netral (`undefined` / `0`).
  - Memperbarui styling tombol pilihan agar HANYA aktif jika nilai state secara ketat (*strict equality* `===`) sesuai pilihan (bukan *truthy/falsy fallback*).
  - Menampilkan kontainer panduan netral pada bagian biaya tambahan dan kapasitas kamar sebelum opsi dipilih.
  - Menambahkan validasi peringatan interaktif jika pemilik kost mencoba melangkah maju tanpa menentukan opsi pilihan wajib.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

### Langkah 1: Netralisasi Pilihan Biaya Sewa Tambahan Penghuni Kamar (`hasExtraFee`)
1. Di `KostFormMitra.tsx`:
   - Deklarasi state: `const [hasExtraFee, setHasExtraFee] = useState<boolean | null>(null);`
   - Pada fungsi `startAddRoom`: `setHasExtraFee(null);`
   - Pada fungsi `startEditRoom`: jika `target.additionalCostPerPerson !== undefined`, set ke `(target.additionalCostPerPerson || 0) > 0 ? true : false`.
2. Di UI Kamar (Tahap 2):
   - Tombol **"Tidak, Biaya Tetap Sama"**: aktif **HANYA** jika `hasExtraFee === false`.
   - Tombol **"Ya, Ada Biaya Tambahan"**: aktif **HANYA** jika `hasExtraFee === true`.
   - Jika `hasExtraFee === null`: kedua tombol berpenampilan netral (border abu-abu lembut, background putih, teks abu-abu gelap).
3. Validasi Navigasi ("Lanjut ke Harga" & `saveDraftRoom`):
   - Jika `(draftRoom.maxOccupants || 0) > 1 && hasExtraFee === null`: berikan alert ramah agar pemilik kost menentukan pilihannya terlebih dahulu.

### Langkah 2: Netralisasi Kapasitas Maksimal Kamar (`draftRoom.maxOccupants`)
1. Pada `startAddRoom`: set `maxOccupants: 0` (atau biarkan kosong).
2. Pilihan tombol kapasitas (1 Orang, 2 Orang, 3 Orang):
   - Hanya aktif jika `draftRoom.maxOccupants === item.cap`.
   - Jika `!draftRoom.maxOccupants || draftRoom.maxOccupants < 1`: ketiga tombol tampil netral, dan area bawahnya menampilkan panduan ramah untuk memilih kapasitas kamar.
3. Validasi Navigasi: jika kapasitas belum dipilih, ingatkan pemilik kost untuk memilih kapasitas kamar.

### Langkah 3: Netralisasi Biaya Tambahan Fasilitas Bulanan Properti (`isAdditionalFeeActive`)
1. Deklarasi state:
   ```tsx
   const [isAdditionalFeeActive, setIsAdditionalFeeActive] = useState<boolean | null>(() => {
       if ((form.additionalFeePrice || 0) > 0 || Boolean(form.additionalFeeName && form.additionalFeeName.trim().length > 0)) {
           return true;
       }
       if (editingKost && form.additionalFeePrice === 0 && !form.additionalFeeName) {
           return false;
       }
       return null; // Netral untuk kost baru
   });
   ```
2. Tombol pilihan:
   - **"✕ Tidak Ada"**: HANYA aktif jika `isAdditionalFeeActive === false`.
   - **"✓ Ada Biaya Tambahan"**: HANYA aktif jika `isAdditionalFeeActive === true`.
   - Jika `isAdditionalFeeActive === null`: kedua tombol tampil netral.
3. Panel informasi:
   - Jika `isAdditionalFeeActive === null`: tampilkan kartu panduan netral agar pemilik kost memilih ada atau tidaknya biaya tambahan bulanan.

### Langkah 4: Netralisasi Ketentuan Penagihan & Tipe Kost
1. `initialForm.additionalFeeStartsFrom`: diubah dari `'month_1'` menjadi `undefined`.
   - Tombol *"Mulai dari Bulan Awal Sewa Pertama"* hanya aktif jika `form.additionalFeeStartsFrom === 'month_1'`.
   - Tombol *"Promo Bebas Tagihan di Bulan Pertama"* hanya aktif jika `form.additionalFeeStartsFrom === 'month_2'`.
2. `initialForm.type`: diubah dari `'Campur'` menjadi `undefined`.
   - Tombol *"Putra"*, *"Putri"*, *"Campur"* berstatus netral hingga diklik salah satunya.
   - Pengecekan `validateStep(0)` akan memastikan pemilik kost telah memilih salah satu tipe kost sebelum lanjut ke langkah lokasi.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi & Tipe (Build Verification)**:
   - Jalankan perintah kompilasi: `npm run build` di terminal powershell.
   - Pastikan 0 TypeScript/TSX lint error, 0 bundle error, dan exit code 0.
2. **Uji Logika & Visual Flow**:
   - Memastikan saat pertama kali menambah tipe kamar baru, kapasitas kamar berstatus netral.
   - Saat memilih kapasitas 2 atau 3 orang, kotak pertanyaan *"Biaya Sewa Tambahan Penghuni Ekstra"* muncul dengan kedua pilihan ("Tidak" dan "Ya") dalam keadaan NETRAL (tidak ada yang langsung berwarna hitam/oranye terpilih).
   - Memastikan saat tombol "Lanjut ke Harga" diklik tanpa memilih opsi, muncul peringatan ramah.
   - Memastikan saat opsi diklik, styling tombol berubah sesuai pilihan pengguna dan form dapat dilanjutkan tanpa hambatan.
   - Memastikan pada data properti yang sudah ada (edit mode), opsi terisi sesuai data yang tersimpan sebelumnya.

---
> **Catatan Sesuai Protokol Kerja (Fase 1)**: Modifikasi kode baru akan dilakukan di Fase 2 setelah rencana implementasi ini disetujui / di-ACC oleh User.
