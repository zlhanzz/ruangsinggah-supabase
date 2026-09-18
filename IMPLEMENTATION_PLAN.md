# Rencana Implementasi: Peningkatan Keamanan Ganti Kata Sandi Berbasis Verifikasi Email OTP (`Profile.tsx` & `MitraProfile.tsx`)

Dokumen ini merinci rencana penanganan celah keamanan (*security anomaly*) pada fitur perubahan kata sandi di RuangSinggah.

---

## 1. Analisis Masalah Keamanan

### Celah Keamanan Saat Ini
Saat ini, baik pada antarmuka **Profil Pengguna (`Profile.tsx`)** maupun **Profil Mitra (`MitraProfile.tsx`)**:
- Pengguna yang sedang login dapat langsung mengganti kata sandi hanya dengan mengetikkan *Kata Sandi Baru* dan *Konfirmasi Kata Sandi Baru*, lalu menekan tombol simpan (`supabase.auth.updateUser({ password: newPassword })`).
- **Risiko Fatal (*Account Takeover*)**:
  Jika perangkat pengguna tertinggal dalam keadaan login (misal di warnet, laptop bersama, atau ponsel pinjaman), pihak yang tidak berwenang dapat langsung mengubah kata sandi akun tanpa memerlukan izin atau verifikasi apa pun ke pemilik akun yang sah. Akibatnya, pemilik asli terkunci dari akunnya sendiri.

### Solusi Standar Keamanan
Untuk memastikan integritas dan keamanan akun, setiap perubahan kata sandi wajib melewati **Verifikasi Kepemilikan Email (Two-Step Email OTP Verification)**:
1. Sistem mengirimkan **Kode OTP 6-Digit** khusus ke alamat email terdaftar pengguna.
2. Form perubahan kata sandi **hanya akan memproses kata sandi baru jika kode OTP yang dimasukkan dari email terbukti valid dan belum kedaluwarsa**.
3. Sistem memberikan notifikasi peringatan jika ada upaya perubahan kata sandi yang tidak dikenali.

---

## 2. Alur Pengalaman Pengguna (Security Flow)

### Rincian Alur:
1. Pengguna membuka modal Keamanan & Ganti Sandi.
2. Modal menampilkan email terdaftar pengguna yang aktif.
3. Pengguna menekan tombol **"Kirim Kode Verifikasi ke Email"**.
4. Sistem men-generate kode OTP 6-digit dan mengirimkannya ke email resmi pengguna.
5. Timer hitung mundur (*cooldown* 60 detik) aktif untuk mencegah spam.
6. Pengguna memasukkan:
   - **Kode OTP 6-Digit**
   - **Kata Sandi Baru** (minimal 6 karakter)
   - **Konfirmasi Kata Sandi Baru**
7. Sistem memvalidasi kesesuaian OTP:
   - Jika OTP salah atau kedaluwarsa (> 10 menit): Ditolak dengan pesan kesalahan yang jelas.
   - Jika OTP valid: Kata sandi diperbarui via `supabase.auth.updateUser({ password })`.

---

## 3. Rincian Fitur yang Akan Diterapkan

### A. Penambahan Fungsi Pengiriman Email OTP di `emailService.ts`
- Membuat fungsi `sendPasswordChangeOtp(email: string, otp: string, name?: string)`:
  - Mengirim email dengan template keamanan resmi RuangSinggah.
  - Subjek: `[RuangSinggah.id] Kode Keamanan Verifikasi Ganti Kata Sandi`.
  - Berisi kode OTP 6-digit, masa berlaku (10 menit), dan peringatan keamanan bahwa jika bukan pemilik akun yang meminta, pemilik dapat segera mengabaikan pesan tersebut.

### B. Pembaruan Modal Ganti Kata Sandi pada `MitraProfile.tsx` (Profil Mitra)
1. **Langkah 1 (Verifikasi Email)**:
   - Menampilkan email terdaftar secara jelas.
   - Tombol *"Kirim Kode OTP"* dengan countdown cooldown timer (60 detik) untuk mencegah spam pengiriman.
2. **Langkah 2 (Input Data)**:
   - Field input **Kode OTP Email (6 digit)** dengan validasi angka.
   - Field input **Kata Sandi Baru** & **Konfirmasi Kata Sandi** (toggle intip sandi).
3. **Langkah 3 (Validasi & Eksekusi)**:
   - Verifikasi kecocokan OTP dan masa aktif (maks 10 menit).
   - Eksekusi `supabase.auth.updateUser({ password: newPassword })` hanya setelah OTP lolos validasi.
   - Tetap menyediakan opsi bantuan *"Kirim Link Reset via Email"* sebagai metode alternatif.

### C. Pembaruan Modal Ganti Kata Sandi pada `Profile.tsx` (Profil User Biasa)
- Menggantikan modal ganti kata sandi lama di `Profile.tsx` dengan alur verifikasi email OTP yang sama persis dan konsisten dengan `MitraProfile.tsx`.

---

## 4. Dampak File yang Tersentuh

1. **`functions/public/emailService.ts`**:
   - Menambahkan fungsi helper `sendPasswordChangeOtp`.
2. **`functions/public/pages/MitraProfile.tsx`**:
   - Menambahkan state OTP (`emailOtp`, `inputOtp`, `isOtpSent`, `otpTimer`, `otpExpiresAt`).
   - Memperbarui modal pengaturan ganti kata sandi dengan verifikasi OTP.
3. **`functions/public/pages/Profile.tsx`**:
   - Menambahkan state OTP dan memperbarui modal ganti sandi user dengan verifikasi OTP.
4. **`functions/PROGRESS.md`**:
   - Pencatatan progres perbaikan celah keamanan nomor #428.
5. **`WALKTHROUGH.md`**:
   - Dokumentasi hasil pengujian keamanan.

---

## 5. Langkah-Langkah Eksekusi (Fase 2)

1. Menambahkan fungsi `sendPasswordChangeOtp` di `emailService.ts`.
2. Mengintegrasikan logika OTP dan pembaruan antarmuka modal pada `MitraProfile.tsx`.
3. Mengintegrasikan logika OTP dan pembaruan antarmuka modal pada `Profile.tsx`.
4. Menjalankan kompilasi `npm run build` di `functions/public` untuk memastikan 0 error tipe TypeScript.
5. Mencatat riwayat di `functions/PROGRESS.md` dan memperbarui `WALKTHROUGH.md`.
6. Melakukan git commit dan push ke branch `bukan-productions`.

---

## 6. Rencana Verifikasi

- [ ] **Kompilasi Sukses**: `npm run build` selesai tanpa error.
- [ ] **Uji Coba Profil Mitra**:
  - Modal ganti kata sandi meminta pengiriman OTP ke email terlebih dahulu.
  - Tombol simpan terkunci/memvalidasi jika OTP belum diisi atau salah.
  - Jika OTP benar, kata sandi berhasil diperbarui.
- [ ] **Uji Coba Profil User**:
  - Alur verifikasi OTP email berjalan mulus dan protektif seperti pada profil mitra.
- [ ] **Rate Limiting & Cooldown**: Timer hitung mundur 60 detik mencegah pengiriman berulang tak terkontrol.
