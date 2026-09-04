# Implementation Plan - Penonaktifan Pop-up Banner Promo Upgrade KostManager untuk Mitra yang Sudah Berlangganan / Berstatus KostManager

Dokumen ini merinci analisis masalah, dampak perubahan, langkah eksekusi, dan rencana verifikasi untuk mencegah kemunculan pop-up banner promo *"Gak Punya Waktu Kelola Kost? Upgrade ke KostManager!"* pada akun Mitra yang sudah aktif sebagai KostManager atau telah berlangganan layanan KostManager.

---

## 1. Analisis Masalah & Kebutuhan

### Masalah:
- Saat ini di [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx), pop-up banner promo KostManager (`showPromoPopup`) muncul saat membuka halaman Kelola Properti (`/dashboard-mitra/properties`) hanya dengan memeriksa:
  1. Status verifikasi identitas (`isVerified === true`).
  2. Tab aktif (`tab === 'properties'`).
  3. Cooldown waktu 24 jam di `localStorage`.
- Sistem **belum memeriksa status langganan atau kepemilikan KostManager mitra (`isKostManager`)**. Akibatnya, mitra yang propertinya sudah dikelola oleh KostManager atau yang akunnya sudah memiliki status `subscription_status: 'kostmanager'` tetap melihat tawaran pop-up upgrade tersebut. Hal ini membingungkan dan tidak efisien bagi mitra yang sudah berlangganan.

### Solusi & Kebutuhan:
1. Menambahkan state dan pemeriksaan komprehensif `isKostManager` di [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx):
   - **Tabel `mitra`**: Cek apakah `subscription_status === 'kostmanager'`.
   - **User Object**: Cek apakah `user?.subscription_status === 'kostmanager'` atau `(user as any)?.is_managed === true`.
   - **Daftar Properti Mitra (`properties`)**: Cek apakah ada properti yang dikelola KostManager (`p.is_managed === true || p.isManaged === true || p.managed_by === 'kostmanager' || p.kost_manager_status === 'ACTIVE' || p.kostManager?.status === 'ACTIVE'`).
   - **Pengajuan KostManager (`kmRequests`)**: Cek apakah mitra memiliki pengajuan KostManager aktif/disetujui (`status in ['COMPLETED', 'APPROVED', 'IN_PROGRESS', 'SURVEY_SCHEDULED', 'ACTIVE']`).
2. **Kondisi Guarding Ketat**:
   - Jika `isKostManager` bernilai `true`, sistem **dilarang memicu `setShowPromoPopup(true)`** baik pada inisialisasi `useEffect`, navigasi tab `handleMenuChange('properties')`, maupun pada rendering JSX modal popup.

---

## 2. Dampak Perubahan File

| File | Bagian yang Dimodifikasi |
|---|---|
| `functions/public/pages/MitraDashboard.tsx` | 1. Menambahkan query `subscription_status` dari tabel `mitra` pada `loadData`.<br>2. Membuat memoized flag `isKostManager`.<br>3. Mencegah trigger popup di `useEffect` dan `handleMenuChange` jika `isKostManager === true`.<br>4. Menambahkan guard `!isKostManager` pada render JSX popup banner. |
| `functions/PROGRESS.md` | Pencatatan riwayat progres 326 (Fase 2). |
| `WALKTHROUGH.md` | Dokumentasi verifikasi dan pengujian fitur (Fase 2). |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

1. **Pengambilan Data & State `mitraSubscriptionStatus`**:
   - Memasukkan query `supabase.from('mitra').select('subscription_status').eq('user_id', uid).maybeSingle()` ke dalam `Promise.all` pada fungsi `loadData`.
   - Menyimpan hasil ke state `mitraSubscriptionStatus`.
2. **Definisi Memoized Flag `isKostManager`**:
   - Mengevaluasi:
     - `user?.subscription_status === 'kostmanager'`
     - `mitraSubscriptionStatus === 'kostmanager'`
     - `properties.some(p => p.is_managed || p.isManaged || p.managed_by === 'kostmanager' || p.kost_manager_status === 'ACTIVE' || p.kostManager?.status === 'ACTIVE')`
     - `kmRequests.some(r => ['COMPLETED', 'APPROVED', 'IN_PROGRESS', 'SURVEY_SCHEDULED', 'ACTIVE'].includes((r.status || '').toUpperCase()))`
3. **Penyisipan Guard pada Event Trigger Promo Popup**:
   - Pada `useEffect` inisialisasi popup: Batalkan kemunculan jika `isKostManager` bernilai `true`.
   - Pada `handleMenuChange`: Jangan buka promo jika `isKostManager` bernilai `true`.
   - Pada JSX popup di akhir file: Tambahkan kondisi `!isKostManager`.
4. **Kompilasi & Build Testing**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 0 error kompilasi.
5. **Dokumentasi & Git Push**:
   - Mencatat Progres 326 di `functions/PROGRESS.md` dan memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke remote branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi**:
   - Jalankan `cmd /c npm run build` untuk memverifikasi tidak ada error TypeScript maupun sintaks JSX.
2. **Uji Skenario Akun Mitra Reguler (Bukan KostManager)**:
   - Akun mitra yang terverifikasi dan belum memiliki properti KostManager tetap dapat melihat promo banner saat membuka tab Kelola Properti (sesuai aturan jeda waktu 24 jam).
3. **Uji Skenario Akun Mitra KostManager (Sudah Berlangganan / Dikelola)**:
   - Akun mitra yang memiliki status `subscription_status === 'kostmanager'` atau memiliki minimal satu properti yang berstatus `is_managed = true` **tidak akan pernah lagi melihat** pop-up promo upgrade KostManager.
