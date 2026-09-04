# Rencana Implementasi: Perbaikan Teks Nama Fasilitas Agar Tidak Terpotong (Anti-Truncate)

Dokumen ini menjelaskan rencana perbaikan menyeluruh pada antarmuka formulir mitra, dashboard agen, dan halaman detail kost agar seluruh nama fasilitas (seperti "Kamar Mandi Dalam", "Wastafel Cuci Piring", dll.) tampil utuh tanpa terpotong (*truncated* / `...`).

---

## 1. Analisis Masalah

- **Gejala / Temuan:**
  - Pada formulir pengelolaan kamar (`KostFormMitra.tsx`), opsi fasilitas utama seperti `"Kamar Mandi Dalam"` terpotong menjadi `"Kamar Mandi..."` karena adanya class styling `truncate` pada elemen `<span>` nama fasilitas di dalam grid 2-kolom.
  - Pada kartu detail listing (`KostDetail.tsx`), beberapa badge fasilitas juga menggunakan class `truncate` yang berpotensi memotong nama fasilitas yang panjang di layar berukuran kecil (mobile/tablet).
- **Kebutuhan:**
  - Menghapus class `truncate` pada seluruh elemen label/badge fasilitas dan menggantinya dengan styling text wrapping yang responsif (`leading-snug break-words flex-1 min-w-0`).
  - Menjaga proporsi icon (`shrink-0`) dan checkbox agar tata letak tetap simetris, rapi, dan nyaman dibaca.

---

## 2. Dampak Perubahan File

| File Target | Ruang Lingkup Perubahan |
| :--- | :--- |
| `functions/public/components/KostFormMitra.tsx` | Menghapus class `truncate` pada `ALL_ROOM_FACILITY_PRESETS`, merapikan icon & label `ROOM_BATHROOM_SUB_OPTIONS` serta `ROOM_KITCHEN_SUB_OPTIONS` agar membungkus teks panjang secara rapi. |
| `functions/public/pages/KostDetail.tsx` | Memperbarui rendering fasilitas umum, fasilitas kamar (perabot, kamar mandi, dapur pribadi) agar teks nama fasilitas panjang selalu tampil utuh. |
| `functions/public/pages/AgentDashboard.tsx` | Memastikan checklist fasilitas kamar dan fasilitas umum di dashboard agen menggunakan format teks wrap bebas truncate. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2)

1. **Perbaikan `KostFormMitra.tsx`**:
   - Ganti `<span className="text-xs font-bold truncate">{preset.label}</span>` menjadi `<span className="text-xs font-bold leading-snug break-words flex-1 min-w-0">{preset.label}</span>`.
   - Format sub-opsi kelengkapan kamar mandi dan dapur agar icon memiliki `shrink-0` dan teks label memiliki `leading-snug break-words flex-1 min-w-0`.
2. **Penyempurnaan `KostDetail.tsx`**:
   - Ganti class `truncate` pada fasilitas umum dan rincian fasilitas kamar dengan `leading-snug break-words flex-1 min-w-0` sehingga nama fasilitas panjang tidak pernah terpotong di berbagai resolusi layar.
3. **Penyempurnaan `AgentDashboard.tsx`**:
   - Periksa dan pastikan checklist fasilitas kamar dan kelengkapan kamar mandi di dashboard agen menampilkan nama fasilitas secara utuh.
4. **Validasi Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` di direktori `functions/public` untuk memastikan 0 error.
5. **Dokumentasi & Git Push**:
   - Catat progres ke `functions/PROGRESS.md`.
   - Terbitkan `WALKTHROUGH.md`.
   - Lakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Kompilasi TypeScript**: Menjalankan build front-end tanpa error.
- [ ] **Verifikasi UI Form Mitra**: Memastikan "Kamar Mandi Dalam", "Lemari Pakaian", "Wastafel Cuci Piring", dll. tampil utuh dan membungkus teks secara estetis jika ruang terbatas.
- [ ] **Verifikasi Detail Kost**: Memastikan badge dan list fasilitas di halaman detail kost tampil utuh di tampilan desktop maupun mobile.
