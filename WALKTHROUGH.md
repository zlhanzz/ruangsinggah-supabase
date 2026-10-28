# Walkthrough: Perbaikan Error PostgREST PGRST204 & Standarisasi Tipe Kamar vs Nomor Kamar

Dokumen ini merangkum perbaikan tuntas terhadap kendala pengajuan sewa, eliminasi error skema database PostgREST `PGRST204`, serta standarisasi model bisnis penyewaan kost antara **Mitra Biasa** dan **Mitra KostManager**.

---

## 1. Analisis Akar Masalah (Root Cause)
1. **Error PostgREST `PGRST204`**:
   - Calon penyewa mengalami pesan error saat menekan tombol `[ Ajukan Sewa Sekarang ]`:
     ```text
     Gagal mengajukan sewa: Could not find the 'room_number' column of 'resident_status' in the schema cache
     ```
   - **Penyebab**: Kode pada `userService.ts` mengirimkan kolom fisik root `room_number` ke dalam tabel Supabase `resident_status`. Berdasarkan skema tabel PostgreSQL asli, kolom `room_number` **memang tidak ada** di tabel `resident_status`, melainkan berada di tabel relasional `rooms` (melalui relasi `room_id`).

2. **Perbedaan Model Bisnis Mitra Biasa vs KostManager**:
   - **Mitra Biasa (Katalog Publik)**:
     - Pemilik kost hanya mendaftarkan kuota umum berdasarkan kategori tipe kamar (misal: "Standard", "Deluxe", "VIP").
     - Penyewa memilih tipe kamar, bukan nomor fisik kamar spesifik.
     - Penomoran fisik diserahkan saat penyewa tiba di kost dan serah terima kunci.
   - **Mitra KostManager (Sistem Manajemen PMS Lengkap)**:
     - Properti memiliki data denah dan unit kamar fisik spesifik di tabel `rooms` (`room_id`, `name`, `roomNumber`).
     - Penyewa atau pemilik dapat menetapkan kamar spesifik (misal: "Kamar 102").
   - **Risiko Downgrade / Berhenti Berlangganan**:
     - Jika sebuah kost KostManager berhenti berlangganan / *downgrade* ke Mitra Biasa, sistem tidak boleh crash atau gagal saat penyewa memesan. Sistem kini secara otomatis dan anggun memperlakukan pesanan sebagai sewa tipe kamar (*category-based booking*).

---

## 2. Rincian Perubahan Kode

### A. Backend Data Layer (`functions/public/userService.ts`)
1. **Pembersihan Root Payload `resident_status`**:
   - Menghapus kolom fisik `room_number` dari payload `resident_status.insert([...])`.
   - Menjaga relasi yang valid:
     - `room_type`: Nama tipe kamar murni (misal: "Standard").
     - `room_id`: UUID dari tabel `rooms` (jika KostManager; bernilai `null` jika Mitra Biasa).
     - Objek `metadata`: Menyimpan `room_assignment_type: isKm ? 'specific_unit' : 'category_only'` dan `assigned_room_number`.
2. **Pembersihan Transaksi Finansial (`transactions`)**:
   - Pada tabel `transactions`, `room_number` juga disimpan dengan aman dan modular tanpa menimbulkan konflik skema database.

### B. Halaman Hunian Saya (`functions/public/pages/MyKost.tsx`)
1. **Pembersihan Logika Pengenalan Kamar (`processedActive`)**:
   - Menghilangkan fallback aneh yang memaksakan teks `'Kamar 3'` atau menduplikasi nama tipe kamar menjadi nomor kamar.
   - Jika Mitra Biasa (`roomNumber == null`): Menampilkan badge oranye elegan `[ TIPE STANDARD ]`.
   - Jika KostManager (`roomNumber != null`): Menampilkan badge unit spesifik `[ UNIT 102 ]` bersanding dengan badge tipe `[ STANDARD ]`.
2. **Eliminasi Teks Duplikat**:
   - Memperbaiki teks modal perpanjangan dari yang sebelumnya `Standard • Standard` menjadi:
     - `Kamar 102 • Tipe Standard` (untuk KostManager).
     - `Tipe Standard` (untuk Mitra Biasa).
3. **Format Pelaporan WhatsApp Customer Service**:
   - Pesan template WhatsApp kini secara otomatis menyesuaikan nama unit kamar yang relevan sesuai jenis propertinya.

---

## 3. Hasil Pengujian & Verifikasi

| Komponen | Status | Hasil |
|---|---|---|
| Frontend Build (`functions/public`) | ✅ Lulus | `vite build` selesai dengan exit code 0 (0 error, 0 duplicate keys). |
| Backend Build (`functions`) | ✅ Lulus | `tsc` selesai dengan exit code 0 (0 error). |
| Pengajuan Sewa Mitra Biasa | ✅ Terverifikasi | Berhasil tersimpan ke Supabase tanpa error `PGRST204`. |
| Pengajuan Sewa KostManager | ✅ Terverifikasi | `room_id` dan nomor unit fisik tersimpan rapi. |

---

## 4. Status Git & Repository
- Seluruh modifikasi telah diuji dan siap di-commit ke branch `bukan-productions`.
