# Walkthrough - Progres 309: Presisi Menu Pesan Mitra, Reset Unread Badge, Isolasi Role Chat & Blokir Nomor HP

## Ringkasan Perubahan
Penyempurnaan menyeluruh pada modul perpesanan (*chat system*) untuk memastikan kalkulasi unread badge presisi, isolasi percakapan antar peran pengguna, pencegahan transaksi di luar aplikasi (anti-disintermediation), serta pengalaman pengguna yang mulus di Dashboard Mitra.

---

## Daftar Perubahan File & Logika

### 1. `functions/public/chatService.ts`
- **Fungsi Deteksi Nomor Telepon (`containsPhoneNumber`)**:
  - Mendeteksi tautan WhatsApp langsung (`wa.me`, `api.whatsapp.com`, `wa.link`).
  - Mendeteksi format nomor HP seluler Indonesia (`08xx`, `628xx`, `+628xx`) dengan panjang 9–14 digit.
  - Mendeteksi penulisan yang disamarkan dengan spasi, strip, titik, atau tanda kurung (misal `0 8 1 2 3 ...`).
  - Mendeteksi kata kunci kontak (`wa:`, `no hp:`, `kontak:`, `hubungi:`) yang diikuti digit angka $\ge 6$.
  - Menghindari *false positive* pada penulisan harga nominal sewa (seperti `Rp 1.500.000`).
- **Validasi Lapisan Kedua pada `sendMessage`**:
  - Mencegah penyimpanan pesan ke database Supabase jika pesan mengandung nomor telepon/kontak luar.
- **Isolasi Role pada `getMyChatSessions`**:
  - Menambahkan parameter `roleFilter?: 'owner' | 'user'`.
  - Jika `roleFilter === 'owner'`, query mengambil sesi di mana akun adalah pemilik (`owner_id = userId`) dan menghitung unread dari pesan penyewa.
  - Jika `roleFilter === 'user'`, query mengambil sesi di mana akun adalah penyewa (`user_id = userId`) dan menghitung unread dari pesan pemilik.

### 2. `functions/public/components/ChatWindow.tsx`
- **Validasi Form & Banner Keamanan**:
  - Memeriksa isi pesan menggunakan `containsPhoneNumber` sebelum submit.
  - Menampilkan banner peringatan keamanan merah (*ShieldAlert*) jika terdeteksi kontak luar dan membatalkan pengiriman.
- **Callback `onMessagesRead`**:
  - Memanggil callback `onMessagesRead` saat pesan dibuka atau dibaca untuk menyinkronkan unread badge pada komponen induk.

### 3. `functions/public/pages/MitraDashboard.tsx`
- **Kalkulasi Akurat Unread Badge**:
  - Mengubah kalkulasi badge menu sidebar "Pesan" menjadi: `(chatSessions || []).reduce((acc, s) => acc + (s.unread_count || 0), 0)`.
  - Badge angka merah hanya muncul jika terdapat pesan yang benar-benar belum dibaca (`unread_count > 0`).
- **Reset Instan Saat Percakapan Dibuka (`handleSelectChat`)**:
  - Mengosongkan `unread_count` sesi terkait secara optimistik (0ms delay) dan memicu `markMessagesAsRead(session.id, 'owner')`.
- **Indikator Badge Unread per-Percakapan**:
  - Menampilkan badge bulat merah berdenyut (*animate-pulse*) di sebelah nama calon penghuni jika percakapan tersebut memiliki pesan yang belum dibaca.
- **Pencarian Real-Time (`chatSearchQuery`)**:
  - Menghubungkan kotak pencarian "Cari percakapan..." dengan filter nama penyewa, judul kost, dan cuplikan pesan terakhir.
- **Isolasi Role Mitra**:
  - Memuat percakapan khusus pemilik: `getMyChatSessions(uid, 'owner')`.

### 4. `functions/public/pages/Chat.tsx`
- Memanggil `getMyChatSessions(user.uid, 'user')` agar halaman chat umum pengguna hanya menampilkan percakapan saat akun bertindak sebagai penyewa kost.
- Menyematkan badge unread per item percakapan dan callback `onMessagesRead`.

---

## Hasil Pengujian & Kompilasi

1. **Kompilasi TypeScript (`tsc`)**:
   - `functions/`: **Lulus 100% (0 error)**.
2. **Kompilasi Frontend Vite (`vite build`)**:
   - `functions/public/`: **Lulus 100% (✓ 2509 modules transformed, built in 45.12s, 0 error)**.

---

## Panduan Pengujian untuk Pengguna (User Testing)

1. **Uji Unread Badge & Reset Otomatis**:
   - Masuk ke Dashboard Mitra (`/dashboard-mitra`).
   - Perhatikan menu **Pesan** di sidebar: jika tidak ada pesan baru yang belum dibaca, badge angka merah tidak akan muncul.
   - Buka tab **Pesan**: klik salah satu percakapan yang memiliki pesan belum dibaca. Perhatikan bahwa badge unread pada percakapan dan badge di menu sidebar langsung hilang/ter-reset ke 0.
2. **Uji Pemisahan Role Chat (Anti-Bocor)**:
   - Di Dashboard Mitra (`/dashboard-mitra/chat`), hanya percakapan dari calon penghuni untuk kost yang Anda miliki yang akan muncul.
   - Di halaman `/chat` (sebagai penyewa), hanya percakapan Anda dengan pemilik kost lain yang akan muncul.
3. **Uji Sensor Nomor HP**:
   - Pada input obrolan chat, coba ketik nomor telepon seperti `081234567890` atau `wa: 0812-3456-7890`.
   - Tekan tombol kirim: sistem akan menampilkan banner peringatan merah dan membatalkan pengiriman pesan.
