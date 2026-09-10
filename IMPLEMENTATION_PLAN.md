# IMPLEMENTATION PLAN: Pembatasan Eksklusif Badge 'TERVERIFIKASI' Hanya untuk Properti Berstatus KostManager

Dokumen ini disusun untuk merencanakan penyesuaian tampilan badge status `TERVERIFIKASI` pada katalog dan kartu properti, agar **eksklusif hanya ditampilkan pada properti yang telah terdaftar dan berstatus KostManager** (`isManaged: true` / `is_managed: true`).

---

## 1. Analisis Masalah & Kebutuhan

### Konteks & Masalah
- Pada tampilan saat ini (seperti pada halaman Hasil Pencarian / Katalog), kartu properti [`KostCard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostCard.tsx#L108) menampilkan badge biru `TERVERIFIKASI` dengan kondisi:
  ```tsx
  {(kost.isVerified || kost.isManaged) && (
    <span className="bg-[#2563eb] text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
      TERVERIFIKASI
    </span>
  )}
  ```
- Karena kondisi menggunakan operator OR `(kost.isVerified || kost.isManaged)`, setiap properti yang memiliki nilai kolom `is_verified = true` (misal properti self-listing mitra biasa yang sempat diverifikasi admin atau memiliki centang biru lama) ikut memunculkan badge `TERVERIFIKASI`.
- Akibatnya, pada halaman pencarian, properti biasa non-KostManager (seperti contoh pada screenshot: *"Kost Apalah Daya"* dan *"Kost Putri Tunggal"*) ikut memiliki badge `TERVERIFIKASI`.

### Kebutuhan Pengguna
- Pengguna meminta: *"saya ingin agar yang memiliki badge terverifikasi hanya yang berstatus kostmanager"*.
- Badge `TERVERIFIKASI` adalah simbol kepercayaan mutu tinggi yang dihasilkan dari survei fisik langsung lapangan oleh surveyor resmi KostManager.
- Properti yang bukan merupakan kelolaan / paket KostManager (`!isManaged`) **TIDAK BOLEH** menampilkan badge `TERVERIFIKASI`.

---

## 2. Dampak Perubahan (Files to be Modified)

1. **`functions/public/components/KostCard.tsx`**:
   - Memperbarui kondisi rendering badge dari `(kost.isVerified || kost.isManaged)` menjadi eksklusif memeriksa status KostManager: `Boolean(kost.isManaged || (kost as any).is_managed)`.
2. **`functions/public/pages/Home.tsx`**:
   - Menyelaraskan filter rekomendasi `featuredKosts` pada beranda agar memprioritaskan properti yang berstatus KostManager (`k.isManaged`), dengan fallback ke listing lain jika jumlah KostManager kurang dari 3 agar beranda tetap proporsional.
3. **`functions/public/pages/KostDetail.tsx`**:
   - Memastikan badge dan label "Terverifikasi RuangSinggah" di halaman detail tetap konsisten hanya muncul pada properti `kost.isManaged` (sudah sesuai, diverifikasi ulang).

---

## 3. Langkah-Langkah Eksekusi (Setelah Approval)

1. **Langkah 1: Modifikasi `functions/public/components/KostCard.tsx`**:
   - Mengubah baris 108:
     ```tsx
     // Sebelum:
     {(kost.isVerified || kost.isManaged) && (
       <span className="bg-[#2563eb] ...">TERVERIFIKASI</span>
     )}

     // Sesudah:
     {Boolean(kost.isManaged || (kost as any).is_managed) && (
       <span className="bg-[#2563eb] text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
         TERVERIFIKASI
       </span>
     )}
     ```
2. **Langkah 2: Penyelarasan Rekomendasi di `functions/public/pages/Home.tsx`**:
   - Memperbarui `featuredKosts` agar mengutamakan properti `isManaged`.
3. **Langkah 3: Pengujian & Validasi Kompilasi**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan 0 error kompilasi TypeScript/Vite.
   - Menguji tampilan visual kartu listing di browser untuk memastikan properti reguler/self-listing tidak lagi memiliki badge `TERVERIFIKASI`, dan hanya properti kelolaan KostManager yang menampilkannya.
4. **Langkah 4: Pencatatan Progres & Git Push**:
   - Mencatat pembaruan ke `functions/PROGRESS.md`.
   - Membuat laporan detail `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Verifikasi Tampilan Katalog (`/listings` & Hasil Pencarian)**:
   - Membuka halaman pencarian properti dan memeriksa kartu-kartu listing:
     - Properti reguler / self-listing mitra $\rightarrow$ **TIDAK** menampilkan badge biru `TERVERIFIKASI`.
     - Properti KostManager (`is_managed: true`) $\rightarrow$ **MENAMPILKAN** badge biru `TERVERIFIKASI`.
2. **Verifikasi Halaman Detail (`/kost/:id`)**:
   - Memastikan badge verifikasi di halaman detail konsisten hanya ada pada properti KostManager.
3. **Verifikasi Build**:
   - Memastikan `npm run build` lulus 100% tanpa error.
