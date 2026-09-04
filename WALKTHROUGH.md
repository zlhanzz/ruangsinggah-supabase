# WALKTHROUGH - Progres 319: Pengendalian & Pembatasan Frekuensi Popup Promo KostManager di Dashboard Mitra

## 📋 Ringkasan Perubahan
Memperbaiki mekanisme kemunculan modal popup promosi KostManager (*"Gak Punya Waktu Kelola Kost? Upgrade ke KostManager!"*) di Dashboard Mitra (`MitraDashboard.tsx`) agar tidak lagi muncul secara agresif/mengganggu, tidak muncul saat mitra masih dalam tahap verifikasi identitas, dan hanya muncul sesekali (maksimal 1x per 24 jam) saat mitra berada di Flow 2 (Kelola Properti / Upload Kost).

---

## 🛠️ Detail Perubahan Kode

### 1. `functions/public/pages/MitraDashboard.tsx`
- **Pengecekan Status Verifikasi Lebih Dini**:
  Memindahkan deklarasi status verifikasi mitra ke level atas komponen:
  ```typescript
  const isVerified = user?.verification_status === 'verified';
  ```
- **Fungsi Penutup Terpusat dengan Penyimpanan Timestamp**:
  Menambahkan `handleClosePromoPopup` untuk menutup popup sekaligus mencatat timestamp penutupan ke `localStorage` dengan key `km_promo_popup_last_shown_${uid || 'guest'}`:
  ```typescript
  const handleClosePromoPopup = useCallback(() => {
      setShowPromoPopup(false);
      try {
          const storageKey = `km_promo_popup_last_shown_${uid || 'guest'}`;
          localStorage.setItem(storageKey, String(Date.now()));
      } catch { }
  }, [uid]);
  ```
- **Filter Evaluasi & Cooldown 24 Jam**:
  Menyempurnakan `useEffect` pemicu pop-up dengan 3 gerbang validasi:
  1. *Abaikan jika setting popup tidak aktif di database:* `if (!setting?.is_active) return;`
  2. *Abaikan jika mitra belum lolos verifikasi:* `if (!isVerified) return;`
  3. *Abaikan jika bukan di Flow 2 (Kelola Properti):* `if (tab !== 'properties') return;`
  4. *Evaluasi Cooldown 24 Jam:* Jika selisih waktu `now - lastShown < 24 jam`, popup tidak akan ditampilkan.
- **Konsistensi Seluruh Tombol Aksi & Penutup**:
  - Tombol Close melayang `[X]` sudut kanan atas $\rightarrow$ memanggil `handleClosePromoPopup`.
  - Tombol `[Nanti Saja]` $\rightarrow$ memanggil `handleClosePromoPopup`.
  - Tombol `[Pelajari Sekarang]` $\rightarrow$ memanggil `handleClosePromoPopup` sebelum redirect.
  - Tombol keyboard `Escape` $\rightarrow$ memanggil `handleClosePromoPopup`.

---

## 🧪 Hasil Pengujian & Kompilasi
Kompilasi TypeScript dan bundling Vite dijalankan:
```bash
npm run build
```
**Hasil**:
- `vite v6.4.1 building for production...`
- `✓ 2509 modules transformed.`
- Output sinkron ke `public/` dan `functions/public/dist/`.
- **Status: 0 Error, 100% Lulus**.

---

## 🧭 Panduan Verifikasi Pengguna
1. **Skenario 1 (Mitra Belum Terverifikasi / Dalam Proses Verifikasi)**:
   - Login sebagai mitra yang `verification_status !== 'verified'`.
   - Buka Beranda Mitra atau klik tab Verifikasi Identitas.
   - **Hasil**: Popup KostManager **TIDAK AKAN PERNAH MUNCUL**, proses verifikasi mitra nyaman dan bebas distraksi.
2. **Skenario 2 (Mitra Terverifikasi Membuka Beranda / Tab Lain)**:
   - Login sebagai mitra yang sudah `verified`.
   - Navigasi di tab Ringkasan/Beranda, Transaksi, Survey, atau Akun.
   - **Hasil**: Popup **TIDAK MUNCUL**.
3. **Skenario 3 (Mitra Terverifikasi Masuk ke Flow 2 / Kelola Kost)**:
   - Klik tab **Kelola Kost** (`tab=properties`).
   - **Hasil**: Popup muncul 1 kali sebagai rekomendasi fitur KostManager.
   - Klik tombol `[X]` atau `[Nanti Saja]`.
   - Coba berpindah-pindah tab dan kembali klik Kelola Kost.
   - **Hasil**: Popup **TIDAK AKAN MUNCUL KEMBALI** karena tersimpan cooldown 24 jam di `localStorage`.
