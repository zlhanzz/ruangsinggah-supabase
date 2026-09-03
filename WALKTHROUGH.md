# Walkthrough - Progres 311: Perbaikan Tuntas Sinkronisasi Unread Badge Pesan saat Refresh, Smart Unread Resolution & Auto-Heal

## Ringkasan Perubahan
Menyelesaikan masalah badge pesan belum dibaca yang sebelumnya muncul kembali saat halaman di-refresh meskipun pesan sudah dibaca dan dibalas. 

Perbaikan dilakukan dengan menambahkan otomatisasi penandaan pesan terbaca saat membalas chat (`sendMessage`), memperkuat query `markMessagesAsRead` dengan filter ID pengguna pembaca (`readerId`), serta menambahkan logika *Smart Unread Resolution* & *Background Auto-Heal* pada `getMyChatSessions`.

---

## Daftar Perubahan File & Logika

### 1. `functions/public/chatService.ts`
- **Auto-Read saat Kirim Balasan (`sendMessage`)**:
  - Menyisipkan pemanggilan `await markMessagesAsRead(sessionId, senderType, senderId)` di dalam `sendMessage`. Ketika pemilik/pengguna membalas pesan, seluruh pesan lawan bicara sebelumnya langsung berstatus `is_read = true` di database.
- **Peningkatan Akurasi `markMessagesAsRead`**:
  - Menambahkan parameter opsional `readerId?: string`. Jika `readerId` ada, fungsi menggunakan filter `.neq('sender_id', readerId)` sehingga seluruh pesan dari lawan bicara dijamin ter-update.
- **Smart Unread Resolution & Background Auto-Heal (`getMyChatSessions`)**:
  - Mengambil data pengirim pesan terbaru per sesi. Jika pesan terakhir dalam percakapan dikirim oleh pengguna saat ini (`latestMsg.sender_id === userId` atau pengirim bertipe `roleFilter`), sistem secara cerdas menyimpulkan percakapan sudah dibaca dan dibalas $\rightarrow$ `unread_count = 0`.
  - Mengumpulkan sesi-sesi yang memiliki status pesan tertinggal dan secara otomatis memperbarui flag `is_read = true` di database di latar belakang (*background auto-heal*).

### 2. `functions/public/components/ChatWindow.tsx` & `functions/public/pages/MitraDashboard.tsx`
- Memastikan `currentId` dan `uid` diteruskan ke fungsi `markMessagesAsRead` saat inisialisasi window chat, saat pesan baru masuk, dan saat sesi chat dipilih dari daftar sidebar.

---

## Hasil Pengujian & Kompilasi

1. **Kompilasi Frontend Vite (`vite build`)**:
   - `functions/public/`: **Lulus 100% (✓ 2509 modules transformed, built in 39.69s, 0 error)**.

---

## Panduan Pengujian Pengguna (User Testing)

1. **Uji Refresh Halaman Chat Mitra**:
   - Buka menu **Pesan** di Dashboard Mitra.
   - Perhatikan sesi percakapan yang sebelumnya sudah dibalas (seperti "Administrator").
   - **Hasil**: Badge merah angka `2` dan tulisan "2 Pesan Belum Dibaca" **hilang / bersih (0)**.
2. **Uji Hard Refresh (F5 / Ctrl+R)**:
   - Lakukan refresh browser.
   - **Hasil**: Badge unread tetap bersih `0`, tidak muncul kembali.
3. **Uji Kirim Pesan Baru & Balasan**:
   - Kirim pesan balasan baru ke percakapan.
   - Lakukan refresh.
   - **Hasil**: Status pesan tetap konsisten dan unread count tetap `0`.
