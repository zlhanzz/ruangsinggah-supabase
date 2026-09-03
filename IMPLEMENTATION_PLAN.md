# IMPLEMENTATION PLAN: Penambahan Menu Chat / Pesan pada Mobile Bottom Navigation Bar

## 1. Analisis Masalah & Kebutuhan
- **Kebutuhan**:
  Pada tampilan mobile, bottom navigation bar saat ini hanya memiliki 4 menu (*Home*, *Search*, *Orders*, *Profile*). Pengguna meminta penambahan menu **Chat / Pesan** agar pengguna dapat langsung melihat dan mengakses riwayat percakapan yang pernah dilakukan sebelumnya dengan pemilik kost maupun admin/pengelola.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**: `functions/public/components/Navbar.tsx`.
- **Proteksi Logika**:
  - Memanfaatkan routing `Page.CHAT` yang sudah terintegrasi stabil di `App.tsx` dan `pages/Chat.tsx`.
  - Jika pengguna sudah login, klik menu **Chat** langsung membuka halaman `Page.CHAT`.
  - Jika pengguna belum login, sistem mengarahkan ke `Page.LOGIN`.
  - Menggunakan ikon vector SVG murni `<MessageSquare />` dari `lucide-react` (bebas FOUT 100%).

---

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `Navbar.tsx` (Bagian Mobile Bottom Navigation Bar)**:
   - Tambahkan menu **Chat** di antara *Search* dan *Orders*:
     ```tsx
     {/* 3. Chat */}
     <button
       onClick={() => onPageChange(user ? Page.CHAT : Page.LOGIN)}
       className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-all cursor-pointer ${
         activePage === Page.CHAT ? 'text-orange-500' : 'text-gray-400 hover:text-gray-800'
       }`}
     >
       <MessageSquare size={22} className={activePage === Page.CHAT ? 'stroke-orange-500 stroke-[2.5]' : 'stroke-gray-400'} />
       <span className={`text-[10px] ${activePage === Page.CHAT ? 'font-bold text-orange-500' : 'font-medium text-gray-500'}`}>
         Chat
       </span>
     </button>
     ```
   - Tambahkan juga shortcut menu **Chat / Pesan Saya** pada dropdown profil desktop/mobile agar pengguna di desktop juga mudah mengakses riwayat chat.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
2. **Uji Tampilan & Navigasi Mobile**:
   - Menguji tampilan Mobile Bottom Navigation Bar dengan 5 menu seimbang (*Home*, *Search*, *Chat*, *Orders*, *Profile*).
   - Memastikan tombol Chat mengarahkan ke halaman riwayat percakapan (`/chat`) dengan tepat.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md`, memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
