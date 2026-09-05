# Rencana Implementasi: Penyederhanaan Desain Pop-Up Penolakan Booking Gender Mismatch

## 1. Analisis Masalah & Kebutuhan
- **Masalah**:
  - Tampilan modal penolakan saat ini dinilai terlalu rumit / ramai (*"se ribet ini"*), memuat terlalu banyak elemen visual (pita gradien, badge sistem, dua kotak komparasi terpisah, dan paragraf peringatan panjang).
- **Tujuan Pengembangan**:
  - Menyederhanakan antarmuka modal menjadi bentuk yang **minimalis, bersih, ringkas, dan langsung tepat sasaran (*straight-to-the-point*)**, sehingga pesan penolakan tersampaikan secara efektif dan ramah kepada pengguna tanpa elemen visual yang berlebihan.

---

## 2. Dampak Perubahan
File yang akan disentuh:
- [`functions/public/pages/KostDetail.tsx`](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostDetail.tsx): Merampingkan markup JSX dan styling modal penolakan gender mismatch.

---

## 3. Rencana Langkah-Langkah Eksekusi
1. **Penyederhanaan Layout & Struktur Modal**:
   - Menghapus elemen dekoratif yang berat (pita atas, box perbandingan 2 kolom, dan paragraf ganda).
   - Mengubah ukuran modal menjadi kompak (`max-w-sm` / `max-w-md`) dengan padding yang pas dan terpusat (`text-center`).
2. **Penyusunan Pesan Ringkas & Efektif**:
   - Ikon tunggal elegan di bagian atas (lingkaran merah lembut dengan ikon `AlertCircle` / `ShieldAlert`).
   - Judul singkat: **"Kost Khusus {Putri / Putra}"**.
   - Deskripsi pesan langsung (1-2 kalimat):
     *"Mohon maaf, kost ini hanya diperuntukkan bagi penyewa **{Wanita / Pria}**, sedangkan akun Anda terdaftar sebagai **{Pria / Wanita}**."*
3. **Penyelarasan Tombol Aksi yang Proporsional**:
   - Tombol Utama (Oranye): *"Cari Kost {Putra / Campur}"* (mengarahkan langsung ke katalog yang sesuai).
   - Tombol Tutup / Batal yang rapi dan tidak memakan ruang.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi**: Menjalankan `npm run build` di direktori `functions/public` untuk memastikan 0 error kompilasi.
2. **Verifikasi Visual**: Memastikan tampilan pop-up di layar mobile maupun desktop tampak bersih, elegan, tidak berbelit-belit, dan mudah dipahami dalam hitungan detik.
