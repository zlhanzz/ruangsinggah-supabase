# Rencana Implementasi: Transformasi Kartu Evaluasi Menjadi Kartu Kompak 'Riwayat Revisi' Pasca Pengiriman Ulang

Dokumen ini merinci rencana perubahan tampilan kartu evaluasi pada daftar tugas surveyor (`AgentDashboard.tsx`) ketika surveyor telah mengirimkan ulang data hasil revisi ke admin.

---

## 1. Analisis Masalah & Kebutuhan

### A. Kondisi Saat Ini
Pada baris ~4527 di `AgentDashboard.tsx`, terdapat kondisi:
`{req.status === 'REVISION_REQUIRED' || req.notes?.includes('[REVISI') ? ...}`
Meskipun surveyor telah mengirimkan ulang data dan status pengajuan telah berubah menjadi `SUBMITTED`, karena kolom `notes` masih memuat teks `"[REVISI ..."`, sistem tetap merender kartu evaluasi besar berwarna oranye menyala dengan badge *"✨ PERLU TINDAKAN"* dan tombol mencolok *"⚡ BUKA & PERBAIKI BAGIAN YANG DIEVALUASI"*. Hal ini menimbulkan kesan bahwa revisi belum terkirim dan masih harus diperbaiki.

### B. Kebutuhan Pengguna
1. **Pemisahan Mode Aktif vs Riwayat**:
   - Jika status **`REVISION_REQUIRED` / `NEED_REVISION`**: Tampilkan kartu oranye aktif ber-prioritas tinggi untuk memberi tahu surveyor bagian yang wajib diperbaiki.
   - Jika status **`SUBMITTED` / `PENDING_ONBOARDING` / `APPROVED`** dan memiliki riwayat revisi: Buat kartunya menjadi **kompak / kecil**, ditandai sebagai **"Riwayat Revisi"** lengkap dengan **tanggal dan waktu pengiriman revisi** (`req.updated_at` / `evalData.date`).
2. **Tombol Tindakan yang Selaras**:
   - Menampilkan tombol aksi tenang berwarna hijau emerald (*"✏️ Edit & Perbarui Data Listing"*) yang menandakan data sudah berada di tangan admin dan surveyor dapat memperbarui jika dibutuhkan.

---

## 2. Rencana Desain & Dampak Perubahan

### Desain Kartu Kompak Riwayat Revisi:
```
┌─────────────────────────────────────────────────────────────┐
│ 🕒 RIWAYAT REVISI TERKIRIM                [✓ Terkirim]     │
│ Terakhir diperbarui: 28 Agu 2026, 17:31 WITA               │
│                                                             │
│ 📌 Poin yang telah diperbaiki:                              │
│ • Foto Utama / Fasad Bangunan  • Fasilitas Umum Kost        │
│ 📝 Catatan Admin: "..."                                     │
└─────────────────────────────────────────────────────────────┘
[ ✏️ Edit & Perbarui Data Listing ]
```

### File yang Tersentuh:
- [functions/public/pages/AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx):
  - Memperbaiki pengkondisian kartu di baris ~4525:
    - Hanya render kartu oranye besar jika `req.status === 'REVISION_REQUIRED' || req.status === 'NEED_REVISION'`.
    - Ketika `req.status === 'SUBMITTED'`, render kartu kompak *"Riwayat Revisi"* dengan timestamp tanggal dan jam WIB/WITA.
- [functions/PROGRESS.md](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md):
  - Catat riwayat pengerjaan Entry #140.

---

## 3. Langkah Eksekusi (Fase 2 Setelah ACC)

1. Modifikasi blok render kartu aksi di `AgentDashboard.tsx`.
2. Format tanggal & waktu revisi menggunakan `Intl.DateTimeFormat` / `toLocaleDateString` dengan format Indonesia lengkap (contoh: *"28 Agu 2026, 17:31 WITA"*).
3. Jalankan `npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
4. Perbarui `functions/PROGRESS.md` dan `WALKTHROUGH.md`.
5. Lakukan git commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Simulasi Status REVISION_REQUIRED**: Kartu tampil besar, oranye menyala, dengan badge *"Perlu Tindakan"*.
- [ ] **Simulasi Status SUBMITTED**: Kartu otomatis mengecil menjadi *"Riwayat Revisi"*, menampilkan tanggal dan jam pengiriman secara elegan, dan tombol menjadi *"✏️ Edit & Perbarui Data Listing"*.
