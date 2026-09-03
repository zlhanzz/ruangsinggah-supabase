# Rencana Implementasi: Perbaikan Tuntas Unread Badge Pesan yang Masih Muncul Saat Refresh

## 1. Analisis Masalah & Akar Penyebab
- **Gejala Masalah**:
  - Pengguna melaporkan bahwa saat halaman Dashboard Mitra di-refresh, badge pesan belum dibaca (misal "2 Pesan Belum Dibaca" atau badge `2` merah pada Administrator) masih muncul kembali, padahal pesan tersebut sudah dibuka, dibaca, dan bahkan sudah dibalas ("masih ad").
- **Akar Penyebab (Root Cause)**:
  1. **Tidak Ada Sinkronisasi `markMessagesAsRead` saat Mengirim Balasan (`sendMessage`)**:
     - Ketika pemilik membalas chat ("masih ad"), fungsi `sendMessage` hanya menyisipkan pesan balasan baru ke database `chat_messages`, namun tidak menandai pesan-pesan lawan bicara sebelumnya sebagai terbaca (`is_read = true`).
  2. **Keterbatasan Filter `markMessagesAsRead`**:
     - Fungsi `markMessagesAsRead` sebelumnya hanya menyaring berdasarkan `sender_type`. Jika `sender_id` pembaca disertakan (`neq('sender_id', readerId)`), database dapat secara akurat menandai seluruh pesan dari lawan bicara sebagai terbaca.
  3. **Belum Ada Logika Pengaman (*Auto-Heal / Smart Unread Resolution*) pada `getMyChatSessions`**:
     - Jika pengguna sudah membalas percakapan (pesan terakhir dalam sesi dikirim oleh pemilik), sistem seharusnya secara cerdas mengenali bahwa pemilik sudah membaca percakapan tersebut (`unread_count = 0`) dan menyinkronkan status `is_read = true` ke database di latar belakang agar tidak ada glitch saat refresh.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/chatService.ts` | 1. Perbarui `markMessagesAsRead(sessionId, readerSenderType, readerId)` agar memfilter `neq('sender_id', readerId)` untuk keandalan maksimal.<br>2. Di dalam `sendMessage`, otomatis panggil `markMessagesAsRead` agar saat pemilik/pengguna membalas pesan, seluruh pesan sebelumnya langsung berstatus `is_read = true`.<br>3. Di dalam `getMyChatSessions`, tambahkan validasi *smart unread*: jika pemilik adalah pengirim pesan terakhir dalam percakapan, otomatis set `unread_count = 0` dan perbarui status di DB (auto-heal). |
| `functions/public/components/ChatWindow.tsx` | Panggil `markMessagesAsRead(session.id, currentSenderType, currentId)` saat memuat pesan, saat jendela chat terbuka, dan sesaat setelah mengirim balasan. |
| `functions/public/pages/MitraDashboard.tsx` | Sertakan parameter `uid` saat memanggil `markMessagesAsRead(session.id, 'owner', uid)`. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Modifikasi `chatService.ts`
- Tingkatkan fungsi `markMessagesAsRead`:
  ```typescript
  export async function markMessagesAsRead(sessionId: string, readerSenderType: 'user' | 'owner', readerId?: string) {
    try {
      const targetSenderType = readerSenderType === 'user' ? 'owner' : 'user';
      let query = supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('is_read', false);

      if (readerId) {
        query = query.neq('sender_id', readerId);
      } else {
        query = query.eq('sender_type', targetSenderType);
      }

      await query;
    } catch (err) {
      console.warn('Failed to mark messages as read:', err);
    }
  }
  ```
- Di dalam `sendMessage`, panggil `await markMessagesAsRead(sessionId, senderType, senderId);`.
- Di dalam `getMyChatSessions`, tambahkan pengecekan jika pemilik mengirim pesan terakhir (`sender_type === 'owner'` pada pesan terakhir), maka pesan sebelumnya dianggap sudah terbaca sehingga `unread_count` dipastikan `0`.

### Langkah 2: Modifikasi `ChatWindow.tsx` & `MitraDashboard.tsx`
- Sinkronkan pemanggilan `markMessagesAsRead` dengan menyertakan `currentId` / `uid`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` di folder `functions/public` untuk memastikan 0 error kompilasi.
2. **Verifikasi Kasus Uji**:
   - **Kasus 1**: Buka percakapan yang sebelumnya memiliki unread count $\rightarrow$ pesan di DB otomatis ter-update menjadi `is_read = true`.
   - **Kasus 2**: Lakukan hard refresh browser (F5 / Ctrl+R) $\rightarrow$ Pastikan badge merah "2 Pesan Belum Dibaca" dan badge angka di menu sidebar / daftar chat **hilang permanen (0 / bersih)**.
   - **Kasus 3**: Kirim balasan baru $\rightarrow$ Pastikan unread count tetap `0` saat di-refresh.
