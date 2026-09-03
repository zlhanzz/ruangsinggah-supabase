# IMPLEMENTATION PLAN: Kendali Cepat Update Jumlah Kamar Tersedia di Menu "Kost Saya"

## 1. Analisis Masalah & Kebutuhan
- **Kebutuhan Pengguna**:
  - Saat ini, jika pemilik kost ingin mengubah jumlah kamar yang kosong/tersedia (misal ada penyewa baru masuk atau keluar), pemilik kost harus mengklik tombol Edit $\rightarrow$ masuk ke wizard formulir raksasa 6-langkah (`KostFormMitra`) $\rightarrow$ mencari langkah tipe kamar $\rightarrow$ mengubah angka $\rightarrow$ lalu menyimpan seluruh formulir.
  - Pengguna meminta adanya **kendali cepat** langsung pada kartu properti di tab **"Kost Saya"** agar perubahan jumlah kamar kosong dapat dilakukan dalam hitungan detik tanpa perlu membuka form edit total.

- **Tujuan Pengembangan**:
  - Menyematkan widget kendali cepat ketersediaan kamar pada setiap kartu properti di tab *"Kost Saya"*.
  - Menyediakan stepper interaktif `[-]` dan `[+]` yang langsung meng-update data ketersediaan kamar di Supabase dan state lokal secara instan (0ms delay / optimistic update).
  - Menyediakan modal ringkas (*Quick Room Manager Modal*) jika kost memiliki banyak tipe kamar (multi-type).

---

## 2. Dampak Perubahan
- **Berkas yang Dimodifikasi**:
  - `functions/public/pages/MitraDashboard.tsx`:
    - Menambahkan state dan fungsi mutasi cepat `handleQuickUpdateRooms(kostId: string, newCount: number, roomTypeIdx?: number)`.
    - Menambahkan antarmuka kendali cepat (*Quick Room Stepper*) pada kartu properti non-KostManager di tab *"Kost Saya"*.
    - Menambahkan modal dialog ringkas untuk properti dengan multi tipe kamar.

---

## 3. Langkah-Langkah Eksekusi
1. **Penyusunan Logika Update Cepat di `MitraDashboard.tsx`**:
   - Membuat fungsi `handleQuickUpdateRooms(kostId: string, newCount: number, roomTypeIdx?: number)`:
     - Menghitung array `room_types` baru dengan `availableRoomCount = newCount` dan `isAvailable = newCount > 0`.
     - Memperbarui state lokal `properties` secara optimistik agar UI seketika berubah.
     - Mengirim update ke Supabase tabel `properties` pada kolom `room_types` dan `updated_at`.
2. **Penyematan Antarmuka Kendali Cepat pada Kartu Kost**:
   - Di dalam kartu properti (di bawah info Harga & Rating):
     - Menampilkan section ketersediaan kamar dengan badge status (*🟢 X Kamar Kosong* atau *🔴 Kamar Penuh*).
     - Untuk kost 1 tipe kamar: Stepper interaktif `[-]` `{X Kamar}` `[+]` yang dapat diklik langsung.
     - Untuk kost multi tipe kamar: Menampilkan rincian per tipe kamar dan tombol `[ Atur per Tipe Kamar ⚡ ]`.
3. **Penyediaan Modal Ringkas Multi-Tipe Kamar**:
   - Modal ringkas untuk menyesuaikan ketersediaan masing-masing tipe kamar secara independen.
4. **Kompilasi & Build**:
   - Menjalankan `cmd /c npm run build` di `functions/public/` untuk memastikan 0 error kompilasi.
5. **Pencatatan Progres & Git Push**:
   - Mencatat progres nomor 308 di `functions/PROGRESS.md`.
   - Memperbarui `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
- Buka tab **"Kost Saya"** di Dashboard Mitra (`/dashboard-mitra/properties`):
  - Periksa kartu kost: Terdapat widget kendali cepat kamar.
  - Klik tombol `[+]` $\rightarrow$ Jumlah kamar kosong bertambah dan tersimpan instan.
  - Klik tombol `[-]` $\rightarrow$ Jumlah kamar kosong berkurang (jika 0 berubah menjadi badge merah *Kamar Penuh*).
  - Buka halaman preview detail kost $\rightarrow$ Verifikasi jumlah kamar kosong di sisi publik otomatis sesuai dengan angka baru.
