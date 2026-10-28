# IMPLEMENTATION PLAN: Perbaikan Tampilan Default Tombol KostManager Menjadi "Silahkan Pilih Kamar Tersedia"

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini
Pada properti yang dikelola melalui **KostManager** (`kost.isManaged = true`), saat calon penyewa membuka halaman detail kost untuk pertama kali (tampilan default):
- Komponen menginisialisasi `selectedVariantIdx` ke indeks `0`.
- Jika unit kamar pertama (`rooms[0]`) kebetulan sedang berstatus **Terisi** (`isAvailable: false`), sistem langsung menganggap kamar yang aktif adalah tidak tersedia.
- Akibatnya, tombol utama di sidebar kanan langsung menampilkan status mati:
  **`KAMAR PENUH`** (disabled abu-abu),
  padahal pada tipe kamar tersebut **masih terdapat banyak unit kamar kosong/tersedia** (misal: 3 dari 4 kamar masih kosong).
- Calon penyewa salah mengira bahwa kost sudah penuh total dan tidak dapat disewa.

### Kebutuhan Pengguna
1. Pada listing yang terdaftar di KostManager, tampilan tombol default saat pertama kali dimuat **BUKAN "Kamar Penuh"**, melainkan **"Silahkan Pilih Kamar Tersedia"** (berwarna oranye aktif).
2. Jika calon penyewa menekan tombol "Silahkan Pilih Kamar Tersedia", halaman akan mengarahkan / *smooth scroll* langsung ke bagian pilihan nomor kamar (*PILIH NOMOR KAMAR*) dengan sorotan visual.
3. Begitu calon penyewa memilih salah satu nomor kamar yang tersedia di grid, tombol seketika berganti menjadi **"Ajukan Sewa [Nama/Nomor Kamar]"**.
4. Tombol **"Kamar Penuh"** (disabled abu-abu) hanya boleh muncul jika seluruh kamar pada tipe tersebut **benar-benar 100% penuh** (`availableCount === 0` atau `isAvailable === false`).

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
- `functions/public/pages/KostDetail.tsx`:
  1. Tambahkan state pelacak pilihan spesifik pengguna: `const [hasSelectedSpecificRoom, setHasSelectedSpecificRoom] = useState(false)`.
  2. Perbarui penetapan `selectedChildRoom`: jika pengguna telah memilih kamar spesifik, ambil kamar tersebut; jika belum, biarkan `null` agar tidak memilih kamar terisi secara otomatis saat awal muat.
  3. Beri penanda elemen `id="pilih-nomor-kamar-section"` pada kontainer interaktif nomor kamar.
  4. Perbarui logika penentuan `isAvailable`, `buttonText`, dan handler klik tombol utama:
     - Jika `isManaged` dan tipe kamar memiliki kamar tersedia (`currentParentGroup.isAvailable`):
       - Jika belum memilih nomor kamar spesifik: tombol berstatus aktif oranye dengan teks **"Silahkan Pilih Kamar Tersedia"**, dan ketika diklik akan scroll halus ke blok pemilihan kamar.
       - Jika sudah memilih nomor kamar: tombol bertuliskan **"Ajukan Sewa [Kamar]"** dan langsung membuka modal booking.
     - Hanya jika seluruh kamar pada tipe tersebut penuh: tombol menampilkan **"Kamar Penuh"** (disabled abu-abu).
  5. Saat pengguna berganti tipe kamar (`selectedParentTypeIdx`), reset `hasSelectedSpecificRoom` ke `false`.
  6. Saat pengguna mengeklik chip nomor kamar di grid, set `hasSelectedSpecificRoom(true)`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Modifikasi `KostDetail.tsx`**:
   - Definisikan state `hasSelectedSpecificRoom`.
   - Update logika `selectedChildRoom` dan reset saat pergantian tipe kamar.
   - Update blok render tombol utama aksi (baris 2880-2915) dengan penanganan state KostManager yang baru.
   - Tambahkan interaktivitas smooth scroll ke section nomor kamar saat tombol "Silahkan Pilih Kamar Tersedia" diklik.
2. **Verifikasi Build**:
   - Jalankan build frontend: `cmd.exe /c "npm --prefix functions/public run build"`
   - Jalankan build backend: `cmd.exe /c "npm --prefix functions run build"`
3. **Dokumentasi & Git Synchronization**:
   - Catat entri progres baru **#461** di `functions/PROGRESS.md`.
   - Terbitkan dokumen `WALKTHROUGH.md`.
   - Commit dan push ke branch GitHub `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan Default KostManager**:
   - Buka halaman kost KostManager yang memiliki kamar terisi dan kamar kosong.
   - Pastikan tombol tampil berwarna oranye bertuliskan **"Silahkan Pilih Kamar Tersedia"** (bukan "Kamar Penuh").
2. **Uji Interaksi Pemilihan Kamar**:
   - Klik tombol "Silahkan Pilih Kamar Tersedia" $\rightarrow$ layar scroll otomatis ke bagian nomor kamar.
   - Klik salah satu nomor kamar kosong (misal: Kamar 102) $\rightarrow$ tombol berubah menjadi **"Ajukan Sewa Kamar 102"** dan chip kamar tercentang.
3. **Uji Kondisi Benar-Benar Penuh**:
   - Buka kamar/tipe yang seluruh kamarnya terisi $\rightarrow$ tombol tetap dengan benar menampilkan **"Kamar Penuh"** (disabled abu-abu).
4. **Uji Kelulusan Build**:
   - 0 error pada build TypeScript / Vite.
