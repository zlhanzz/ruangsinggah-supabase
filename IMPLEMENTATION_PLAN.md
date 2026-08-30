# Rencana Implementasi: Penghapusan Tombol Hotline WhatsApp pada Modal Lapor Kendala & Perapian Label Kamar (`MyKost.tsx`)

Dokumen ini merancang penyederhanaan antarmuka modal pelaporan kendala kamar di halaman **Kost Saya** (`MyKost.tsx`) agar alur pelaporan 100% terkelola melalui tiket in-app ke Portal KostManager tanpa tombol pintas WhatsApp langsung yang menduplikasi alur.

---

## 1. Analisis Kebutuhan

### Masukan Pengguna:
- *"tidak usah ada tombol wa nggak sih"*
- Pengguna meminta agar tombol hijau *"BUTUH CEPAT? HUBUNGI ADMIN VIA WHATSAPP"* di bagian bawah modal formulir pelaporan kendala dihilangkan, sehingga penghuni fokus mengirim laporan terstruktur melalui tiket in-app.
- Teks sub-header kamar pada modal saat ini menampilkan duplikasi kata (*"Kamar Kamar 3"*), yang akan kita rapikan menjadi format bersih (*"Kamar 3"*).

---

## 2. Dampak Perubahan File

| No | File | Deskripsi Perubahan |
|---|---|---|
| 1 | [`functions/public/pages/MyKost.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) | Menghapus tombol hotline WhatsApp di bagian bawah modal komplain dan merapikan teks header kamar menjadi `Kamar X`. |
| 2 | `functions/PROGRESS.md` | Pencatatan riwayat perubahan (Anti-Amnesia). |
| 3 | `WALKTHROUGH.md` | Dokumentasi walkthrough hasil pengujian. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah ACC)

1. **Langkah 1: Modifikasi `MyKost.tsx`**
   - Hapus elemen `<button>` hotline WhatsApp pada baris 4088–4095 di dalam `showComplaintModal`.
   - Rapikan formatting nomor kamar pada header modal di baris 3906 agar tidak ada pengulangan kata *"Kamar Kamar"*.
2. **Langkah 2: Uji Kompilasi & Build**
   - Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
3. **Langkah 3: Dokumentasi & Git Push**
   - Catat di `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Lakukan `git commit` dan `git push origin bukan-productions`.

---

## 4. Rencana Verifikasi

- **Verifikasi UI Modal Komplain**:
  - Buka halaman `Kost Saya` -> Klik **"🚨 Lapor Kendala Kamar"**.
  - Sub-header menampilkan nama kost dan unit kamar secara rapi (*"kost madani • Kamar 3"*).
  - Bagian bawah formulir hanya memuat tombol utama yang tegas: **"Kirim Laporan Kendala"** tanpa tombol hijau WhatsApp.
- **Verifikasi Build**:
  - `cmd /c npm run build` lulus 100% dengan 0 error.
