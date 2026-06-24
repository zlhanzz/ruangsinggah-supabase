# IMPLEMENTATION PLAN — Penyelarasan Fitur, Biaya Tambahan, Media, & Dropdown Cari Pemilik KostManager

**Tanggal:** 25 Juni 2026  
**Fitur:** Menghapus ikon sidebar modal, menyamakan gaya tabs dengan panel admin utama, menambahkan bidang "Biaya Tambahan", "Media (Foto/Video Listing)", "Kampus & Fasilitas Publik Terdekat", "Omnichannel Contact", serta menambahkan fitur pencarian (search) pemilik kost/mitra secara langsung pada dropdown pemilihan pemilik properti.

---

## 1. Analisis Masalah / Tujuan

1. **Pencarian Pemilik/Mitra yang Panjang:** Saat mendaftarkan properti di KostManager, dropdown "Pilih Pemilik (Mitra)" menampilkan semua akun pemilik/mitra. Ketika jumlah mitra bertambah banyak, memilih secara manual sangat menyulitkan. Diperlukan komponen input pencarian (searchable dropdown) agar admin dapat mengetik nama atau nomor telepon mitra untuk memfilter dan memilih secara cepat.
2. **Ikon & Tema Sidebar Modal:** Menghapus ikon emoji (📝, 📍, dll.) pada sidebar tabs modal tambah properti KostManager dan mengubah styling font/text agar bernada `font-black text-xs uppercase tracking-widest` (persis layout admin utama).
3. **Biaya Tambahan (Additional Fees):** Menambahkan bidang Keterangan Biaya, Nominal, dan Ketentuan Penagihan (Mulai Bulan Pertama / Promo Bebas Bulan Pertama) ke tab "Fasilitas & Biaya".
4. **Penyelidikan Fitur Admin Utama yang Relevan:**
   - **Tab Media:** Menambahkan tab baru untuk mengelola foto & video utama listing (`imageUrls`, `videoUrls`, `instagramUrl`, `tiktokUrl`), mendukung upload file baru, pratinjau, drag-drop reordering, dan hapus gambar.
   - **Kampus & Fasilitas Publik Terdekat:** Mengaktifkan array `campuses` dan `publicFacilities` di tab lokasi beserta fitur pencarian koordinat Nominatim dan estimasi waktu perjalanan.
   - **Omnichannel Contact:** Menambahkan bidang kontak WhatsApp forwarding ke tab "Info Dasar".
5. **Penyimpanan Terintegrasi:** Mengubah alur simpan (`handleSave`) agar memanggil helper `addPropertyWithMedia` dan `updatePropertyWithMedia` dari `adminService.ts` untuk mengunggah file media listing utama ke storage Supabase.

---

## 2. Dampak Perubahan

| File | Perubahan |
|------|-----------|
| `functions/public/components/admin/KostManagerPortal.tsx` | 1. Impor `addPropertyWithMedia` dan `updatePropertyWithMedia` dari `../../adminService`.<br>2. Perbarui interface `ManagedProperty` dan mapping-nya pada `loadAllData`. <br>3. Tambahkan state `ownerSearchQuery` (string) dan `isOwnerDropdownOpen` (boolean) serta ref `ownerDropdownRef` untuk mengontrol dropdown cari pemilik.<br>4. Tambahkan event listener untuk mendeteksi klik di luar dropdown guna menutup dropdown otomatis.<br>5. Ubah render elemen `<select>` untuk `owner_uid` di bagian Info Dasar menjadi custom searchable dropdown dengan input teks filter, tombol reset query, list pilihan bermikro-animasi, dan list kosong state.<br>6. Perbarui tabs (`sections`) menjadi 6 buah tanpa icon field: Info Dasar, Lokasi & Kampus, Media, Fasilitas & Biaya, Tipe Kamar & Penghuni, Peraturan.<br>7. Terapkan render form untuk tab Media, Biaya Tambahan, Kampus, dan Fasilitas Publik terdekat.<br>8. Perbarui `handleSave` agar memanggil helper media upload admin service. |

---

## 3. Rencana Verifikasi

1. Jalankan compile proyek dengan `npm.cmd run build` (atau `npm run dev` / `tsc --noEmit`) untuk memastikan TypeScript compiler bersih.
2. Buka KostManager Portal -> "+ Tambah Properti".
3. Di tab **Info Dasar**, cari field **Pilih Pemilik (Mitra)**.
4. Klik tombol dropdown dan ketik sebagian nama (misal: "sulhan") atau nomor telepon. Pastikan daftar terfilter secara dinamis.
5. Klik salah satu mitra untuk memilih, pastikan dropdown tertutup, nama mitra terpilih ditampilkan, dan `newPropForm.owner_uid` terisi dengan benar.
6. Simpan properti, lalu pastikan properti tersimpan dengan id pemilik yang sesuai di Supabase.

