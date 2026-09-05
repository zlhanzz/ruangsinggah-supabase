# WALKTHROUGH: Pemisahan Responsif Alur Navigasi Desktop & Mobile (Menu Pengaturan & Profil Saya)

Dokumen ini merangkum seluruh perubahan kode, hasil pengujian, dan panduan pengujian terkait pemisahan alur menu antara Desktop dan Mobile.

---

## 1. Ringkasan Perubahan

### A. Tampilan Mobile (Smartphone / Layar Kecil)
- **Bottom Navigation Bar (5 Tab)**:
  - Tab **"Profile"** (`/profile`): Membuka **Profile Hub Dashboard** (berisi identitas akun, ringkasan aktivitas, tombol *"Edit Profil & Data Kontak Pribadi"*, Riwayat Sewa Kost, Kost Favorit Saya, Riwayat Transaksi & Tagihan, Ganti Password, Preferensi Notifikasi, Pusat Bantuan 24/7, Syarat & Ketentuan, Kebijakan Privasi, dan Logout).
  - Tidak ada menu "Pengaturan" terpisah di mobile sehingga navigasi bawah tetap bersih dan ringkas.

---

### B. Tampilan Desktop (Dropdown Header Kanan Atas)
- **Menu Dropdown Avatar Pengguna**:
  - **"Profil Saya"**: Mengarahkan pengguna langsung ke formulir **Edit Data Pribadi & Kontak** (`/profile?view=edit`). Pengguna desktop dapat langsung melihat dan mengedit data diri, kontak, dan KTP secara instan.
  - **"Pesan / Chat"**: Menuju halaman percakapan (`/chat`).
  - **"Kost Saya"**: Menuju modul sewa aktif (`/my-bookings`).
  - **"Pengaturan" (Menu Baru)**: Mengarahkan pengguna ke **Profile Hub Dashboard** (`/settings`), yang memuat seluruh modul Hub yang sama persis seperti di mobile (Riwayat Sewa, Favorit, Transaksi, Keamanan Akun, Notifikasi, Bantuan 24/7, dll.).
  - **"Keluar"**: Logout akun pengguna.

---

### C. Detail File yang Diubah
1. **[`types.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/types.ts)**: Menambahkan `Page.SETTINGS = '/settings'`.
2. **[`Navbar.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/Navbar.tsx)**: Memperbarui tautan dropdown "Profil Saya" ke `${Page.PROFILE}?view=edit` dan menyisipkan menu baru "Pengaturan" (`Page.SETTINGS`).
3. **[`Profile.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/Profile.tsx)**: Mengintegrasikan `useLocation()` dan query parameter `?view=edit` agar secara reaktif memuat `viewMode = 'edit_personal_data'` saat diakses dari Profil Saya desktop, dan `viewMode = 'hub'` saat diakses dari Pengaturan desktop atau Profile bottom nav mobile.
4. **[`App.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/App.tsx)**: Mendaftarkan route `<Route path={Page.SETTINGS} ... />`.

---

## 2. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi TypeScript & Vite Bundle
```bash
cmd /c npm run build (di functions/public)
```
- **Hasil**: **Lulus 100% (Exit code 0)**
- **Status**: `✓ 2511 modules transformed, built in 23.03s, 0 errors`.

---

## 3. Panduan Pengujian untuk Pengguna

1. **Pengujian Desktop**:
   - Buka website di browser desktop / layar lebar.
   - Klik nama / foto avatar Anda di sudut kanan atas navbar.
   - Klik menu **"Profil Saya"** $\rightarrow$ Halaman akan langsung terbuka pada formulir **Edit Data Pribadi & Kontak** (siap mengisi/mengedit data diri).
   - Klik kembali avatar di sudut kanan atas navbar $\rightarrow$ Klik menu **"Pengaturan"** $\rightarrow$ Halaman akan membuka **Profile Hub Dashboard** lengkap (Riwayat Sewa, Favorit, Transaksi, Ganti Password, Notifikasi, Bantuan 24/7).
2. **Pengujian Mobile**:
   - Buka website pada smartphone atau beralih ke mobile viewport di browser.
   - Klik tab **"Profile"** pada Bottom Navigation Bar.
   - Halaman akan langsung membuka **Profile Hub Dashboard** secara terpusat, dan dari kartu paling atas Anda dapat mengklik tombol *"Edit Profil & Data Kontak Pribadi"* jika ingin mengubah data diri.
