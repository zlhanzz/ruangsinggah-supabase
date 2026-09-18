# Walkthrough: Validasi Status Verifikasi Identitas & Kontrol Sesi Pop-Up Promosi KostManager (`MitraDashboard.tsx`)

Dokumen ini mencatat perbaikan atas penayangan pop-up promosi KostManager agar tepat sasaran, hanya muncul untuk mitra yang telah diverifikasi identitasnya, dan tidak muncul berulang kali secara agresif.

---

## 1. Ringkasan Perubahan

### A. Syarat Mutlak Identitas Terverifikasi (`isVerified === true`)
Pop-up promosi KostManager ("Capek Kelola Kost Sendiri? Serahkan Operasional ke KostManager!") kini memverifikasi status identitas mitra secara ketat:
- **Sebelumnya**: `useEffect` dan `handleMenuChange` hanya memeriksa `!loading && !isKostManager`, sehingga akun baru yang statusnya `unverified` atau `pending` langsung disajikan pop-up promosi.
- **Sesudahnya**:
  - `useEffect` pemicu pop-up dan `useEffect` setting promosi langsung mematikan pop-up (`setShowPromoPopup(false); return;`) jika `!isVerified || isKostManager`.
  - Kondisi render JSX dilengkapi pengaman tingkat akhir:
    ```tsx
    {showPromoPopup && !loading && !isKostManager && isVerified && (
    ```
  - Akun baru yang belum melengkapi KTP atau berstatus selain `verified` dipastikan **100% bebas dari gangguan pop-up promosi KostManager**.

### B. Pencegahan Pop-up Muncul Berulang-ulang (*Anti-Spam / Session Control*)
- Pada fungsi `handleClosePromoPopup`, sistem kini menyimpan penanda sesi:
  ```tsx
  sessionStorage.setItem('km_promo_popup_closed_session', 'true');
  ```
  yang terpanggil baik saat mitra menekan tombol "X" di sudut kanan atas, tombol "Nanti Saja", klik area latar belakang (backdrop), maupun tombol `Escape`.
- `useEffect` memeriksa apakah pop-up sudah pernah ditutup dalam sesi browser aktif (`sessionStorage.getItem('km_promo_popup_closed_session') === 'true'`).
- Dihapus pemanggilan paksa `setShowPromoPopup(true)` pada handler klik menu tab `handleMenuChange`, sehingga navigasi antar tab di dashboard mitra berlangsung mulus tanpa ada pop-up yang tiba-tiba melompat lagi.
- Saat mitra logout (`handleLogoutWithCleanup`), key `km_promo_popup_closed_session` dibersihkan dari `sessionStorage` sehingga siap untuk sesi berikutnya.

---

## 2. Hasil Verifikasi Kompilasi (Build Test)

Perintah kompilasi frontend Vite dijalankan dan berhasil 100% tanpa error:
```bash
cmd.exe /c npm run build
```

**Output Log**:
```
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
../../public/index.html                                  7.92 kB │ gzip:   2.29 kB
../../public/assets/index-B5qcSKpE.css                 299.39 kB │ gzip:  35.93 kB
../../public/assets/MitraDashboard-Bc6vPKAq.js         427.54 kB │ gzip:  93.15 kB
✓ built in 34.13s
```

---

## 3. Panduan Pengujian bagi Pengguna (User Testing)

1. **Pengujian Akun Baru / Belum Verifikasi**:
   - Masuk menggunakan akun mitra yang belum terverifikasi identitasnya (status `unverified` atau `pending`).
   - Buka halaman dashboard (`/dashboard-mitra`).
   - Berpindah antar menu (`Overview`, `Kamar & Kost`, `Transaksi`, `Profil`, dll.).
   - **Hasil yang Diharapkan**: Pop-up promosi KostManager **TIDAK MUNCUL SAMA SEKALI**.

2. **Pengujian Akun Terverifikasi**:
   - Masuk menggunakan akun mitra yang sudah terverifikasi resmi (`verification_status: 'verified'`).
   - Masuk ke tab `Overview` atau `Kamar & Kost`.
   - Pop-up promosi akan muncul secara elegan.
   - Klik tombol **"Nanti Saja"** atau tombol **"X"**.
   - Berpindah tab ke menu lain dan kembali lagi ke tab `Overview`.
   - **Hasil yang Diharapkan**: Pop-up **TIDAK MUNCUL LAGI** karena sudah ditutup pada sesi penjelajahan tersebut.
