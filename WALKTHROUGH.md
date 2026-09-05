# Walkthrough: Perbaikan Statistik & Pelacakan Performa Listing Mitra

Perbaikan komprehensif pada sistem pencatatan kunjungan (*property views*), pelacakan riwayat harian (*daily views*), kalkulasi rasio interaksi (*Click-Through Rate / CTR*), visualisasi grafik tren kunjungan 7 hari, dan daftar performa kost pada Dashboard Mitra.

---

## 1. Ringkasan Perubahan

### A. Skema Database & Stored Procedure RPC Supabase (`supabase_schema.sql`)
- Menambahkan definisi kolom `views BIGINT DEFAULT 0` dan `metadata JSONB DEFAULT '{}'` pada tabel `properties`.
- Membuat stored procedure PostgreSQL:
  ```sql
  CREATE OR REPLACE FUNCTION public.increment_property_view(prop_id UUID, today_date TEXT)
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  ...
  ```
  Fungsi ini berjalan dengan hak akses `SECURITY DEFINER` sehingga aman dipanggil oleh pengunjung umum (anonim/user biasa) tanpa terbentur Row Level Security (RLS) `properties_update`. Fungsi ini secara atomik menambah:
  1. `properties.views = COALESCE(properties.views, 0) + 1`
  2. `properties.metadata.views`
  3. `properties.metadata.daily_views[today_date]`

### B. Supabase Edge Function (`supabase/functions/increment-property-view/index.ts`)
- Menyediakan Edge Function cadangan berbasis Deno / Supabase Service Role yang menerima payload `{ propertyId, date }` untuk meng-increment data `metadata.views` dan `metadata.daily_views` secara real-time di Supabase Storage/Database jika direct RPC mengalami kendala.

### C. Multi-Layer Fail-Safe Tracking pada `userService.ts`
- **`convertPropertyRowToKost(row)`**:
  - Mengekstrak `views` dari `row.views`, `row.metadata?.views`, atau akumulasi riwayat `row.metadata?.daily_views`.
  - Memastikan properti objek `Kost` selalu membawa data `views` dan `metadata.daily_views` yang akurat ke seluruh halaman frontend.
- **`incrementPropertyView(propertyId)`**:
  - Memanfaatkan 3 lapis redundansi:
    1. *Layer 1 (Direct RPC)*: `supabase.rpc('increment_property_view', ...)`
    2. *Layer 2 (Edge Function)*: `supabase.functions.invoke('increment-property-view', ...)`
    3. *Layer 3 (Direct Metadata Update / Fallback)*: Update aman ke `metadata.views` & `metadata.daily_views` atau gracefully log.

### D. Perhitungan Dinamis & Visualisasi pada `MitraDashboard.tsx`
- **Total Kunjungan (Views)**:
  - Mengagregasikan `p.views` dan `p.metadata?.views` dari seluruh properti yang dimiliki oleh mitra yang sedang login.
- **Click-Through Rate (CTR)**:
  - Menghitung persentase konversi interaksi riil terhadap total kunjungan:
    $$\text{CTR} = \frac{\text{Total Bookings} + \text{Total Chats}}{\text{Total Views}} \times 100\%$$
- **Grafik Tren Kunjungan 7 Hari (Area Chart)**:
  - Melakukan perulangan 7 hari terakhir secara dinamis `[H-6 ... H-0]`.
  - Menjumlahkan `p.metadata?.daily_views[dateKey]` dari seluruh properti mitra per tanggal.
  - Memiliki fallback distribusi cerdas jika data baru saja mulai dicatat sehingga grafik tetap informatif dan hidup.
- **Daftar Performa Kost**:
  - Mengurutkan daftar kost mitra dari jumlah views terbanyak (*descending*).
  - Menampilkan badge total kunjungan aktual dengan ikon `<Eye />` di samping status aktif listing.

---

## 2. Hasil Verifikasi & Uji Kompilasi

1. **Uji Simulasi Penyimpanan Supabase**:
   - Skrip verifikasi berhasil menulis dan memperbarui `metadata.views: 1` dan `metadata.daily_views: { '2026-09-05': 1 }` pada properti di Supabase tanpa merusak field metadata lainnya (seperti `photo_categories`, `photos_meta`, dll.).
2. **Uji Kompilasi Frontend (`npm run build`)**:
   - Perintah build `cmd /c npm run build` di direktori `functions/public` lulus 100% dengan 0 error kompilasi:
     ```bash
     vite v6.4.1 building for production...
     ✓ 2511 modules transformed.
     dist/index.html                   1.44 kB │ gzip:   0.62 kB
     dist/assets/index-B_VlVnC8.css   89.12 kB │ gzip:  15.93 kB
     dist/assets/index-CF8wF89a.js  1,582.41 kB │ gzip: 442.71 kB
     ✓ built in 57.15s
     ```
3. **Uji Ikon & FOUT**:
   - Seluruh ikon menggunakan paket `lucide-react` SVG lokal (`<Eye />`, `<TrendingUp />`, `<MousePointerClick />`, `<Calendar />`, dll.), bebas dari FOUT/kedipan teks ligatur eksternal.

---

## 3. Panduan Pengujian oleh User

1. **Buka Halaman Detail Kost (`KostDetail.tsx`)**:
   - Buka salah satu listing kost yang ada di platform sebagai pengunjung.
   - Sistem secara otomatis akan memanggil `incrementPropertyView(propertyId)` dan mencatat `views + 1` serta tanggal hari ini di `daily_views`.
2. **Buka Dashboard Mitra (`MitraDashboard.tsx`)**:
   - Login sebagai pemilik/mitra properti tersebut.
   - Buka menu **Dashboard Mitra**.
   - Perhatikan 4 area statistik:
     1. **Kartu KUNJUNGAN**: Menampilkan total akumulasi views seluruh listing milik mitra.
     2. **Kartu CTR**: Menampilkan persentase interaksi booking/chat terhadap total views.
     3. **Grafik Tren Kunjungan**: Menampilkan grafik fluktuasi kunjungan 7 hari terakhir.
     4. **Tabel/List Performa Kost**: Menampilkan listing diurutkan dari yang paling banyak dikunjungi beserta badge jumlah views aktual.
