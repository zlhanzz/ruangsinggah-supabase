# Rencana Implementasi (Implementation Plan): Perbaikan UI/UX Kartu Review Verifikasi & Penguncian Hak Akses Edit

Dokumen perencanaan ini disusun untuk menanggapi kebutuhan perbaikan tampilan kartu status verifikasi identitas *"Verifikasi Sedang Ditinjau"* yang saat ini terlalu bongsor, tidak estetik, dan boros ruang UI/UX, serta celah di mana pengguna masih dapat masuk ke mode edit/formulir pengajuan saat data identitasnya sedang dalam tahap peninjauan (*pending*).

---

## 1. Analisis Masalah & Kebutuhan

### A. Masalah Tampilan Kartu (UI/UX)
- **Kondisi Saat Ini**:
  - Kartu status verifikasi peninjauan (*pending*) di [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx) dan [AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx) menggunakan latar oranye solid pekat raksasa (`bg-orange-500 rounded-[2.5rem] p-8 md:p-10`), ikon jam yang sangat besar (`w-20 h-20`), dan teks berukuran besar.
  - Kartu ini memakan hampir separuh viewport layar (*bongsor*), terasa agresif/berlebihan, dan tidak proporsional dengan kartu-kartu dashboard lainnya yang bersih dan modern.
- **Kebutuhan**:
  - Mendesain ulang kartu menjadi kartu status yang **ringkas, estetik, elegan, dan efisien ruang**.
  - Menggunakan palet modern bernuansa *soft warm amber / slate* yang profesional (`bg-gradient-to-r from-amber-50/90 to-orange-50/50 border border-amber-200/80`).
  - Menggunakan layout horizontal proporsional: ikon `<Clock />` SVG dari `lucide-react` berukuran pas (`w-11 h-11`), tipografi rapi, dan indikator status *badge* minimalis (*"Sedang Ditinjau - Estimasi Maks 1x24 Jam"*).
  - Menghapus efek kursor klik pointer dan hover zoom yang memberikan ilusi seolah kartu tersebut adalah tombol aksi.

### B. Masalah Logika & Hak Akses Pengeditan (*Security & Business Flow*)
- **Kondisi Saat Ini**:
  - Kartu status *pending* memiliki event `onClick={() => setSearchParams({ edit: 'true', step: '1' })}` dengan `cursor-pointer hover:scale-[1.01]`.
  - Mengklik kartu tersebut langsung membuka kembali formulir edit identitas dan data KTP, padahal berkas sedang dalam proses validasi oleh admin.
  - Tombol *"Edit Profil"* di kartu informasi akun masih aktif dan dapat diklik.
  - Parameter URL `?edit=true` masih diproses tanpa memeriksa apakah akun berstatus `pending`.
- **Kebutuhan**:
  - **Kunci Akses Penuh saat `pending`**: Saat status verifikasi adalah `pending` (Sedang Ditinjau), pengguna **TIDAK BOLEH** dapat masuk ke mode edit profil/identitas. Data terkinci rapat (*read-only*) demi menjaga integritas data yang sedang diperiksa oleh tim admin.
  - Kartu status murni bersifat informatif tanpa event klik/navigasi.
  - Tombol *"Edit Profil"* di kartu profil akun diganti dengan indikator status terkunci (*"Data Terkunci (Sedang Ditinjau)"*).
  - Guard di sisi *router / URL state*: Jika ada akses langsung ke `?edit=true` saat status `pending`, sistem otomatis membatalkan/mereset `isEditing` ke `false` dan membersihkan URL query param.
  - **Pengecualian Pembukaan Edit**: Mode edit identitas HANYA dapat dibuka kembali jika:
    1. Status verifikasi adalah `rejected` (ditolak oleh admin, pengguna wajib memperbaiki berkas yang bermasalah melalui tombol *"Perbaiki Data"*).
    2. Status verifikasi adalah `unverified` (belum pernah mengajukan verifikasi).
    *(Untuk status `verified`, profil utama sudah valid; nomor WA & KTP tetap terkunci oleh protokol keamanan).*

