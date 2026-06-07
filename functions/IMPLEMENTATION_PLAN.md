# IMPLEMENTATION PLAN - Dropdown Pilihan Bank pada Dashboard Agen

Rencana ini dibuat untuk mengganti input teks "Bank" pada tab Rekening dashboard agen dengan dropdown seleksi berbasis daftar bank resmi Indonesia yang didukung (diimpor dari konstanta yang ada).

## 1. Analisis Masalah
- **Masalah Utama**:
  - Input bank pada tab Rekening di `AgentDashboard.tsx` saat ini berupa kolom input teks bebas (`<input>`). Agen harus mengetik manual nama bank mereka, yang rentan terhadap kesalahan ketik (typo) atau ketidaksesuaian format.
  - Untuk kelancaran transfer manual oleh admin atau integrasi masa depan, format nama bank harus konsisten.

- **Solusi**:
  - Impor konstanta `INDONESIAN_BANKS` dari [constants.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/constants.tsx) yang berisi daftar bank utama terintegrasi (BCA, Mandiri, BNI, BRI, Danamon, dst.).
  - Ganti elemen `<input>` untuk nama bank di [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx) menjadi `<select>` dengan opsi dari `INDONESIAN_BANKS`.

## 2. Dampak Perubahan
File yang akan disentuh:
1. **`functions/public/pages/AgentDashboard.tsx`**:
   - Impor `INDONESIAN_BANKS`.
   - Ubah rendering form input Bank menjadi selector dropdown.

## 3. Rencana Verifikasi
- Memastikan build Vite berhasil tanpa kesalahan kompilasi.
- Meninjau tab Rekening di dashboard agen untuk memastikan dropdown bank muncul dan pilihan bank BCA terpilih secara default.
