# Walkthrough: Penayangan Otomatis Pop-Up Iklan KostManager Setiap Kali Mitra Baru Login

## Ringkasan Perubahan
Fitur promosi KostManager pada akun mitra biasa telah disempurnakan agar **selalu muncul secara otomatis dalam bentuk iklan pop-up modal interaktif setiap kali mitra baru login** ke Dashboard Mitra (`/mitra`), dengan tetap menjaga kenyamanan navigasi selama sesi aktif berlangsung.

---

## 1. Detail Implementasi

### A. Reset Flag Sesi Otomatis saat Login & Logout
1. **[`Login.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Login.tsx)**:
   - Pada saat proses autentikasi berhasil (`handleLogin`), sistem secara otomatis menghapus flag sesi lama:
     ```ts
     sessionStorage.removeItem('km_promo_popup_closed_session');
     ```
   - Hal ini memastikan bahwa setiap login baru (atau login ulang setelah logout) akan mengaktifkan kembali kemunculan pop-up iklan KostManager.
2. **[`App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx)**:
   - Menambahkan pembersihan flag `sessionStorage.removeItem('km_promo_popup_closed_session')` di dalam `handleLogout` global.

### B. Lifecycle Pop-Up Cerdas & Tombol Logout Bersih di [`MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
1. **Penyimpanan Status Penutupan Berbasis Sesi Aktif**:
   - Fungsi `handleClosePromoPopup` menyimpan flag ke `sessionStorage`:
     ```ts
     sessionStorage.setItem('km_promo_popup_closed_session', 'true');
     ```
   - Pop-up tidak akan melakukan spam berulang kali ketika mitra berpindah-pindah sub-menu (*Beranda*, *Kost Saya*, *Pemesanan*, *Dompet*, dll.) dalam satu sesi login yang sama.
2. **Penayangan Otomatis saat Dashboard Dimuat**:
   - Hook inisialisasi `useEffect` saat `MitraDashboard` dimuat memeriksa apakah mitra berstatus reguler (`!isKostManager`) dan belum menutup pop-up pada sesi login ini:
     ```ts
     if (!isKostManager && !sessionStorage.getItem('km_promo_popup_closed_session')) {
       setShowPromoPopup(true);
     }
     ```
3. **Pembersihan Bersih saat Logout dari Dashboard**:
   - Disediakan `handleLogoutWithCleanup` yang membersihkan `km_promo_popup_closed_session` sebelum mengeksekusi `onLogout()`.
   - Terpasang pada tombol *Keluar Akun* desktop sidebar maupun mobile drawer.

---

## 2. Hasil Pengujian & Kompilasi

- **Kompilasi Frontend Vite**:
  ```bash
  cmd /c npm run build (di functions/public)
  ```
  **Status**: `✓ 2511 modules transformed. ✓ built in 29.16s` (**0 Error, 0 Warning Kritis**).

---

## 3. Panduan Pengujian untuk Pengguna (User Testing Steps)

1. **Buka Aplikasi & Login sebagai Mitra**:
   - Masuk ke halaman login (`/login`) dan login menggunakan akun mitra biasa (*regular partner*).
2. **Periksa Kemunculan Pop-up Iklan**:
   - Begitu berhasil login dan masuk ke Dashboard Mitra (`/mitra`), **pop-up modal iklan KostManager otomatis langsung muncul di tengah layar**.
3. **Uji Penutupan Pop-up**:
   - Klik tombol silang **`X`** di sudut kanan atas modal (atau klik *"Nanti Saja"*, klik backdrop luar, atau tekan tombol `Escape`).
   - Pop-up akan tertutup dengan mulus.
4. **Uji Navigasi Menu Dashboard**:
   - Berpindahlah ke menu **Kost Saya**, **Pemesanan**, atau **Dompet & Pendapatan**.
   - Pop-up **tidak akan muncul mengganggu lagi** selama masih dalam sesi login yang sama.
5. **Uji Logout & Login Ulang**:
   - Klik tombol **Keluar Akun** (*Logout*).
   - Lakukan login kembali ke akun mitra.
   - **Pop-up iklan KostManager akan otomatis muncul kembali**, sesuai kebutuhan promosi berkala setiap sesi login baru.
