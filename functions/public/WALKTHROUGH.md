# WALKTHROUGH — Implementasi Multi-Kost Survey Checkout

**Tanggal:** 2026-05-18  
**Fitur:** Multi-Kost Survey Booking System

---

## 1. Daftar Perubahan

### ✅ `types.ts`
- Tambah enum `SURVEY_CHECKOUT = '/survey-checkout'` pada `Page`

### ✅ `adminService.ts`
- Tambah field `price_per_kost: number` pada interface `SurveyCatalogSettings`
- `getSurveyCatalogSettings()` sekarang membaca dan return `price_per_kost` (default: 35000)
- `saveSurveyCatalogSettings()` menyimpan `price_per_kost` ke Supabase

### ✅ `App.tsx`
- Tambah lazy import `SurveyCheckout`
- Tambah route `Page.SURVEY_CHECKOUT` dilindungi `ProtectedRoute`

### ✅ `pages/SurveyCheckout.tsx` (BARU)
- Halaman checkout 4-step: Data Diri → Detail Kost → Jadwal → Konfirmasi
- Mendukung hingga **5 kost sekaligus** per pesanan
- **Harga dinamis otomatis:**
  - 1 kost = harga dasar (surveyPrice, misal Rp 70.000)
  - 2–5 kost = jumlah × pricePerKost (misal Rp 35.000/kost)
- Setiap kost memiliki input: nama, no HP pemilik, sumber info, alamat
- Termasuk jadwal survey (tanggal + waktu) dan catatan opsional
- T&C checkbox sebelum bayar
- Terintegrasi langsung dengan `PaymentGateway`
- Halaman sukses menampilkan ringkasan pesanan

### ✅ `pages/SurveyService.tsx`
- Tombol "Ambil Promo Ini Sekarang" kini **navigate ke `/survey-checkout`**
- Form modal lama tidak lagi digunakan untuk CTA utama

### ✅ `components/admin/CatalogManagement.tsx`
- Tambah prop `verifikasiPricePerKost` & `setVerifikasiPricePerKost`
- Tambah input field **"Harga Per Kost (Multi-Kost Checkout)"** di UI admin
- `saveSurveyCatalogSettings` sekarang menyertakan `price_per_kost`

### ✅ `pages/Dashboard.tsx`
- Tambah state `verifikasiPricePerKost` (default: 35000)
- `useEffect` load settings sekarang juga load `price_per_kost`
- Dua panggilan `<CatalogManagement>` diperbarui dengan props baru

---

## 2. Alur Bisnis Baru

```
User di SurveyService (Landing Page)
  ↓ klik "Ambil Promo Ini Sekarang"
  ↓ navigate ke /survey-checkout
  
SurveyCheckout (4 Step):
  Step 1: Isi data diri (nama, WA, email)
  Step 2: Tambah 1–5 kost (nama, HP pemilik, sumber, alamat)
          → Harga auto: 1 kost = Rp70rb, 2+ kost = N × Rp35rb
  Step 3: Pilih jadwal (tanggal + jam)
  Step 4: Review + T&C → Bayar via PaymentGateway
  
→ Setelah bayar: halaman sukses → redirect ke My Bookings
```

---

## 3. Pengaturan Admin

Admin dapat mengubah harga di **Dashboard Admin → Jasa Survey**:
- **Harga Normal (Biaya Dasar):** harga untuk 1 kost
- **Harga Diskon:** harga coret yang ditampilkan ke user
- **Harga Per Kost (Multi-Kost):** harga per lokasi jika pesan 2+ kost

---

## 4. Petunjuk Deploy

```bash
# 1. Build
npm run build

# 2. Deploy ke Firebase Hosting
firebase deploy --only hosting
```

---

## 5. Catatan Penting

- `SurveyService.tsx` masih mempertahankan form modal lama (state tersisa),
  namun CTA utama sudah dialihkan. Modal bisa di-cleanup di sprint berikutnya.
- `kostList` di-serialize ke `metadata.kostList` saat pembayaran, sehingga
  backend webhook dapat membuat N survey_request secara terpisah.
- Harga `price_per_kost` dibaca dari `app_settings` tabel Supabase.
