# Implementation Plan: Pemisahan & Filtrasi Ketat Properti KostManager vs Mitra Biasa di Portal Operasional

## 1. Analisis Masalah & Kebutuhan

### Masalah Saat Ini:
- Pada halaman **Portal KostManager** ([`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)), seluruh data properti di database `properties` yang berstatus bukan draf diambil tanpa filter (`.neq('status', 'draft')`), sehingga properti milik **Mitra Biasa / Regular Listings** (yang memiliki flag `is_managed = false` dan bukan merupakan langganan KostManager) ikut muncul di daftar *"PROPERTI TERKELOLA"* dengan status *"AKTIF TERKELOLA"*.
- Hal ini menyebabkan data portofolio, statistik okupansi, daftar penghuni, dan penagihan sewa di Portal Operasional KostManager tercampur aduk dengan listing reguler umum.

### Solusi & Standar Baru:
Sistem harus secara cerdas dan ketat membedakan mana properti kelolaan **KostManager (Autopilot)** dan mana listing **Mitra Biasa**:
1. **Definisi Properti KostManager**:
   Properti dianggap sebagai properti terkelola KostManager **HANYA JIKA**:
   - Properti memiliki flag database `is_managed === true` (telah disetujui/diaktifkan oleh admin atau didaftarkan melalui alur KostManager).
   - **ATAU** Pemilik properti (`owner_uid`) tercatat memiliki status langganan `subscription_status = 'kostmanager'` di tabel `mitra`.
   - **ATAU** Properti terhubung secara resmi ke pengajuan aktif `kostmanager_requests` (`status = 'ACTIVE'`).
2. **Pembersihan & Isolasi Data di Portal KostManager**:
   - `loadAllData()` pada [`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) memfilter `props` secara ketat hanya untuk properti yang memenuhi kriteria KostManager di atas.
   - Properti reguler non-KostManager (`is_managed = false` dan bukan langganan KostManager) **100% diisolasi dan dilarang masuk ke Portal Operasional KostManager**.
   - Data penghuni (`tenants`), statistik kamar (`occupancyRate`, `totalEmpty`), dan tagihan sewa (`invoices`) hanya menghitung unit dari properti kelolaan KostManager.
3. **Penegasan Pembuatan & Edit Properti di Portal KostManager**:
   - Memastikan handler `handleSaveManagedProperty` dan `handleSave` pada form modal penambahan properti di portal selalu menyertakan `is_managed: true` pada payload penyimpanan Supabase.
4. **Tampilan State Kosong yang Informatif (Empty State)**:
   - Jika belum ada properti KostManager yang aktif di database, portal menampilkan kartu *Empty State* yang elegan dan profesional dengan tombol cepat `+ Daftarkan Properti Baru`.

---

## 2. Dampak Perubahan

File yang akan disentuh:
- [`functions/public/components/admin/KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx):
  - Memperbarui fungsi `loadAllData` dengan logika penyaringan presisi KostManager vs Mitra Biasa.
  - Memastikan seluruh operasi kalkulasi metrik, ringkasan, penghuni, dan tagihan hanya merujuk ke properti KostManager yang valid.
  - Memastikan `handleSaveManagedProperty` menyertakan `is_managed: true` pada `properties.insert`.

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

1. **Perbarui Logika Data Fetching di `KostManagerPortal.tsx`**:
   - Mengambil data `mitras` (`subscription_status = 'kostmanager'`) dan `kmRequests` (`status = 'ACTIVE'`).
   - Menyaring data `properties` dari database dengan aturan isolasi ketat:
     ```ts
     const managedPropertiesList = (rawProps || []).filter(p => 
         p.is_managed === true || 
         ownerIds.includes(p.owner_uid) || 
         reqOwnerIds.includes(p.owner_uid) || 
         reqPropertyIds.includes(p.id)
     );
     ```
2. **Sinkronkan Relasi Penghuni & Tagihan**:
   - Memastikan `managedPropIds` hanya berasal dari `managedPropertiesList`.
   - Menjamin seluruh daftar kamar, tenant offline hasil survei, dan invoice bulanan hanya terikat pada properti KostManager yang valid.
3. **Penyempurnaan Payload Insert di `handleSaveManagedProperty`**:
   - Menambahkan `is_managed: true` pada objek insert properti baru agar properti yang dibuat dari portal otomatis terdaftar sebagai properti kelolaan.
4. **Kompilasi & Pengujian Build**:
   - Menjalankan `npm run build` di folder `functions/public/` untuk memastikan 0 error kompilasi.
5. **Pencatatan Riwayat & Git Push**:
   - Mencatat progres pada `functions/PROGRESS.md` (Entry #138), menerbitkan `WALKTHROUGH.md`, dan melakukan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Verifikasi Data di Portal KostManager**:
   - Buka menu **Portal Operasional KostManager** (`/admin/km_properties` & `/admin/km_overview`).
   - Pastikan listing reguler (seperti *Kontrakan Dekat Unhas Teknik*, *Kost F4*, *Kost Belfachr Unismuh*, dll.) yang berstatus `is_managed = false` dan bukan KostManager **tidak lagi muncul** di tabel Properti Terkelola.
   - Pastikan statistik ringkasan dan daftar penghuni bersih dari data listing reguler.
2. **Verifikasi Pendaftaran Properti Baru**:
   - Buat 1 properti baru dari Portal KostManager dan verifikasi bahwa data tersebut tersimpan dengan `is_managed: true` dan muncul di portal.
3. **Uji Build Kompilasi**:
   - `npm run build` berhasil dengan *exit code 0*.
