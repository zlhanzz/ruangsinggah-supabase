# Rencana Implementasi (Implementation Plan): Rekonstruksi Navigasi Mobile & Arsitektur Menu Profil Mitra

Dokumen perencanaan ini disusun untuk menanggapi permintaan pengguna terkait restrukturisasi tata letak antarmuka mobile Mitra Dashboard dan halaman Profil Mitra agar lebih estetik, efektif, efisien, dan selaras dengan pola UI/UX role user RuangSinggah.

---

## 1. Analisis Masalah & Kebutuhan

### A. Floating Header Mobile & Pemindahan Menu Chat / Pesan Masuk
- **Kebutuhan**:
  - Pada tampilan mobile (layar kecil `< lg`), menu **Pesan / Chat** dipindahkan ke sisi kanan atas **Header Mobile**.
  - Header mobile diubah menjadi **Floating Header** (`sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-gray-100/80 shadow-xs`).
  - Tombol Chat di header dilengkapi dengan badge indikator jumlah pesan belum terbaca (*unread count badge*). Ketika diklik, langsung membuka menu percakapan (`chat`).

### B. Penataan Ulang Bottom Navigation Mobile
- **Kondisi Saat Ini**:
  - Bottom navigation mobile saat ini menampilkan:
    1. Beranda (`overview`)
    2. Pesanan (`bookings`)
    3. Penghuni Aktif (`tenants`)
    4. Pesan (`chat`)
    5. Profil (`profile`)
- **Kebutuhan**:
  - Karena menu **Pesan** telah berpindah ke Floating Header, slot ke-4 pada bottom navigation digantikan oleh menu **"Kelola Kost"** (`properties` / `Home` icon).
  - Susunan Bottom Navigation Mobile baru:
    1. **Beranda** (`overview`)
    2. **Pesanan** (`bookings`)
    3. **Penghuni Aktif** (`tenants`)
    4. **Kelola Kost** (`properties`)
    5. **Profil** (`profile`)
  - Pada halaman Beranda mobile, blok pintas menu lama (`Kelola Kost` dan `Cek Dompet`) yang sebelumnya memakan ruang vertikal dihapus/dibersihkan karena `Kelola Kost` kini telah permanen di bottom nav dan `Cek Dompet` dipindahkan ke halaman Profil.

### C. Rekonstruksi Halaman Profil Mitra (Arsitektur Grouped-Menu ala Role User)
- **Kondisi Saat Ini**:
  - Halaman profil mitra ([MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx)) saat ini menampilkan kartu besar memanjang langsung berisi seluruh kolom biodata diri, dokumen KTP, dan status layanan tanpa menu grouping.
- **Kebutuhan Berdasarkan Referensi Profile Role User (Foto 2)**:
  - Mengadopsi arsitektur **Profile Hub Berkelompok (Grouped Menus)**:
    1. **Header Profil Pengguna**:
       - Avatar foto profil dengan inisial/foto dan badge status verifikasi.
       - Nama mitra & alamat email.
       - Badge role kemitraan: *"✨ Pemilik Kost / Mitra"*.
       - Action Banner Quick Action: *"Data Kontak Pribadi"* `[Lihat / Ubah >]` yang membuka detail profil (dengan proteksi terkunci jika status `pending`).
    2. **Status Verifikasi Identitas**:
       - Menampilkan kartu status verifikasi ringkas & proporsional yang telah diperbaiki sebelumnya.
    3. **Grup Menu 1: KEUANGAN & SALDO KOST (Cek Dompet & Tarik Dana)**:
       - **Tarik Saldo Kost (Cek Dompet)**:
         - Ikon: `<Wallet />` dalam aksen background lembut.
         - Subtitle: *"Pencairan pendapatan sewa, rekening bank & mutasi dana"*.
         - Badge info saldo tersedia: misal `Rp X.XXX.XXX`.
         - Aksi klik: Membuka menu Dompet & Penarikan Dana (`wallet`).
       - **Rekening Penarikan Bank**:
         - Ikon: `<Landmark />`.
         - Subtitle: *"Atur rekening bank tujuan transfer sewa"*.
         - Aksi klik: Membuka pengaturan rekening bank mitra.
    4. **Grup Menu 2: PENGATURAN AKUN & DOKUMEN IDENTITAS**:
       - **Data Profil Lengkap**:
         - Ikon: `<User />`.
         - Subtitle: *"Nama lengkap, nomor WhatsApp, dan alamat domisili"*.
         - Aksi klik: Membuka form/tampilan detail biodata profil.
       - **Verifikasi KTP & Identitas**:
         - Ikon: `<ShieldCheck />`.
         - Subtitle: *"Dokumen identitas resmi pemilik kost"*.
         - Aksi klik: Membuka detail dokumen identitas resmi KTP.
       - **Keamanan & Kata Sandi**:
         - Ikon: `<Lock />`.
         - Subtitle: *"Ganti PIN, password & autentikasi"*.
    5. **Grup Menu 3: BANTUAN & PROGRAM KEMITRAAN**:
       - **Program KostManager Auto-Pilot**:
         - Ikon: `<Sparkles />` / `<Building2 />`.
         - Subtitle: *"Solusi operasional kost terima beres tanpa repot"*.
       - **Pusat Bantuan 24/7**:
         - Ikon: `<HelpCircle />`.
         - Subtitle: *"Hubungi layanan pelanggan RuangSinggah"*.
       - **Syarat & Ketentuan Kemitraan**:
         - Ikon: `<FileText />`.
         - Subtitle: *"Panduan dan legalitas pemilik kost"*.
    6. **Tombol Keluar Akun (Logout)**.

