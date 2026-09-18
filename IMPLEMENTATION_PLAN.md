# Implementation Plan: Pembersihan Diksi Internal ("Instan") & Standarisasi Hasil Evaluasi Protokol AI Verifikasi Mitra

Dokumen rencana kerja ini disusun berdasarkan arahan pengguna untuk menata ulang tata bahasa (*copywriting*) dan alur interaksi verifikasi mitra. Konsep "instan" adalah logika dapur/sistem latar belakang internal dan tidak boleh ditampilkan kepada mitra. Mitra hanya perlu mengetahui status kepatuhan dokumen: **apakah verifikasi berhasil** atau **masih ada bagian yang perlu dievaluasi dan diperbaiki** berdasarkan protokol AI & keamanan yang tertanam dalam sistem.

---

## 1. Analisis Masalah & Kebutuhan

1. **Pembersihan Diksi "Dapur" Internal**:
   - Penggunaan kata seperti *"Instan"*, *"Verifikasi Instan"*, *"Kilat"*, dan *"Auto-ACC"* pada tombol, alert, kartu banner, serta status catatan membuat sistem tampak mengekspos mekanisme internal.
   - Mitra pemilik kost membutuhkan pengalaman pengguna (*user experience*) yang profesional, tenang, dan berstandar industri: tombol aksi formal, konfirmasi yang jelas, dan penjelasan apakah data mereka telah memenuhi protokol verifikasi.
2. **Standarisasi Protokol Evaluasi Berbasis AI**:
   - Sistem telah memiliki integrasi validasi AI KTP (OCR via edge function `analyze-ktp`) dan validasi nomor WhatsApp OTP 6-digit.
   - Evaluasi kelayakan harus menyajikan respon yang tegas dan edukatif:
     - **Jika Berhasil Lolos Protokol**: Tampilkan konfirmasi keberhasilan resmi bahwa identitas telah terverifikasi dan akun mitra aktif penuh untuk mulai mempublikasikan kost.
     - **Jika Perlu Evaluasi / Perbaikan**: Tampilkan pesan panduan spesifik mengenai poin mana yang belum memenuhi standar (misal: foto KTP buram/tidak terbaca, NIK belum tepat 16 digit, nama lengkap belum sesuai KTP, atau WhatsApp belum diverifikasi OTP).

---

## 2. Dampak Perubahan

File yang akan disentuh pada tahap eksekusi:
- [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
  - Mengganti teks tombol Langkah 2 dari `"SIMPAN & VERIFIKASI INSTAN"` menjadi `"SIMPAN & AJUKAN VERIFIKASI"`.
  - Mengubah alert keberhasilan dari bahasa "terverifikasi secara instan oleh sistem" menjadi pernyataan resmi: `"🎉 Verifikasi Identitas Berhasil! Dokumen identitas dan kontak Anda telah memenuhi protokol verifikasi RuangSinggah. Akun mitra Anda kini aktif penuh dan dapat langsung mempublikasikan unit kost."`
  - Menyempurnakan catatan status di database (`verification_notes`) dari `'Terverifikasi Otomatis (Validasi AI KTP & WhatsApp OTP)'` menjadi `'Identitas Terverifikasi'`.
  - Mengganti tombol banner pending dari `"Periksa / Verifikasi Instan"` menjadi `"Periksa Kelengkapan Data"`.
  - Memperbaiki copywriting banner peninjauan agar informatif dan bebas dari istilah "kilat/instan".
- [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx):
  - Mengganti tombol banner verifikasi overview dari `"Periksa / Verifikasi Instan"` menjadi `"Periksa Kelengkapan Data"`.
  - Mengubah deskripsi banner overview dari *"menyelesaikan verifikasi kilat otomatis"* menjadi *"Data verifikasi identitas Anda sedang diproses. Anda dapat memeriksa kembali kelengkapan dokumen apabila ada data yang perlu diperbarui."*

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Pembersihan Copywriting di `MitraProfile.tsx`
1. Ubah tombol submit formulir identitas (Langkah 2) menjadi `"SIMPAN & AJUKAN VERIFIKASI"`.
2. Ubah pesan dialog / alert saat protokol verifikasi terpenuhi:
   - Bahasa lugas, ramah, dan profesional yang mengonfirmasi bahwa data berhasil lolos verifikasi dan akun langsung aktif.
3. Ubah catatan status verifikasi di Supabase menjadi `'Identitas Terverifikasi'` (tanpa embel-embel teknis internal).
4. Ubah tombol pada banner status peninjauan (pending) menjadi `"Periksa Kelengkapan Data"`.
5. Perhalus pesan panduan evaluasi jika ada input yang tidak memenuhi protokol (misal: foto KTP buram, NIK tidak pas 16 digit, OTP belum dimasukkan).

### Langkah 2: Penyelarasan Copywriting di `MitraDashboard.tsx`
1. Perbarui banner status verifikasi di halaman overview dashboard mitra:
   - Ganti label tombol menjadi `"Periksa Kelengkapan Data"`.
   - Perbarui subteks keterangan agar bersih dari kata "kilat" atau "instan".

### Langkah 3: Pengujian Kompilasi & Bebas Regresi
1. Jalankan pengujian build Vite via shell (`cmd.exe /c npm run build`).
2. Pastikan 0 lint error dan seluruh alur transisi status berjalan mulus.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**: Memastikan proses `npm run build` sukses 100% tanpa kompilasi error.
2. **Pemeriksaan Teks (Grep Search)**: Melakukan scan pada seluruh file frontend untuk memastikan tidak ada lagi kata "instan" atau "kilat" pada alur verifikasi identitas mitra.
3. **Uji Fungsionalitas Alur**:
   - Memastikan tombol "SIMPAN & AJUKAN VERIFIKASI" tetap mengevaluasi protokol AI dan WhatsApp OTP secara andal di belakang layar.
   - Memastikan akun yang memenuhi syarat langsung aktif (`verified`) dan dapat mengunggah kost, sementara yang belum memenuhi syarat mendapatkan panduan perbaikan yang jelas.
