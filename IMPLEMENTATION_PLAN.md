# Rencana Implementasi: Sistem Riwayat Tiket Kendala & Tracking Status Penanganan di Halaman "Kost Saya" (`MyKost.tsx`)

Dokumen ini merancang penambahan antarmuka **Riwayat Tiket Kendala Penghuni** dengan navigasi 2-tab internal di dalam modal formulir kendala di [`MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx), sehingga penghuni dapat memantau seluruh tiket kendala yang pernah diajukan beserta status penanganan real-time dari pengelola/teknisi.

---

## 1. Analisis Masalah & Kebutuhan

### Masukan Pengguna:
- *"pada laporan kendala, apakah riwayat tiket pengiriman atau pelaporan kendalanya tidak dapat dilihat? kalau begini bikin user ragu apakah laporannya benar benar sudah terkirim atau tidak"*
- **Permasalahan**:
  1. Saat ini setelah penghuni mengirim laporan kendala kamar, modal langsung tertutup dan tidak ada tempat bagi penghuni untuk memeriksa kembali daftar tiket yang telah dikirim.
  2. Penghuni tidak memiliki visibilitas terhadap status tindak lanjut kendala (*Apakah laporan sudah dibaca pengelola? Apakah teknisi sedang menangani? Apakah sudah selesai?*).
- **Tujuan Pengembangan**:
  1. Menghadirkan **Navigasi 2-Tab Internal** pada modal Layanan Kendala:
     - **Tab 1: 📝 Buat Laporan Baru** (Formulir pengajuan tiket baru).
     - **Tab 2: 📋 Riwayat Tiket Saya (X)** (Daftar tiket historis beserta tracking status).
  2. Saat laporan berhasil dikirim, sistem otomatis mengalihkan pengguna ke **Tab 2 (Riwayat Tiket)** dan menyajikan tiket yang baru dibuat di posisi teratas dengan status `⏳ Baru Masuk / Menunggu Tindakan`. Ini memberikan kepastian instan (*instant reassurance*) kepada penghuni bahwa laporannya 100% tersimpan di sistem.
  3. Menyajikan kartu tiket yang informatif:
     - ID Tiket / Nomor Referensi, waktu pengajuan lengkap.
     - Badge Kategori (AC, Air, Listrik, dll.) & Badge Tingkat Urgensi (Darurat vs Standar).
     - Badge Status Real-Time (`⏳ Menunggu Tindakan`, `⚙️ Sedang Diproses`, `✅ Selesai Ditangani`).
     - Pokok masalah dan rincian deskripsi kerusakan.
     - Galeri thumbnail foto bukti kerusakan (dengan fitur klik untuk memperbesar).
     - Catatan/tanggapan dari pengelola/teknisi jika ada (`admin_notes`).

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Menambahkan state `complaintModalTab`, `myComplaints`, query pembacaan riwayat tiket dari Supabase, navigasi tab internal pada header modal, rendering daftar kartu riwayat tiket, dan auto-switch tab setelah submit sukses. |
| 2 | `functions/PROGRESS.md` | Pencatatan riwayat fitur (Anti-Amnesia). |
| 3 | `WALKTHROUGH.md` | Dokumentasi walkthrough hasil pengujian. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

### Langkah 1: Penambahan State & Query Riwayat Tiket di `MyKost.tsx`
- Tambahkan state `complaintModalTab: 'form' | 'history'`, `myComplaints: any[]`, `loadingComplaints: boolean`, dan `previewComplaintPhotoUrl: string | null`.
- Buat fungsi `fetchMyComplaints(kostId)` yang mengambil seluruh tiket kendala milik user dari tabel `complaints` di Supabase (`user_id = user.uid`).
- Panggil `fetchMyComplaints` saat modal dibuka (`handleOpenComplaint`).

### Langkah 2: Desain Header 2-Tab pada Modal Lapor Kendala
- Di bawah judul modal, buat segmented control 2-tab modern:
  - **`📝 Buat Laporan Baru`**
  - **`📋 Riwayat Tiket Saya`** (dengan badge counter jumlah tiket).

### Langkah 3: Desain Tampilan Tab Riwayat Tiket
- **Jika Ada Tiket**:
  - Render list kartu tiket dengan border halus dan background modern.
  - Tampilkan header tiket: Nomor referensi, tanggal kirim, badge urgensi, badge kategori, dan badge status penanganan dengan warna kontras yang jelas.
  - Tampilkan deskripsi kerusakan dan thumbnail galeri foto WebP (dengan tombol zoom preview).
  - Tampilkan panel catatan pengelola jika admin/teknisi telah memberikan catatan respon.
- **Jika Belum Ada Tiket**:
  - Tampilan empty state yang ramah: *"Belum ada riwayat laporan kendala. Fasilitas kamar Anda terpantau aman dan prima!"* dengan tombol *"Buat Laporan Baru"*.

### Langkah 4: Otomasi Pasca-Submit
- Saat fungsi `submitComplaint` berhasil mengeksekusi insert database:
  - Segarkan data riwayat `await fetchMyComplaints(...)`.
  - Pindahkan tab aktif ke `'history'` secara otomatis.
  - Berikan feedback notifikasi sukses.

### Langkah 5: Uji Kompilasi & Build
- Jalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan 100% bebas error kompilasi.

### Langkah 6: Dokumentasi & Git Push
- Catat riwayat di `functions/PROGRESS.md` (Fitur #220).
- Terbitkan dokumen `WALKTHROUGH.md`.
- Commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Transisi Tab**:
   - Buka modal "Lapor Kendala Kamar" di halaman `Kost Saya`.
   - Berpindah antara tab "Buat Laporan Baru" dan "Riwayat Tiket Saya".
2. **Uji Pengiriman & Auto-Switch**:
   - Isi form laporan baru dan klik "Kirim Laporan Kendala".
   - Verifikasi bahwa modal langsung berpindah ke tab Riwayat dan tiket yang baru saja dibuat tampil di paling atas dengan status `⏳ Menunggu Tindakan`.
3. **Uji Tampilan Detail Tiket**:
   - Periksa kejelasan informasi nomor kamar, tanggal, kategori, urgensi, foto bukti, dan status penanganan.
4. **Uji Build**:
   - Kompilasi `cmd /c npm run build` lulus 100% (0 error).
