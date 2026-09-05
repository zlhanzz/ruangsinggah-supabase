# Rencana Implementasi (Implementation Plan): Penyelarasan Menu Pusat Bantuan pada Footer & Profile Hub Dashboard

## 1. Analisis Kebutuhan & Masalah

### A. Masalah & Konteks
1. **Footer Navigasi**: Menu pada footer di bawah kolom "PERUSAHAAN" saat ini masih menggunakan label teks **"Kontak"**. Pengguna meminta agar label ini diubah menjadi **"Pusat Bantuan"**.
2. **Profile Hub Navigasi**: Pada menu Profile Hub (`/profile`), opsi **"Pusat Bantuan 24/7"** sebelumnya langsung membuka tautan eksternal WhatsApp via `window.open()`. Pengguna meminta agar ketika tombol ini diklik, sistem membuka halaman **Pusat Bantuan (`Page.CONTACT` / `/contact`)** yang sama persis dengan yang diakses dari menu Footer.
3. **Penyempurnaan Halaman Pusat Bantuan (`Contact.tsx`)**:
   - Memastikan header dan konten di halaman `/contact` menyajikan representasi **Pusat Bantuan** yang lengkap (WhatsApp CS resmi, Email Bantuan, Informasi Kantor, Media Sosial, serta Formulir Kirim Pesan Cepat).
   - Memastikan seluruh ikon menggunakan pure bundled vector SVG dari package **`lucide-react`** sesuai aturan baku workspace (mencegah FOUT).

---

## 2. Dampak Perubahan (File yang Terpengaruh)

| No | File | Perubahan |
|---|---|---|
| 1 | `functions/public/components/Footer.tsx` | Mengubah label menu `Kontak` menjadi `Pusat Bantuan`. |
| 2 | `functions/public/pages/Profile.tsx` | Mengubah event click pada menu "Pusat Bantuan 24/7" agar memanggil `navigate(Page.CONTACT)`. |
| 3 | `functions/public/pages/Contact.tsx` | Menyelaraskan heading menjadi "Pusat Bantuan" / "Pusat Bantuan & Kontak", mengoptimalkan styling modern, serta mengganti SVG mentah dengan icon `lucide-react`. |

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Pasca-Approval)

1. **Modifikasi `Footer.tsx`**:
   - Mengganti teks `Kontak` menjadi `Pusat Bantuan` pada baris menu navigasi footer.
2. **Modifikasi `Profile.tsx`**:
   - Memperbarui tombol "Pusat Bantuan 24/7" agar menavigasikan pengguna ke rute `Page.CONTACT` menggunakan `navigate(Page.CONTACT)`.
3. **Penyempurnaan `Contact.tsx`**:
   - Mengimpor icon dari `lucide-react` (`Phone`, `Mail`, `MapPin`, `Send`, `MessageSquare`, `Clock`, `ArrowLeft`, dll.).
   - Menghubungkan tombol WhatsApp CS dengan nomor WhatsApp resmi RuangSinggah.
4. **Verifikasi Kompilasi & Standar Baku**:
   - Menjalankan `npm run build` di `functions/public` untuk memastikan 0 error TypeScript/Vite.
5. **Pencatatan Progres & Walkthrough**:
   - Menambahkan catatan progres di `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

- [ ] **Kompilasi**: Menjalankan `npm run build` dan memastikan build sukses 100%.
- [ ] **Uji Navigasi Footer**: Mengklik menu "Pusat Bantuan" di footer dan memastikan halaman `/contact` terbuka.
- [ ] **Uji Navigasi Profile**: Mengklik menu "Pusat Bantuan 24/7" di Profile Hub dan memastikan halaman `/contact` terbuka dengan tampilan yang sama.
- [ ] **Uji Responsif & Ikon**: Memastikan tampilan mobile dan desktop tidak mengalami FOUT/glitch.
