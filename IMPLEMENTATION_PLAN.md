# Rencana Implementasi: Redesain Sederhana & Tegas Pemilihan Peran Login (`Login.tsx`)

## 1. Analisis Masalah & Kebutuhan
- **Masalah dari Pengalaman Pengguna**:
  - Pada layar pemilihan peran sebelum login/register, saat ini disajikan 2 kartu berukuran sangat besar yang dipenuhi banyak teks (paragraf panjang, 3 butir checklist bullet point, badge ganda, dll.).
  - Di layar HP maupun PC, kartu tersebut terpotong dan terlihat seperti artikel/brosur promosi daripada tombol yang bisa di-klik. Pengguna tidak menyadari bahwa kartu tersebut adalah tombol untuk melanjutkan login.
- **Kebutuhan Pengguna**:
  - Tampilan dibuat **sangat simpel, bersih, dan langsung to-the-point**:
    - Cukup 2 tombol pilihan peran yang kontras dan jelas sebagai tombol yang bisa di-klik:
      1. **Pencari Kost** (dengan icon, teks peran jelas, dan tombol panah `→`).
      2. **Pemilik Kost** (dengan icon, teks peran jelas, dan tombol panah `→`).
    - Langsung pas dalam satu layar (*single-screen view*), tanpa perlu scroll panjang di HP.
    - Interaksi hover, active click effect (`active:scale-[0.98]`), dan border yang tegas sehingga pengguna 100% paham mana yang harus di-klik.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/pages/Login.tsx` | Menata ulang bagian `!isRoleSelected` menjadi box modal ringkas dengan 2 tombol aksi peran (Pencari Kost vs Pemilik Kost), menghilangkan teks berlebih/checklist panjang. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Redesain Komponen Pemilihan Peran di `Login.tsx`
- Mengganti grid kartu raksasa dengan container terpusat (`max-w-md mx-auto`) berlatar putih bersih dengan header ringkas:
  - Logo RuangSinggah.
  - Judul: **Masuk ke RuangSinggah**.
  - Subjudul: **Pilih peran Anda untuk melanjutkan**.
- Menghadirkan 2 elemen tombol `<button>` dengan border tebal, icon, label role, dan indikator panah aksi:
  - **Tombol 1**: `Pencari Kost` (Aksen Oranye, icon Compass, label "User", deskripsi singkat "Cari, sewa, & survey kamar kost").
  - **Tombol 2**: `Pemilik Kost` (Aksen Indigo, icon Building, label "Mitra", deskripsi singkat "Kelola kamar & pantau sewa kost").
- Menambahkan tautan kembali ke Beranda di bagian bawah.

### Langkah 2: Build & Validasi
- Jalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi dan sinkronisasi ke folder `dist` dan `public`.
- Commit ke `bukan-productions`, merge ke `main`, dan push ke GitHub `origin main`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan Mobile (HP)**:
   - Buka halaman login di HP $\rightarrow$ Kedua tombol peran (Pencari Kost & Pemilik Kost) langsung terlihat jelas dalam satu layar tanpa perlu scroll.
2. **Uji Klik Pemilihan Peran**:
   - Klik tombol **Pencari Kost** $\rightarrow$ Langsung masuk ke form login Pencari Kost dengan mulus.
   - Klik tombol **Pemilik Kost** $\rightarrow$ Langsung masuk ke form login Pemilik Kost (Mitra) dengan mulus.
