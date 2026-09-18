# Rencana Implementasi: Penyelarasan Z-Index Pop-Up Promo KostManager & Lapisan Blur FAB Chat

Dokumen perencanaan ini disusun untuk menyelesaikan anomali visual pada saat Pop-Up Iklan Promosi KostManager muncul di layar mobile, di mana tombol melayang (*Floating Action Button / FAB*) Chat tampil menembus ke depan modal dan tidak ikut ter-blur di balik lapisan backdrop overlay.

---

## 1. Analisis Masalah

1. **Akar Masalah Z-Index Stacking**:
   - Komponen modal pop-up iklan promosi KostManager (`showPromoPopup`) pada [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx#L3883) saat ini menggunakan class `z-50`:
     ```tsx
     className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
     ```
   - Tombol melayang (FAB) Chat sebelumnya telah ditingkatkan ke `z-[60]` agar melayang di atas bottom navigation bar (`z-50`).
   - Karena nilai `z-[60]` milik tombol Chat lebih tinggi daripada `z-50` milik overlay pop-up promosi, tombol Chat dirender di atas modal dan menembus lapisan backdrop blur, bukannya berada di belakang dan ikut ter-blur bersama navbar dan konten halaman.

2. **Standar Modal di Workspace**:
   - Seluruh modal overlay layar penuh lainnya di `MitraDashboard.tsx` (seperti Modal Edit Rekening Bank `isEditingBank`, Modal Laporan Keuangan `selectedKostForFinance`, dan Mobile Sidebar Drawer) menggunakan standar lapisan **`z-[100]`**.
   - Menyamakan pop-up promosi KostManager ke standar `z-[100]` akan menempatkan seluruh lapisan backdrop gelap (`bg-black/75`) dan efek *frosted glass* (`backdrop-blur-md`) di atas tombol Chat (`z-[60]`) dan navbar (`z-50`).

---

## 2. Solusi yang Direncanakan

1. **Peningkatan Z-Index Modal Promosi KostManager ke `z-[100]`**:
   - Mengubah class kontainer overlay pop-up promosi di [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx#L3883):
     ```diff
     - className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
     + className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
     ```
2. **Efek Visual yang Dihasilkan**:
   - Ketika pop-up promosi KostManager aktif, lapisan latar belakang hitam transparan dengan efek `backdrop-blur-md` akan menyelimuti seluruh layar mobile, termasuk tombol FAB Chat dan Bottom Navigation Bar.
   - Tombol Chat akan berada di belakang modal, ter-blur halus dan meredup secara serasi bersama elemen latar lainnya, sehingga kartu promosi KostManager menjadi satu-satunya fokus interaksi di depan.
   - Ketika pop-up ditutup (via tombol close silang X, tombol "Nanti Saja", atau klik backdrop), tombol Chat dan navbar kembali aktif di lapisan depan seperti biasa.

---

## 3. Dampak Perubahan

File yang akan dimodifikasi:
- `functions/public/pages/MitraDashboard.tsx`:
  - Mengubah z-index modal pop-up promosi KostManager dari `z-50` menjadi `z-[100]`.
- `functions/PROGRESS.md`: Pencatatan progres entri baru (#426).
- `WALKTHROUGH.md`: Dokumentasi hasil perbaikan dan bukti pengujian.

---

## 4. Langkah-Langkah Eksekusi (FASE 2 Setelah di-ACC)

1. **Modifikasi Kode `MitraDashboard.tsx`**:
   - Ganti `z-50` pada kontainer overlay `showPromoPopup` menjadi `z-[100]`.
2. **Pengujian Build Frontend**:
   - Jalankan kompilasi `npm.cmd run build` di direktori `functions/public` untuk memastikan 0 error kompilasi.
3. **Pencatatan Dokumen & Git Push**:
   - Perbarui `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Tampilan saat Pop-Up Promosi Muncul**:
   - Buka dashboard mitra pada mode mobile emulator / HP sehingga pop-up promosi KostManager muncul.
   - Amati sudut kanan bawah: tombol melayang (FAB) Chat kini berada **di belakang** lapisan gelap dan ter-blur bersama navbar dan konten halaman. Tombol tidak lagi menembus ke depan modal.
2. **Uji Penutupan Pop-Up**:
   - Klik tombol silang `X` atau tombol *"NANTI SAJA"*.
   - Pop-up tertutup dengan mulus, dan tombol FAB Chat oranye kembali tajam dan melayang di atas navbar siap untuk diklik.
