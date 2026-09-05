# Rencana Implementasi (Implementation Plan): Integrasi Fitur "Kost Favorit Saya" pada Menu Profil

## 1. Analisis Kebutuhan & Masalah

### A. Masalah & Konteks
1. **Fungsi Simpan Sudah Ada**:
   - Di halaman detail kost (`KostDetail.tsx`), sudah terdapat tombol **"Simpan" / "Tersimpan"** yang menyimpan ID kost ke `localStorage` dengan key `ruangsinggah_saved_kosts`.
2. **Kebutuhan yang Belum Tersedia**:
   - Tombol **"Kost Favorit Saya"** pada menu Profil (`/profile`) saat ini belum memiliki halaman atau sub-view untuk menampilkan daftar kost yang telah disimpan oleh pengguna.
3. **Solusi yang Dibutuhkan**:
   - Menghubungkan menu "Kost Favorit Saya" di `Profile.tsx` agar membuka **Sub-view Kost Favorit Saya** (`viewMode === 'favorites'`).
   - Mengambil detail properti dari database/cache berdasarkan ID yang ada di `ruangsinggah_saved_kosts`.
   - Menampilkan grid kartu properti kost tersimpan, live counter badge pada menu profil ("2 Kost", dsb.), serta *Empty State* jika belum ada kost yang disimpan lengkap dengan tombol navigasi `← Kembali ke Menu Profil`.

---

## 2. Dampak Perubahan (File yang Terpengaruh)

| No | File | Perubahan |
|---|---|---|
| 1 | `functions/public/favoriteService.ts` | **(File Baru)** Helper modular untuk membaca, menyimpan, menghapus ID favorit dari `ruangsinggah_saved_kosts`, serta query data properti favorit dari Supabase. |
| 2 | `functions/public/pages/Profile.tsx` | Menambahkan sub-view `favorites` pada halaman Profil, menampilkan grid listing kost favorit, live badge counter jumlah kost tersimpan, empty state, dan tombol navigasi `← Kembali ke Menu Profil`. |
| 3 | `functions/public/pages/KostDetail.tsx` | Menyelaraskan penyimpanan `ruangsinggah_saved_kosts` melalui `favoriteService.ts` dan memicu event reaktif. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Pasca-Approval)

1. **Pembuatan `favoriteService.ts`**:
   - `getSavedKostIds(): string[]` (membaca dari `ruangsinggah_saved_kosts`).
   - `toggleSaveKost(kostId: string): boolean` (menambah/menghapus ID dan memancarkan event `rs_favorites_updated`).
   - `fetchSavedProperties(): Promise<Kost[]>` (mengambil data properti terpublikasi berdasarkan ID dari Supabase / cache).
2. **Implementasi Sub-view "Kost Favorit Saya" di `Profile.tsx`**:
   - State `viewMode: 'hub' | 'edit_personal_data' | 'favorites'`.
   - Live badge counter pada baris menu "Kost Favorit Saya" di hub profil (misal: `<span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-black">2 Kost</span>`).
   - Render Grid Kartu Kost Favorit menggunakan komponen `KostCard` yang sudah dioptimasi.
   - Tombol navigasi `← Kembali ke Menu Profil` di bagian atas.
   - Empty State informatif jika belum ada kost tersimpan dengan tombol CTA menuju `/listings`.
3. **Penyelarasan `KostDetail.tsx`**:
   - Memastikan toggle save memancarkan event `rs_favorites_updated` agar badge counter di profil langsung ter-update otomatis.
4. **Kompilasi & Pengujian**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan 0 error kompilasi.
5. **Pencatatan Progres & Walkthrough**:
   - Menambahkan catatan ke `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Kompilasi**: `npm run build` berhasil 100%.
- [ ] **Simpan Kost**: Buka salah satu kost di detail `/kost/:id`, klik tombol **Simpan** ➔ kost tersimpan.
- [ ] **Buka Kost Favorit Saya**: Buka menu **Profil (`/profile`)** ➔ terlihat badge angka jumlah kost favorit ➔ klik **"Kost Favorit Saya"** ➔ terbuka sub-view dengan daftar kost yang tersimpan.
- [ ] **Navigasi & Interaksi**: Klik salah satu kartu favorit untuk membuka detailnya, atau klik `← Kembali ke Menu Profil`.
