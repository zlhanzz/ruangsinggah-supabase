# Rencana Implementasi: Presisi Menu Pesan Mitra, Reset Unread Badge, Isolasi Role Chat & Blokir Nomor HP

## 1. Analisis Masalah & Kebutuhan Pengguna
1. **Unread Badge & Auto-Reset**:
   - **Masalah**: Pada sidebar Dashboard Mitra (`MitraDashboard.tsx`), badge angka pada menu "Pesan" dihitung dari total jumlah percakapan (`chatSessions.length`), bukan jumlah pesan yang belum dibaca (`unread_count`). Akibatnya, meskipun semua pesan sudah dibaca dan dibalas, badge angka merah tetap muncul (misal angka `2`).
   - **Solusi**:
     - Hitung badge menu pesan dari jumlah pesan belum dibaca yang sebenarnya: `chatSessions.reduce((acc, s) => acc + (s.unread_count || 0), 0)`.
     - Ketika mitra memilih/membuka percakapan tertentu (`activeChat`), langsung perbarui state lokal `chatSessions` dengan menyetel `unread_count: 0` untuk sesi tersebut (0ms delay) dan panggil `markMessagesAsRead(session.id, 'owner')`.
     - Tampilkan badge unread indikator per-sesi di daftar percakapan hanya jika `session.unread_count > 0`.

2. **Isolasi Role Chat (User vs Mitra - Anti Bocor)**:
   - **Masalah**: Fungsi `getMyChatSessions` di `chatService.ts` sebelumnya mengambil seluruh sesi dengan filter `.or(user_id.eq.${userId},owner_id.eq.${userId})` tanpa membedakan peran. Akibatnya, percakapan pribadi akun saat menyewa kost di tempat lain ikut bercampur ke dalam Dashboard Mitra.
   - **Solusi**:
     - Tambahkan parameter `roleFilter?: 'owner' | 'user'` pada `getMyChatSessions(userId, roleFilter)`.
     - Di **Dashboard Mitra** (`/dashboard-mitra/chat`): Panggil `getMyChatSessions(uid, 'owner')` sehingga hanya sesi di mana akun bertindak sebagai pemilik kost/mitra yang dimuat.
     - Di **Halaman Chat User** (`/chat`): Panggil `getMyChatSessions(user.uid, 'user')` sehingga hanya sesi saat akun bertindak sebagai pencari kost yang dimuat.

3. **Larangan & Pemblokiran Otomatis Nomor HP / Kontak Luar (Anti-Disintermediation)**:
   - **Masalah**: Belum ada sistem filter pencegahan pengiriman kontak luar (seperti nomor WhatsApp / HP) untuk mencegah transaksi di luar aplikasi.
   - **Solusi**:
     - Buat utilitas deteksi nomor telepon `containsPhoneNumber(text: string): { blocked: boolean; reason?: string }` di `chatService.ts` yang mampu mendeteksi format nomor HP Indonesia dan variasi manipulasi (misal: `08...`, `+628...`, `628...`, nomor dipisah spasi `0 8 1 2 ...`, strip `0812-xxxx`, titik, atau susunan angka berurutan $\ge 8$ digit).
     - Pasang validasi di sisi UI (`ChatWindow.tsx`) sebelum form terkirim: jika terdeteksi nomor kontak luar, batalkan pengiriman dan tampilkan pesan peringatan ramah bahwa pengiriman kontak dilarang demi keamanan transaksi di aplikasi.
     - Pasang validasi di sisi service (`sendMessage` di `chatService.ts`) sebagai lapisan keamanan lapis kedua.

