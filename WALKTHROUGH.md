# WALKTHROUGH - Modal Pratinjau Listing Terisolasi di Lingkup Dashboard Mitra (Opsi A)

## Ringkasan Eksekutif
Pemisahan alur pratinjau (*preview*) listing kost agar **tetap berada 100% di dalam lingkup portal mitra tanpa tembus ke lingkungan publik pencari properti** telah **berhasil diselesaikan, diuji build Vite (0 error), dan diintegrasikan penuh ke Dashboard Mitra**.

Sebelumnya:
- Mengklik tombol **Preview** akan melakukan navigasi halaman keluar ke rute publik pencari sewa: `/kost/{slug}`.
- Mitra harus melihat navbar pencari publik, search bar publik, dan footer marketplace.

Sekarang (Opsi A):
- Mengklik tombol **Preview** membuka **Modal Pratinjau Interaktif Layar Penuh** langsung di atas Dashboard Mitra.
- URL browser tetap berada di `/dashboard-mitra`.
- Mitra dapat melihat simulasi detail listing, memeriksa foto, fasilitas, dan harga kamar, serta langsung mengedit data tanpa berpindah halaman.

---

## 1. Arsitektur & Keunggulan Fitur

1. **Isolasi Portal Total (*Portal Isolation*)**:
   - Menjawab kebutuhan arsitektur jangka panjang di mana portal mitra akan dipisah ke lingkungan mandiri (seperti subdomain `mitra.ruangsinggah.id`).
   - Halaman publik pencari sewa tidak pernah terbebani atau tercampur dengan data listing yang belum disetujui admin.
2. **Pengalaman Pengguna Tanpa Hambatan (*Seamless UX*)**:
   - Membuka pratinjau berlangsung instan (0ms network round-trip untuk navigasi).
   - Menutup pratinjau cukup dengan menekan tombol **`[ ✕ Tutup ]`**, mengklik area luar (backdrop), atau menekan tombol **`Escape`** pada keyboard.
3. **Integrasi Langsung ke Form Edit**:
   - Jika mitra melihat ada kesalahan pengetikan nama, fasilitas, atau foto yang kurang tepat saat pratinjau, tombol **`[ ✏️ Edit Kost ]`** di bagian atas dan bawah modal akan langsung menutup pratinjau dan membuka form pendaftaran/edit kost mitra (`KostFormMitra`).

---

## 2. Rincian Perubahan Kode

### A. Komponen Modal Pratinjau Mitra
- **Lokasi File**: [MitraKostPreviewModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/mitra/MitraKostPreviewModal.tsx) (Baru)
- **Fitur Utama**:
  - **Bilah Header Kontrol Mitra**: Menampilkan judul, status badge dinamis (`⏳ Sedang Ditinjau Admin`, `● Tayang Publik`, atau `● Ditangguhkan`), tombol `[ ✏️ Edit Kost ]`, dan tombol `[ ✕ Tutup ]`.
  - **Status Banner Edukatif**: Memastikan mitra memahami bahwa ini adalah simulasi pratinjau tampilan bagi calon penyewa dan tombol transaksi sewa dinonaktifkan.
  - **Galeri Foto Interaktif**: Viewer foto beresolusi tinggi dengan panah navigasi, nomor slide foto, dan deretan thumbnail gambar.
  - **Navigasi Tabs Konten**:
    - **Tipe Kamar**: Menampilkan kartu setiap tipe kamar dengan foto kamar, spesifikasi ukuran kasur/kamar mandi, harga bulanan, dan badge fasilitas kamar.
    - **Fasilitas Umum**: Grid fasilitas bersama dan fasilitas publik.
    - **Peraturan & Deskripsi**: Penjelasan lengkap deskripsi dan peraturan kost yang telah ditentukan.
  - **100% Pure Lucide React SVG**: Menjamin tidak ada kedipan font ligature (bebas FOUT).

### B. Integrasi pada Dashboard Mitra
- **Lokasi File**: [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
- **Perubahan**:
  - Mengimpor `MitraKostPreviewModal`.
  - Menambahkan state:
    ```typescript
    const [previewingKost, setPreviewingKost] = useState<Kost | null>(null);
    ```
  - Mengubah handler tombol `[ 👁️ Preview ]` pada kartu properti:
    ```typescript
    onClick={() => setPreviewingKost(p)}
    ```
  - Merender modal di layer atas dashboard saat `previewingKost !== null`.

---

## 3. Hasil Verifikasi & Uji Kompilasi

Build front-end dijalankan dengan Vite:
```bash
cmd /c npm run build
```
**Hasil**:
```text
vite v6.4.1 building for production...
transforming...
✓ 2508 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 35.37s
0 errors, 0 warnings fatal.
```

---

## 4. Panduan Verifikasi untuk Pengguna

1. **Buka Dashboard Mitra**:
   - Masuk ke menu **Kost Saya** pada Dashboard Mitra (`/dashboard-mitra`).
2. **Uji Tombol Preview**:
   - Klik tombol **`[ 👁️ Preview ]`** pada kartu kost Anda.
   - Perhatikan bahwa URL browser **tetap berada di `/dashboard-mitra`** dan tidak pernah berpindah ke rute publik `/kost/...`.
3. **Periksa Konten Pratinjau**:
   - Periksa badge status di bagian atas: jika listing baru disubmit, akan tertulis `⏳ Sedang Ditinjau Admin`.
   - Geser foto galeri dan klik thumbnail foto.
   - Buka tab "Tipe Kamar", "Fasilitas Umum", dan "Peraturan & Deskripsi".
4. **Uji Tombol Edit dari Pratinjau**:
   - Klik tombol **`[ ✏️ Edit Kost ]`** di bagian atas modal.
   - Modal pratinjau akan tertutup dan form edit kost langsung terbuka untuk pengisian data.
5. **Uji Penutupan Modal**:
   - Tekan tombol **`[ ✕ ]`** di sudut kanan atas atau tekan tombol **`Esc`** pada keyboard untuk kembali ke daftar kost Anda.
