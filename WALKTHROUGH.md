# Walkthrough: Integrasi & Sinkronisasi Riwayat Pembayaran Sewa & Perpanjangan Sewa Online pada Portal KostManager (`KostManagerPortal.tsx`)

Dokumen ini mendokumentasikan hasil perbaikan dan pengujian integrasi riwayat pembayaran sewa / perpanjangan sewa online agar otomatis terdata pada menu **"Riwayat Pembayaran Sewa"** di Portal KostManager (`/dashboard-admin/km_billing`).

---

## 1. Rincian Perubahan yang Diterapkan

### A. Perluasan Filter Query Transaksi (`loadAllData`):
- Memperluas query transaksi tabel `transactions` untuk properti KostManager dengan menambahkan filter `product_type: 'perpanjangan_sewa'`, selain `'kost_booking'`, `'sewa'`, `'rent'`, dan `'tagihan_ekstra'`.

### B. Pemetaan Otomatis Transaksi Online ke Format Invoices (`onlineInvoices`):
- Setiap transaksi online yang tercatat di tabel `transactions` kini otomatis diubah ke entri tagihan standar:
  - **No. Tagihan**: Mengambil `#INV-...` dari `order_id` atau ID transaksi unik.
  - **Penerima & Kontak**: Nama penyewa dan nomor WhatsApp pengguna.
  - **Kost & Kamar**: Nama properti dan nomor unit kamar yang disewa/diperpanjang.
  - **Tanggal & Jatuh Tempo**: Waktu pembayaran dan tanggal jatuh tempo baru.
  - **Total Tagihan**: Nominal transaksi yang telah dibayarkan.
  - **Status**: Status dinamis (`Lunas`, `Terbit`, atau `Batal`).

### C. Penggabungan Terpadu (*Unified Invoices Stream*):
- Menggabungkan data tagihan manual dari `getManualInvoices()` dan seluruh riwayat transaksi sewa online (`onlineInvoices`).
- Melakukan deduplikasi otomatis berdasarkan ID transaksi / invoice dan mengurutkannya dari yang terbaru.

### D. Akses Kwitansi Digital Resmi:
- Tombol **"🧾 Kwitansi"** pada setiap baris transaksi yang berstatus `paid` kini otomatis memetakan nomor kwitansi, nama penyewa, nomor kamar, periode sewa baru, dan rincian biaya ke dalam `DigitalReceiptModal`.

---

## 2. File yang Dimodifikasi

| File | Perubahan |
|---|---|
| [`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) | Perluasan filter query `transactions`, transformasi `onlineInvoices`, penggabungan ke state `invoices`, dan penyelarasan ekstraksi data kwitansi digital. |
| `functions/PROGRESS.md` | Pencatatan riwayat progres fitur #215. |
| `WALKTHROUGH.md` | Dokumentasi walkthrough hasil pengujian. |

---

## 3. Hasil Kompilasi & Build

- **Perintah Build**:
  ```bash
  cmd /c npm run build
  ```
- **Output**:
  ```
  vite v6.4.1 building for production...
  transforming...
  ✓ 2531 modules transformed.
  rendering chunks...
  computing gzip size...
  ✓ built in 34.84s
  exit code: 0
  ```

---

## 4. Panduan Verifikasi Pengguna (UI)

1. Buka browser dan arahkan ke menu **Portal KostManager -> Riwayat Pembayaran Sewa** (`http://localhost:5173/dashboard-admin/km_billing`).
2. Periksa tabel riwayat tagihan:
   - Seluruh transaksi pembayaran sewa online (termasuk simulasi perpanjangan sewa yang baru saja Anda lakukan) kini langsung muncul pada tabel.
   - Kolom memuat **No. Tagihan**, **Penerima (Kost)**, **Tanggal Tagihan**, **Jatuh Tempo**, **Total Tagihan**, dan badge hijau **Lunas**.
3. Klik tombol **"Kwitansi"** pada baris transaksi:
   - Lembar kwitansi digital resmi berstempel PT RUANG SINGGAH NUSANTARA akan terbuka menampilkan rincian sewa dan periode baru secara akurat.
