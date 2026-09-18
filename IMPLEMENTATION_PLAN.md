# Rencana Implementasi: Floating Action Button (FAB) Chat di Pojok Kanan Bawah Menggantikan Time Travel Simulator

Dokumen perencanaan ini disusun berdasarkan masukan cerdas pengguna untuk memanfaatkan posisi tombol melayang (*Floating Action Button / FAB*) di sudut kanan bawah layar mobile (posisi yang sebelumnya ditempati oleh tombol Time Travel Simulator) menjadi **Tombol Floating Chat / Pesan Masuk**, serta mengembalikan header mobile menjadi bersih dan natural tanpa perlu meniru ikon Facebook Messenger.

---

## 1. Analisis Masalah & Kebutuhan

### A. Evaluasi Posisi Floating Action Button (FAB)
1. **Kondisi Saat Ini**:
   - Di sudut kanan bawah layar mobile (posisi tepat di atas tab bottom navigation bar pada `bottom-24 right-5/6`), terdapat tombol mengambang oranye dengan ikon jam `<Clock />` yang berasal dari komponen `<TimeSimulator />` (alat simulasi perpanjangan sewa untuk keperluan pengujian developer).
   - Penempatan tombol simulasi pengujian di area jempol (*thumb zone*) layar ponsel sangat memakan ruang strategis dan tidak memiliki nilai guna operasional langsung bagi pemilik kost sehari-hari.
2. **Keunggulan Ide Pengguna**:
   - Menggantikan tombol Time Travel tersebut dengan **Floating Action Button (FAB) Chat / Pesan Masuk**:
     - Posisi sudut kanan bawah (`bottom-24 right-4 sm:right-6`) adalah *primary thumb zone* yang paling mudah, cepat, dan nyaman dijangkau oleh satu tangan pengguna smartphone saat memegang HP.
     - FAB melayang di atas konten halaman dan di atas bottom navigation bar, sehingga pengguna dapat membuka pesan masuk kapan saja dari halaman mana pun secara instan.
     - Didesain dengan bahasa desain asli RuangSinggah (gradasi oranye-amber khas RuangSinggah, bukan biru/ungu Messenger), lengkap dengan ikon pesan vector Lucide `<MessageSquare size={24} />` dan badge counter notifikasi pesan belum dibaca yang menyala.
     - Ketika pengguna sudah berada di dalam menu chat (`activeMenu === 'chat'`), FAB chat disembunyikan secara otomatis agar tidak menutupi kotak obrolan.

---

### B. Penyederhanaan & Estetika Header Mobile
1. **Kondisi Saat Ini**:
   - Di kanan atas header mobile terdapat ikon Messenger bergaya Facebook yang dibuat untuk menarik perhatian (*get noticed*).
   - Pengguna menyampaikan bahwa jika chat sudah berada dalam bentuk tombol melayang (FAB) di pojok kanan bawah, tombol Messenger di header atas tidak diperlukan lagi.
2. **Solusi**:
   - Menghapus tombol Messenger dari header mobile atas.
   - Menjadikan header mobile tetap melayang (*floating fixed top-0*) namun dengan tata letak yang bersih, simetris, dan elegan:
     - Sisi Kiri: Tombol Hamburger Menu (`<Menu size={22} />`) untuk membuka drawer sidebar.
     - Sisi Tengah: Identitas brand `RuangSinggah.id` dengan subtitle `MITRA DASHBOARD`.
     - Sisi Kanan: Spacer simetris (`w-10 h-10`) agar logo brand tetap terpusat (*centered*) sempurna.

---

### C. Penanganan Komponen Time Travel Simulator
- Komponen `<TimeSimulator />` di `MitraDashboard.tsx` dapat dinonaktifkan atau disembunyikan dari antarmuka mobile biasa, sehingga ruang sudut kanan bawah 100% didedikasikan untuk FAB Chat.

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
- `functions/public/pages/MitraDashboard.tsx`:
  - Menghapus komponen `MessengerIcon` dan tombol pesan di header atas mobile, menggantikannya dengan spacer penyeimbang.
  - Membangun komponen **Floating Action Button (FAB) Chat** di sudut kanan bawah (`fixed bottom-24 right-4 sm:right-6 z-40 lg:hidden`) dengan gradasi oranye RuangSinggah, ikon `<MessageSquare size={24} />`, unread badge counter, dan handler `handleMenuChange('chat')`.
  - Mengondisikan penyembunyian FAB saat `activeMenu === 'chat'`.
  - Melepas atau menyembunyikan rendering `<TimeSimulator />` di mobile dashboard mitra.
- `functions/PROGRESS.md`: Pencatatan progres fitur entri baru (#424).
- `WALKTHROUGH.md`: Dokumentasi hasil kerja dan panduan pengujian visual.

---

## 3. Langkah-Langkah Eksekusi (FASE 2 Setelah di-ACC)

1. **Pembersihan Header Mobile di `MitraDashboard.tsx`**:
   - Hapus pemanggilan `MessengerIcon` di header mobile.
   - Pasang elemen spacer `w-10 h-10` di sisi kanan header agar logo tetap seimbang di tengah.
2. **Pembuatan Floating Action Button (FAB) Chat**:
   - Tempatkan tombol FAB di root layout `MitraDashboard.tsx`:
     ```tsx
     {activeMenu !== 'chat' && (
         <button
             onClick={() => handleMenuChange('chat')}
             className="lg:hidden fixed bottom-24 right-4 sm:right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-xl shadow-orange-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/80"
             aria-label="Buka Chat"
         >
             <MessageSquare size={24} strokeWidth={2.2} />
             {chatUnreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                     {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                 </span>
             )}
         </button>
     )}
     ```
3. **Penyisihan TimeSimulator**:
   - Hapus pemanggilan `<TimeSimulator />` dari tampilan dashboard mitra mobile agar tidak tumpang tindih.
4. **Verifikasi Kompilasi**:
   - Jalankan `npm.cmd run build` di direktori `functions/public` hingga lulus 0 error.
5. **Pencatatan Dokumen & Git Push**:
   - Perbarui `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Verifikasi Header Mobile**:
   - Buka `/mitra` dalam tampilan mobile.
   - Header tampil bersih, rapi, simetris, dan tetap floating di puncak layar tanpa tergulung saat di-scroll.
   - Ikon Messenger sudah tidak ada di header atas.
2. **Verifikasi Floating Chat Button (FAB)**:
   - Terlihat tombol lingkaran oranye menyala melayang di sudut kanan bawah (tepat di atas tab "Profil" bottom navigation bar).
   - Tombol memuat ikon chat `<MessageSquare size={24} />` dan badge angka jika ada pesan belum dibaca.
   - Klik tombol FAB: aplikasi langsung beralih ke tab **Chat / Pesan Masuk**, dan tombol FAB otomatis menghilang saat berada di dalam halaman chat.
3. **Verifikasi Time Simulator**:
   - Tombol jam Time Simulator sudah tidak lagi bertabrakan di sudut kanan bawah.
