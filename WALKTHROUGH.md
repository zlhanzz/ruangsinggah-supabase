# WALKTHROUGH - Penegasan Status "Belum Terverifikasi" & Tombol Aksi "Verifikasi Sekarang!" pada No. WhatsApp Profil Mitra

**ID Pekerjaan**: Entry #438  
**Tanggal**: September 2026  
**Status**: Selesai & Lulus Uji Kompilasi (`build 0 error`)

---

## 1. Ringkasan Perubahan

Berdasarkan permintaan evaluasi pada formulir profil mitra **Langkah 1 (Data Profil)** di [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
1. **Penegasan Status Belum Terverifikasi**:
   - Keterangan status `WAJIB OTP` dengan badge amber yang kurang lugas telah diubah menjadi badge alert merah tegas: **`Belum Terverifikasi`** lengkap dengan ikon `<AlertCircle />`.
2. **Tombol Aksi Interaktif "Verifikasi Sekarang!"**:
   - Teks tombol aksi yang semula bertuliskan `"Kirim OTP"` diubah menjadi lebih direktif (*Call-To-Action*): **`Verifikasi Sekarang!`**.
3. **Penyesuaian Padding Input**:
   - Padding sisi kanan input nomor telepon disesuaikan dari `pr-28` menjadi `pr-44` agar nomor telepon panjang tidak tertindih oleh tombol aksi di sisi kanan.

---

## 2. Rincian Perubahan Kode

### [functions/public/pages/MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)
1. **Badge Status No. WhatsApp (Baris ~1250)**:
   ```tsx
   {/* Sebelum: */}
   <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
       Wajib OTP
   </span>

   {/* Sesudah: */}
   <span className="flex items-center gap-1 text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
       <AlertCircle size={12} className="text-rose-500" /> Belum Terverifikasi
   </span>
   ```
2. **Padding Input Nomor Telepon (Baris ~1287)**:
   ```tsx
   waOtpCode || isVerifyingWaOtp ? 'pr-20 bg-gray-100/70 text-gray-600 cursor-not-allowed' : 'pr-44 bg-gray-50 focus:bg-white'
   ```
3. **Tombol Aksi Call-To-Action (Baris ~1314)**:
   ```tsx
   {/* Sebelum: */}
   <span>Kirim OTP</span>

   {/* Sesudah: */}
   <span>Verifikasi Sekarang!</span>
   ```

---

## 3. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi Frontend (`cmd.exe /c npm run build`)
Kompilasi TypeScript dan Vite build berjalan sukses 100% tanpa error (`exit code 0`):
```bash
> ruangsinggah.id@0.0.0 build
> vite build && node -e "const fs=require('fs'); if (fs.existsSync('./dist')) fs.rmSync('./dist', {recursive: true, force: true}); fs.cpSync('../../public', './dist', {recursive: true, force: true});"

vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.92 kB │ gzip:   2.29 kB
../../public/assets/index-CnLlENow.css                 300.55 kB │ gzip:  36.04 kB
...
✓ built in 26.41s
```

### B. Panduan Pengujian Pengguna (User Testing Guide)
1. Buka halaman profil mitra: `/dashboard-mitra/profile?edit=true&step=1`.
2. Periksa kolom **No. WhatsApp**:
   - Jika nomor belum terverifikasi, badge di samping label akan menampilkan tanda alert merah: `[⚠️] BELUM TERVERIFIKASI`.
   - Tombol di sisi kanan dalam input nomor kini bertuliskan **"Verifikasi Sekarang!"** berwarna oranye menyala.
   - Ketik atau lihat nomor telepon panjang, teks nomor tidak akan bertumpukan dengan tombol aksi.
3. Klik tombol **"Verifikasi Sekarang!"**:
   - Kode OTP akan dikirimkan dan kotak 6 digit OTP akan terbuka di bawah kolom input untuk verifikasi instan.
4. Fitur Logout pada menu profil dashboard mitra tetap berfungsi sempurna dengan modal konfirmasi dan pembersihan sesi Supabase Auth.
