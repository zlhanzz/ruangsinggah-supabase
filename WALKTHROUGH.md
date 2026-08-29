# WALKTHROUGH — Perbaikan RLS Violations `notifications` & Penyelarasan Sub-Label KostManager

**Tanggal Selesai**: 30 Agustus 2026  
**Entry PROGRESS.md**: #208  
**Branch**: `bukan-productions`

---

## 1. Ringkasan Masalah & Perbaikan

### A. Error RLS Policy pada `notifications`
- **Gejala**:
  Saat pengguna mengirim pesan obrolan, console browser menampilkan error:
  ```text
  notificationService.ts:40
   Notification insertion failed: new row violates row-level security policy for table "notifications"
  ```
- **Akar Masalah**:
  Tabel `notifications` mengizinkan `INSERT` untuk semua orang (`WITH CHECK (true)`), namun membatasi `SELECT` hanya untuk pemilik record yang sedang login (`USING (auth.uid() = user_id)`). Fungsi `sendNotification` sebelumnya memanggil `.insert([...]).select().single()`. Pemanggilan `.select()` memicu query SELECT balik ke PostgreSQL untuk row yang `user_id`-nya adalah lawan bicara/mitra/admin, sehingga PostgREST membatalkannya dengan error kode `42501`.
- **Solusi**:
  Menghapus chaining `.select().single()` pada `sendNotification()` di `functions/public/notificationService.ts` sehingga PostgREST hanya mengeksekusi operasi `INSERT` murni.

### B. Sub-Label Kontak di Jendela Chat
- **Gejala**:
  Header obrolan pada properti terkelola menampilkan teks: `kost madani • TIM KOSTMANAGER (PEMILIK)`.
- **Solusi**:
  Menyelaraskan logika penentuan label di `ChatWindow.tsx` agar kontak dengan tipe `admin`, `manager`, atau bernama mengandung `KostManager` menampilkan label **`TIM KOSTMANAGER (PENGELOLA RESMI)`**.

---

## 2. File yang Diubah

1. **[`functions/public/notificationService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/notificationService.ts)**:
   - Mengubah `supabase.from('notifications').insert([...]).select().single()` menjadi `supabase.from('notifications').insert([...])`.
   - Mengembalikan `{ success: true }` jika tidak ada error.
2. **[`functions/public/components/ChatWindow.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/ChatWindow.tsx)**:
   - Memperluas interface `ChatWindowProps`: `contactType?: 'owner' | 'caretaker' | 'admin' | 'manager'`.
   - Menghasilkan label dinamis `Pengelola Resmi` untuk KostManager.
3. **[`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md)**:
   - Mencatat progres pekerjaan pada Entry #208.

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
✓ built in 34.06s (Exit code 0)
```
- 0 error TypeScript
- 0 warning kompilasi fatal

---

## 4. Panduan Verifikasi Pengguna

1. Buka kembali halaman obrolan di menu **Kost Saya** (`/my-bookings/aktif`) pada kartu sewa Kost Madani.
2. Perhatikan sub-label di header chat: kini tertulis rapi dan profesional sebagai **`TIM KOSTMANAGER (PENGELOLA RESMI)`**.
3. Kirimkan pesan obrolan (misal: *"Halo kak"*).
4. Buka Console DevTools (F12): pesan terkirim seketika, dan pesan error `Notification insertion failed: new row violates row-level security policy for table "notifications"` sudah tidak muncul lagi.
