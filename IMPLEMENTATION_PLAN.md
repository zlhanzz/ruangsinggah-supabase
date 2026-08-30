# Rencana Implementasi: Perbaikan ReferenceError `Phone` di `MyKost.tsx`

Dokumen ini menganalisis penyebab error runtime `ReferenceError: Phone is not defined` pada modal pelaporan kendala in-app di halaman **Kost Saya** (`MyKost.tsx`) dan rencana perbaikannya.

---

## 1. Analisis Masalah

### Kondisi Error:
- Pada console browser muncul error:
  ```text
  Uncaught ReferenceError: Phone is not defined
      at MyKost (MyKost.tsx:4093:38)
  ```
- **Penyebab**:
  - Pada baris 4093 di dalam modal formulir komplain/kendala kamar (`showComplaintModal`), terdapat tombol hotline WhatsApp alternatif yang merender komponen icon `<Phone className="w-4 h-4 text-emerald-600" />`.
  - Pada baris 4 [`MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx#L4), daftar import dari package `lucide-react` mengimpor `PhoneCall` dan `Smartphone`, namun nama `Phone` belum terdaftar di dalam destructuring import.

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Menambahkan `Phone` ke dalam daftar import dari `lucide-react`. |
| 2 | `functions/PROGRESS.md` | Pencatatan riwayat perbaikan (Anti-Amnesia). |
| 3 | `WALKTHROUGH.md` | Dokumentasi walkthrough hasil pengujian. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Langkah 1: Perbaikan Import di `MyKost.tsx`**
   - Tambahkan `Phone` ke dalam import `lucide-react` pada baris 4 `MyKost.tsx`.
2. **Langkah 2: Uji Kompilasi & Build**
   - Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan kompilasi 100% bebas error.
3. **Langkah 3: Dokumentasi & Git Push**
   - Catat progres di `functions/PROGRESS.md` dan perbarui `WALKTHROUGH.md`.
   - Lakukan `git commit` dan `git push origin bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi UI**:
  - Buka halaman `Kost Saya` (`/my-bookings/aktif` atau `/my-kost`).
  - Klik tombol **"🚨 Lapor Kendala Kamar"**.
  - Modal form pelaporan terbuka tanpa error runtime console dan icon `Phone` pada tombol hotline WhatsApp di bawah form ter-render sempurna.
- **Verifikasi Build**:
  - `cmd /c npm run build` lulus 100% dengan 0 error.
