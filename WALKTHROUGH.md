# Walkthrough: Sistem Re-Aktivasi KostManager Otomatis Berbasis Data Historis KostManager

Dokumen ini merangkum penyelesaian fitur untuk memastikan bahwa ketika sebuah properti kost yang sebelumnya pernah aktif sebagai mitra KostManager (kemudian kembali menjadi mitra biasa self-listing karena tidak memperpanjang langganan atau dideaktivasi oleh admin), dan kini mengajukan permohonan kembali menjadi KostManager, seluruh data survei dan portofolio KostManager lama (10 unit kamar individual, nomor kamar, status keterisian, tarif sewa, foto survei kamar, foto survei properti, fasilitas, dan GPS) otomatis dipulihkan ke dalam formulir dashboard agen survei. Agen survei yang datang ke lokasi fisik hanya perlu melakukan penyesuaian ulang (*readjustment*), tanpa harus menginput ulang seluruh data dari nol.

---

## 1. Ringkasan Perubahan & Logika Sistem

| Aspek | Kondisi Sebelumnya | Solusi yang Diimplementasikan |
| :--- | :--- | :--- |
| **Pengarsipan Data Saat Deaktivasi** | Saat kost dideaktivasi dari KostManager ke mitra biasa, data unit kamar individual dan foto survei resmi terancam hilang/tertindih oleh data mandiri mitra biasa. | `deactivateKostManagerAndRestoreSelfListing` di `adminService.ts` kini secara otomatis mengarsipkan seluruh snapshot data KostManager ke dalam `metadata.archived_kostmanager_data` dan `metadata.kostmanager_*`. |
| **Survei Ulang Re-Aktivasi di Agent Dashboard** | Jika properti kembali mengajukan KostManager, dashboard agen memperlakukannya seperti properti reguler baru yang beralih (semua foto dikosongkan menjadi `0 Foto`, kamar di-reset menjadi tipe kamar ringkas saja). | `openKostManagerListing` di `AgentDashboard.tsx` kini mendeteksi `archived_kostmanager_data`. Jika ditemukan, sistem otomatis memuat seluruh 10 unit kamar individual, nomor kamar, status terisi/kosong, tarif sewa, fasilitas kamar, dan seluruh foto survei lama. |
| **Pencegahan Foto Terhapus oleh Sanitasi** | Fungsi filter sanitasi draft `isValidSurveyPhoto` sebelumnya mengabaikan foto bertanda path survei jika URL-nya pernah tercatat di snapshot mandiri. | `isValidSurveyPhoto` kini secara eksplisit mengizinkan seluruh URL yang memuat path `kostmanager/` dan `survey_photos/`, memastikan foto survei lama tetap tampil utuh. |
| **Pemberitahuan & Modal Konfirmasi Agen** | Modal konfirmasi hanya menampilkan pesan umum peninjauan ulang data self-listing. | Modal peringatan disesuaikan dengan tema biru khusus: *"Basis Data KostManager Dipulihkan"*, tombol *"Mulai Penyesuaian"*, dan banner informasi berlatar belakang biru dengan ikon `Building2` yang menjelaskan secara transparan bahwa data 10 unit kamar dan foto survei telah terpasang otomatis. |

---

## 2. File yang Dimodifikasi

1. **[`functions/public/adminService.ts`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/adminService.ts)**:
   - Memperbarui fungsi `deactivateKostManagerAndRestoreSelfListing` agar menyimpan arsip lengkap KostManager ke `metadata.archived_kostmanager_data` dan field `metadata.kostmanager_*` (mencakup `room_types`, `image_urls`, `facilities`, `rules`, `description`, `price`, `total_rooms`, `location`, `photo_categories`, `categorized_photos`, `photos_meta`, `signature_data`).
