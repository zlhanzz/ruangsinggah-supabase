# Walkthrough: Penayangan Berkelanjutan Pop-Up Iklan KostManager Setiap Kali Masuk Menu "Kost Saya" atau "Beranda"

## Ringkasan Perubahan
Fitur promosi KostManager pada akun mitra biasa telah disempurnakan agar **selalu muncul secara otomatis dalam bentuk iklan pop-up modal interaktif setiap kali mitra masuk atau berpindah ke menu "Kost Saya" maupun menu "Beranda"** di Dashboard Mitra (`/mitra`), memberikan visibilitas promosi yang optimal dan berkelanjutan.

---

## 1. Detail Implementasi

### A. Pembaruan Reaktif Navigasi Menu di [`MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx)
1. **Hook Reaktif `useEffect` pada `activeMenu`**:
   - Memantau perubahan menu aktif. Begitu mitra berada pada tab `overview` (Beranda) atau `properties` (Kost Saya) dan berstatus non-KostManager (`!isKostManager`), pop-up iklan KostManager otomatis langsung dibuka:
     ```ts
     useEffect(() => {
         if (!isKostManager && (activeMenu === 'overview' || activeMenu === 'properties')) {
             setShowPromoPopup(true);
         }
     }, [activeMenu, isKostManager]);
     ```
2. **Pemicu Langsung pada Klik Menu (`handleMenuChange`)**:
   - Ketika mitra mengklik tombol menu *Beranda* atau *Kost Saya* (baik dari sidebar desktop maupun mobile navigation), pop-up iklan KostManager dipicu seketika:
     ```ts
     const handleMenuChange = (menu: MenuKey) => {
         if (!isKostManager && (menu === 'overview' || menu === 'properties')) {
             setShowPromoPopup(true);
         }
         navigate(`${Page.DASHBOARD_MITRA}/${menu}`);
     };
     ```
3. **Penyederhanaan `handleClosePromoPopup`**:
   - Menutup pop-up saat tombol silang `X`, *"Nanti Saja"*, backdrop, atau tombol `Escape` ditekan (`setShowPromoPopup(false)`), tanpa memblokir pembukaan kembali saat berpindah menu berikutnya.

---

## 2. Hasil Pengujian & Kompilasi

- **Kompilasi Frontend Vite**:
  ```bash
  cmd /c npm run build (di functions/public)
  ```
  **Status**: `✓ 2511 modules transformed. ✓ built in 35.91s` (**0 Error, 0 Warning Kritis**).

---

## 3. Panduan Pengujian untuk Pengguna (User Testing Steps)

1. **Buka Dashboard Mitra (Beranda)**:
   - Akses `/mitra` atau `/mitra/overview`.
   - **Pop-up modal iklan KostManager langsung muncul secara otomatis di tengah layar**.
2. **Tutup Pop-Up**:
   - Klik tombol silang **`X`** di sudut kanan atas (atau tombol *"Nanti Saja"* / klik backdrop). Modal tertutup seketika.
3. **Pindah ke Menu "Kost Saya"**:
   - Klik menu **Kost Saya** (`/mitra/properties`).
   - **Pop-up iklan KostManager langsung muncul kembali secara otomatis**.
4. **Pindah ke Menu Lain (misal "Pemesanan" / "Dompet")**:
   - Klik menu **Pemesanan** atau **Dompet & Pendapatan**.
   - Pop-up tidak menghalangi menu operasional ini.
5. **Kembali ke Menu "Beranda" atau "Kost Saya"**:
   - Klik kembali menu **Beranda** atau **Kost Saya**.
   - **Pop-up iklan KostManager akan selalu terus muncul kembali secara konsisten**.
