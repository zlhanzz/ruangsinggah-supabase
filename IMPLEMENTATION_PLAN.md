# Rencana Implementasi: Floating Mobile Header Anti-Scroll & Ikon Chat Gaya Messenger

Dokumen perencanaan ini disusun untuk merealisasikan permintaan pengguna terkait perbaikan posisi header mobile agar melayang (*floating* dan tidak ikut ter-scroll saat isi halaman digeser) serta mengganti ikon pesan menjadi ikon gaya **Messenger** yang menonjol dan mudah dikenali (*easy to notice*).

---

## 1. Analisis Masalah & Kebutuhan

### A. Header Mobile Masih Ikut Ter-scroll
1. **Penyebab**:
   - Header mobile sebelumnya menggunakan class `sticky top-0 z-40`.
   - Pada hierarki DOM [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx), elemen pembungkus utama memiliki class `overflow-x-hidden` (`<div className="flex-1 lg:ml-64 xl:ml-72 flex flex-col min-h-screen overflow-x-hidden">`).
   - Dalam spesifikasi CSS browser modern (Chrome, Safari, Edge), properti `overflow: hidden` atau `overflow-x: hidden` pada elemen leluhur (ancestor) membatalkan konteks viewport dari `position: sticky`. Hal ini menyebabkan header tetap dianggap bagian dari aliran dokumen biasa dan ikut tergulung (scrolled away) saat pengguna melakukan scroll pada konten body.
2. **Solusi**:
   - Mengubah posisi header mobile menjadi **`fixed top-0 left-0 right-0 z-40`** (atau `fixed top-0 inset-x-0 z-40 lg:hidden`).
   - Dengan `position: fixed`, header akan terikat langsung ke layar viewport mobile, **100% kebal terhadap scroll body** dan tidak terpengaruh oleh properti `overflow` milik kontainer induk.
   - Menambahkan offset padding atas (`pt-20 lg:pt-8`) pada elemen kontainer konten `<main>` agar bagian teratas konten (seperti kartu *"Selamat Datang Kembali"* atau banner verifikasi) tidak tertimpa/tertutup oleh header yang melayang.
   - Mempertahankan efek visual *frosted glass* modern (`bg-white/90 backdrop-blur-md border-b border-gray-100/80 shadow-xs`).

---

### B. Ikon Pesan/Chat Kurang Menarik & Sulit Dikenali (Noticed)
1. **Penyebab**:
   - Ikon sebelumnya menggunakan kotak tumpul oranye lembut dengan outline tipis `<MessageSquare size={19} />` yang terlihat seperti ikon komentar atau dokumen biasa, sehingga kurang mencolok dan kurang cepat diasosiasikan dengan pesan instan.
2. **Solusi**:
   - Mengganti tombol pesan di pojok kanan atas header dengan **Ikon Messenger**:
     - Menggunakan bentuk siluet balon pesan khas dengan petir diagonal di tengahnya (*speech bubble with lightning bolt*).
     - Menggunakan gradasi warna ikon khas aplikasi Messenger (*Messenger vibrant gradient* dari biru ke ungu-magenta atau gradasi cerah yang tajam dan kontras) agar langsung memikat mata pengguna saat pertama kali membuka halaman.
     - Membungkusnya dalam tombol lingkaran modern (*circular button* `w-10 h-10 rounded-full bg-gray-100/80 hover:bg-gray-200/80 active:scale-95`) yang identik dengan tata letak header aplikasi sosial media/chat modern.
     - Menyertakan badge notifikasi merah cerah (`bg-rose-500`) dengan animasi pulse halus jika ada pesan yang belum dibaca (`chatUnreadCount > 0`).

---

## 2. Dampak Perubahan

File yang akan disentuh dalam pekerjaan ini:
- `functions/public/pages/MitraDashboard.tsx`:
  - Mengubah class styling `<header>` mobile menjadi `fixed top-0 inset-x-0 z-40 lg:hidden`.
  - Menambahkan padding top kompensasi pada kontainer konten `<main className="flex-1 p-4 pt-20 lg:p-8 ...">`.
  - Mengganti komponen tombol chat menjadi circular button dengan vector SVG murni Messenger icon bergradasi.
- `functions/PROGRESS.md`: Pencatatan riwayat progres entri baru (#423).
- `WALKTHROUGH.md`: Dokumentasi hasil perubahan dan panduan verifikasi.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 Setelah di-ACC)

1. **Modifikasi Header & Tombol Chat di `MitraDashboard.tsx`**:
   - Definisikan komponen vector SVG Messenger murni (tanpa external dependency font CDN, 100% bebas FOUT).
   - Perbarui elemen `<header className="lg:hidden fixed top-0 inset-x-0 h-16 bg-white/90 backdrop-blur-md border-b border-gray-100/80 flex items-center justify-between px-4 z-40 shadow-xs transition-all">`.
   - Perbarui kontainer `<main>` dengan offset `pt-20 lg:pt-8` agar jarak antar elemen tetap proporsional dan tidak terpotong.
   - Render tombol Messenger circular dengan unread badge.
2. **Kompilasi & Build Frontend**:
   - Jalankan `npm.cmd run build` di direktori `functions/public` untuk memastikan 0 error TypeScript/Vite.
3. **Pencatatan Dokumen & Git Commit**:
   - Perbarui `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Lakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Scroll Viewport Mobile**:
   - Buka dashboard mitra pada mode mobile emulator / smartphone.
   - Gulir/scroll halaman hingga ke bawah. Header harus tetap menempel di posisi paling atas layar (fixed) tanpa bergeser 1 piksel pun, sementara konten body mengalir mulus di bawahnya dengan efek blur semi-transparan.
2. **Uji Tampilan Ikon Messenger**:
   - Ikon di kanan atas menampilkan bentuk gelembung pesan dengan petir khas Messenger yang kontras dan mudah dikenali.
   - Klik tombol: navigasi langsung membuka tab Chat / Pesan Masuk secara instan.
3. **Uji Bebas Tumpang Tindih (No Overlap)**:
   - Pastikan kartu greeting *"Selamat Datang Kembali"* berada tepat di bawah header dengan jarak spasi yang nyaman (tidak tertutup oleh header).
