# IMPLEMENTATION PLAN - Perbaikan Bug Modal Pendataan KostManager Tidak Bisa Ditutup (Re-Opening Loop)

**Tanggal Pengajuan**: September 2026  
**Status Dokumen**: Menunggu Persetujuan User (RequestFeedback: true)  
**Target File**: `functions/public/pages/AgentDashboard.tsx`

---

## 1. Analisis Masalah & Akar Penyebab

### Masalah yang Terjadi
Setiap kali agen survei mencoba menutup modal pendataan KostManager (*ONBOARDING KOST - Survey Field App*), baik dengan:
- Mengklik tombol silang **(X)** di pojok kanan atas,
- Mengklik tombol **KELUAR** di bagian bawah,
- Maupun mengklik area luar modal (backdrop gelap),
modal tersebut sekejap tertutup namun langsung terbuka kembali secara otomatis. Agen terjebak di dalam modal dan tidak bisa kembali ke tampilan utama dashboard agen.

### Mengapa Hal Ini Terjadi (*Root Cause Analysis*)
1. **Looping Trap pada Hook Auto-Load Refresh (`useEffect`)**:
   - Di file `functions/public/pages/AgentDashboard.tsx` (baris 2417–2447), terdapat `useEffect` yang bertugas memuat draf survei secara otomatis jika ada parameter query URL `?onboarding_id=...`:
     ```tsx
     useEffect(() => {
         const onboardingIdStr = searchParams.get('onboarding_id');
         if (onboardingIdStr && !isEditingKostManager) {
             const found = surveyRequests.find(r => String(r.id) === String(onboardingIdStr));
             if (found) {
                 openKostManagerListing(found);
                 return;
             }
             ...
         }
     }, [searchParams, surveyRequests, isEditingKostManager]);
     ```
2. **Kondisi Balapan (*Race Condition*) saat Modal Ditutup**:
   - Ketika tombol **Keluar** atau **(X)** diklik, fungsi `closeKostManagerListing()` dijalankan:
     ```ts
     setIsEditingKostManager(null);
     const cleanupParams = new URLSearchParams(searchParams);
     cleanupParams.delete('onboarding_id');
     setSearchParams(cleanupParams);
     ```
   - Pemanggilan `setIsEditingKostManager(null)` memicu re-render instan pada komponen React `AgentDashboard`.
   - Namun, pembaruan URL melalui `setSearchParams` dari React Router berjalan secara asinkron di tick terpisah.
   - Pada siklus render di mana `isEditingKostManager` baru saja berubah menjadi `null`, nilai `searchParams.get('onboarding_id')` **masih berisi ID survei lama**.
   - Karena `isEditingKostManager` masuk ke dalam *dependency array* `useEffect`, efek tersebut **langsung terpicu seketika** begitu `isEditingKostManager` bernilai `null`.
   - Kondisi `if (onboardingIdStr && !isEditingKostManager)` terpenuhi (`true`), sehingga sistem **langsung memanggil kembali `openKostManagerListing(found)`**!
   - Fungsi `openKostManagerListing` kembali mengisi `isEditingKostManager(found)` dan menaruh kembali `onboarding_id` di URL.
   - Terjadilah siklus tertutup (*infinite re-opening trap*) yang membuat modal selalu muncul kembali setiap kali ditutup.

---

## 2. Dampak Perubahan

Hanya 1 file kode yang akan disentuh secara terisolasi tanpa mengubah logika bisnis perhitungan data survei:
- **`functions/public/pages/AgentDashboard.tsx`**:
  - Mengisolasi eksekusi auto-load dari URL agar hanya berjalan **satu kali saat halaman pertama kali dibuka / di-refresh** (*one-time mount evaluation*).
  - Menambahkan ref pelindung penutupan (`isExplicitlyClosedRef`) agar penutupan manual oleh user tidak memicu pembukaan kembali.
  - Memastikan parameter URL `onboarding_id` langsung dibersihkan secara instan dari `window.history` dan `searchParams` saat tombol Keluar/(X) ditekan.
  - Menghapus ketergantungan `isEditingKostManager` dari dependency array auto-load effect untuk memutus loop.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)

1. **Membuat Flag Ref Penanda Auto-Load & Penutupan Eksplisit**:
   - Di `AgentDashboard.tsx`, buat `const hasAutoLoadedOnboardingRef = useRef(false);` dan `const isClosingKostManagerRef = useRef(false);`.
2. **Memperbaiki Hook Auto-Load `useEffect`**:
   - Batasi evaluasi auto-load dari query URL: jika `hasAutoLoadedOnboardingRef.current === true` ATAU `isClosingKostManagerRef.current === true`, segera batalkan/hentikan eksekusi (*early return*).
   - Setelah survei pertama kali berhasil dimuat dari URL query saat refresh, tandai `hasAutoLoadedOnboardingRef.current = true`.
   - Hapus `isEditingKostManager` dari *dependency array* effect tersebut agar perubahan status modal terbuka/tertutup tidak lagi memicu auto-load dari URL.
3. **Menyempurnakan `closeKostManagerListing`**:
   - Di awal fungsi `closeKostManagerListing`, set `isClosingKostManagerRef.current = true`.
   - Bersihkan parameter `onboarding_id` seketika menggunakan `window.history.replaceState` dan `setSearchParams(cleanupParams, { replace: true })`.
   - Di dalam `openKostManagerListing` (yang dipicu saat agen sengaja mengklik tombol di kartu survei), reset kembali `isClosingKostManagerRef.current = false`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi & Build Frontend**:
   - Jalankan `npm.cmd run build` di direktori `functions/public`.
   - Memastikan build Vite lulus 100% tanpa error TypeScript.
2. **Uji Skenario Penutupan Modal**:
   - Buka modal pendataan KostManager.
   - Klik tombol **(X)** di pojok kanan atas $\rightarrow$ Modal tertutup sempurna dan tetap tertutup, kembali ke dashboard agen.
   - Buka kembali modal pendataan KostManager.
   - Klik tombol **KELUAR** di bagian bawah $\rightarrow$ Modal tertutup sempurna dan tidak terbuka lagi.
   - Klik backdrop abu-abu di luar modal $\rightarrow$ Modal tertutup dengan baik.
3. **Uji Skenario Refresh Tetap Berjalan**:
   - Saat modal terbuka, tekan tombol `F5` / Refresh browser.
   - Karena URL memiliki `onboarding_id`, modal tetap otomatis terbuka memulihkan draf seperti yang diharapkan.
   - Kemudian setelah terbuka, klik **KELUAR** $\rightarrow$ Modal tertutup dan parameter URL bersih.
