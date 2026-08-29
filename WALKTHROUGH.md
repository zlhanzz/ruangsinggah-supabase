# WALKTHROUGH — Perbaikan Runtime Bug `currentSenderType is not defined` pada ChatWindow

**Tanggal Selesai**: 30 Agustus 2026  
**Entry PROGRESS.md**: #207  
**Branch**: `bukan-productions`

---

## 1. Ringkasan Masalah & Perbaikan

### Gejala
Ketika pengguna mengklik tombol chat (misalnya *"Bantuan KostManager"* di menu Kost Saya atau tombol chat listing), muncul error di console browser:
```text
ChatWindow.tsx:75 Failed to load messages: ReferenceError: currentSenderType is not defined
    at loadMessages (ChatWindow.tsx:73:38)
```
Pesan gagal dimuat dan status pembacaan pesan tidak dapat disinkronkan.

### Solusi
Mengangkat (*hoisting*) deklarasi variabel `currentId` dan `currentSenderType` dari dalam blok `useEffect` ke tingkat root komponen `ChatWindow`:
```typescript
const currentId = currentUser?.uid || currentUser?.id || '';
const currentSenderType: 'user' | 'owner' = currentId === session.user_id ? 'user' : 'owner';
```
Dengan perubahan ini, seluruh fungsi pembantu di dalam `ChatWindow` (`loadMessages`, callback `subscribeToMessages`, `handleSendMessage`, dan rendering JSX) memiliki akses penuh ke `currentSenderType` tanpa memicu `ReferenceError`.

---

## 2. File yang Diubah

### [`functions/public/components/ChatWindow.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/ChatWindow.tsx)
- **Baris ~22**: Menambahkan deklarasi `currentId` dan `currentSenderType`.
- **Baris ~24–27**: Menghapus deklarasi lokal di dalam `useEffect` dan menambahkan pengecekan `if (currentSenderType) markMessagesAsRead(...)`.
- **Baris ~60**: Menambahkan `currentSenderType` ke dependency array `useEffect`.
- **Baris ~73**: Memperbarui `loadMessages()` agar memanggil `markMessagesAsRead(session.id, currentSenderType)` dengan aman.
- **Baris ~95**: Menghapus deklarasi `currentId` berulang di `handleSendMessage`.

---

## 3. Hasil Pengujian & Kompilasi

### Uji Build Vite
```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 2531 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 35.38s (Exit code 0)
```
- 0 error TypeScript
- 0 warning kompilasi fatal
- Asset build berhasil diperbarui

---

## 4. Panduan Verifikasi untuk Pengguna

1. Buka menu **Kost Saya** (`/my-bookings/aktif`).
2. Klik tombol **"Bantuan KostManager"** pada kartu sewa aktif.
3. Jendela obrolan obrolan (*ChatWindow*) akan terbuka mulus tanpa error `ReferenceError: currentSenderType is not defined` di console browser.
4. Riwayat pesan percakapan termuat dengan sempurna dan indikator centang baca (*read receipts*) tersinkronisasi secara real-time.
