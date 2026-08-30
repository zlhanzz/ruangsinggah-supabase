# Rencana Implementasi: Penyelarasan Scroll & Sticky Section Booking (Desktop vs Mobile) pada Halaman Detail Kost

Dokumen ini menganalisis penyebab terperangkapnya gestur scroll (*scroll trapping*) pada section booking di tampilan mobile dan merumuskan solusi penyesuaian yang efektif untuk desktop maupun mobile pada [`KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx).

---

## 1. Analisis Masalah

### Kondisi & Masalah Saat Ini:
1. **Perubahan Sebelumnya untuk Desktop**:
   - Di tampilan desktop (`lg`), section booking ditempatkan di sidebar kolom kanan. Agar form booking yang panjang (pilihan tipe kamar, chip nomor kamar, pilihan durasi sewa, fasilitas kamar, dan tombol booking) tidak meluap ke bawah layar dan tetap nyaman diakses, kontainer booking diberikan pembatasan tinggi dan scroll internal:
     ```tsx
     <div className="sticky top-20">
       <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-7 border border-gray-100 shadow-xl shadow-gray-100/50 max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain pr-4 lg:pr-5 scrollbar-thin scrollbar-thumb-orange-200">
     ```
2. **Efek Negatif pada Tampilan Mobile (< lg)**:
   - Karena class `sticky top-20`, `max-h-[calc(100vh-5.5rem)]`, `overflow-y-auto`, dan `overscroll-contain` diaplikasikan secara global (tanpa modifier responsif `lg:`):
     - **Scroll Trapping (Terjebak Scroll)**: Pada layar mobile vertikal 1 kolom, ketika pengguna menggulir ke bawah hingga masuk ke section booking, sentuhan jari (*touch swipe*) langsung ditangkap oleh kontainer internal booking.
     - **Overscroll Contain**: Properti `overscroll-contain` secara eksplisit memutus rantai scroll (*scroll chaining*) ke halaman utama (`window`). Akibatnya, saat pengguna ingin menggeser layar kembali ke atas untuk melihat galeri foto atau informasi properti, gestur swipe tertahan di dalam card booking dan **tidak bisa kembali ke atas**.
     - **Sticky Berlebih di Mobile**: Posisi `sticky top-20` di mobile membuat card booking menempel canggung di layar ponsel saat pengguna scrolling.

---

## 2. Solusi yang Direncanakan

Melakukan pemisahan perilaku CSS murni berbasis responsive breakpoint Tailwind (`lg:`):

1. **Untuk Tampilan Desktop (`lg:` dan layar lebar $\ge 1024\text{px}$)**:
   - **Sticky Sidebar Aktif**: Menggunakan `lg:sticky lg:top-20`.
   - **Scroll Internal Mandiri**: Mempertahankan `lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-5 lg:scrollbar-thin lg:scrollbar-thumb-orange-200`.
   - **Manfaat**: Pengguna desktop tetap dapat menggulir form booking panjang di sidebar kanan secara mandiri dengan mouse wheel tanpa merusak tata letak konten utama di sisi kiri.

2. **Untuk Tampilan Mobile (`< lg` / layar ponsel & tablet $< 1024\text{px}$)**:
   - **Aliran Alami (Natural Document Flow)**: Menonaktifkan pembatasan tinggi internal dan scrollbar (`max-h-none overflow-visible overscroll-auto static lg:relative`).
   - **Bebas Scroll Trap (Zero Friction)**: Mengalirkan section booking sebagai bagian utuh dari halaman vertikal mobile. Pengguna dapat dengan leluasa menyentuh dan menggulir ke bawah maupun kembali ke atas menuju foto dan deskripsi kost tanpa pernah tersangkut.
   - **Padding Responsif**: Mengoptimalkan padding card agar pas di layar HP (`p-5 sm:p-6 lg:p-7`).

---

## 3. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx) | Menyelaraskan class wrapper booking card agar sifat `sticky`, `max-h`, `overflow-y-auto`, dan `overscroll-contain` hanya aktif di breakpoint desktop (`lg:`), sedangkan di mobile bersifat natural document flow (`overflow-visible`, `max-h-none`). |
| 2 | `functions/PROGRESS.md` | Pencatatan riwayat pekerjaan ke progress log utama (Anti-Amnesia). |
| 3 | `WALKTHROUGH.md` | Penerbitan dokumentasi walkthrough hasil pengujian. |

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Langkah 1: Modifikasi Wrapper Sidebar Booking di `KostDetail.tsx`**
   - Mengubah wrapper kolom kanan:
     - Dari:
       ```tsx
       {/* Right Sidebar - Booking Card */}
       <div className="relative">
         <div className="sticky top-20">
           <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-6 lg:p-7 border border-gray-100 shadow-xl shadow-gray-100/50 max-h-[calc(100vh-5.5rem)] overflow-y-auto overscroll-contain pr-4 lg:pr-5 scrollbar-thin scrollbar-thumb-orange-200">
       ```
     - Menjadi:
       ```tsx
       {/* Right Sidebar - Booking Card */}
       <div className="relative">
         <div className="lg:sticky lg:top-20">
           <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-7 border border-gray-100 shadow-xl shadow-gray-100/50 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-5 lg:scrollbar-thin lg:scrollbar-thumb-orange-200">
       ```

2. **Langkah 2: Uji Kompilasi & Build**
   - Menjalankan perintah `npm run build` di direktori `functions/public/` untuk memastikan tidak ada error syntax maupun kompilasi TypeScript.

3. **Langkah 3: Dokumentasi & Git Push**
   - Mencatat ke `functions/PROGRESS.md` dan membuat `WALKTHROUGH.md`.
   - Melakukan `git commit` dan `git push` ke branch `bukan-productions` sesuai aturan baku workspace.

---

## 5. Rencana Verifikasi

- **Verifikasi Mobile Viewport (< 1024px)**:
  - Buka halaman detail kost di mobile browser / simulasi DevTools (ukuran 360px - 430px).
  - Gulir ke bawah hingga section booking.
  - Lakukan gestur scroll kembali ke atas: halaman harus langsung menggulir ke atas dengan lancar tanpa hambatan dan tanpa terjebak di dalam card booking.
- **Verifikasi Desktop Viewport ($\ge$ 1024px)**:
  - Buka halaman detail kost di desktop browser.
  - Pastikan card booking tetap berada di sidebar kanan dalam mode `sticky`.
  - Jika pilihan kamar atau variasi durasi panjang, arahkan mouse ke card booking dan pastikan card tetap dapat di-scroll internal secara mandiri tanpa merusak halaman utama.
- **Verifikasi Build**: `npm run build` lulus 100% dengan 0 error.
