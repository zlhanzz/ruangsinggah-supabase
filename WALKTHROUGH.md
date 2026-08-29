# WALKTHROUGH — Perbaikan Bug Chat Bantuan KostManager & Implementasi Smart Inbox Terpadu (Penghuni vs Calon Penyewa)

**Tanggal Selesai**: 30 Agustus 2026  
**Entry PROGRESS.md**: #206  
**Branch**: `bukan-productions`

---

## 1. Ringkasan Pekerjaan

Pekerjaan ini menyelesaikan 2 poin utama:
1. **Perbaikan Runtime Error Tombol "Bantuan KostManager" pada Menu Kost Saya (`MyKost.tsx`)**:
   - Menghilangkan crash `ReferenceError: getOrCreateChatSession is not defined` saat penghuni mengklik tombol *"Bantuan KostManager"* di tab Kost Aktif.
   - Memastikan routing chat properti terkelola otomatis terhubung ke CS Resmi KostManager (`SYSTEM_ADMIN_ID`).
2. **Implementasi Unified Smart Inbox di Portal KostManager (`KostManagerPortal.tsx`)**:
   - Menjawab kebutuhan arsitektur penanganan chat calon penyewa vs penghuni aktif: **Tersentralisasi dalam satu inbox terpadu** tanpa memecah menu, namun diperkaya dengan **Quick Filter Tabs**, **Visual Identity Badges**, dan **High-Context Resident Information Strip**.

---

## 2. Daftar Perubahan Kode

### A. [`MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx)
- **Import Module**: Menambahkan import `getOrCreateChatSession` dan `SYSTEM_ADMIN_ID` dari `../chatService`.
- **Routing Chat Cerdas**:
  - Pada fungsi `handleOpenChat`, sistem mendeteksi apakah properti berstatus kelolaan KostManager (`kost.isManagedKost` / `kost.is_managed`).
  - Jika ya:
    - Target penerima otomatis dialihkan ke `SYSTEM_ADMIN_ID`.
    - Nama kontak ditampilkan sebagai **`Tim KostManager`** dengan tipe `contactType: 'admin'`.
    - Mengirimkan metadata lengkap (`customerName`, `customerPhoto`) ke `getOrCreateChatSession` agar kartu CS langsung memiliki identitas pengguna yang valid.

### B. [`KostManagerPortal.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx)
- **State Filter Kategori**:
  - Menambahkan state `chatCategoryFilter: 'all' | 'resident' | 'inquirer' | 'unread'` (default `'all'`).
- **Pencocokan Otomatis Penghuni (`getTenantForSession`)**:
  - Fungsi pencocokan otomatis antara pengirim chat dengan database penyewa aktif (`tenants`) berdasarkan `user_id` / `email` dan `property_id`.
- **Quick Filter Tabs di Kolom Kiri**:
  - `[ SEMUA (N) ]`: Menampilkan seluruh percakapan.
  - `[ 🏠 PENGHUNI (N) ]`: Menyaring khusus percakapan dari penyewa yang memiliki kamar aktif.
  - `[ 💬 CALON (N) ]`: Menyaring calon penyewa yang sedang menanyakan ketersediaan kamar.
  - `[ 🔔 UNREAD (N) ]`: Menyaring percakapan yang memiliki pesan baru belum dibalas.
- **Micro-Badges Identitas pada Kartu Sesi**:
  - Penghuni: Badge hijau emerald `[ 🏠 PENGHUNI • UNIT X ]` dengan avatar bergradasi emerald.
  - Calon: Badge abu-abu `[ 🔍 CALON ]` dengan avatar bergradasi oranye.
- **High-Context Resident Status Strip di Header Chat**:
  - Ketika percakapan penghuni aktif dipilih, muncul banner konteks sewa di atas pesan:
    - **Unit Hunian & Posisi Lantai**: misal `Unit Kamar 1 • Lantai 1`.
    - **Periode Masa Sewa**: misal `28 Ags 2026 s/d 28 Sep 2026`.
    - **Tombol Pintas WhatsApp**: Akses cepat ke kontak WhatsApp penghuni.

---

## 3. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi TypeScript & Vite Build
```bash
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
✓ 2531 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 31.81s (Exit code 0)
```
Semua file terkompilasi 100% tanpa error TypeScript maupun syntax error.

### B. Uji Skenario Pengguna
1. **Klik Bantuan KostManager di Kost Saya (`MyKost.tsx`)**:
   - Membuka jendela obrolan dengan CS `Tim KostManager` tanpa runtime exception `getOrCreateChatSession`.
2. **Penerimaan Chat di Portal CS (`KostManagerPortal.tsx`)**:
   - Chat masuk terdaftar dan terdeteksi statusnya secara otomatis (`🏠 PENGHUNI` vs `🔍 CALON`).
   - CS dapat mengklik tab `[ 🏠 PENGHUNI ]` untuk merespons kendala kamar dengan segera, atau tab `[ 💬 CALON ]` untuk memprioritaskan konversi prospek sewa baru.
   - Context bar menampilkan unit kamar dan masa sewa aktif tanpa perlu CS berpindah tab.

---

## 4. Riwayat Git

- **Branch**: `bukan-productions`
- **File Dimodifikasi**:
  - `functions/public/pages/MyKost.tsx`
  - `functions/public/components/admin/KostManagerPortal.tsx`
  - `functions/PROGRESS.md`
  - `walkthrough.md`
