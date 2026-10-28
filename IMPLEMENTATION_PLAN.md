# IMPLEMENTATION PLAN: Optimalisasi Menu Peraturan Kost dengan Katalog Preset Aturan Populer & Kustom Manual

## 1. Analisis Masalah & Kebutuhan

### A. Konteks Masalah
Pada wizard pendaftaran kost (*Langkah 6 dari 6: Peraturan Kost* di [KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx)):
- Halaman saat ini hanya menyediakan satu kolom input teks kosong dan tombol `+` dengan placeholder *"Contoh: Dilarang membawa..."*.
- Pemilik kost harus memikirkan dan mengetik setiap aturan satu per satu dari nol. Hal ini menimbulkan beban kognitif tinggi, memakan waktu lama, dan sering kali membuat mitra melewatkan aturan-aturan penting yang lazim berlaku di kost Indonesia.

### B. Kebutuhan Pengguna
- Menyediakan katalog pilihan peraturan yang **umum dan lazim berlaku di berbagai kost di Indonesia**.
- Pemilik kost cukup mengeklik/memilih aturan yang relevan untuk mengaktifkannya secara instan (*toggle on/off*).
- Pemilik kost tetap memiliki fleksibilitas penuh untuk **menulis aturan manual/kustom** jika ada aturan unik di properti mereka.

### C. Standarisasi Aturan Kost Indonesia yang Disediakan
Katalog aturan dibagi menjadi 5 kategori praktis:
1. **🕒 Akses & Kunjungan Tamu**:
   - *Akses gerbang 24 jam*
   - *Jam malam tamu berkunjung maks. pukul 22.00*
   - *Tamu lawan jenis dilarang masuk ke dalam kamar*
   - *Tamu menginap wajib melapor ke pengelola kost*
   - *Dilarang membawa tamu menginap*
   - *Gerbang wajib selalu dikunci kembali setelah keluar/masuk*
2. **👥 Kapasitas & Penghuni**:
   - *Maksimal 1 orang per kamar*
   - *Boleh sekamar berdua (dengan biaya tambahan)*
   - *Khusus penghuni resmi (tidak boleh dipindahtangankan)*
   - *Penghuni pasutri wajib melampirkan surat/buku nikah resmi*
3. **🚭 Ketertiban & Kebersihan**:
   - *Dilarang merokok di dalam kamar tidur*
   - *Dilarang membawa atau mengonsumsi miras dan narkoba*
   - *Dilarang membuat kegaduhan / jam tenang setelah pukul 22.00*
   - *Wajib menjaga kebersihan dan kerapian area bersama*
   - *Dilarang membuang sampah atau pembalut ke dalam kloset*
4. **⚡ Listrik, Fasilitas & Keamanan**:
   - *Wajib mematikan lampu, AC, dan keran air saat meninggalkan kamar*
   - *Membawa alat elektronik tambahan (kulkas/dispenser/magic com) dikenakan biaya tambahan*
   - *Dilarang memasak di dalam kamar tidur*
   - *Dilarang memaku atau merusak dinding kamar tanpa izin pengelola*
5. **🐾 Hewan Peliharaan**:
   - *Dilarang membawa hewan peliharaan*
   - *Boleh membawa hewan peliharaan tertentu (kucing/anjing kecil)*

---

## 2. Dampak Perubahan

File yang disentuh:
- [functions/public/components/KostFormMitra.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostFormMitra.tsx):
  - Menambahkan konstanta katalog preset peraturan kost Indonesia terstruktur (`KOST_RULE_PRESETS`).
  - Memperbarui komponen Langkah 5 (Case 5: Peraturan Kost) dengan:
    1. **Katalog Preset Interaktif**: Kartu kategori dengan chip preset yang bisa diklik on/off (terdapat indikator centang saat aktif).
    2. **Daftar Aturan Aktif**: Menampilkan seluruh aturan yang dipilih/dibuat lengkap dengan nomor urut dan tombol hapus cepat `(X)`.
    3. **Input Kustom Manual**: Kolom teks tetap tersedia untuk menambah aturan khusus tambahan.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Definisi Data Katalog Aturan Populer**:
   - Membuat struktur data terorganisir per kategori di `KostFormMitra.tsx`.
2. **Penyusunan UI Langkah Peraturan Kost**:
   - Menampilkan tab / accordion kelompok kategori aturan dengan ikon representatif.
   - Menampilkan chip aturan: bila diklik, jika belum ada di `form.rules` maka ditambahkan, jika sudah ada maka dikeluarkan.
   - Menampilkan rekap aturan aktif dengan counter `X Aturan Diterapkan`.
   - Menjaga input manual teks dan tombol `+` untuk aturan kustom.
3. **Kompilasi & Build Frontend**:
   - Menjalankan `npm --prefix functions/public run build` untuk memverifikasi 0 error TypeScript dan bundler Vite.
4. **Kompilasi & Build Backend**:
   - Menjalankan `npm --prefix functions run build` untuk memverifikasi `tsc`.
5. **Pencatatan Progres Anti-Amnesia**:
   - Mencatat ke [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) (entri **#458**).
6. **Penerbitan Dokumen Walkthrough**:
   - Memperbarui [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md).
7. **Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Fungsionalitas**:
  - Klik pada salah satu chip preset (misal: "Dilarang merokok di dalam kamar"): aturan langsung muncul di daftar aturan aktif dan chip berubah menjadi aktif (orange + centang).
  - Klik kembali chip tersebut: aturan terhapus dari daftar aktif.
  - Tulis aturan manual "Parkir motor di area basement" dan klik `+`: aturan masuk ke daftar aturan aktif.
  - Klik tombol hapus `(X)` pada salah satu aturan: aturan terhapus dengan mulus.
  - Auto-save draft tetap berjalan menyimpan array `form.rules`.
- **Verifikasi Build**:
  - `npm --prefix functions/public run build` harus exit code 0 tanpa error TypeScript.
