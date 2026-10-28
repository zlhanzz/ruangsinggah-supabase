# Rencana Implementasi: Perbaikan Mobile Friendly & Restorasi Alur Booking Proptech

Dokumen ini merinci rencana perbaikan agar modal pengajuan sewa ([BookingModal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/BookingModal.tsx)) tampil 100% *mobile friendly*, tidak tertutup oleh bilah navigasi bawah, serta mengembalikan visual alur transaksi proptech (**Pengajuan Sewa > Konfirmasi Pemilik > Pembayaran**) dengan desain modern dan ringkas.

---

## 1. Analisis Masalah Berdasarkan Feedback & Screenshot Pengguna

1. **Masalah Z-Index & Bilah Navigasi Bawah Menutupi Modal (*Bottom Nav Overlap*)**:
   - Pada [Navbar.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/Navbar.tsx) baris 422, Mobile Bottom Navigation Bar memiliki `z-[100]`.
   - Sebelumnya, modal diatur pada `z-[90]`. Akibatnya, bilah navigasi bawah (`Home`, `Search`, `Chat`, `Orders`, `Profile`) tetap berada di lapisan terdepan dan **menutupi Sticky Footer Action Bar** modal (total harga dan tombol submit `[ Ajukan Sewa ]` tenggelam di balik menu navigasi).
   - Solusi: Modal dan backdrop wajib dinaikkan ke **`z-[150]`**, sehingga modal secara penuh menutupi layar bawah seperti *native bottom sheet* standar Airbnb / Traveloka.
2. **Ketiadaan Alur Transaksi 3-Langkah**:
   - Pengguna secara eksplisit menginginkan agar alur pemesanan **Pengajuan Sewa > Konfirmasi Pemilik > Pembayaran** tetap terlihat, karena alur ini sangat penting untuk mengedukasi calon penyewa bahwa mereka **tidak perlu membayar saat ini**, melainkan baru membayar setelah pemilik kost menyetujui.
   - Solusi: Merestorasi indikator tahapan ini dalam bentuk **Stepped Progress Bar Modern & Ringkas** yang proporsional, hemat ruang vertikal, dan nyaman dilihat di layar ponsel maupun desktop.
3. **Penyempurnaan Garis Pembatas / Border Glitch**:
   - Menghilangkan glitch border vertikal pada bar edukasi yang tampak pada crop gambar kedua pengguna.

---

## 2. Rencana Solusi UI/UX Standar Industri

### A. Tumpukan Lapisan Layar & Safe Area (`z-[150]` & Bottom-Safe)
- Mengubah kontainer modal menjadi `z-[150]` (di atas `Navbar` mobile `z-[100]`).
- Pada layar ponsel, modal melekat sempurna di batas bawah layar dengan padding safe-area (`pb-[max(1rem,env(safe-area-inset-bottom))]`).
- Sticky Action Bar (Total Tagihan di kiri, Tombol `Ajukan Sewa` di kanan) akan 100% tampak di atas layar ponsel tanpa ada elemen navigasi yang menghalangi.

### B. Restorasi Stepper Alur Transaksi (Sleek 3-Step Flow Bar)
- Menampilkan visual tahapan 3 langkah yang ringkas dan ramah pengguna di bawah header:
  - **Tahap 1 (Aktif)**: `1. Pengajuan Sewa` (Badge oranye aktif + teks tebal).
  - Pemisah: Ikon `ChevronRight` halus.
  - **Tahap 2**: `2. Konfirmasi Pemilik` (Teks abu-abu netral).
  - Pemisah: Ikon `ChevronRight` halus.
  - **Tahap 3**: `3. Pembayaran` (Teks abu-abu netral).
- Dilengkapi catatan edukatif mini:
  `💡 Anda belum dikenakan biaya apapun. Pembayaran baru dilakukan setelah pemilik kost menyetujui pengajuan.`

### C. Responsivitas Konten Formulir di Ponsel
- Grid durasi sewa, tanggal masuk, dan tamu disesuaikan agar padding dan tinggi elemen pas untuk sentuhan jempol (*thumb-zone friendly*).
- Menjamin tidak ada scroll horizontal atau elemen yang terpotong ke samping.

---

## 3. Dampak Perubahan

File yang akan disentuh:
1. `functions/public/components/BookingModal.tsx`
   - Naikkan z-index kontainer menjadi `z-[150]`.
   - Tambahkan komponen Stepper Alur Booking 3-Langkah (`Pengajuan Sewa > Konfirmasi Pemilik > Pembayaran`).
   - Berikan safe-area handling pada sticky footer bar agar tombol selalu terlihat di semua perangkat mobile.
2. `functions/PROGRESS.md`
   - Catat pembaruan progres perbaikan mobile z-index dan restorasi alur booking.
3. `WALKTHROUGH.md`
   - Dokumentasi hasil pengujian.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

1. Modifikasi `BookingModal.tsx`:
   - Ganti `z-[90]` menjadi `z-[150]`.
   - Sisipkan breadcrumb/stepper 3-tahap ringkas di bawah header modal.
   - Sempurnakan layout sticky footer dengan `pb-[max(1rem,env(safe-area-inset-bottom))]`.
2. Jalankan kompilasi frontend `npm --prefix functions/public run build` dan kompilasi backend `npm --prefix functions run build`.
3. Verifikasi secara teliti bahwa modal berada di atas bilah navigasi bawah dan alur booking tampil jelas.
4. Catat riwayat di `functions/PROGRESS.md`, perbarui `WALKTHROUGH.md`, serta commit & push ke `bukan-productions`.

---

## 5. Rencana Verifikasi

- **Kompilasi**: Memastikan build Vite dan tsc lulus 100% (0 error).
- **Verifikasi Mobile Viewport**: Memastikan modal tampil menutupi bottom navigation bar, sticky footer bar terlihat penuh bersama tombol CTA, dan alur 3-langkah terbaca jelas.
- **Kepatuhan Ikon**: 100% vector SVG `lucide-react`, 0% Google Fonts ligature.
