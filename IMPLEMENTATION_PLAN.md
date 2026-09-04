# IMPLEMENTATION PLAN - Peningkatan Sistem Rekening & Pengajuan Penarikan Dana Profesional Ala E-Commerce (`MitraDashboard.tsx`)

## 1. Analisis Masalah & Kebutuhan
- **Kondisi Saat Ini**:
  - Modal input rekening bank masih sangat sederhana (form dasar dengan dropdown standar dan header oranye polos).
  - Sistem penarikan dana saat ini langsung menarik seluruh saldo yang ada tanpa opsi memilih nominal kustom, tanpa breakdown biaya/estimasi waktu, dan tanpa konfirmasi rincian terstandarisasi.
  - Tampilan kartu rekening di tab Dompet masih berbentuk kotak abu-abu datar tanpa visualisasi kartu bank modern.
- **Kebutuhan Pengguna (Benchmark: TikTok Shop & Shopee Seller)**:
  - **Penginputan & Profil Rekening Bank**:
    1. Desain visual kartu bank virtual modern (tampilan kartu ATM/debit eksklusif dengan chip IC, nomor rekening terformat berjarak rapi, nama pemilik huruf kapital, dan badge *Terverifikasi/Rekening Utama*).
    2. Modal edit rekening yang interaktif: pilihan cepat bank/e-wallet populer (BCA, Mandiri, BRI, BNI, BSI, Seabank, Jago, GoPay, OVO, DANA) + dropdown lengkap, auto-formatting nomor rekening, dan validasi nama pemilik sesuai identitas KTP.
  - **Sistem Pengajuan Penarikan Dana Terintegrasi**:
    1. Modal penarikan dana profesional dengan input nominal kustom (format rupiah otomatis) + tombol cepat (*Rp 50rb, Rp 100rb, Rp 500rb, Rp 1jt, Tarik Semua Saldo*).
    2. Breakdown rincian transparan: Nominal Tarik, Biaya Admin (Rp 0 / Gratis), Total Masuk Rekening, dan Estimasi Waktu Pencairan (1x24 jam kerja).
    3. Ringkasan kartu rekening tujuan di dalam modal penarikan dan proteksi *anti-double submission*.
  - **Pelacakan Riwayat Penarikan Dana & Status Tracking**:
    1. Pelacakan status pencairan yang jelas: 🟡 *Sedang Diproses*, 🟢 *Berhasil Ditransfer*, 🔴 *Ditolak*.
    2. Modal tanda terima rincian penarikan (*Withdrawal Receipt Details*) saat riwayat diklik.

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/pages/MitraDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx):
  - Memperbarui komponen visual kartu rekening bank di tab Dompet (`withdrawalAccount`).
  - Mengembangkan modal pengelolaan rekening penarikan terstandarisasi (`isEditingBank`).
  - Mengembangkan modal pengajuan penarikan dana fleksibel (`showWithdrawModal` / `withdrawAmount`).
  - Menambahkan modal tanda terima rincian penarikan (`selectedWithdrawalDetail`).
  - Menyelaraskan fungsi `handleWithdraw` dan `saveWithdrawalAccount` dengan validasi nominal kustom.
- [`functions/PROGRESS.md`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Mencatat riwayat implementasi Progres 325.
- `WALKTHROUGH.md`:
  - Menerbitkan dokumentasi panduan visual dan hasil pengujian sistem penarikan baru.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah Approval)
1. **Peningkatan State & Helper Penarikan di `MitraDashboard.tsx`**:
   - Menambahkan state `withdrawAmount: string`, `selectedWithdrawalDetail: any | null`.
   - Mengintegrasikan helper format rupiah interaktif untuk input nominal penarikan kustom.
2. **Redesain Kartu Rekening Penarikan di Tab Dompet**:
   - Mengubah kartu rekening biasa menjadi *Virtual Bank Debit Card* elegan dengan efek glossy, chip kartu, nomor rekening terformat, dan tombol kelola.
3. **Penyempurnaan Modal Rekening Penarikan (`BankEditModal`)**:
   - Grid pilihan cepat Bank/E-Wallet terpopuler (dengan badge/icon khas).
   - Input nomor rekening auto-format angka bersih.
   - Peringatan keamanan pencairan data sesuai nama KTP.
4. **Pengembangan Modal Pengajuan Penarikan Dana Profesional (`WithdrawModal`)**:
   - Input nominal penarikan dinamis + tombol chip nominal cepat (*Rp 50rb, Rp 100rb, Rp 500rb, Tarik Semua*).
   - Rincian penarikan (Nominal, Biaya Admin Rp 0, Estimasi Dana Masuk, Estimasi Waktu).
   - Tampilan kartu mini rekening tujuan penarikan.
   - Tombol konfirmasi aman dengan indikator loading.
5. **Modal Tanda Terima Riwayat Penarikan (`WithdrawalReceiptModal`)**:
   - Memberikan preview tanda terima resmi saat mitra mengklik salah satu riwayat penarikan dana.
6. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` untuk memastikan 100% lulus tanpa error kompilasi.
7. **Pencatatan & Git Repository**:
   - Mencatat ke `functions/PROGRESS.md` (Progres 325) dan memperbarui `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- [ ] Buka Tab Dompet di Dashboard Mitra $\rightarrow$ Tampilan rekening tersaji sebagai *Virtual Bank Card* yang mewah dan profesional.
- [ ] Klik "+ Ganti Rekening" $\rightarrow$ Modal input rekening menampilkan pilihan cepat bank populer, auto-format nomor rekening, dan validasi nama pemilik KTP.
- [ ] Klik "Tarik Dana Sekarang" $\rightarrow$ Muncul modal penarikan profesional dengan input nominal kustom, tombol chip cepat, rincian biaya Rp 0, estimasi 1x24 jam, dan rekening tujuan.
- [ ] Ajukan penarikan dengan nominal tertentu $\rightarrow$ Saldo berkurang sesuai nominal yang ditarik, masuk ke riwayat penarikan dengan status *Diproses*, dan notifikasi admin terkirim.
- [ ] Klik item riwayat penarikan $\rightarrow$ Terbuka modal rincian tanda terima penarikan.
- [ ] Uji kompilasi build project $\rightarrow$ 100% lolos tanpa error.
