# WALKTHROUGH — Integrasi 1:1 Mekanisme Input Form Survei Agen ke Modal Edit Properti Portal KostManager

**Tanggal Selesai**: 28 Agustus 2026  
**Entry PROGRESS.md**: #146  
**Branch**: `bukan-productions`

---

## 1. Daftar Perubahan Lengkap

### File Utama yang Diubah
**`functions/public/components/admin/KostManagerPortal.tsx`**

#### A. Import Ikon Tambahan (baris ~55–68)
Menambahkan ikon `lucide-react` yang diperlukan oleh renderer survei:
- `AlertCircle`, `Fan`, `ImagePlus`, `Maximize2`, `LocateFixed`, `RefreshCw`

#### B. Helper Functions Baru (baris ~166–292)
| Fungsi | Kegunaan |
|--------|----------|
| `parseDimensionParts(size)` | Memisahkan string dimensi `"3x4"` menjadi `{ panjang: 3, lebar: 4 }` |
| `formatThousand(val)` | Format angka ke tampilan ribuan: `1500000` → `"1.500.000"` |
| `parseThousand(str)` | Kebalikan: `"1.500.000"` → `1500000` |
| `computeDynamicRoomPhotoCategories(unit)` | Menghitung kategori foto dinamis berdasarkan fasilitas aktif unit |
| `getRoomCategorizedPhotos(unit)` | Normalisasi data foto berkategori dari Supabase |
| `exportCategorizedPhotos(catPhotos)` | Konversi foto berkategori ke format flat untuk penyimpanan |

#### C. State Tambahan (baris ~3538–3550)
```tsx
const [customRoomFacilityInputs, setCustomRoomFacilityInputs] = useState<Record<string, string>>({});
const [customBathroomFacilityInputs, setCustomBathroomFacilityInputs] = useState<Record<string, string>>({});
const [customKitchenFacilityInputs, setCustomKitchenFacilityInputs] = useState<Record<string, string>>({});
const [newRoomPhotoCategoryInputs, setNewRoomPhotoCategoryInputs] = useState<Record<string, string>>({});
```

#### D. Mutators Survei Baru (baris ~4075–4250)
| Mutator | Aksi |
|---------|------|
| `handleUploadRoomPhotoCategorized` | Kompresi WebP client-side (kualitas 0.82) + simpan ke kategori |
| `handleDeleteRoomPhotoFromCategory` | Hapus foto dari kategori tertentu |
| `toggleUnitRoomFacility` | Toggle checklist fasilitas kamar (AC, Kasur, Lemari, dll.) |
| `toggleUnitBathroomFacility` | Toggle sub-fasilitas kamar mandi (Kloset, Shower, Wastafel) |
| `toggleUnitKitchenFacility` | Toggle sub-fasilitas dapur (Kompor, Kulkas, Sink, dll.) |
| `updateUnitPricingItem` | Update baris tarif sewa pada tabel multi-periode |
| `addUnitPricingItem` | Tambah baris tarif baru ke tabel |
| `deleteUnitPricingItem` | Hapus baris tarif dari tabel |
| `toggleUnitOtherFeeCoveredItem` | Toggle cakupan biaya tambahan (Listrik, Air, Sampah, Wifi, Parkir) |

#### E. Renderer Terpadu `renderSurveyStyleRoomUnit` (baris ~4340–5185)
Fungsi helper utama yang merender satu unit kamar secara 1:1 dengan form pendataan agen survei:

**Struktur Render untuk Unit Terisi (isOccupied = true)**:
1. Header: Status badge TERISI (amber), nomor kamar editable, tombol hapus
2. Dropdown Lantai & Tipe Kamar
3. Dimensi Kamar P x L: dua input number terpisah (Panjang + Lebar meter)
4. Tabel Multi-Periode Tarif Sewa: baris Bulanan / 3 Bulan / 6 Bulan / Tahunan, format ribuan
5. Biaya Bulanan Lain: input nominal + checklist cakupan (Listrik, Air, Sampah, Wifi, Parkir)
6. Toggle Kosongan vs Furnished + grid checklist fasilitas standar
7. Sub-checklist Kamar Mandi Dalam (Kloset Duduk/Jongkok, Shower, Wastafel)
8. Sub-checklist Dapur Dalam (Kompor, Kulkas, Sink, Kitchen Set)
9. Custom Facility Adder: input untuk menambahkan fasilitas kustom
10. Upload Foto Per-Kategori Dinamis: kategori dihitung otomatis + custom category adder
11. Form Data Penghuni: Nama, KTP, No. WhatsApp + link direct WA, Periode, Jatuh Tempo, Jumlah Penghuni