4. **Presisi UI/UX Menu Pesan Mitra**:
   - Menghubungkan input *Search* ("Cari percakapan...") di sidebar list chat `MitraDashboard.tsx` dengan state filter real-time agar pencarian berfungsi dengan baik.
   - Menyelaraskan tata letak list percakapan, avatar, nama penyewa, judul properti, cuplikan pesan terakhir, dan stempel waktu agar rapi dan presisi.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/chatService.ts` | 1. Tambahkan fungsi helper deteksi nomor HP `containsPhoneNumber(text: string)`.<br>2. Validasi pencegahan nomor HP di fungsi `sendMessage`.<br>3. Tambahkan parameter `roleFilter?: 'owner' | 'user'` pada `getMyChatSessions`. |
| `functions/public/pages/MitraDashboard.tsx` | 1. Ubah kalkulasi `chatCount` dari `chatSessions.length` menjadi total `unread_count`.<br>2. Panggil `getMyChatSessions(uid, 'owner')` pada `loadData`.<br>3. Reset `unread_count` sesi ke 0 secara optimistik saat sesi diklik/dibuka.<br>4. Aktifkan fitur pencarian percakapan pada sidebar chat.<br>5. Tampilkan indikator unread badge per percakapan. |
| `functions/public/pages/Chat.tsx` | Panggil `getMyChatSessions(user.uid, 'user')` untuk isolasi sesi chat role penyewa. |
| `functions/public/components/ChatWindow.tsx` | 1. Tambahkan pengecekan `containsPhoneNumber` sebelum submit pesan dengan toast/alert larangan transaksi luar.<br>2. Callback reset unread saat pesan dibuka/dibalas. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Modifikasi `chatService.ts`
- Implementasi fungsi regex validator nomor HP `containsPhoneNumber(text)` yang memfilter:
  - Format standar: `08xx`, `628xx`, `+628xx`.
  - Format angka bersekat: spasi (`0 8 1 2`), titik (`0812.333`), strip (`0812-333`), slash, tanda kurung.
  - Urutan angka $\ge 8$ digit beruntun.
- Sisipkan validasi ini ke dalam fungsi `sendMessage`.
- Perbarui `getMyChatSessions(userId: string, roleFilter?: 'owner' | 'user')` dengan query yang difilter sesuai role.

### Langkah 2: Modifikasi `ChatWindow.tsx`
- Tambahkan validasi `containsPhoneNumber` di handler `handleSendMessage`.
- Tampilkan pesan peringatan keamanan saat pengguna mencoba mengirimkan nomor telepon.
- Pastikan real-time `markMessagesAsRead` terpanggil saat pesan baru masuk atau jendela chat sedang aktif dibuka.

### Langkah 3: Modifikasi `MitraDashboard.tsx`
- Ubah `chatCount` menjadi kalkulasi jumlah unread.
- Panggil `getMyChatSessions(uid, 'owner')`.
- Tambahkan state `chatSearchQuery` dan fungsikan input pencarian di tab chat.
- Buat handler `handleSelectChat(session)` yang langsung mengosongkan unread count sesi yang dipilih.
- Tambahkan badge penanda unread pada list percakapan.

### Langkah 4: Modifikasi `Chat.tsx`
- Pastikan pemanggilan `getMyChatSessions(user.uid, 'user')` terpasang agar chat pencari kost terisolasi dari chat pemilik kost.

---

## 4. Rencana Verifikasi

1. **Uji Build TypeScript & Bundling Vite**:
   - Menjalankan `cmd /c npm run build` untuk memverifikasi tidak ada error tipe data, lint, atau sintaks.
2. **Verifikasi Kasus Uji Logika**:
   - **Uji 1 (Badge & Unread Reset)**: Pastikan jika `unread_count === 0`, badge merah pada menu sidebar "Pesan" tidak muncul. Ketika ada pesan baru dari penyewa, badge muncul dengan angka yang sesuai; dan saat chat dibuka/dibalas, badge langsung hilang (0).
   - **Uji 2 (Isolasi Role)**: Akun mitra yang juga menyewa kost orang lain tidak akan melihat chat sewa pribadinya di Dashboard Mitra, melainkan hanya di menu `/chat`.
   - **Uji 3 (Deteksi Nomor HP)**: Pengiriman nomor seperti `08123456789`, `+62812 3456 7890`, `0 8 1 3 4 5 6 7 8 9` otomatis diblokir dengan pesan peringatan yang jelas.
