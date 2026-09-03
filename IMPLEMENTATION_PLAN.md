# IMPLEMENTATION PLAN: Redesain Mobile Bottom Navigation Bar Presisi Mockup Google Stitch

## 1. Analisis Masalah & Kebutuhan
- **Masalah Saat Ini**:
  - Ikon pada bottom navbar mobile berukuran terlalu kecil (`size={21}`), garis ikon tipis, dan warna font/ikon abu-abu muda (`text-gray-400`/`text-gray-500`) yang pudar sehingga sulit dilihat dan disentuh.
- **Kebutuhan Desain Referensi (Mockup Google Stitch)**:
  - **Ukuran Ikon**: Diperbesar ke ukuran standar `size={24}` (`w-6 h-6`).
  - **Ketebalan Garis (Stroke Width)**: Ditebalkan menjadi `strokeWidth={2.2}` untuk status inaktif dan `strokeWidth={2.5}` untuk status aktif.
  - **Warna & Kontras Teks/Ikon**:
    - **Inaktif**: Warna *dark slate* tegas (`text-[#334155]` / `text-[#1e293b]`) dengan font tebal `font-bold text-[11px]` (jelas dan mudah terbaca).
    - **Aktif**: Warna signature oranye/warm accent (`text-[#ff7a00]` / `fill-[#ff7a00]/15`) dengan font ekstra tebal `font-extrabold text-[11px]`.
  - **Container & Padding**: `py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]` dengan area ketuk (*tap target*) yang nyaman.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**: `functions/public/components/Navbar.tsx`.
- **Proteksi Logika**: Mempertahankan seluruh logika navigasi 5 menu (*Home, Search, Chat, Orders, Profile*), autentikasi redirect login, dan proteksi FOUT 100% menggunakan SVG `lucide-react`.

---

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `Navbar.tsx` (Bagian Mobile Bottom Navigation Bar)**:
   - Menerapkan styling baru pada container dan masing-masing dari ke-5 item menu (*Home*, *Search*, *Chat*, *Orders*, *Profile*).
   - Memastikan responsivitas dan kenyamanan *touch target* di semua layar smartphone.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
2. **Uji Tampilan & Interaktivitas Mobile**:
   - Menguji tampilan Mobile Bottom Navigation Bar di resolusi mobile (375px - 430px) untuk memastikan ikon tajam, jelas, kontras tinggi, dan nyaman diklik.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md`, memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
