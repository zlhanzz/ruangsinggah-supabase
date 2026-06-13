# WALKTHROUGH — Perbaikan Penyelarasan State Global & Penyimpanan Draft Mitra

**Tanggal:** 13 Juni 2026  
**Fitur:** State Sync Global & Pembebanan Awal Mitra (Mitra State Synchronization)

---

## 1. Daftar Perubahan

### ✅ `functions/public/App.tsx`
- **Pemuatan Paralel `referred_by`**:
  - Memperbarui `fetchUserData` untuk memuat data dari tabel `mitra` di database secara paralel bersamaan dengan tabel `users`, `user_verifications`, dan `user_bank_accounts`.
  - Menggabungkan kolom `referred_by` ke dalam global state `user` (`safeUser`) sehingga Kode Referral dapat dimuat secara benar oleh seluruh komponen aplikasi sejak awal.
- **Event Listener Pembaruan Profil Global**:
  - Menambahkan listener `RS_USER_UPDATED` pada Window object untuk mendeteksi perubahan profil yang terjadi di halaman sub-screen (seperti draf/simpan di `MitraProfile.tsx`) dan memicu pemanggilan ulang `fetchUserData` secara langsung tanpa me-refresh halaman web.

### ✅ `functions/public/pages/MitraProfile.tsx`
- **Pemicu `loadProfile` Tanpa Syarat**:
  - Mengubah siklus hook `useEffect` saat inisialisasi agar selalu memicu `loadProfile()` saat komponen dimuat (menghapus blok `if (!initialUser)`). Ini menjamin data mutakhir dari database (termasuk status referral terbaru) selalu termuat dengan benar.
- **Pengiriman Event Sinkronisasi**:
  - Mengirimkan event global `window.dispatchEvent(new Event('RS_USER_UPDATED'))` ketika draf Step 1 berhasil disimpan (`saveStep1Draft`) maupun ketika simpan akhir diselesaikan (`handleSave`). Ini memicu pembaruan state user di `App.tsx` secara instan, menyinkronkan data sidebar dashboard, header, dan isian formulir.

---

## 2. Hasil Pengujian
- Semua komponen terkompilasi bersih tanpa ada error TypeScript.
- Klik tombol "Lanjutkan" pada form edit profil berhasil menyimpan draf ke database Supabase dan secara instan menyinkronkan state global aplikasi.

---

## 3. Petunjuk Deploy
Jalankan perintah berikut untuk menguji/mendeploy aplikasi:

```bash
# 1. Melakukan build produksi lokal
npm run build

# 2. Deploy ke hosting Firebase
firebase deploy --only hosting
```
