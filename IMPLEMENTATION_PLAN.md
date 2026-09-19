# IMPLEMENTATION PLAN - Penyesuaian Alert "Belum Terverifikasi" & Tombol "Verifikasi Sekarang!" pada No. WhatsApp Profil Mitra

Dokumen ini disusun sebagai panduan teknis dan alur eksekusi perubahan antarmuka pada formulir profil mitra sesuai arahan pengguna.

---

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini:
1. **Label Status Kurang Tegas**:
   - Kolom No. WhatsApp saat ini menampilkan badge status berwarna kuning/amber bertuliskan `WAJIB OTP`.
   - Mitra masih merasa ambigu dengan istilah tersebut karena tidak secara gamblang menyatakan status kondisi data nomor mereka (apakah sudah aktif/sah atau belum diverifikasi).
2. **Tombol Aksi Kurang Direktif**:
   - Tombol aksi saat ini bertuliskan `"Kirim OTP"`.
   - Pengguna meminta agar tombol aksi ini diubah menjadi lebih tegas dan mengajak aksi langsung (*call to action*): **"Verifikasi Sekarang!"**.
3. **Proporsi Input & Penyesuaian Padding**:
   - Karena teks `"Verifikasi Sekarang!"` sedikit lebih panjang dibanding `"Kirim OTP"`, padding kanan pada elemen input (`pr-28`) perlu disesuaikan (menjadi `pr-44` atau `pr-48`) agar deretan nomor telepon pengguna tidak terpotong atau tertutup di belakang tombol aksi.

### Tujuan Perubahan:
1. Mengganti badge `WAJIB OTP` menjadi tanda alert merah mencolok:
   - Ikon `<AlertCircle size={12} className="text-rose-500" />`
   - Teks: **`Belum Terverifikasi`**
   - Styling: Badge merah lembut dengan kontras teks jelas (`text-rose-600 bg-rose-50 border border-rose-200`).
2. Mengubah label tombol aksi di dalam kolom input telepon dari `"Kirim OTP"` menjadi **`"Verifikasi Sekarang!"`**.
3. Memastikan tata letak responsif tetap proporsional dan tidak merusak layout form profil Langkah 1.

---

## 2. Dampak Perubahan (Files Touched)

File yang akan dimodifikasi:
- [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
  - **Baris ~1250**: Mengubah blok badge status saat `!waOtpVerified` dari badge `WAJIB OTP` menjadi badge alert merah `Belum Terverifikasi`.
  - **Baris ~1287**: Menyesuaikan padding kanan input nomor telepon dari `pr-28` menjadi `pr-44` (atau `pr-48`) agar string nomor telepon tidak tertindih oleh tombol aksi.
  - **Baris ~1314**: Mengubah teks tombol aksi dari `Kirim OTP` menjadi `Verifikasi Sekarang!`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Modifikasi Badge Status No. WhatsApp
- Mengubah elemen badge pada baris ~1250:
  ```tsx
  // Sebelum:
  <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
      Wajib OTP
  </span>

  // Sesudah:
  <span className="flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
      <AlertCircle size={12} className="text-rose-500" /> Belum Terverifikasi
  </span>
  ```

### Langkah 2: Penyesuaian Tombol Aksi & Padding Input
- Mengubah teks tombol aksi pada baris ~1314:
  ```tsx
  // Sebelum:
  <span>Kirim OTP</span>

  // Sesudah:
  <span>Verifikasi Sekarang!</span>
  ```
- Menyesuaikan `className` padding kanan pada input nomor telepon (baris ~1287) agar teks input tidak bertubrukan dengan tombol:
  ```tsx
  waOtpCode || isVerifyingWaOtp ? 'pr-20 bg-gray-100/70 text-gray-600 cursor-not-allowed' : 'pr-44 bg-gray-50 focus:bg-white'
  ```

### Langkah 3: Pengujian Kompilasi
- Menjalankan build frontend via terminal: `cmd.exe /c npm run build` di folder `functions/public`.
- Memastikan tidak ada error TypeScript atau kendala kompilasi Vite (0 error).

### Langkah 4: Dokumentasi & Git Push
- Menambahkan catatan pekerjaan ke [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) (Entry #438).
- Membuat dokumen [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md).
- Melakukan commit dan push ke remote repository branch `origin bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Verifikasi Tampilan UI**:
   - Buka `/dashboard-mitra/profile?edit=true&step=1`.
   - Pastikan badge di samping label `No. WhatsApp` kini menampilkan tanda alert merah: `[⚠️] BELUM TERVERIFIKASI`.
   - Pastikan tombol aksi berwarna oranye kini bertuliskan **"Verifikasi Sekarang!"**.
   - Pastikan nomor telepon yang dimasukkan (misal: `+6281527080656`) tidak bertabrakan secara visual dengan tombol aksi di sisi kanan.
2. **Verifikasi Fungsionalitas**:
   - Memastikan tombol *"Verifikasi Sekarang!"* tetap memicu fungsi `handleSendWaOtp` dengan benar.
   - Memastikan saat OTP terkirim, kotak 6 digit OTP tetap muncul dengan mulus.
3. **Uji Kompilasi**:
   - Build Vite berhasil 100% tanpa error (`npm run build`).
