# Rencana Implementasi: Menampilkan Data Wilayah (Provinsi, Kota/Kabupaten, Kecamatan) pada Menu Peninjauan (Step 3 Review)

Dokumen ini merinci rencana penambahan tampilan data wilayah (Provinsi, Kota/Kabupaten, dan Kecamatan) pada menu peninjauan (*Step 3: Review*) formulir pendataan survei di `AgentDashboard.tsx`.

---

## 1. Analisis Masalah & Kebutuhan

### A. Kondisi Saat Ini
Pada Menu Peninjauan (*Step 3: Review*), tampilan yang ada meliputi:
1. Data Pemilik / Mitra (Nama, No. WA, Email)
2. Simulasi Tampilan Aplikasi (*Preview Mobile App*)
3. Data Kamar (Statistik, Daftar Kamar, Penghuni, Fasilitas)
4. Syarat & Ketentuan serta Tanda Tangan Digital Pemilik

Namun, pada menu peninjauan tersebut:
- Bagian lokasi hanya menampilkan teks string alamat lengkap mentah (`kmListingForm.address`).
- Data **Provinsi** (`kmListingForm.province`), **Kota / Kabupaten** (`kmListingForm.city`), dan **Kecamatan / Area** (`kmListingForm.area`) belum ditampilkan secara terstruktur, baik pada ringkasan informasi administratif maupun di dalam simulasi kartu preview mobile.

### B. Tujuan & Peningkatan
Menampilkan data wilayah administratif yang lengkap dan terstruktur pada Step 3 (Review):
1. **Ringkasan Wilayah Administratif**: Menambahkan seksi ringkasan data properti & lokasi yang memuat kartu Provinsi, Kota/Kabupaten, Kecamatan/Area, dan Alamat Lengkap + Titik Koordinat GPS.
2. **Badges Wilayah pada Simulasi Preview Mobile**: Menyajikan chips wilayah (Kecamatan, Kota/Kabupaten, Provinsi) tepat di bawah baris alamat pada simulasi layar handphone calon penyewa.

---

## 2. Rencana Desain & Tata Letak

### A. Komponen Ringkasan Informasi Properti & Wilayah (Step 3):
```
┌─────────────────────────────────────────────────────────────┐
│ 📍 Informasi Properti & Lokasi Administratif        [✏️ Edit] │
├─────────────────┬───────────────────┬───────────────────────┤
│ 🏛️ PROVINSI     │ 🏙️ KOTA / KAB.    │ 📍 KECAMATAN / AREA   │
│ Sulawesi Selatan│ Makassar          │ Tamalanrea            │
├─────────────────┴───────────────────┴───────────────────────┤
│ 🏠 ALAMAT LENGKAP                                           │
│ Jl. Perintis Kemerdekaan KM 10, Makassar                    │
│ 📍 Titik GPS: -5.13324, 119.48912                           │
└─────────────────────────────────────────────────────────────┘
```

### B. Badges Wilayah pada Simulasi Mobile Preview:
```
┌─────────────────────────────────────────┐
│ 📍 Jl. Perintis Kemerdekaan KM 10...   │
│ [Kec. Tamalanrea] [Kota Makassar] [Prov. Sul-Sel] │
└─────────────────────────────────────────┘
```

---

## 3. Dampak Perubahan

### File yang Tersentuh:
- [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx):
  - Menambahkan icon `Building2` dari `lucide-react`.
  - Menambahkan section ringkasan *"Informasi Properti & Lokasi Administratif"* pada Step 3.
  - Menambahkan baris badge wilayah pada bagian alamat di simulasi Mobile App Preview Step 3.
- [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Pencatatan riwayat progres Entry #141.

---

## 4. Langkah Eksekusi (Fase 2 Setelah ACC)

1. Perbarui `AgentDashboard.tsx` dengan menambahkan seksi ringkasan informasi wilayah administratif dan chip lokasi pada mobile preview.
2. Jalankan `npm run build` di `functions/public/` untuk memastikan lulus kompilasi dengan 0 error.
3. Catat riwayat pekerjaan ke `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
4. Lakukan git commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

- [ ] Buka formulir survei KostManager dan navigasikan ke **Step 3 (Peninjauan)**.
- [ ] Periksa seksi informasi properti: pastikan **Provinsi**, **Kota/Kabupaten**, dan **Kecamatan/Area** tampil akurat sesuai data yang diisi pada Step 1.
- [ ] Periksa simulasi Mobile App Preview: pastikan badge wilayah muncul rapi di bawah alamat.
