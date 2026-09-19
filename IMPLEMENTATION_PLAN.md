# IMPLEMENTATION PLAN: Restrukturisasi Modal Ganti Kata Sandi Menjadi Clean 2-Step Flow

**ID Rencana**: Plan #439  
**Target Fitur**: Restrukturisasi Antarmuka & Alur Minimalis Modal Keamanan & Kata Sandi (`MitraProfile.tsx` & `Profile.tsx`)  
**Status**: Menunggu Persetujuan User (*Pending Approval*)

---

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini
1. **Tampilan Modal Padat & "Semrawut"**:
   - Seluruh elemen perubahan kata sandi ditumpuk dalam satu layar vertikal yang panjang: info email terdaftar, kartu verifikasi email dengan tombol kirim OTP, input 6 digit OTP, input kata sandi baru, input konfirmasi kata sandi, serta tombol submit.
   - Hal ini menimbulkan kebingungan bagi pengguna (*cognitive overload*): pengguna tidak mengetahui apakah harus meminta kode OTP terlebih dahulu sebelum mengisi kata sandi, atau mengisi kata sandi terlebih dahulu.
2. **Kebutuhan Pengguna**:
   - Struktur dari atas ke bawah yang ringkas, simpel, dan elegan:
     1. **Kata Sandi Baru** (Input + toggle lihat/sembunyikan sandi)
     2. **Ulangi Kata Sandi Baru** (Input + toggle lihat/sembunyikan sandi)
     3. **Email Terdaftar** (Info box email akun yang akan menerima kode verifikasi)
     4. **Tombol "Verifikasi Perubahan Sandi"**
   - **Alur 2-Tahap (2-Step Clean Flow)**:
     - **Tahap 1 (Input Sandi Baru)**: Pengguna mengisi kata sandi baru dan konfirmasinya, lalu menekan tombol verifikasi. Sistem melakukan validasi (minimal 6 karakter & konfirmasi cocok) dan secara otomatis mengirimkan kode OTP ke email terdaftar, lalu langsung beralih ke Tahap 2.
     - **Tahap 2 (Input & Verifikasi OTP Email)**: Menampilkan halaman ringkas yang fokus pada instruksi pengiriman email, input kode OTP 6-digit, timer kirim ulang, tombol *"Verifikasi & Simpan Kata Sandi"*, serta tombol kembali ke tahap 1 jika ingin mengubah input sandi.
     - Begitu kode OTP diverifikasi benar, kata sandi akun resmi diperbarui via Supabase Auth dan modal ditutup dengan notifikasi sukses.

---

## 2. Dampak Perubahan (Files Touched)

1. [`functions/public/pages/MitraProfile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
   - Menambahkan state navigasi step modal: `passwordStep: 'input_password' | 'verify_otp'`.
   - Mengubah handler pemicu verifikasi Tahap 1 (`handleProceedToOtp`): memvalidasi password dan memicu `sendPasswordChangeOtp` otomatis sebelum transisi ke step 2.
   - Merestrukturisasi JSX modal `isSettingsModalOpen` menjadi alur 2 tahap:
     - **Step 1**: Kata Sandi Baru -> Ulangi Kata Sandi -> Box Email Terdaftar -> Tombol *"Verifikasi Perubahan Sandi"*.
     - **Step 2**: Status Notifikasi Pengiriman Email -> Input 6 Digit OTP -> Tombol *"Verifikasi & Simpan Kata Sandi"* -> Opsi Kirim Ulang & Tombol Kembali.
2. [`functions/public/pages/Profile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx):
   - Menyelaraskan komponen modal `isPasswordModalOpen` pada profil penyewa/user biasa agar memiliki alur dan tampilan 2-tahap yang konsisten dan minimalis.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah ACC)

### Langkah 1: Penyesuaian State & Validasi di `MitraProfile.tsx`
- Tambahkan state:
  ```tsx
  const [passwordStep, setPasswordStep] = useState<'input_password' | 'verify_otp'>('input_password');
  ```
