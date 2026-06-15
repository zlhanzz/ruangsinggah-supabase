# IMPLEMENTATION PLAN - Pengamanan Akses Step 2 KTP Profil Terverifikasi

Dokumen ini menjelaskan rencana pencegahan akses ke formulir KTP (Step 2) bagi pengguna (Mitra dan Agen) yang status akunnya sudah terverifikasi (`verified`), guna mengamaman data sensitif KTP agar tidak dapat diakses secara manual melalui manipulasi URL parameter (`?step=2`).

## 1. Analisis Masalah
- Di `MitraProfile.tsx` dan `AgentProfile.tsx`, status pengeditan dan wizard disinkronkan menggunakan parameter URL `edit=true` dan `step=2`.
- Saat akun sudah berstatus terverifikasi (`verification_status === 'verified'`), pengguna seharusnya hanya bisa mengedit data dasar di Step 1 (seperti Nama Lengkap, Nomor WhatsApp, Tempat/Tanggal Lahir, Alamat Domisili) dan tidak boleh melihat atau mengedit berkas KTP di Step 2.
- Namun, jika pengguna secara manual mengetik `&step=2` di URL browser, state `currentStep` diatur menjadi `2`, sehingga menampilkan formulir unggah KTP dan data NIK sensitif yang sudah terverifikasi sebelumnya.

## 2. Dampak Perubahan
File yang akan diubah:
1. [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)
2. [AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx)

## 3. Langkah-Langkah Eksekusi
1. **Validasi State Reaktif**:
   - Di kedua berkas component, tambahkan `useEffect` baru (atau perbarui `useEffect` sync URL) untuk mendeteksi: jika `formData.verification_status === 'verified'` dan parameter `step` atau state `currentStep` terdeteksi bernilai `2`, paksa arahkan kembali ke `step=1` di URL parameter dan set `currentStep` to `1`.
2. **Proteksi Rendering (Hard-Guard)**:
   - Pada bagian render Step 2, pastikan ada pengaman tambahan: jika `formData.verification_status === 'verified'`, render fallback/peringatan atau kosongkan visualnya agar KTP tidak bocor sama sekali walau terjadi delay pembaruan URL.
3. **Uji Build & Jalankan**:
   - Lakukan kompilasi untuk memastikan tidak ada error TypeScript.

## 4. Rencana Verifikasi
1. Login dengan akun Mitra yang sudah terverifikasi.
2. Klik "Edit Profil", lalu edit URL secara manual di browser menjadi: `/dashboard-mitra/profile?edit=true&step=2`.
3. Pastikan sistem mendeteksi manipulasi tersebut, mengarahkan URL kembali ke `step=1`, dan layar tetap berada pada formulir Step 1 (tidak menampilkan KTP).
4. Lakukan langkah yang sama untuk akun Agen terverifikasi di rute `/dashboard-agent/profile?edit=true&step=2`.
