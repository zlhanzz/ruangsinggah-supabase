# IMPLEMENTATION PLAN - Paritas Halaman Profil Agen & Manajemen Agen Admin dengan Mitra

Dokumen ini menjelaskan rencana perubahan komprehensif untuk menyelaraskan halaman profil Agen (`AgentProfile.tsx`) dan halaman panel admin Kelola Agen (`AgentManagement.tsx`) dengan alur, tampilan, dan sistem yang ada pada Mitra.

## 1. Analisis Masalah & Kebutuhan
Sesuai instruksi USER:
- **Profil Agen (`AgentProfile.tsx`)**:
  - Harus diselaraskan agar memiliki tampilan, tata letak, alur pengajuan verifikasi dua langkah (wizard Step 1 & Step 2), dan sistem Double OTP WhatsApp yang identik dengan `MitraProfile.tsx`.
  - Berbeda dengan Mitra, profil Agen tidak memiliki input referral (`referred_by`) saat melakukan pengeditan. Namun, Agen memiliki kode referral sendiri (`referral_code`) yang dibaca dari tabel `agents` dan ditampilkan secara read-only agar bisa disalin/dibagikan.
  - Harus mendukung penyimpanan draf otomatis saat berpindah dari Step 1 ke Step 2, auto scroll-to-top saat navigasi step, dan peletakan RLS Security Notice di bagian atas Step 2.
- **Kelola Agen di Admin (`AgentManagement.tsx`)**:
  - Harus diselaraskan agar mirip dengan `MitraManagement.tsx`, termasuk pemisahan tabulasi menjadi tiga tab: "Permintaan Verifikasi" (requests), "Daftar Agen Aktif" (active), dan "Akun Diblokir" (blocked).
  - Menambahkan fitur tolak verifikasi dengan alasan kustom, pemblokiran akses kemitraan agen (banned), pemulihan akses (unban), dan counter batas penolakan (maksimal 3 kali penolakan memicu pemblokiran otomatis).

## 2. Dampak Perubahan
File yang akan dimodifikasi:
1. `functions/public/adminService.ts`:
   - Tambahkan fungsi `getBannedAgents()`, `banAgentRequest()`, dan `unbanAgentRequest()`.
   - Perbarui/optimalkan `updateAgentVerificationStatus()` agar mendukung penolakan beralasan, penanganan batas penolakan 3 kali (rejection count), sinkronisasi tabel `user_verifications`, dan pengiriman notifikasi email.
2. `functions/public/pages/AgentProfile.tsx`:
   - Terapkan struktur state & UI wizard flow dua langkah (Step 1: Data Profil, Step 2: Verifikasi KTP) dan Double OTP WhatsApp yang sama dengan `MitraProfile.tsx`.
   - Hapus input referral code (`referred_by`) dan tampilkan kode referral agen sendiri (`referral_code`) secara read-only dengan tombol "Salin".
3. `functions/public/components/admin/AgentManagement.tsx`:
   - Ubah tab menjadi 3 bagian (`requests`, `active`, `blocked`).
   - Tambahkan penolakan dengan alasan kustom, tombol Blokir Kemitraan (ban), dan tombol Pulihkan Akses (unban) di tab blocked.
4. `functions/public/pages/Dashboard.tsx`:
   - Tambahkan state `bannedAgents` dan fungsi `loadBannedAgents()` (atau integrasikan ke dalam `loadAgentVerifications`).
   - Kirim prop `bannedAgents` ke komponen `AgentManagement`.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `adminService.ts`**: Tulis fungsi-fungsi baru untuk paritas backend agen.
2. **Modifikasi `AgentProfile.tsx`**: Salin, sesuaikan, dan bersihkan logika referral input.
3. **Modifikasi `AgentManagement.tsx`**: Implementasikan layout 3 tab dan action handler baru.
4. **Modifikasi `Dashboard.tsx`**: Tambahkan integrasi state `bannedAgents`.
5. **Uji Build**: Jalankan `npm run build` untuk memverifikasi kelulusan kompilasi TypeScript/Vite.

## 4. Rencana Verifikasi
1. **Verifikasi Profil Agen**:
   - Buka profil agen, klik edit, amati wizard Step 1. Pastikan tidak ada input referral pemilik kost.
   - Klik "Lanjutkan", pastikan draft tersimpan di DB, layar scroll ke atas, dan diarahkan ke Step 2.
   - Amati RLS Security Notice di bagian atas Step 2.
   - Tes penggantian nomor WhatsApp untuk memicu Double OTP (OTP email keamanan + OTP WA baru).
2. **Verifikasi Admin Kelola Agen**:
   - Buka panel kelola agen di admin. Pastikan terdapat 3 tab: Permintaan, Aktif, dan Diblokir.
   - Uji tombol "Tolak" dengan memasukkan alasan kustom.
   - Uji tombol "Blokir Kemitraan" dan pastikan agen berpindah ke tab "Akun Diblokir".
   - Uji tombol "Pulihkan Akses" pada tab "Akun Diblokir".