---

## 2. Dampak Perubahan (Files Affected)

1. [functions/public/pages/MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx):
   - Mengubah elemen `<header>` mobile menjadi floating header (`sticky top-0 bg-white/85 backdrop-blur-md`).
   - Memasang tombol Chat/Pesan Masuk beserta badge pesan belum terbaca di sisi kanan header mobile.
   - Mengganti item `chat` pada `NAV_ITEMS.filter` di mobile bottom nav menjadi `properties` (dengan label "Kelola Kost").
   - Menghapus blok pintas menu 2 kolom lama (`Kelola Kost` dan `Cek Dompet`) pada Beranda overview mobile.
   - Mengirimkan prop handler navigasi (`onNavigateMenu={handleMenuChange}`) dan data saldo (`availableBalance={stats.availableBalance}`) ke komponen `<MitraProfile />`.
2. [functions/public/pages/MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
   - Menambahkan prop `onNavigateMenu?: (menuKey: string) => void` dan `availableBalance?: number`.
   - Menambahkan state navigasi sub-menu internal (`viewMode: 'hub' | 'personal_data' | 'ktp_data'`).
   - Mengimplementasikan layout **Profile Hub Berkelompok** sesuai desain referensi screenshot user.
   - Menghubungkan menu "Tarik Saldo Kost (Cek Dompet)" ke handler dompet/keuangan.
   - Menyediakan tombol navigasi kembali (`<ArrowLeft /> Kembali ke Menu Profil`) saat pengguna membuka sub-tampilan biodata/KTP.
3. [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) & [WALKTHROUGH.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md):
   - Dokumentasi lengkap riwayat progres dan walkthrough pengujian.

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

1. **Pembaruan Mobile Header & Bottom Nav di `MitraDashboard.tsx`**:
   - Menata `<header className="lg:hidden h-16 bg-white/85 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-40 flex items-center justify-between px-4 shadow-xs">`.
   - Menambahkan tombol `<button onClick={() => handleMenuChange('chat')}>` dengan `<MessageSquare />` dan unread counter pill di slot kanan header.
   - Mengubah mapping bottom nav mobile:
     `NAV_ITEMS.filter(item => ['overview', 'bookings', 'tenants', 'properties', 'profile'].includes(item.key))`.
   - Memastikan label tombol `properties` adalah "Kelola Kost".
   - Menghapus 2-button grid pintas menu Beranda (`Kelola Kost` & `Cek Dompet`).

2. **Rekonstruksi Tampilan Profil Mitra di `MitraProfile.tsx`**:
   - Memperluas interface `MitraProfileProps` dengan `onNavigateMenu` dan `availableBalance`.
   - Membangun antarmuka utama Profil dalam mode `'hub'` yang mencakup:
     - Header profil dengan avatar, info nama, email, role badge, dan tombol *Data Kontak Pribadi*.
     - Kartu status verifikasi yang ringkas.
     - Card Group 1 (Keuangan & Saldo): Menu *Tarik Saldo Kost (Cek Dompet)* dan *Rekening Penarikan*.
     - Card Group 2 (Akun & Identitas): Menu *Data Profil*, *Dokumen Identitas KTP*, dan *Keamanan*.
     - Card Group 3 (Layanan & Bantuan): Menu *KostManager*, *Pusat Bantuan*, dan *Legal*.
     - Tombol Logout.
   - Menjaga keutuhan logika edit data dan guard penguncian data saat status `pending`.

3. **Verifikasi Kompilasi & Pengujian**:
   - Menjalankan kompilasi `npm run build` di `functions/public` untuk memastikan 0 error kompilasi TypeScript / JSX.
   - Memverifikasi tampilan responsif pada viewport mobile dan interaksi antar menu.

4. **Pencatatan Progres & Git Push**:
   - Mencatat ke `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
   - Melakukan commit dan push ke remote repository branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi Floating Header & Chat**:
  - Menguji tampilan header pada mode mobile: header tetap mengambang (*floating*) dengan efek blur saat halaman di-scroll.
  - Mengklik icon chat di header: navigasi langsung membuka tab pesan / chat.
  - Memastikan badge unread message muncul secara dinamis jika ada pesan masuk.
- **Verifikasi Bottom Navigation**:
  - Memastikan menu ke-4 di bottom navigation adalah **Kelola Kost** dengan ikon yang tepat.
  - Mengklik **Kelola Kost**: membuka halaman pengelolaan kost (`properties`).
  - Memastikan Beranda mobile bersih dari pintas menu ganda.
- **Verifikasi Arsitektur Profil**:
  - Membuka menu **Profil**: memastikan tata letak grouped-menu tampil identik secara estetika dengan referensi profile role user.
  - Mengklik **Tarik Saldo Kost (Cek Dompet)**: membuka halaman saldo/dompet mitra.
  - Mengklik **Data Kontak Pribadi**: membuka detail/edit data profil dengan tombol kembali yang berfungsi normal.
  - Memastikan verifikasi identitas tetap terkunci saat berstatus `pending`.
- **Verifikasi Build**:
  - Menjalankan `npm.cmd run build` dan memastikan 100% lulus tanpa error.
