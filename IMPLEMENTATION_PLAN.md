# Rencana Implementasi: Penyederhanaan UI/UX Verifikasi WhatsApp pada Formulir Profil Mitra (Langkah 1)

## 1. Analisis Masalah / Kebutuhan
Berdasarkan feedback pengguna:
- Tampilan verifikasi WhatsApp yang sebelumnya diimplementasikan terlalu besar, memakan *space layout* berlebihan, dan merusak keseragaman/pola desain form yang sudah ada di sekitarnya (seperti *Nama Lengkap*, *Alamat Email*, dan *Alamat Domisili*).
- Terdapat elemen yang dirasa terlalu "bertele-tele" dan repetitif (seperti banner petunjuk besar di atas form, kartu di dalam kartu bertingkat, teks ganda, serta kotak checklist kelengkapan yang tebal di bawah).
- **Kebutuhan Pengguna**:
  - UI/UX kembali selaras (*seamless & coherent*) dengan pola desain form yang ada: menggunakan format baris & kotak input standar (`ProfileItemRead`).
  - Fungsionalitas verifikasi nomor WhatsApp tetap bekerja secara efektif dan mudah dipahami:
    1. Label input standar dengan ikon telepon & indikator status verifikasi yang ringkas.
    2. Input nomor telepon dengan tombol aksi yang kompak (misal tombol *"Kirim OTP"* di dalam/samping input).
    3. Jika kode OTP sudah dikirim, area input 6 digit OTP muncul secara ringkas tepat di bawah input nomor tanpa pembungkus kartu raksasa yang merusak ritme form.
    4. Menghapus banner petunjuk berlebih di atas form dan kotak checklist tebal di bawah form, mengembalikan tombol navigasi bawah yang bersih (*Batal* & *Lanjutkan*).

---

## 2. Dampak Perubahan
File yang akan disentuh:
- `functions/public/pages/MitraProfile.tsx`:
  - Menghapus banner pembuka Langkah 1 yang memakan ruang layout.
  - Merestrukturisasi blok input nomor WhatsApp agar menggunakan pola visual yang sama persis dengan `ProfileItemRead` (1 kolom pada grid 2 kolom, atau selaras dengan field form lainnya).
  - Menyederhanakan area input OTP 6 digit menjadi baris kompak tepat di bawah kolom nomor WhatsApp.
  - Menghapus kotak checklist pills di atas tombol aksi bawah.
  - Mempertahankan proteksi tombol *"Lanjutkan"* (memberi notifikasi panduan ramah & mengarahkan fokus ke input OTP jika pengguna mencoba lanjut tanpa verifikasi WA).

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Menghapus Elemen Berlebih (De-clutter)
- Hapus banner petunjuk berlebih di atas `Data Profil` pada Langkah 1.
- Hapus kotak checklist kelengkapan di atas tombol bawah (*Batal* dan *Lanjutkan*).

### Langkah 2: Merestrukturisasi Input No. WhatsApp Menjadi Kompak & Selaras
- Gunakan grid standar `ProfileItemRead`:
  - **Header Bar**: Ikon telepon dalam box 8x8 + label `NO. WHATSAPP` + badge status ringkas di sisi kanan (`✓ Terverifikasi` warna hijau atau `Belum Verifikasi` warna amber).
  - **Input Box**: Menggunakan styling input form standar (`w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold text-gray-900 focus:bg-white focus:border-orange-500`).
  - **Aksi Kirim OTP**:
    - Jika nomor belum terverifikasi: tombol *"Kirim OTP"* ringkas diletakkan di sisi kanan dalam input (posisi absolute/flex) sehingga tidak memakan baris baru secara boros.
    - Jika nomor sudah terverifikasi: menampilkan ikon centang hijau `<BadgeCheck />` dan opsi teks kecil *"Ubah"*.

### Langkah 3: Desain Kompak untuk Input 6 Digit OTP
- Saat status sedang menunggu OTP (`waOtpCode` aktif / `isVerifyingWaOtp`):
  - Tampilkan baris kompak tepat di bawah input nomor WhatsApp:
    - 6 kotak digit angka berukuran proporsional (w-9 h-11 atau w-10 h-12).
    - Tombol *"Verifikasi"* yang ringkas di samping/bawahnya.
    - Info waktu kirim ulang (*"Kirim ulang dalam Xs"* / tombol teks *"Kirim Ulang"*).
  - Tanpa nesting kartu berlapis-lapis dan tanpa teks pengantar yang panjang.

### Langkah 4: Tombol Aksi Bawah yang Bersih
- Tombol navigasi bawah tetap bersih dan proporsional:
  - Tombol *"BATAL"*
  - Tombol *"LANJUTKAN KE LANGKAH 2 (KTP)"* (tetap memiliki proteksi cerdas: jika diklik saat WA belum diverifikasi, memunculkan pesan ramah dan langsung memfokuskan kursor ke input OTP).

---

## 4. Rencana Verifikasi
1. **Verifikasi Tampilan Visual**:
   - Memastikan tidak ada layout shift atau kartu berbingkai raksasa yang merusak pola form.
   - Memastikan nomor WhatsApp sejajar dan selaras dengan field lain (seperti Nama Lengkap dan Email).
2. **Verifikasi Fungsionalitas**:
   - Uji klik *"Kirim OTP"* pada nomor WhatsApp.
   - Uji input 6 digit angka OTP dan tombol *"Verifikasi"*.
   - Uji klik tombol *"Lanjutkan"* sebelum vs setelah nomor WhatsApp terverifikasi.
3. **Uji Kompilasi**:
   - Menjalankan `npm run build` di folder `functions/public` untuk memastikan 0 error TypeScript/Vite.
4. **Git Push**:
   - Commit dan push ke branch `bukan-productions`.