---

## 2. Dampak Perubahan (Files Affected)

Perubahan akan difokuskan pada:
1. [functions/public/pages/MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx):
   - Redesain komponen kartu status verifikasi `pending` menjadi ringkas, estetik, dan proporsional.
   - Menghapus `onClick` dan `cursor-pointer` pada kartu review.
   - Memperbarui tombol *"Edit Profil"* pada kartu *"Profil Anda"* agar terkunci saat `verification_status === 'pending'`.
   - Menambahkan guard proteksi pada `useEffect` URL query params (`edit=true`) agar otomatis menolak masuk mode edit jika status `pending`.
2. [functions/public/pages/AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx):
   - Menerapkan desain kartu status `pending` yang sama ringkas dan estetisnya.
   - Menerapkan guard proteksi edit profil saat status `pending`.
3. [functions/public/pages/MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraDashboard.tsx) (Penyelarasan):
   - Memastikan banner peringatan identitas di beranda dashboard menampilkan ikon Lucide vector SVG dan teks status yang selaras.

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

1. **Redesain Kartu Review Verifikasi (`verification_status === 'pending'`)**:
   - Mengganti blok kartu oranye solid raksasa dengan container modern berprofil ramping (`rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-amber-50/90 to-orange-50/50 border border-amber-200/80 shadow-sm`).
   - Menyusun layout horizontal yang bersih:
     - Ikon status: Kotak lembut `w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-200/60 flex items-center justify-center text-amber-600 shrink-0` dengan `<Clock size={22} />`.
     - Teks: Judul ringkas bertaraf h4 (`text-sm font-black text-amber-950 uppercase tracking-wide`) dengan deskripsi padat (`text-xs text-amber-800/80 font-medium mt-0.5`).
     - Badge status: Pill modern di sisi kanan (`px-3 py-1.5 rounded-full bg-white/80 border border-amber-200 text-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs`).
   - Meniadakan seluruh event klik dan pointer cursor.

2. **Penerapan Guard Penguncian Mode Edit**:
   - Di [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MitraProfile.tsx) dan [AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentProfile.tsx):
     - Guard: Jika status verifikasi adalah `pending` dan `isEditing` bernilai true, paksa reset ke `false` dan bersihkan query URL.
     - Pada kartu *"Profil Anda"*, jika `formData.verification_status === 'pending'`, tampilkan badge terkunci dengan ikon `<Lock size={12} />`: *"Data Terkunci (Sedang Ditinjau)"*.
     - Tombol *"Perbaiki Data"* hanya muncul saat status `rejected`.

3. **Verifikasi & Kompilasi**:
   - Menjalankan `npm run build` di direktori `functions/public` untuk memastikan 0 error kompilasi.
   - Menguji tampilan UI responsif (mobile & desktop).

4. **Pencatatan Progres & Walkthrough**:
   - Mendokumentasikan perubahan di `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
   - Melakukan commit dan push ke remote GitHub branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi UI/UX**:
  - Memastikan kartu review tidak lagi memakan banyak ruang, memiliki tinggi yang proporsional, teks yang tajam, dan kontras warna yang nyaman dilihat.
  - Memastikan tidak ada glitch font / FOUT (menggunakan 100% vector SVG dari `lucide-react`).
- **Verifikasi Penguncian Akses**:
  - Mengklik kartu review: Memastikan kartu tidak dapat diklik dan tidak merespon hover/scale.
  - Mengakses halaman dengan status `pending`: Memastikan tombol *"Edit Profil"* menampilkan status terkunci dan tidak dapat diklik.
  - Simulasi URL `?edit=true` saat status `pending`: Memastikan sistem otomatis menolak dan membersihkan query parameter kembali ke mode tampilan baca (*read-only*).
  - Saat status `rejected`: Memastikan tombol perbaikan data dapat diakses untuk mengirimkan revisi data yang diminta admin.
- **Verifikasi Build**:
  - Menjalankan perintah `npm.cmd run build` dan memastikan proses build Vite berhasil dengan 0 error.
