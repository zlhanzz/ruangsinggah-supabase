# Rencana Implementasi: Integrasi & Sinkronisasi Riwayat Pembayaran Sewa / Perpanjangan Sewa Online pada Portal KostManager (`KostManagerPortal.tsx`)

Dokumen ini menganalisis akar masalah dan menyusun rencana perbaikan agar seluruh transaksi pembayaran sewa online, simulasi perpanjangan sewa, serta tagihan kamar pada properti kelolaan KostManager otomatis tampil secara lengkap pada menu **"Riwayat Pembayaran Sewa"** (`/dashboard-admin/km_billing`).

---

## 1. Analisis Masalah & Akar Penyebab (Root Cause)

### Gejala Masalah:
- Pengguna telah melakukan simulasi perpanjangan sewa (atau pembayaran sewa online), namun tabel **"Riwayat Pembayaran Sewa"** di Portal KostManager (`/dashboard-admin/km_billing`) masih kosong melompong (0 data).

### Akar Penyebab:
1. **Pemuatan Data Tagihan Terisolasi Hanya pada Tabel Manual**:
   - Pada fungsi `loadAllData` di [`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx#L1698-L1710), state `invoices` sebelumnya **hanya memuat data dari fungsi `getManualInvoices()`** (tabel `invoices`).
   - Tabel `invoices` ini hanya terisi jika admin menekan tombol manual *"➕ Terbitkan Tagihan Sewa"*.
2. **Transaksi Online & Perpanjangan Sewa Tersimpan di Tabel `transactions`**:
   - Setiap kali penyewa melakukan pembayaran booking sewa, perpanjangan sewa (`product_type: 'perpanjangan_sewa'`), atau pelunasan tagihan fasilitas, data tersimpan secara otomatis di tabel **`transactions`**.
   - Karena transaksi dari tabel `transactions` belum dimapping ke dalam daftar `invoices`, maka tabel "Riwayat Pembayaran Sewa" di portal tidak pernah menampilkan pembayaran sewa online tersebut.
3. **Filter `product_type` di Query Transaksi Belum Menyertakan `perpanjangan_sewa`**:
   - Filter query `transactions` pada `KostManagerPortal.tsx` baris 1718 sebelumnya hanya membatasi `['kost_booking', 'sewa', 'rent', 'tagihan_ekstra']` tanpa menyertakan tipe `'perpanjangan_sewa'`.

---

## 2. Solusi yang Direncanakan

1. **Perluas Filter Transaksi Properti Terkelola**:
   - Memastikan query `transactions` menyertakan `product_type` `'perpanjangan_sewa'`, `'kost_booking'`, `'sewa'`, `'rent'`, dan `'tagihan_ekstra'`.
2. **Transformasi & Sinkronisasi Otomatis Transaksi Online ke Format `InvoiceRecord`**:
   - Memetakan setiap transaksi sewa online menjadi format invoice standar:
     - `bill_number`: `#INV-{id}` atau nomor invoice transaksi.
     - `recipient_name`: Nama penyewa / pemesan.
     - `recipient_phone`: Nomor WhatsApp penyewa.
     - `kost_name`: Nama properti kost kelolaan.
     - `bill_date`: Tanggal transaksi dibuat/dibayar.
     - `due_date`: Tanggal jatuh tempo sewa yang diperpanjang.
     - `total`: Nominal transaksi yang dibayarkan.
     - `status`: `paid` jika transaksi lunas (`PAID`/`SETTLEMENT`/`SUCCESS`), `issued` jika pending, `cancelled` jika batal/expired.
     - `notes`: Rincian perpanjangan (misal: *Perpanjangan Sewa (1 Bulan) - Kamar 3*).
3. **Penggabungan Terpadu (Unified Invoices List)**:
   - Menggabungkan data tagihan manual dari `getManualInvoices()` dan seluruh riwayat transaksi sewa online dari `transactions`.
   - Mengurutkan data secara kronologis (dari transaksi terbaru).
4. **Dukungan Kwitansi Digital & WhatsApp**:
   - Memastikan tombol **"🧾 Kwitansi"** dan **"Kirim Kwitansi WA"** di baris tabel dapat langsung dibuka dan mencetak kwitansi resmi PT RUANG SINGGAH NUSANTARA untuk transaksi perpanjangan sewa online tersebut.

---

## 3. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) | Menambahkan `'perpanjangan_sewa'` pada filter transaksi, mengintegrasikan transaksi online sewa ke dalam state `invoices`, dan menyelaraskan aksi kwitansi digital. |
| 2 | `functions/PROGRESS.md` | Pencatatan riwayat penambahan fitur #215 (Anti-Amnesia). |
| 3 | `WALKTHROUGH.md` | Penerbitan dokumentasi walkthrough hasil pengujian. |

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Langkah 1: Perbarui Query & Mapping Data di `loadAllData` (`KostManagerPortal.tsx`)**
   - Sertakan `perpanjangan_sewa` pada query `transactions`.
   - Bangun pemetaan `onlineTrxInvoices` dari seluruh transaksi sewa milik properti KostManager terkelola.
2. **Langkah 2: Gabungkan & Deduplikasi Invoices**
   - Gabungkan `rentInvoices` manual dan `onlineTrxInvoices`.
   - Set ke state `setInvoices(combinedInvoices)`.
3. **Langkah 3: Uji Kompilasi & Build**
   - Jalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 0 error kompilasi.
4. **Langkah 4: Dokumentasi & Git Push**
   - Catat di `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Lakukan `git commit` dan `git push origin bukan-productions`.

---

## 5. Rencana Verifikasi

- **Verifikasi Tampilan Tabel Riwayat Pembayaran Sewa**:
  - Buka `/dashboard-admin/km_billing`.
  - Pastikan transaksi perpanjangan sewa (dan pembayaran sewa online lainnya) muncul secara otomatis di tabel tanpa perlu diterbitkan manual.
- **Verifikasi Kwitansi**:
  - Klik tombol **"Kwitansi"** pada baris transaksi perpanjangan sewa dan pastikan modal kwitansi digital muncul lengkap dengan stempel dan detail periode baru.
- **Verifikasi Build**:
  - `npm run build` lulus 100% dengan 0 error.