**Struktur Render untuk Unit Kosong (isOccupied = false)**:
- Sama persis MINUS bagian form data penghuni
- Status badge KOSONG (emerald), dengan tombol untuk pasang penghuni

#### F. Pembersihan Tab 2 (baris ~6520–6590)
Menggantikan ~300 baris kode render inline lama menjadi 2 baris bersih:

```tsx
// Sebelum (lama) - ~150 baris per map
occupiedUnits.map((u: any) => { ...150 baris JSX... })

// Sesudah (baru) - 1 baris per map
occupiedUnits.map((u: any) => renderSurveyStyleRoomUnit(rt, rtIdx, u, u.originalIdx, true))
vacantUnits.map((u: any) => renderSurveyStyleRoomUnit(rt, rtIdx, u, u.originalIdx, false))
```

---

## 2. Hasil Pengujian Build

```
> ruangsinggah.id@0.0.0 build
> vite build

vite v6.4.1 building for production...
transforming...
2526 modules transformed.
built in 22.96s
```

**Status: LULUS** — 0 TypeScript error, 0 Vite compilation error.
Catatan: Warning chunk size > 500 kB adalah warning normal (bukan error) pada file Dashboard yang memang besar karena kompleksitas fitur.

---

## 3. Panduan Pengujian User di UI

### Langkah Verifikasi Fitur

1. **Masuk ke Portal KostManager** → Buka halaman Admin → Klik **KostManager Portal**
2. **Pilih Properti** → Klik tombol **Edit** pada salah satu properti terkelola (contoh: "Kost Madani")
3. **Klik Tab "2. DATA KAMAR & PENGHUNI"**
4. **Expand accordion tipe kamar** → Klik **"BUKA LIST"** pada Tipe Kamar
5. **Expand "KAMAR SEDANG DIHUNI / TERISI"** → Verifikasi tampilan:
   - [ ] Muncul badge status TERISI (amber) dengan tombol toggle ke Kosong
   - [ ] Input Lantai (dropdown) dan Tipe Kamar (dropdown)
   - [ ] Input Dimensi P x L meter terpisah (dua field angka)
   - [ ] Tabel tarif sewa multi-periode (Bulanan / 3 Bln / 6 Bln / Tahunan) dengan format ribuan
   - [ ] Input Biaya Tambahan per Orang + Maks. Penghuni
   - [ ] Checklist cakupan biaya (Listrik, Air, Sampah, Wifi, Parkir)
   - [ ] Toggle Kosongan / Furnished + grid fasilitas standar
   - [ ] Sub-checklist Kamar Mandi Dalam + Sub-checklist Dapur Dalam
   - [ ] Input tag fasilitas kustom
   - [ ] Grid upload foto per-kategori dinamis + tombol tambah kategori kustom
   - [ ] Form data penghuni: Nama, KTP, WhatsApp, link "Hubungi via WA", Periode, Jatuh Tempo
6. **Expand "KAMAR KOSONG / SIAP HUNI"** → Verifikasi:
   - [ ] Muncul badge KOSONG (emerald)
   - [ ] Semua field survei muncul KECUALI form data penghuni
   - [ ] Tombol "+ Pasang Penghuni" muncul

---

## 4. Perintah Git Push ke Non-Production

CATATAN: Jangan push ke branch main. Hanya push ke bukan-productions.

```powershell
cd "c:\Users\ZHULL\Desktop\Firebase to Supabase"
git add -A
git commit -m "feat(kostmanager): integrate 1:1 agent survey input mechanisms and dynamic category photo upload to property editor"
git push origin bukan-productions
```
