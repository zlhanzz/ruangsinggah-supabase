# Rencana Implementasi (Implementation Plan): Penghapusan Header Kecil Top Bar pada Menu Profil

## 1. Analisis Kebutuhan & Masalah

### A. Masalah & Konteks
- Pada tampilan awal **Profile Hub (`/profile`)**, terdapat baris header kecil di bagian atas yang memuat logo *"RuangSinggah.id"* beserta tombol aksi cepat (Lonceng Notifikasi & Icon Tanda Tanya Bantuan).
- Pengguna meminta agar **header kecil ini dihapus** sehingga tampilan halaman profil langsung menampilkan Kartu Profil Pengguna (Main Profile Card) dengan layout yang lebih bersih, fokus, dan rapi.

---

## 2. Dampak Perubahan (File yang Terpengaruh)

| No | File | Perubahan |
|---|---|---|
| 1 | `functions/public/pages/Profile.tsx` | Menghapus elemen top bar header kecil (`TOP BAR HEADER (Mobile/Desktop Title)`) pada tampilan `Profile Hub`. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Pasca-Approval)

1. **Modifikasi `Profile.tsx`**:
   - Menghapus blok JSX `<div className="flex items-center justify-between mb-5">...</div>` yang berisi logo dan tombol icon di bagian atas view `hub`.
2. **Kompilasi & Pengujian**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan 0 error kompilasi.
3. **Pencatatan Progres & Walkthrough**:
   - Menambahkan catatan ke `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
   - Melakukan git commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Kompilasi**: `npm run build` berhasil 100%.
- [ ] **Verifikasi Tampilan UI**: Membuka `/profile` di browser dan memastikan header kecil di atas kartu profil sudah tidak muncul lagi.
