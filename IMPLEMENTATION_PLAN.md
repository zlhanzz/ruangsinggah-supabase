# IMPLEMENTATION PLAN - Pop-Up Iklan Grafis Promo Mitra dengan Kontrol Manajemen di Dashboard Super Admin

## 1. Analisis Masalah & Kebutuhan Pengguna

### Visi & Masukan Pengguna:
Pengguna ingin agar promosi KostManager:
1. **Tidak lagi menjadi banner statis hardcode** yang memenuhi dan memakan area kerja di Dashboard Mitra ("Kost Saya").
2. **Berbentuk Iklan Pop-up Grafis (*Image Ad Pop-up*)**:
   - Menampilkan desain visual banner grafis yang menarik (seperti pop-up in-app promo Tokopedia/Traveloka).
   - Dapat di-klik untuk mengarah ke halaman tujuan (misal `/kost-manager`).
   - Memiliki tombol tutup **`[ ✕ ]`** di sudut atas banner.
   - Muncul saat mitra membuka menu "Kelola Kost" atau pertama kali login.
3. **Kontrol Penuh di Dashboard Super Admin**:
   - Super Admin dapat mengunggah desain grafis banner promo baru sewaktu-waktu.
   - Super Admin dapat mengaktifkan / menonaktifkan (*toggle switch*) pop-up iklan.
   - Super Admin dapat mengatur URL tujuan dan judul promo.
> *"kalau perlu nanti kita pakai desain grafis aja sebagai banner promo kostmanager. jadi nnanti bentuknya seperti iklan pop up yang bisa di close. kontrol pop up iklan promo nantinya akan ada di dashboard super admin untuk upload desain banner nya"*

---

## 2. Arsitektur & Solusi Teknis

### A. Penyimpanan Data Pengaturan Pop-Up (`app_settings`)
- Memanfaatkan tabel konfigurasi sistem Supabase `app_settings` dengan kunci:
  - `key`: `'mitra_promo_popup'`
  - `value` (JSONB):
    ```json
    {
      "is_active": true,
      "title": "Upgrade ke KostManager!",
      "image_url": "https://.../storage/v1/object/public/banners/promo/kostmanager_banner.webp",
      "link_url": "/kost-manager",
      "alt_text": "Promo Eksklusif KostManager RuangSinggah"
    }
    ```
- Keuntungan: Sangat fleksibel, tersimpan aman di database PostgreSQL Supabase, tidak memerlukan skema migration rumit, dan dapat dibaca secara instan oleh frontend mitra maupun admin.

### B. Modul Kontrol di Dashboard Super Admin (`BannerManagement.tsx`)
- Menambahkan section / kartu baru di halaman **Banner Promo** Super Admin:
  **"🖼️ Kontrol Iklan Pop-up Promo Mitra (KostManager)"**:
  1. **Pratinjau Visual Banner Aktif**: Menampilkan gambar desain banner yang sedang aktif.
  2. **Toggle Status**: Saklar on/off untuk mengaktifkan atau menonaktifkan pop-up di sisi mitra.
  3. **Upload Desain Grafis**: Input file gambar dengan kompresi otomatis ke format modern **`.webp`** di sisi browser (sesuai standar baku `AGENTS.md`) sebelum dikirim ke Supabase Storage bucket `banners`.
  4. **Form Input Target URL & Judul**: Mengatur link tujuan (default: `/kost-manager`).
  5. **Tombol Simpan**: Menyimpan pengaturan ke `app_settings` secara instan.

### C. Pembersihan & Tampilan Pop-Up Iklan di Dashboard Mitra (`MitraDashboard.tsx`)
1. **Pembersihan Layout**: Menghapus blok banner oranye statis hardcoded di atas daftar "Kost Saya" dan Beranda. Ruang dashboard mitra menjadi lega, bersih, dan rapi.
2. **Modal Pop-Up Iklan Grafis**:
   - Membaca konfigurasi `mitra_promo_popup` dari Supabase saat mitra membuka menu "Kelola Kost" (`activeTab === 'properties'`) atau login.
   - Jika `is_active === true`:
     - Menampilkan modal pop-up iklan di tengah layar dengan latar belakang gelap blur (`backdrop-blur-md`).
     - Menampilkan desain grafis banner yang diunggah Admin.
     - Mengklik gambar banner akan mengarahkan mitra ke `link_url` (halaman `/kost-manager`).
     - Terdapat tombol close **`[ ✕ ]`** melayang di pojok kanan atas banner untuk menutup iklan.
     - *Fallback Elegan*: Jika admin belum mengunggah gambar grafis custom, pop-up menampilkan kartu visual default KostManager yang cantik.

---

## 3. Dampak Perubahan

File yang akan disentuh:
1. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\adminService.ts`:
   - Menambahkan fungsi helper:
     - `getMitraPromoPopupSetting()`
     - `saveMitraPromoPopupSetting(setting, imageFile?)`
2. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\components\admin\BannerManagement.tsx`:
   - Menambahkan UI Kontrol Iklan Pop-up Promo Mitra (Upload desain banner, preview, toggle aktif/nonaktif, dan simpan).
3. `c:\Users\ZHULL\Desktop\Firebase to Supabase\functions\public\pages\MitraDashboard.tsx`:
   - Menghapus banner statis hardcode.
   - Menambahkan state dan modal Pop-up Iklan Grafis Promo Mitra yang terhubung langsung dengan konfigurasi dari admin.

---

## 4. Langkah-Langkah Eksekusi (Fase 2 - Menunggu Persetujuan / ACC)

1. **Langkah 1 (Service Layer)**:
   - Tambahkan fungsi get & update pengaturan pop-up mitra pada `adminService.ts` / `userService.ts` berbasis `app_settings`.
2. **Langkah 2 (Admin Control Panel)**:
   - Pasang kartu kontrol upload dan toggle pop-up di `BannerManagement.tsx` di Dashboard Super Admin.
3. **Langkah 3 (Dashboard Mitra & Pembersihan)**:
   - Bersihkan banner hardcode di `MitraDashboard.tsx`.
   - Render Pop-Up Iklan Grafis berbasis desain yang diupload Super Admin dengan tombol close `[ ✕ ]`.
4. **Langkah 4 (Uji Kompilasi & Dokumentasi)**:
   - Jalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
   - Catat riwayat ke `functions/PROGRESS.md` sebagai **Fitur #270**.
   - Perbarui `WALKTHROUGH.md`.
   - Lakukan commit dan `git push origin bukan-productions`.

---

## 5. Rencana Verifikasi

- **Uji Kompilasi**: `npm run build` lulus 100% tanpa error TypeScript/Vite.
- **Uji Super Admin**:
  - Buka menu **Banner Promo** di Dashboard Super Admin.
  - Periksa section baru "Kontrol Iklan Pop-up Promo Mitra".
  - Unggah desain banner promo, atur toggle aktif, dan simpan.
- **Uji Dashboard Mitra**:
  - Buka halaman **Kost Saya** pada Dashboard Mitra (`/dashboard-mitra`).
  - Pastikan banner statis hardcode yang sebelumnya memenuhi tempat sudah **hilang total**.
  - Pop-up iklan grafis dengan gambar desain dari admin muncul elegan di tengah layar.
  - Klik gambar iklan -> berpindah ke halaman `/kost-manager`.
  - Klik tombol **`[ ✕ ]`** -> pop-up tertutup dan dashboard terlihat bersih.
