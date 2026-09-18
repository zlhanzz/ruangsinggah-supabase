# Rencana Implementasi: Perbaikan Posisi Vertikal & Z-Index Floating Chat FAB di Atas Navbar

Dokumen perencanaan ini disusun untuk menindaklanjuti temuan pengguna pada tampilan mobile, di mana tombol melayang (*Floating Action Button / FAB*) Chat di sudut kanan bawah tertutup separuh bagian oleh Bottom Navigation Bar.

---

## 1. Analisis Masalah

1. **Akar Masalah Posisi Vertikal**:
   - Tombol FAB sebelumnya menggunakan class `bottom-24` (setara dengan `6rem` atau 96px).
   - Bottom Navigation Bar mobile memiliki total tinggi elemen mencapai 95px – 130px karena memuat padding, icon kartu menu, teks label, serta `pb-safe` (`env(safe-area-inset-bottom)` untuk area navigasi gestur HP modern).
   - Akibatnya, tombol setinggi 56px (`w-14 h-14`) yang ditempatkan pada 96px dari dasar layar mengalami tabrakan dengan bagian atas navbar.
2. **Akar Masalah Z-Index Stacking**:
   - Bottom Navigation Bar memiliki class `z-50`.
   - Tombol FAB sebelumnya memiliki class `z-40`.
   - Karena `z-40` lebih rendah daripada `z-50`, lapisan navbar merender di atas tombol chat, sehingga separuh bagian bawah tombol chat terpotong dan tertutup oleh latar belakang putih navbar.

---

## 2. Solusi yang Direncanakan

1. **Peningkatan Ketinggian Vertikal Mengikuti Safe Area**:
   - Mengubah posisi vertikal tombol FAB menjadi:
     `bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-32` (atau jarak elevasi aman yang menjamin celah minimal 12–16px di atas garis batas navbar).
   - Dengan menyertakan `env(safe-area-inset-bottom,0px)`, tombol akan otomatis naik jika perangkat pengguna memiliki notch / gesture bar bawah, sehingga tidak akan pernah bertabrakan dengan navbar di perangkat apa pun.
2. **Koreksi Z-Index Stacking Context**:
   - Mengubah z-index tombol FAB dari `z-40` menjadi **`z-[60]`** (lebih tinggi daripada navbar `z-50`).
   - Hal ini menjamin tombol selalu berada di lapisan teratas antarmuka mobile.
3. **Penyempurnaan Visual & Estetika**:
   - Memastikan lingkaran FAB berdiameter 56px, ikon `<MessageSquare size={24} />`, dan badge unread counter tampil 100% utuh mengambang (*floating*) tepat di atas tab "Profil" dengan bayangan (*glow shadow*) oranye yang tajam.

---

## 3. Dampak Perubahan

File yang akan dimodifikasi:
- `functions/public/pages/MitraDashboard.tsx`:
  - Mengubah class FAB button dari `bottom-24 right-5 z-40` menjadi `bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))] right-5 z-[60]`.
- `functions/PROGRESS.md`: Pencatatan progres entri baru (#425).
- `WALKTHROUGH.md`: Dokumentasi perbaikan dan panduan verifikasi.

---

## 4. Langkah-Langkah Eksekusi (FASE 2 Setelah di-ACC)

1. **Modifikasi Kode di `MitraDashboard.tsx`**:
   - Perbarui class tombol FAB Chat mobile agar menggunakan elevasi adaptif `bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px))]` dan `z-[60]`.
2. **Pengujian Build Frontend**:
   - Jalankan `npm.cmd run build` di `functions/public` untuk memastikan kelulusan 100% tanpa error kompilasi.
3. **Pencatatan Dokumen & Git Push**:
   - Perbarui `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Tampilan Mobile**:
   - Buka `/mitra` pada browser smartphone atau emulator layar mobile.
   - Amati sudut kanan bawah: seluruh bulatan tombol FAB Chat oranye harus melayang bebas **di atas** garis border navbar dengan spasi yang nyaman (tidak terpotong atau tertutup sama sekali).
2. **Uji Interaksi & Z-Index**:
   - Klik tombol FAB: menu chat terbuka dengan mulus.
   - Klik tab menu lain pada navbar: navbar tetap berfungsi normal tanpa hambatan.