2. **[`functions/public/pages/AgentDashboard.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/AgentDashboard.tsx)**:
   - Menambahkan state `isPreviousKostManagerReactivation`.
   - Mengintegrasikan deteksi `archived_kostmanager_data` pada inisialisasi `openKostManagerListing`.
   - Menambahkan cabang pemulihan B.1 khusus Re-Aktivasi KostManager yang memuat seluruh unit kamar individual beserta foto surveinya, foto properti publik, dan kategori foto.
   - Menyelaraskan fallback `draftRoomTypes` dengan data `archivedKm`.
   - Memperbarui modal peninjauan ulang dengan header dan deskripsi khusus re-aktivasi KostManager.
   - Menambahkan banner informasi modern di bagian atas badan modal survei.
3. **Database Supabase (`properties`)**:
   - Menyelaraskan rekaman `metadata.archived_kostmanager_data` untuk "Kost Apalah Daya" (`bb6b0ccc-6d9e-494a-b972-aa7dd9cbd81f`) dengan 10 unit kamar resmi (8 Terisi, 2 Kosong) beserta foto kamar 8 (7 foto) dan kamar 9 (8 foto).

---

## 3. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi Produksi Front-End
Menjalankan perintah build `npm.cmd run build` di direktori `functions/public`:
```
vite v6.4.1 building for production...
transforming...
✓ 2512 modules transformed.
rendering chunks...
computing gzip size...
✓ built in 33.36s
```
- **Hasil**: 100% Lulus (0 error kompilasi).
- Seluruh aset produksi telah disinkronkan ke direktori root `./public` dan `./dist`.

### B. Uji Verifikasi Data Historis KostManager (Node.js)
Hasil eksekusi verifikasi integritas data pada properti "Kost Apalah Daya":
```
Property Title: Kost Apalah Daya
Archived KM Data Present: true
Archived KM Room Count: 10
Archived KM Images Count: 7
  Room 1: 1 (Status: Terisi, Photos: 0)
  Room 2: 2 (Status: Terisi, Photos: 0)
  Room 3: 3 (Status: Terisi, Photos: 0)
  Room 4: 4 (Status: Terisi, Photos: 0)
  Room 5: 5 (Status: Terisi, Photos: 0)
  Room 6: 6 (Status: Terisi, Photos: 0)
  Room 7: 7 (Status: Terisi, Photos: 0)
  Room 8: 8 (Status: Kosong, Photos: 7)
  Room 9: 9 (Status: Kosong, Photos: 8)
  Room 10: 10 (Status: Terisi, Photos: 0)
```

---

## 4. Panduan Verifikasi Pengguna (UI Testing Guide)

1. **Buka Halaman Dashboard Agen (`/dashboard/agent` atau tab Survei Agen)**:
   - Masuk menggunakan akun Agen Survei yang ditugaskan untuk tiket survei Kost Apalah Daya (atau properti dengan riwayat KostManager lainnya).
2. **Buka Formulir Onboarding KostManager**:
   - Klik tombol aksi survei / onboarding pada kartu properti Kost Apalah Daya.
3. **Periksa Tampilan Modal Peringatan**:
   - Sistem akan memunculkan modal khusus berikon gedung biru bertajuk **"Basis Data KostManager Dipulihkan"**.
   - Teks penjelasan mengonfirmasi bahwa 10 unit kamar dan foto survei lama telah otomatis dipulihkan.
   - Klik tombol **"Mulai Penyesuaian"**.
4. **Periksa Banner Informasi di Atas Formulir**:
   - Di bagian atas formulir muncul banner biru elegan dengan badge *"Riwayat KostManager"* yang menginformasikan bahwa data unit kamar dan foto survei telah terpasang otomatis.
5. **Periksa Tab Kamar (Step 2)**:
   - Terlihat ke-10 unit kamar (Kamar 1 hingga Kamar 10).
   - Kamar 8 dan Kamar 9 berstatus Kosong lengkap dengan foto-foto survei yang telah diambil sebelumnya.
   - Agen hanya perlu memperbarui status kamar jika ada yang keluar/masuk atau menyesuaikan harga sewa terkini.
