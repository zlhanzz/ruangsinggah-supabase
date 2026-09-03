# Rencana Implementasi: Sembunyikan Header Navigation Khusus Landing Page KostManager

## 1. Analisis Masalah & Penegasan Batasan Kebutuhan
- **Kebutuhan Pengguna**:
  - Menyembunyikan Header Navigation (Navbar di bagian atas) **HANYA** saat pengguna mengakses Landing Page KostManager (`/kostmanager` atau `/kost-manager`).
  - **Pengecualian & Keutuhan Halaman Lain**:
    - Halaman **"Jadi Mitra / Mitra Kost"** pada tampilan pengguna umum (`Page.OWNER` / `/owner` atau `/mitra`) **TETAP menampilkan Header Navigation** normal seperti biasa.
    - Halaman umum lainnya (*Cari Kost, Jasa Survey, Data Kost, Beranda, Profil, dll.*) **TETAP menampilkan Header Navigation** normal tanpa perubahan.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/App.tsx` | 1. Definisikan kondisi spesifik `isKostManagerPage` yang hanya aktif pada rute `/kostmanager` dan `/kost-manager`.<br>2. Perbarui render `<Navbar />` agar disembunyikan saat `isKostManagerPage === true`.<br>3. Memastikan rute `Page.OWNER` (`/owner`), rute umum, dan rute lainnya tidak terpengaruh dan tetap menampilkan `<Navbar />`. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Modifikasi Kondisi di `App.tsx`
- Di dalam komponen `App`:
  - Definisikan `isKostManagerPage`:
    ```typescript
    const isKostManagerPage = [
      Page.KOSTMANAGER,
      '/kost-manager',
      '/kostmanager'
    ].some(p => location.pathname === p || location.pathname.startsWith(`${p}/`));
    ```
  - Pastikan `<Navbar />` dirender dengan kondisi:
    ```tsx
    {!isDashboardPage && !isKostManagerPage && (
      <Navbar
        activePage={location.pathname as Page}
        onPageChange={(page) => {
          navigate(page);
          setPendingTransaction(null);
        }}
        user={user}
        onLogout={handleLogout}
        hideBottomNav={hideNavbar}
        hideNavLinks={location.pathname.startsWith(Page.DASHBOARD_MITRA)}
      />
    )}
    ```
  - Pastikan halaman `Page.OWNER` (`/owner` / menu "Jadi Mitra") **tetap menampilkan Navbar** karena `isKostManagerPage` bernilai `false` untuk rute tersebut.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` di folder `functions/public` untuk memastikan 0 error kompilasi.
2. **Verifikasi Kasus Uji**:
   - **Kasus 1 (KostManager)**: Buka `/kostmanager` $\rightarrow$ Header navigation atas **tidak muncul**, halaman bersih dengan navigasi internal `← KEMBALI KE DASHBOARD MITRA`.
   - **Kasus 2 (Menu Mitra Kost User)**: Buka `/owner` (menu "Jadi Mitra" di navbar user) $\rightarrow$ Header navigation atas **tetap muncul normal**.
   - **Kasus 3 (Halaman Lain)**: Buka `/`, `/listings`, `/products`, `/survey-service` $\rightarrow$ Header navigation **tetap muncul normal**.
