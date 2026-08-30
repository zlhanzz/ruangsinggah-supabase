# 📋 Rencana Implementasi: Perbaikan ReferenceError `setIsSubmitting` & Pembukaan Chat Bantuan KostManager (Kost Saya)

Dokumen ini berisi analisis tepat berdasarkan temuan stack trace error browser dan rencana eksekusi perbaikan tombol **"Bantuan KostManager"** pada menu **Kost Saya** (`MyKost.tsx`).

---

## 1. Analisis Masalah (Penyebab Pasti dari Stack Trace)

### 🔍 Temuan Stack Trace Browser
```text
MyKost.tsx:429 Failed to open chat: ReferenceError: setIsSubmitting is not defined
    at handleOpenChat (MyKost.tsx:397:13)
    at onClick (MyKost.tsx:2478:64)
MyKost.tsx:432 Uncaught (in promise) ReferenceError: setIsSubmitting is not defined
    at handleOpenChat (MyKost.tsx:432:13)
```

### ⚙️ Akar Masalah (Root Cause)
1. **Deklarasi State `isSubmitting` Hilang / Tidak Didefinisikan di `MyKost.tsx`**:
   - Di dalam `MyKost.tsx`, fungsi `handleOpenChat` (baris 397 & 432), `handleCancelBooking` (baris 442 & 450), submit rating (baris 1301), perpanjangan sewa (baris 1324), komplain (baris 1441), dan tombol aksi modal menggunakan `isSubmitting` dan `setIsSubmitting`.
   - Namun, deklarasi `const [isSubmitting, setIsSubmitting] = useState(false);` tidak ada di daftar React state hook komponen `MyKost`.
   - Akibatnya, begitu tombol **"Bantuan KostManager"** diklik, JavaScript langsung melempar `ReferenceError: setIsSubmitting is not defined`.
   - Blok `catch (error)` menangkap error ini dan menampilkan dialog bawaan: *"Gagal membuka chat. Pastikan koneksi internet stabil atau hubungi sistem admin RuangSinggah."*.
   - Kemudian blok `finally` memanggil `setIsSubmitting(false)` yang kembali melempar `Uncaught ReferenceError`.

2. **Ketahanan Layanan Chat di [`chatService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/chatService.ts)**:
   - Selain memperbaiki state di `MyKost.tsx`, kita juga mengoptimalkan `ensureUserProfileExists` agar memeriksa keberadaan user di database publik sebelum mencoba upsert, sehingga pembukaan chat selalu 100% instan dan bebas dari kendala RLS.

---

## 2. Dampak Perubahan File

| File | Perubahan yang Dilakukan |
| :--- | :--- |
| [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Menambahkan deklarasi `const [isSubmitting, setIsSubmitting] = useState(false);` di state declarations, serta merapikan fallback user ID pada `handleOpenChat`. |
| [`functions/public/chatService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/chatService.ts) | Mengoptimalkan `ensureUserProfileExists` untuk memeriksa user yang sudah terdaftar (`select id from users`) agar proses pembuatan/pembukaan sesi chat instan dan stabil. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

### Langkah 1: Tambahkan State `isSubmitting` di `MyKost.tsx`
- Menambahkan `const [isSubmitting, setIsSubmitting] = useState(false);` pada baris ~103 bersama state loading lainnya.

### Langkah 2: Sempurnakan `handleOpenChat` di `MyKost.tsx`
- Pastikan resolusi user UID lengkap (`user.uid || user.id`).
- Tangani target KostManager (`SYSTEM_ADMIN_ID`).
- Log error detail dengan `error?.message || error`.

### Langkah 3: Optimasi `ensureUserProfileExists` di `chatService.ts`
- Tambahkan fast-path pengecekan profil user di database publik.

### Langkah 4: Verifikasi & Build
- Jalankan `npm run build` di `functions/public/` (pastikan 0 error).
- Catat ke `functions/PROGRESS.md` (Entry #212).
- Sajikan `WALKTHROUGH.md` dan push commit ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Klik Tombol Bantuan KostManager**:
   - Klik tombol **"Bantuan KostManager"** pada kartu pengajuan sewa Kamar 4.
   - Pastikan modal jendela chat (`ChatWindow`) langsung terbuka tanpa melempar ReferenceError.
2. **Uji Pengiriman Pesan Chat**:
   - Kirim pesan di dalam chat window dan verifikasi pesan terkirim real-time.
3. **Uji Kompilasi TypeScript**:
   - Jalankan `npm run build` dan pastikan lulus 100%.
