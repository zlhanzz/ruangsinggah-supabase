# WALKTHROUGH - Redesain UI/UX Komunikatif Verifikasi WhatsApp & Formulir Profil Mitra Langkah 1

**ID Pekerjaan**: Entry #436  
**Tanggal**: September 2026  
**Status**: Selesai & Lulus Uji Kompilasi (`build 0 error`)

---

## 1. Ringkasan Pekerjaan
Telah dilakukan perombakan antarmuka (UI/UX) pada formulir profil mitra **Langkah 1 (Data Profil & Verifikasi WhatsApp)** di [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx).

Sebelumnya:
- Calon mitra baru mengira nomor WhatsApp sudah beres karena nomor otomatis terisi dari akun registrasi, padahal statusnya belum diverifikasi (`whatsapp_verified === false`).
- Tombol kirim OTP hanya berupa teks kecil tersembunyi berukuran 9px.
- Kotak input 6 digit OTP tidak terlihat sebelum tombol kecil diklik.
- Tombol **"LANJUTKAN"** di bagian bawah terkunci bisu (*silent disabled*) warna abu-abu tanpa penjelasan apapun, membuat pengguna bingung mengira sistem rusak atau macet.

Sesudah perombakan:
- Ditambahkan **Banner Panduan Alur** di bagian atas formulir yang menjelaskan tahapan pengisian identitas dan verifikasi OTP WhatsApp sebelum melangkah ke Langkah 2 (KTP).
- Dibuatkan **Kartu Verifikasi WhatsApp Khusus** yang langsung terbuka dan mencolok dengan status badge dinamis (`⚠️ BUTUH VERIFIKASI OTP (WAJIB)` atau `✓ TERVERIFIKASI RESMI`).
- Disediakan tombol aksi utama berukuran besar **"📲 KIRIM KODE OTP WHATSAPP"** dan 6 kotak digit OTP modern dengan navigasi otomatis dan hitung mundur kirim ulang.
- Dihilangkan sifat mati bisu pada tombol **"LANJUTKAN"**: jika diklik sebelum verifikasi WA selesai, tombol akan menampilkan notifikasi panduan ramah, melakukan *smooth scroll* otomatis ke kartu WhatsApp, serta memicu animasi kedipan sorotan oranye (*highlight effect*).
- Ditambahkan **Checklist Indikator Kelengkapan** (Nama Lengkap, Verifikasi WA, Alamat Domisili) di atas tombol aksi.

---

## 2. Rincian Perubahan Kode

### [functions/public/pages/MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)
1. **State & Ref Interaktif Tambahan**:
   - `waCardRef = useRef<HTMLDivElement>(null)`: Ref untuk navigasi scroll dan penyorotan visual.
   - `waHighlight = useState(false)`: State efek animasi *highlight flash* oranye pada kartu WhatsApp.
   - `waErrorMessage = useState('')`: State pesan galat instan saat pengiriman atau verifikasi kode OTP.
2. **Cerdas Tombol Lanjutkan (`handleAttemptNextStep`)**:
   - Mengecek kelengkapan nama dan alamat.
   - Jika WhatsApp belum diverifikasi (`!profile.whatsapp_verified`):
     - Memunculkan alert panduan ramah.
     - Menggulir layar secara mulus (*smooth scroll*) langsung ke kartu verifikasi WhatsApp.
     - Mengaktifkan efek kedipan *highlight* oranye selama 2 detik agar perhatian mitra tertuju langsung pada kartu OTP.
   - Jika semua syarat terpenuhi, melanjutkan ke Langkah 2 (Unggah KTP).
3. **Komponen Kartu Verifikasi WhatsApp Terbuka**:
   - Status badge informatif:
     - `⚠️ BUTUH VERIFIKASI OTP (WAJIB)` (Kuning-Oranye) jika belum terverifikasi.
     - `⏳ MENUNGGU KODE OTP (6 DIGIT)` (Biru) saat OTP sedang dikirim/menunggu verifikasi.
     - `✓ TERVERIFIKASI RESMI` (Hijau) setelah verifikasi berhasil.
   - Kotak input 6 digit OTP berbasis flexbox dengan font monospace tebal dan tombol aksi konfirmasi besar.
   - Opsi ubah nomor WhatsApp jika pengguna ingin mengganti nomor tujuan OTP.
4. **Ringkasan Syarat Kelengkapan (Checklist Pills)**:
   - Menampilkan status 3 syarat utama di atas tombol aksi bawah:
     - Nama Lengkap (Terisi / Belum)
     - Nomor WhatsApp (Terverifikasi / Belum)
     - Alamat Domisili (Terisi / Belum)
5. **Pembersihan State pada Tombol Batal**:
   - Menghapus input OTP dan state verifikasi sementara saat menekan tombol "BATAL".

---

## 3. Hasil Pengujian & Verifikasi

### Hasil Kompilasi Frontend (`npm run build`)
```bash
> ruangsinggah.id@0.0.0 build
> vite build && node -e "const fs=require('fs'); if (fs.existsSync('./dist')) fs.rmSync('./dist', {recursive: true, force: true}); fs.cpSync('../../public', './dist', {recursive: true, force: true});"

vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 1m 2s
The command exited with code 0.
```
Kompilasi TypeScript dan Vite selesai dengan status **Lulus 100% (Exit code 0)** tanpa ada galat tipe data maupun syntax error.

---

## 4. Panduan Pengujian untuk Pengguna (User Testing Guide)

1. Masuk ke halaman dashboard mitra: `http://localhost:5173/dashboard-mitra/profile` (atau melalui menu tab **Profil**).
2. Jika profil belum lengkap atau menekan tombol **"Lengkapi Profil Sekarang"** / **"Edit Data Profil"**:
   - Anda akan melihat formulir **Langkah 1 dari 2**.
   - Perhatikan banner panduan berwarna biru di bagian atas.
   - Perhatikan **Kartu Verifikasi WhatsApp** berbingkai oranye dengan status badge `⚠️ BUTUH VERIFIKASI OTP (WAJIB)`.
3. Uji Coba Tombol Lanjutkan:
   - Isi Nama Lengkap dan Alamat Domisili, namun biarkan WhatsApp belum diverifikasi.
   - Klik tombol **"LANJUTKAN KE UNGGAH KTP"**.
   - Sistem tidak lagi diam/bisu; sebuah peringatan ramah akan muncul dan layar akan langsung bergulir otomatis ke kartu WhatsApp dengan efek animasi sorotan oranye.
4. Uji Verifikasi OTP WhatsApp:
   - Klik tombol hijau/biru **"📲 KIRIM KODE OTP WHATSAPP"**.
   - Masukkan 6 digit kode OTP yang diterima.
   - Klik **"VERIFIKASI WHATSAPP SEKARANG"**.
   - Kartu WhatsApp akan berubah menjadi warna hijau dengan badge `✓ TERVERIFIKASI RESMI`.
5. Klik **"LANJUTKAN KE UNGGAH KTP"**:
   - Formulir akan berpindah dengan mulus ke Langkah 2 (Unggah KTP).
