# IMPLEMENTATION PLAN - Hambuger Menu & Fitur Logout Pada Dashboard Mitra

Rencana ini dibuat untuk menambahkan tombol hamburger (garis 3) pada Dashboard Mitra untuk aksesibilitas navigasi seluler (mobile) serta menyediakan tombol Logout akun yang sesungguhnya.

## 1. Analisis Masalah
- **Masalah**:
  1. Pada tampilan seluler (mobile), menu sidebar Dashboard Mitra tersembunyi, namun tidak ada tombol pemicu (hamburger menu/garis 3) di bagian atas halaman untuk membuka sidebar tersebut. Hal ini membuat pengguna mobile terjebak dan tidak dapat membuka menu navigasi penuh (seperti Kost Saya, Dompet, dll).
  2. Tombol di bagian bawah sidebar saat ini tertulis "Kembali ke Beranda" menggunakan ikon `LogOut`, namun aksi yang dijalankan hanya navigasi biasa ke halaman utama (`Page.HOME`), tidak benar-benar mengeluarkan sesi pengguna (`signOut`) dari Supabase.
- **Solusi**:
  1. Tambahkan bar header seluler (`header` dengan kelas `lg:hidden`) di bagian atas area konten utama [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx) yang berisi tombol hamburger (`Menu` dari `lucide-react`) untuk menyetel `mobileSidebarOpen` menjadi `true`.
  2. Tambahkan prop callback `onLogout` pada `MitraDashboardProps` dan salurkan fungsi `handleLogout` dari `App.tsx`.
  3. Desain ulang bagian bawah sidebar (baik desktop maupun mobile overlay) untuk menyajikan dua tombol terpisah:
     - **Kembali ke Beranda** (menggunakan ikon navigasi/rumah) untuk beralih ke halaman depan.
     - **Keluar Akun** (menggunakan ikon `LogOut` merah) untuk melakukan logout autentikasi Supabase.

## 2. Dampak Perubahan
File yang akan diubah:
1. `functions/public/pages/MitraDashboard.tsx`:
   - Tambahkan `onLogout?: () => void` ke antarmuka `MitraDashboardProps`.
   - Sisipkan komponen `<header>` seluler dengan tombol hamburger di atas tag `<main className="flex-1 ...">`.
   - Ubah footer tombol sidebar untuk mendukung tombol "Kembali ke Beranda" dan "Keluar Akun" secara terpisah.
2. `functions/public/App.tsx`:
   - Salurkan properti `onLogout={handleLogout}` ke rendering komponen `<MitraDashboard>`.

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `functions/public/pages/MitraDashboard.tsx`**:
   - Daftarkan `onLogout` di deklarasi props.
   - Sisipkan `<header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-40">...` sebelum `<main ...>`.
   - Ganti isi div `p-4 border-t border-gray-50` di sidebar desktop dan sidebar mobile overlay dengan dua tombol terpisah.
2. **Modifikasi `functions/public/App.tsx`**:
   - Temukan route `Page.DASHBOARD_MITRA` dan tambahkan `onLogout={handleLogout}` pada tag `<MitraDashboard>`.
3. **Kompilasi Frontend**:
   - Jalankan `npm run build` di folder `functions/public` untuk memastikan build tetap berhasil.

## 4. Rencana Verifikasi
- Pastikan build sukses.
- Periksa tombol hamburger muncul pada layar seluler dan ketika diklik berhasil membuka overlay sidebar.
- Pastikan tombol "Keluar Akun" berfungsi dan mengakhiri sesi user di Supabase.
