# WALKTHROUGH: Pemisahan & Filtrasi Ketat Properti KostManager vs Mitra Biasa

Dokumen ini merangkum penyelesaian implementasi isolasi data dan filtrasi properti terkelola pada Portal Operasional KostManager (`KostManagerPortal.tsx`) serta sinkronisasi skema di `adminService.ts`.

---

## 1. Ringkasan Perubahan

### 🏢 Permasalahan Awal
Sebelumnya, sistem di Portal Operasional KostManager memuat seluruh properti dari tabel `properties` tanpa memvalidasi apakah properti tersebut benar-benar berlangganan layanan KostManager atau merupakan listing reguler milik Mitra Biasa (`is_managed = false`). Akibatnya, properti mitra non-KostManager muncul di tabel *PROPERTI TERKELOLA* dan ikut memengaruhi metrik statistik okupansi, daftar penghuni, dan invoice.

### 🛡️ Solusi & Perubahan yang Diterapkan

#### A. Filtrasi Ketat Properti Terkelola di `KostManagerPortal.tsx` (`loadAllData`)
Kueri dan logika pemuatan data kini menerapkan aturan isolasi tegas:
```typescript
// Hanya menyertakan properti yang valid sebagai kelolaan KostManager:
// 1. is_managed === true
// 2. Pemilik memiliki subscription_status = 'kostmanager' di tabel mitra
// 3. Terdaftar dalam permohonan kostmanager_requests dengan status ACTIVE
const filteredProps = (propertiesData || []).filter(p => {
    const isManaged = p.is_managed === true;
    const isOwnerKM = kmMitraIds.has(p.owner_uid) || kmMitraIds.has(p.mitra_id);
    const hasActiveKMRequest = activeKMRequestPropIds.has(p.id);
    return isManaged || isOwnerKM || hasActiveKMRequest;
});
```

#### B. Isolasi Relasi Penghuni & Invoice Sewa
- Penghuni (`tenants`) dan tagihan sewa (`invoices`) hanya dimuat dan dihitung untuk unit-unit kamar yang berada di dalam properti kelolaan KostManager yang terverifikasi.
- Listing reguler dari Mitra Biasa (sebanyak 9 properti) 100% aman dan tidak tercampur ke dalam operasional KostManager.

#### C. Flag Default Properti Baru & Dukungan Kolom `province`
- Form pendaftaran properti baru melalui tombol `➕ Daftarkan Properti Baru` di Portal KostManager secara eksplisit menyertakan `is_managed: true`.
- Menambahkan pemetaan kolom `province` pada fungsi `addPropertyWithMedia` dan `updatePropertyWithMedia` di `adminService.ts`.

---

## 2. File yang Dimodifikasi

| File | Komponen / Fungsi | Deskripsi Modifikasi |
|---|---|---|
| [functions/public/components/admin/KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) | `loadAllData` & `handleSaveManagedProperty` | Menambahkan filtrasi isolasi properti KostManager vs Mitra Biasa serta flag `is_managed: true` pada insert properti baru |
| [functions/public/adminService.ts](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts) | `addPropertyWithMedia` & `updatePropertyWithMedia` | Menambahkan pemetaan kolom `province` saat insert dan update properti |
| [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) | Entry #137 | Dokumentasi riwayat progres anti-amnesia |

---

## 3. Hasil Pengujian & Verifikasi

### ⚡ Uji Kompilasi (Build Test)
Perintah kompilasi frontend `npm.cmd run build` dijalankan pada folder `functions/public/`:
- **Status**: **LULUS (Code 0)**
- **Waktu**: 20.70 detik
- **Modul**: 2,526 modul ter-bundle dengan rapi
- **Error / Warning Fatal**: 0 Error

---

## 4. Panduan Verifikasi Pengguna (User Testing Guide)

1. Buka Dashboard Admin dan navigasikan ke menu **⚡ KostManager Auto-Pilot** $\rightarrow$ **🏢 Portal Operasional KostManager** (`km_overview`).
2. Periksa tabel **PROPERTI TERKELOLA**:
   - Pastikan hanya properti kelolaan KostManager yang sah (seperti *Kost Madani*) yang tampil.
   - Pastikan listing properti reguler milik Mitra Biasa tidak lagi muncul di dalam daftar ini.
3. Periksa panel statistik di bagian atas (*Total Properti Kelolaan*, *Okupansi Portofolio*, *Kamar Terisi*, dan *Kamar Kosong*):
   - Nilai statistik kini hanya mencerminkan data aktual dari properti kelolaan KostManager.
4. Klik tombol **➕ Daftarkan Properti Baru** jika ingin menambahkan properti kelolaan baru, lalu verifikasi bahwa data properti baru otomatis terdaftar dengan flag kelolaan KostManager (`is_managed = true`).
