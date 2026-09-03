# IMPLEMENTATION PLAN: Tampilan Penuh Menyeluruh Right Sidebar Booking Card di KostDetail.tsx

## 1. Analisis Masalah & Kebutuhan
- **Masalah**: Pada layar desktop, card samping (*Right Sidebar Booking Card*) yang memuat informasi harga sewa, biaya tambahan, pilihan tipe kamar, pilihan nomor kamar unit, pilihan durasi sewa, rincian fasilitas kamar, dan tombol ajukan sewa memiliki pembatasan tinggi `lg:max-h-[calc(100vh-5.5rem)]` dan `lg:overflow-y-auto`.
- **Dampak Bagi Pengguna**: Jika properti memiliki banyak tipe kamar, unit kamar, atau fasilitas yang banyak, informasi di dalam card terpotong dan memunculkan *nested scrollbar* internal. Pengguna seringkali tidak menyadari bahwa card tersebut dapat di-scroll atau tidak mengetahui keberadaan tombol "Ajukan Sewa" di bagian bawah.
- **Tujuan**: Menghapus batasan `max-h` dan scrollbar internal pada card sidebar booking di `KostDetail.tsx`, sehingga card memanjang secara natural dan menyajikan seluruh informasi serta tombol transaksi sewa secara menyeluruh, jelas, dan terbuka tanpa terpotong.

---

## 2. Dampak Perubahan
- **File Tersentuh**:
  - `functions/public/pages/KostDetail.tsx` (Container Right Sidebar Booking Card)

---

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `KostDetail.tsx`**:
   - Menghapus kelas `lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-5 lg:scrollbar-thin lg:scrollbar-thumb-orange-200` pada container card booking.
   - Mengganti styling container menjadi natural full-height: `className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-7 border border-gray-100 shadow-xl shadow-gray-100/50"`.
2. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di direktori `functions/public/` untuk memastikan kompilasi 0 error.
3. **Pencatatan Riwayat & Git Push**:
   - Mencatat progres nomor 295 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Membuka halaman detail kost (`/kost/:id`) pada layar desktop.
- Memastikan card samping kanan menampilkan seluruh tipe kamar, nomor kamar, durasi sewa, fasilitas kamar, dan tombol "Ajukan Sewa" secara penuh tanpa adanya scrollbar internal atau teks/elemen yang terpotong.
