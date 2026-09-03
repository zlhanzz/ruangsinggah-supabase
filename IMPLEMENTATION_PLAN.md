# IMPLEMENTATION PLAN: Integrasi & Pembukaan Akses Landing Page KostManager bagi Pemilik Kost

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Pada pembaharuan isolasi role sebelumnya, rute `Page.KOSTMANAGER` (`/kostmanager`) dimasukkan ke dalam daftar rute publik yang otomatis di-redirect ke `Page.DASHBOARD_MITRA` (`/dashboard-mitra`).
  - Akibatnya, ketika Pemilik Kost di dalam Dashboard Mitra mengklik banner / modal popup promo KostManager ("*Pelajari Sekarang ↗*") atau ingin mempelajari program KostManager, mitra langsung terlempar (*kicked back*) kembali ke Dashboard Mitra dan tidak dapat membaca halaman edukasi maupun mendaftarkan propertinya ke paket KostManager.
  - Selain itu, diperlukan tautan/tombol kembali yang jelas di dalam `KostManagerLanding.tsx` (*← Kembali ke Dashboard Mitra*) serta kartu akses cepat di sidebar `MitraDashboard.tsx` agar mitra dapat mengeksplorasi layanan KostManager kapan saja.
- **Tujuan Pengembangan**:
  - Membuka akses rute `Page.KOSTMANAGER` (`/kostmanager`) bagi user dengan peran Pemilik Kost (`role === 'owner'`).
  - Menyesuaikan tombol kembali di `KostManagerLanding.tsx` agar mengarahkan mitra secara mulus kembali ke Dashboard Mitra.
  - Menyematkan kartu pintasan program KostManager di sidebar `MitraDashboard.tsx` dan memastikan tombol *"Pelajari Sekarang ↗"* pada popup iklan promo bekerja 100% lancar.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/App.tsx`:
    - Menghapus `Page.KOSTMANAGER` dari array `publicUserPages` di `fetchUserData()`.
    - Membuka `<Route path={Page.KOSTMANAGER} element={<KostManagerLanding user={user} onBack={() => navigate(user?.role === 'owner' ? Page.DASHBOARD_MITRA : Page.HOME)} />} />` agar dapat diakses oleh semua role tanpa redirect paksa.
  - `functions/public/pages/KostManagerLanding.tsx`:
    - Memperbarui fungsi `handleGoBack` dan tombol kembali di bagian atas agar secara cerdas menampilkan label `← Kembali ke Dashboard Mitra` jika diakses oleh pemilik kost.
  - `functions/public/pages/MitraDashboard.tsx`:
    - Menambahkan kartu pintasan *KostManager Auto-Pilot* di bagian bawah sidebar desktop & mobile.
    - Memastikan trigger popup promo KostManager membuka rute `Page.KOSTMANAGER` tanpa kendala.

---

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Konfigurasi Rute di `App.tsx`**:
   - Menghapus `Page.KOSTMANAGER` dari proteksi blacklist rute owner di `fetchUserData()`.
   - Mengubah elemen rute `Page.KOSTMANAGER` agar merender `<KostManagerLanding user={user} />` secara langsung.
2. **Penyempurnaan Navigasi di `KostManagerLanding.tsx`**:
   - Memastikan `isMitra` (`user?.role === 'owner' || user?.role === 'mitra'`) mengarahkan `handleGoBack` ke `Page.DASHBOARD_MITRA`.
   - Menampilkan label tombol `← Kembali ke Dashboard Mitra` pada header landing page.
3. **Penyematan Pintasan di `MitraDashboard.tsx`**:
   - Menambahkan kartu promo/edukasi *KostManager Auto-Pilot* di sidebar Mitra Dashboard.
   - Menguji alur tombol popup promo *"Pelajari Sekarang ↗"*.
4. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
5. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 305 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Melakukan login sebagai akun Pemilik Kost (`owner`):
  - Membuka Dashboard Mitra (`/dashboard-mitra`).
  - Mengklik tombol *"Pelajari Sekarang ↗"* pada popup promo KostManager $\rightarrow$ Verifikasi halaman `/kostmanager` terbuka dengan lengkap.
  - Memverifikasi tombol `← Kembali ke Dashboard Mitra` di bagian atas landing page mengembalikan mitra ke `/dashboard-mitra`.
  - Menguji kartu pintasan KostManager di sidebar desktop dan drawer mobile.
