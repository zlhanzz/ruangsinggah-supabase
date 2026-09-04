# Rencana Implementasi: Pengendalian & Pembatasan Frekuensi Popup KostManager di Dashboard Mitra

## 1. Analisis Masalah & Kebutuhan
- **Masalah dari Keluhan Pengguna**:
  1. **Tampil di Tahap yang Salah**: Pop-up promosi program KostManager saat ini muncul bahkan saat mitra masih dalam tahap awal (verifikasi identitas). Hal ini membingungkan dan mengganggu fokus mitra yang sedang memverifikasi akunnya.
  2. **Muncul Berulang Setiap Saat**: Setiap kali mitra mengklik menu "Beranda" atau "Kelola Kost", pop-up promosi tersebut selalu muncul kembali tanpa henti karena `useEffect` memicunya tanpa pengecekan riwayat penutupan (*dismiss history*).
- **Kebutuhan Pengguna**:
  - Pop-up promosi KostManager **HANYA boleh tampil ketika mitra sudah lolos verifikasi identitas (`isVerified === true`) dan masuk ke Flow 2 (upload/kelola properti kost)**.
  - Jika mitra masih dalam tahap verifikasi identitas (`!isVerified`), pop-up **DILARANG MUNCUL**.
  - Pop-up **CUKUP MUNCUL SESEKALI** (dibatasi maksimal 1x per 24 jam atau 1x per sesi) dan **TIDAK BOLEH muncul terus-menerus setiap kali klik menu atau ganti tab**.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/pages/MitraDashboard.tsx` | 1. Menambahkan validasi syarat verifikasi (`isVerified`) sebelum pop-up diizinkan muncul.<br>2. Menerapkan kontrol frekuensi kemunculan via `localStorage` (timestamp interval 24 jam / sesi) pada `useEffect` inisialisasi pop-up.<br>3. Menyimpan status dismiss saat tombol 'X', 'Nanti Saja', 'Esc', atau 'Pelajari Sekarang' ditekan agar tidak muncul kembali berulang kali saat bernavigasi. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Tambahkan Pemeriksaan Syarat & Frekuensi di `MitraDashboard.tsx`
- Perbarui `useEffect` pemicu pop-up promosi:
  ```tsx
  useEffect(() => {
      getMitraPromoPopupSetting().then(setting => {
          setPromoPopupSetting(setting);
          if (!setting?.is_active) return;

          // Syarat 1: Jangan tampilkan jika masih tahap verifikasi identitas
          if (!isVerified) return;

          // Syarat 2: Hanya izinkan jika masuk ke Flow 2 (Kelola Properti / Upload Kost)
          if (tab !== 'properties') return;

          // Syarat 3: Cek frekuensi kemunculan (cukup sesekali, max 1x per 24 jam)
          const storageKey = `km_promo_popup_last_shown_${uid || 'guest'}`;
          const lastShown = localStorage.getItem(storageKey);
          const now = Date.now();
          const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Jam

          if (!lastShown || (now - Number(lastShown)) > COOLDOWN_MS) {
              setShowPromoPopup(true);
              localStorage.setItem(storageKey, String(now));
          }
      });
  }, [tab, isVerified, uid]);
  ```

### Langkah 2: Buat Handler Penutupan yang Konsisten
- Buat fungsi penutup pop-up:
  ```tsx
  const handleClosePromoPopup = () => {
      setShowPromoPopup(false);
      if (uid) {
          localStorage.setItem(`km_promo_popup_last_shown_${uid}`, String(Date.now()));
      }
  };
  ```
- Terapkan ke tombol `[X]`, tombol `[Nanti Saja]`, event tombol `Esc`, dan navigasi `handlePromoNavigate`.

### Langkah 3: Build & Validasi
- Jalankan `cmd /c npm run build` untuk memverifikasi 0 error kompilasi dan sinkronisasi ke folder `dist` dan `public`.
- Commit ke `bukan-productions`, merge ke `main`, dan push ke GitHub `origin main`.

---

## 4. Rencana Verifikasi

1. **Uji Tahap Verifikasi Identitas (Belum Verified)**:
   - Login dengan akun mitra baru yang belum terverifikasi $\rightarrow$ Buka Beranda/Kelola Kost $\rightarrow$ **Hasil**: Pop-up KostManager **TIDAK MUNCUL sama sekali**.
2. **Uji Flow 2 (Sudah Verified & Buka Kelola Kost)**:
   - Login dengan akun mitra yang sudah terverifikasi $\rightarrow$ Buka tab Kelola Kost $\rightarrow$ **Hasil**: Pop-up muncul 1 kali.
3. **Uji Anti-Spam Navigasi**:
   - Tutup pop-up $\rightarrow$ Klik menu Beranda $\rightarrow$ Klik menu Kelola Kost $\rightarrow$ Klik menu Chat $\rightarrow$ Kembali ke Beranda.
   - **Hasil**: Pop-up **TIDAK MUNCUL LAGI**, alur navigasi berjalan tenang dan lancar.
