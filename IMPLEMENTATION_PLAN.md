# IMPLEMENTATION PLAN: Perbaikan Error TypeError toLowerCase pada KostDetail.tsx

## 1. Analisis Masalah & Mengapa Terjadi pada Listing KostManager
- **Penyebab Error**:
  - Pada listing tipe **KostManager**, format data JSON kolom `campuses` atau `publicFacilities` dapat berupa:
    1. *Array of String* (misal `["UNHAS", "UIM"]` atau `["Dapur Bersama", "Area Parkir"]`),
    2. *Array of Object* (misal `[{ name: "UNHAS", distance: "2 km", lat: ..., lng: ... }]`), atau
    3. Mengandung elemen yang tidak memiliki properti `.name` (`undefined`).
  - Pada baris 897–898 di `KostDetail.tsx`, kode memanggil `p.name.toLowerCase()`. Ketika `p` berupa string mentah atau objek tanpa properti `name`, `p.name` bernilai `undefined`, sehingga memicu:
    `Uncaught TypeError: Cannot read properties of undefined (reading 'toLowerCase')`.

---

## 2. Batasan Cakupan & Proteksi Logika (Strict Scope Boundary)
- **File Terdampak**: `functions/public/pages/KostDetail.tsx`.
- **Proteksi Logika**:
  - Menjaga 100% kompatibilitas rute peta mini (*Interactive In-App Route Preview*), eliminasi duplikasi nama kampus vs fasilitas publik, serta render landmark terdekat.
  - Memastikan seluruh tipe listing (KostManager maupun Mitra biasa) dapat dibuka dengan mulus tanpa error.

---

## 3. Langkah-Langkah Eksekusi
1. **Normalisasi Komprehensif Data Kampus & Fasilitas Publik di `KostDetail.tsx` (baris 890–905)**:
   - Membuat normalizer yang menangani format *string* maupun *object*, serta menyaring elemen null/undefined:
     ```tsx
     const publicFacilitiesList = useMemo(() => {
       const raw = kost.publicFacilities || [];
       return raw
         .map((item: any) => {
           if (!item) return null;
           if (typeof item === 'string') {
             return { name: item, distance: '-', walkDuration: '', motoDuration: '', carDuration: '' };
           }
           if (typeof item === 'object' && item.name) {
             return item;
           }
           return null;
         })
         .filter((item): item is NonNullable<typeof item> => Boolean(item && item.name));
     }, [kost.publicFacilities]);

     const campusList = useMemo(() => {
       const raw = kost.campuses || [];
       const normalized = raw
         .map((item: any) => {
           if (!item) return null;
           if (typeof item === 'string') {
             return { name: item, distance: '-', walkDuration: '', motoDuration: '', carDuration: '' };
           }
           if (typeof item === 'object' && item.name) {
             return item;
           }
           return null;
         })
         .filter((item): item is NonNullable<typeof item> => Boolean(item && item.name));

       if (publicFacilitiesList.length === 0) return normalized;
       const publicNames = new Set(
         publicFacilitiesList.map(p => (p.name || '').toLowerCase().trim())
       );
       return normalized.filter(c => !publicNames.has((c.name || '').toLowerCase().trim()));
     }, [kost.campuses, publicFacilitiesList]);
     ```

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
2. **Uji Halaman Detail Kost (Semua Tipe Properti)**:
   - Membuka halaman detail properti KostManager dan properti Mitra biasa untuk memastikan halaman tampil sempurna tanpa crash.
3. **Pencatatan & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md`, memperbarui `WALKTHROUGH.md`, dan push ke `bukan-productions`.
