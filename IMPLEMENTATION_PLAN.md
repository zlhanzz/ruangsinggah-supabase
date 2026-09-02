# IMPLEMENTATION PLAN: Penyesuaian Badge "TERVERIFIKASI" Berwarna Biru pada Kartu Kost

## 1. Analisis Masalah & Kebutuhan
Berdasarkan permintaan pengguna:
- **Teks Badge**: Diubah dari `"VERIFIED"` menjadi `"TERVERIFIKASI"`.
- **Warna Badge**: Diubah dari oranye (`bg-[#ff7a00]`) menjadi warna biru terverifikasi elegan (`bg-[#2563eb]`).

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**: `functions/public/components/KostCard.tsx`.
- **Proteksi Logika**: Kondisi `(kost.isVerified || kost.isManaged)` dan seluruh handler klik kartu tetap utuh 100%.

---

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `KostCard.tsx`**:
   - Mengubah badge verifikasi menjadi:
     ```tsx
     {(kost.isVerified || kost.isManaged) && (
       <span className="bg-[#2563eb] text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
         TERVERIFIKASI
       </span>
     )}
     ```

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
2. **Uji Tampilan**:
   - Memastikan kartu listing di halaman Beranda dan Hasil Pencarian menampilkan badge biru bertuliskan `TERVERIFIKASI`.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md`, memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
