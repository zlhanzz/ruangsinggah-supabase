# IMPLEMENTATION PLAN - Perbaikan UX & Validasi Halaman Profil User

Rencana ini dibuat untuk menganalisis dan memperbaiki masalah di mana beberapa pengguna melaporkan tidak dapat menyimpan data profil mereka pada halaman `Profile.tsx`.

## 1. Analisis Masalah
Setelah dianalisis, ditemukan dua masalah utama pada halaman `Profile.tsx`:
- **Label Tanggal Lahir Kurang Jelas (Required tetapi tidak ber-asterisk)**:
  Kolom "Tanggal Lahir" bersifat wajib diisi (*required*) dalam logika validasi `handleSave`, namun pada label visual UI tidak ditambahkan tanda asterisk merah (`*`). Hal ini membuat pengguna mengira kolom tersebut opsional, membiarkannya kosong, dan akibatnya proses penyimpanan gagal dengan pesan kesalahan validasi yang membingungkan.
- **Tombol Aksi Menyesatkan di Mode Read-Only**:
  Ketika pengguna sedang dalam mode membaca (*read-only* / `isEditing === false`), terdapat tombol putih di sebelah kanan tombol "Edit Profil" yang berlabel **"Simpan Profile"** tetapi fungsi `onClick` yang dijalankan adalah `onBack` (kembali ke halaman sebelumnya). Pengguna yang mengira tombol tersebut berfungsi untuk menyimpan perubahan akan kecewa karena data mereka tidak tersimpan dan malah diarahkan kembali.

## 2. Dampak Perubahan
Berkas yang akan diubah:
1. `functions/public/pages/Profile.tsx`:
   - Menambahkan tanda asterisk merah (`<span className="text-red-500">*</span>`) pada label "Tanggal Lahir" agar konsisten dengan kolom wajib lainnya.
   - Mengubah teks tombol `"Simpan Profile"` pada mode read-only menjadi `"Kembali"` agar tidak membingungkan pengguna.

## 3. Langkah-Langkah Eksekusi
1. **Pembaruan Label Tanggal Lahir**:
   - Cari bagian input tanggal lahir di `Profile.tsx` (sekitar baris 500).
   - Ubah label menjadi: `Tanggal Lahir <span className="text-red-500">*</span>`.
2. **Penyelarasan Teks Tombol Mode Read-Only**:
   - Cari baris tombol aksi read-only di `Profile.tsx` (sekitar baris 681).
   - Ubah label tombol `Simpan Profile` dengan `onClick={onBack}` menjadi `Kembali`.
3. **Verifikasi Build**:
   - Jalankan `npm run build` menggunakan `cmd.exe` untuk memverifikasi kelayakan kompilasi kode.

## 4. Rencana Verifikasi
- Masuk ke halaman profil pengguna biasa.
- Masuk ke mode edit, pastikan label "Tanggal Lahir" sekarang memiliki tanda bintang merah `*`.
- Masuk ke mode read-only, pastikan tombol kedua berganti nama menjadi "Kembali" alih-alih "Simpan Profile".
- Pastikan build Vite selesai dengan sukses tanpa error.
