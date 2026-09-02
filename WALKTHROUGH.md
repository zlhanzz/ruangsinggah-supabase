# WALKTHROUGH: Penyesuaian Badge "TERVERIFIKASI" Berwarna Biru pada Kartu Listing

## 1. Ringkasan Pekerjaan
Telah berhasil diselaraskan tampilan badge verifikasi pada kartu listing properti (**`KostCard.tsx`**):
- **Teks**: Menggunakan bahasa Indonesia baku **`TERVERIFIKASI`** (sebelumnya `VERIFIED`).
- **Warna**: Menggunakan warna biru terverifikasi **`bg-[#2563eb]`** (*Royal Blue*) dengan teks putih tebal.

---

## 2. Rincian Perubahan Berkas

### A. [`KostCard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/KostCard.tsx)
- Mengubah badge verifikasi menjadi:
  ```tsx
  {(kost.isVerified || kost.isManaged) && (
    <span className="bg-[#2563eb] text-white px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
      TERVERIFIKASI
    </span>
  )}
  ```

---

## 3. Hasil Pengujian & Kompilasi

```bash
cmd /c npm run build
```
**Output:**
```text
✓ 2509 modules transformed.
✓ built in 46.33s
Exit code: 0 (0 error)
```

---

## 4. Panduan Pengujian

1. **Buka Halaman Beranda / Hasil Pencarian di `localhost:5173`**:
   - Perhatikan kartu-kartu kost yang terverifikasi.
   - Badge di pojok atas foto kini berwarna biru dengan teks **`TERVERIFIKASI`**.
