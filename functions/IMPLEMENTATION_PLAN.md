# IMPLEMENTATION PLAN - Perbaikan Visibilitas Pesanan Survey pada Halaman Kost Saya

Rencana ini dibuat untuk memperbaiki masalah di mana pesanan survey tidak muncul pada menu "Kost Saya" bagi pengguna biasa yang belum memiliki transaksi sewa/booking kost.

## 1. Analisis Masalah
- **Masalah Utama**:
  - Pada fungsi `fetchMyKosts` di [MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx), terdapat logika pengecekan transaksi sewa/booking kost (`combinedData` alias `data`) setelah digabungkan dari `resident_status` dan `transactions`.
  - Jika `data.length === 0` (pengguna tidak memiliki riwayat hunian aktif atau booking sewa kost), fungsi tersebut langsung melakukan `return` awal (early return) pada baris 348-352:
    ```typescript
    } else {
        setActiveKosts([]);
        setLoading(false);
        return;
    }
    ```
  - Akibat dari early return ini, seluruh kode pemanggilan data di bawahnya—termasuk pengambilan data rekomendasi kost dan pengambilan data pesanan survey (`survey_requests` dari tabel Supabase)—terlewati dan tidak pernah dieksekusi untuk pengguna tersebut.
  - Ini menjelaskan mengapa pesanan survey muncul di akun admin (karena admin biasanya memiliki transaksi dummy sewa/booking kost), tetapi tidak muncul sama sekali di akun user biasa yang baru memesan survey.

- **Solusi**:
  - Hapus early return `return;` di block `else` tersebut.
  - Bungkus logika pemrosesan transaksi sewa kost (mulai dari inisialisasi `productIds` hingga pemetaan data hunian aktif `setActiveKosts(activeWithBills)`) ke dalam block kondisional `if (data && data.length > 0)`.
  - Pastikan state default `setActiveKosts([])` dan `setResidentStatus([])` tetap dipanggil jika tidak ada data hunian.
  - Lanjutkan alur eksekusi fungsi `fetchMyKosts` ke bawah untuk melakukan kueri rekomendasi properti dan pesanan survey, serta menonaktifkan loading state di blok `finally`.

## 2. Dampak Perubahan
File yang akan disentuh:
1. **`functions/public/pages/MyKost.tsx`**:
   - Modifikasi fungsi `fetchMyKosts` untuk merestrukturisasi penanganan data transaksi sewa kost tanpa melakukan `return` dini.

## 3. Langkah-Langkah Eksekusi
1. Buka file [MyKost.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx).
2. Temukan blok pengecekan `if (data && data.length > 0) ... else { setActiveKosts([]); setLoading(false); return; }` di fungsi `fetchMyKosts`.
3. Ubah logika tersebut agar:
   - Jika `data && data.length > 0`, jalankan proses pemetaan properti dan resident status.
   - Jika tidak ada data (`data.length === 0`), panggil `setActiveKosts([])` dan `setResidentStatus([])` tanpa melakukan `return;`.
4. Pastikan pemanggilan rekomendasi kost dan `survey_requests` berada di luar blok kondisional tersebut, sehingga selalu dieksekusi.
5. Bersihkan console log diagnostik yang tidak diperlukan.
6. Jalankan build lokal `npm run build` untuk memverifikasi tidak ada kesalahan sintaksis/kompilasi TypeScript.

## 4. Rencana Verifikasi
- Memastikan build Vite berjalan sukses tanpa error.
- Melakukan verifikasi dengan menjalankan aplikasi locally atau push ke repositori.