- Buat fungsi transisi Tahap 1 ke Tahap 2:
  ```tsx
  const handleProceedToOtp = async (e: React.FormEvent) => {
      e.preventDefault();
      // 1. Validasi kata sandi
      if (!newPassword || newPassword.length < 6) {
          setPasswordMessage({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
          return;
      }
      if (newPassword !== confirmPassword) {
          setPasswordMessage({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
          return;
      }
      // 2. Kirim OTP otomatis ke email
      const targetEmail = formData.email || initialUser?.email;
      if (!targetEmail) {
          setPasswordMessage({ type: 'error', text: 'Email akun mitra tidak ditemukan.' });
          return;
      }
      setIsSendingOtp(true);
      setPasswordMessage(null);
      try {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expires = Date.now() + 10 * 60 * 1000;
          const sent = await sendPasswordChangeOtp(targetEmail, otp, formData.name || initialUser?.name);
          if (sent) {
              setGeneratedPasswordOtp(otp);
              setOtpExpiresAt(expires);
              setIsOtpSent(true);
              setOtpCooldown(60);
              setPasswordStep('verify_otp');
          } else {
              setPasswordMessage({ type: 'error', text: 'Gagal mengirim kode OTP ke email. Coba lagi.' });
          }
      } catch (err: any) {
          setPasswordMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem.' });
      } finally {
          setIsSendingOtp(false);
      }
  };
  ```

### Langkah 2: Restrukturisasi Tampilan Modal di `MitraProfile.tsx`
- **Tampilan Step 1 (`input_password`)**:
  - Input Kata Sandi Baru + toggle Eye/EyeOff.
  - Input Ulangi Kata Sandi Baru.
  - Box Email Terdaftar (Label, alamat email, badge Aktif, keterangan info kode verifikasi).
  - Tombol submit: `"Verifikasi Perubahan Sandi"` (dengan icon panah/loading).
  - Tautan alternatif di bawah: `"Atau Kirim Link Reset ke Email"`.
- **Tampilan Step 2 (`verify_otp`)**:
  - Banner info: `"Kode verifikasi telah dikirim ke [email]. Masukkan 6 digit kode untuk mengonfirmasi perubahan sandi."`
  - Input 6 digit OTP (center, tracking-widest, font tebal).
  - Tombol Kirim Ulang OTP dengan countdown timer.
  - Tombol utama: `"Verifikasi & Simpan Kata Sandi"`.
  - Tombol kembali: `"← Ubah Kata Sandi"`.

### Langkah 3: Penyelarasan di `Profile.tsx`
- Mengaplikasikan logika dan struktur 2-tahap yang sama ke modal `isPasswordModalOpen` di `Profile.tsx` agar konsisten untuk seluruh pengguna aplikasi.

### Langkah 4: Uji Kompilasi & Build
- Menjalankan `cmd.exe /c npm run build` di folder `functions/public`.
- Memastikan 0 error kompilasi dan bundling Vite sukses.

### Langkah 5: Dokumentasi & Git Push
- Menambahkan catatan ke `functions/PROGRESS.md` (Entry #439).
- Menerbitkan `WALKTHROUGH.md`.
- Melakukan commit dan push ke remote branch `origin bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan Visual Step 1**:
   - Buka modal "Keamanan & Kata Sandi".
   - Pastikan urutan persis dari atas ke bawah:
     1. Kata Sandi Baru
     2. Ulangi Kata Sandi Baru
     3. Email Terdaftar
     4. Tombol Verifikasi Perubahan Sandi
   - Pastikan tidak ada kartu OTP yang muncul sebelum tombol verifikasi ditekan.
2. **Uji Transisi ke Step 2**:
   - Masukkan kata sandi yang valid dan cocok.
   - Klik tombol "Verifikasi Perubahan Sandi".
   - Pastikan sistem mengirim email OTP dan layar modal berganti dengan mulus ke form input 6 digit OTP.
3. **Uji Verifikasi & Perubahan Kata Sandi**:
   - Masukkan kode OTP yang benar -> klik tombol "Verifikasi & Simpan Kata Sandi".
   - Pastikan pesan sukses muncul dan kata sandi di Supabase Auth berhasil diperbarui.
   - Uji tombol kembali ke Step 1 untuk memastikan pengguna dapat mengedit sandi sebelum konfirmasi OTP.
4. **Uji Kompilasi**:
   - Build Vite berhasil 100% tanpa error (`npm run build`).
