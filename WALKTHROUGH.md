# Walkthrough: Perbaikan HTTP 400 Bad Request `users?referred_by=...` pada `AgentDashboard.tsx`

Dokumen ini merangkum perbaikan network error HTTP 400 Bad Request saat memuat riwayat mitra yang bergabung menggunakan kode referral agen di Dashboard Agen.

---

## 1. Ringkasan Perubahan & Hasil Perbaikan

| Area / Lokasi | Kondisi Sebelum Perbaikan | Kondisi Setelah Perbaikan |
| :--- | :--- | :--- |
| **Konsol Browser saat Buka Dashboard Agen** | Muncul network request gagal:<br>`GET .../rest/v1/users?select=name%2Ccreated_at&referred_by=eq.AGE0MDNV&role=eq.mitra&order=created_at.desc 400 (Bad Request)` | Request berjalan lancar mengarah ke tabel `mitra` dengan status **200 OK**. Error 400 hilang total dari console browser. |
| **Penyajian Riwayat Mitra & Ticker Referral** | Kueri gagal melempar error sehingga data mitra yang diundang tidak termuat. | Data mitra berhasil termuat dari tabel `mitra` dengan relasi `users:user_id(name, full_name)` dan tampil rapi pada card ticker referral agen. |

---

## 2. File & Modifikasi yang Dilakukan

1. **[`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)**:
   - Mengubah kueri dari tabel `users` (yang tidak memiliki kolom `referred_by`) menjadi tabel `mitra`:
     ```tsx
     const { data: referredMitra, error: refError } = await supabase
         .from('mitra')
         .select('created_at, users:user_id ( name, full_name )')
         .eq('referred_by', codeToCheck)
         .order('created_at', { ascending: false });

     if (!refError && referredMitra) {
         const formatted = referredMitra.map((item: any) => {
             const u = Array.isArray(item.users) ? item.users[0] : item.users;
             return {
                 name: u?.name || u?.full_name || 'Mitra Kost',
                 created_at: item.created_at
             };
         });
         setReferralHistory(formatted);
     }
     ```
   - Membungkus kueri dengan penanganan `try-catch` defensif.

---

## 3. Hasil Pengujian & Verifikasi Build

1. **Uji Kompilasi Front-End**:
   - Menjalankan `npm.cmd run build` di direktori `functions/public`:
     ```
     vite v6.4.1 building for production...
     transforming...
     ✓ 2512 modules transformed.
     rendering chunks...
     computing gzip size...
     ✓ built in 49.98s
     ```
   - **Hasil**: 100% Lulus (0 error, 0 warning baru).
2. **Uji Kueri Database**:
   - Pengujian kueri tabel `mitra` dengan relasi `users:user_id(name)` berhasil mengembalikan status 200 OK.

---

## 4. Panduan Verifikasi Pengguna (UI Testing Guide)

1. **Buka Dashboard Agen**:
   - Buka halaman Dashboard Agen (`/dashboard`) dan login dengan akun Agen Survei.
2. **Periksa Network Tab / Console**:
   - Buka DevTools Browser (F12) -> tab **Console** dan tab **Network**.
   - Pastikan tidak ada lagi request merah `GET .../rest/v1/users?referred_by=... 400 (Bad Request)`.
3. **Periksa Card Referral**:
   - Lihat bagian card kode referral agen di bagian atas/dashboard. Ticker referral menampilkan riwayat mitra yang terdaftar dengan kode agen secara mulus.
