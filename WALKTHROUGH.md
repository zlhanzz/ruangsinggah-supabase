# WALKTHROUGH: Penyempurnaan UX Profil Desktop (Mode Peninjauan Default, Simpan tanpa Redirect Beranda, Navigasi Kembali)

Dokumen ini merangkum seluruh perubahan kode, hasil pengujian, dan panduan pengujian terkait penyempurnaan alur halaman profil desktop.

---

## 1. Ringkasan Perubahan

### A. Mode Peninjauan (View Mode) Default pada Desktop
- **Link Dropdown "Profil Saya" (`Navbar.tsx`)**:
  - Diubah agar mengarah langsung ke `Page.PROFILE` (`/profile`) tanpa menyertakan query param `?view=edit`.
- **Tampilan Awal Profil (`Profile.tsx`)**:
  - Secara default dibuka dalam **Mode Peninjauan (Read-Only / Profile Overview)**:
    - Seluruh informasi pribadi (Nama, No. WhatsApp, Pekerjaan, Tempat Kerja, Agama, Status, Gender, Domisili, dll.) ditampilkan dalam format kartu informasi yang rapi, elegan, dan terstruktur dengan ikon representatif (`lucide-react`).
    - Breadcrumb: `Kembali / Profil Saya / Data Kontak Pribadi`.
    - Tombol aksi pojok kanan atas: **"Edit Data Profil"** (oranye dengan ikon pencil).
    - Tombol aksi sidebar kiri desktop: **"Edit Profil Sekarang"**.
    - Tombol kembali pojok kiri atas: **"Kembali"** (mengembalikan ke halaman yang dikunjungi pengguna sebelumnya).

### B. Mode Pengeditan & Perilaku Simpan Perubahan
- **Mengaktifkan Mode Edit**:
  - Ketika tombol *"Edit Data Profil"* atau *"Edit Profil Sekarang"* diklik, status beralih ke `isEditing = true`.
  - Formulir input field menjadi aktif dan dapat diketik/diubah.
  - Tombol kanan atas berubah menjadi **"Simpan Perubahan"** (dengan ikon checklist).
  - Tombol kiri atas berubah menjadi **"Batal Edit"** (mengembalikan form ke data semula dan kembali ke mode peninjauan).
- **Perilaku Setelah Klik "Simpan Perubahan" (`Profile.tsx` & `App.tsx`)**:
  - Data profil disimpan ke Supabase (`users`, `user_verifications`), Supabase Auth user metadata, dan `localStorage`.
  - Event `RS_USER_UPDATED` dikirimkan secara global untuk memperbarui nama & avatar di Navbar.
  - Mode edit dimatikan (`setIsEditing(false)`), data lokal diperbarui, dan sistem **TETAP berada di halaman profil** dalam Mode Peninjauan menampilkan data terbaru yang baru saja disimpan (**tidak lagi me-redirect ke Beranda**).
  - Menampilkan feedback alert sukses: *"Data profil berhasil disimpan!"*.

### C. Navigasi Cerdas Tombol Kembali
- **Dalam Mode Peninjauan (`!isEditing`)**:
  - Mengklik tombol "Kembali" di header atau tombol bawah akan memicu `navigate(-1)` (kembali ke halaman sebelumnya saat sebelum membuka profil).
- **Dalam Mode Edit (`isEditing`)**:
  - Mengklik tombol "Batal Edit" di header atau tombol "Batal" di bawah/sidebar akan membatalkan pengeditan dan mengembalikan tampilan ke Mode Peninjauan tanpa berpindah halaman.

---

## 2. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi TypeScript & Vite Bundle
```bash
cmd /c npm run build (di functions/public)
```
- **Hasil**: **Lulus 100% (Exit code 0)**
- **Status**: `✓ 2511 modules transformed, built in 34.96s, 0 error`.

---

## 3. Panduan Pengujian untuk Pengguna

1. **Buka Profil Saya di Desktop**:
   - Klik nama / foto avatar di pojok kanan atas navbar desktop.
   - Klik menu **"Profil Saya"**.
   - **Hasil**: Halaman membuka dalam **Mode Peninjauan (Read-Only)** dengan tombol kanan atas *"Edit Data Profil"*. Input field tidak langsung dalam kondisi form edit.
2. **Uji Pengeditan & Penyimpanan**:
   - Klik tombol **"Edit Data Profil"** $\rightarrow$ Form input menjadi aktif/bisa diedit.
   - Ubah salah satu data (misal pekerjaan atau institusi), lalu klik **"Simpan Perubahan"**.
   - **Hasil**: Notifikasi *"Data profil berhasil disimpan!"* muncul, halaman **TETAP di profil**, dan tampilan kembali ke **Mode Peninjauan** dengan data yang baru saja diperbarui.
3. **Uji Tombol Kembali**:
   - Dari halaman Data Kost atau Beranda, klik *"Profil Saya"*.
   - Saat di Mode Peninjauan, klik tombol **"Kembali"** di kiri atas $\rightarrow$ Halaman kembali ke Data Kost / Beranda (halaman sebelumnya).
   - Masuk lagi ke *"Profil Saya"*, klik *"Edit Data Profil"*, lalu klik **"Batal Edit"** $\rightarrow$ Kembali ke Mode Peninjauan di halaman profil yang sama tanpa keluar.
