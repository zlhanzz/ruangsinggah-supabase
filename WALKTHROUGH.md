# WALKTHROUGH: Penyajian Kuantitas Kamar Tersedia Dinamis pada Tipe Kamar Listing Mitra Biasa

## 1. Ringkasan Pekerjaan
Telah berhasil diimplementasikan penyajian kuantitas kamar tersedia secara dinamis dan akurat untuk seluruh tipe kamar pada listing milik Mitra Biasa (Non-KostManager) di [`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx):
- **Parser Kuantitas Kamar Tersedia (`parentRoomGroups`)**:
  - Mengambil data `availableRoomCount`, `availableRooms`, `availableCount`, dan `totalRooms` dari objek tipe kamar mitra biasa.
  - Memastikan jika kamar berstatus kosong/tersedia, kuantitas kamar riil yang dapat disewa terhitung dengan tepat.
- **Pembaruan Tampilan Badge Ketersediaan**:
  - **Kartu Tipe Kamar di Sidebar**: Menampilkan badge berformat `X Kamar Tersedia` (misal *`3 Kamar Tersedia`*, atau *`Penuh`* jika kamar habis/0).
  - **Header Fasilitas Kamar di Kolom Utama**: Menampilkan badge `X Kamar Tersedia` pada tipe kamar yang sedang aktif.
  - **Tab Switcher Tipe Kamar**: Menampilkan badge mini `X Tersedia` pada masing-masing tombol tab pemilih tipe kamar.
- **Konsistensi Alur Pemesanan**:
  - Listing Mitra Biasa dapat langsung memilih tipe kamar dan durasi sewa, sedangkan listing KostManager tetap menyediakan pemilihan nomor/unit kamar individual.

---

## 2. Rincian Perubahan Berkas

### [`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx)
- Memperbarui pemetaan `parentRoomGroups` untuk regular kost (`!kost.isManaged`) agar menghitung `availableCount` dan `totalCount` dari properti `availableRoomCount` / `availableRooms` / `availableCount`.
- Memperbarui badge pada kartu tipe kamar di sidebar (baris ~2435).
- Memperbarui badge pada header seksian fasilitas kamar di badan utama (baris ~1870).
- Menambahkan badge mini kuantitas kamar pada tab selector tipe kamar di badan utama (baris ~1845).

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 22.90s
Exit code: 0 (0 error)
```

---

## 4. Panduan Verifikasi Pengguna
1. Buka halaman detail kost mitra biasa (`/kost/:id`) di browser.
2. Periksa kartu tipe kamar di sidebar:
   - Badge ketersediaan kini menampilkan kuantitas riil (misal: *`3 Kamar Tersedia`* bukan sekadar teks *"Tersedia"*).
3. Periksa seksian *Fasilitas Kamar* di badan utama listing:
   - Tab switcher menampilkan badge `X Tersedia`.
   - Header tipe kamar aktif menampilkan badge `X Kamar Tersedia`.
