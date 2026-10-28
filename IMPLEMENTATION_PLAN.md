# Rencana Implementasi: Perbaikan Preview Foto, Banner Keamanan Penuh, dan Normalisasi Label Kamar pada Chat

Dokumen ini disusun untuk mengatasi umpan balik visual dari pengguna di mana preview foto kamar belum muncul dan teks peringatan keamanan transaksi terpotong tanda elipsis (`...`).

---

## 1. Analisis Masalah

1. **Preview Foto Tidak Muncul (Muncul Icon Fallback Home)**:
   - **Penyebab**: Pada `KostDetail.tsx`, data foto kost dari database disimpan dalam properti `kost.imageUrls` (array string/objek), sedangkan saat menyalurkan props ke `<ChatWindow />`, kode sebelumnya hanya membaca `kost.images?.[0]`. Pada kost reguler (seperti *kost ryuta* pada screenshot), `kost.images` tidak terdefinisi sehingga `propertyPhoto` menjadi `undefined` dan memicu fallback icon rumah `<Home />`.
   - **Solusi**: Lengkapi rantai ekstraksi URL foto secara komprehensif:
     `selectedChildRoom?.images?.[0] || selectedRoom?.images?.[0] || (kost.imageUrls && (typeof kost.imageUrls[0] === 'string' ? kost.imageUrls[0] : kost.imageUrls[0]?.url)) || (kost.images && kost.images[0]) || displayedImages?.[0] || propertyPhotos?.[0]?.url || ''`.

2. **Teks Peringatan Keamanan Transaksi Terpotong (`sis...`)**:
   - **Penyebab**: Kontainer teks pada `ChatWindow.tsx` menggunakan kelas CSS Tailwind `truncate` (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`), yang memotong paksa teks satu baris jika ukuran layar atau modal tidak mencukupi.
   - **Solusi**: Hapus kelas `truncate`, ganti dengan text wrapping responsif (`leading-snug sm:leading-normal text-emerald-950 font-normal break-words`), sehingga seluruh kalimat perlindungan dan garansi uang kembali 100% terbaca utuh tanpa terpotong di semua ukuran layar (mobile maupun desktop).

3. **Label Kamar Dobel / Redundan (`Kamar Standard • Standard`)**:
   - **Penyebab**: Ketika unit kamar yang dipilih adalah kost biasa (bukan managed per nomor kamar), `roomNumber` dan `roomType` sama-sama berisi `"Standard"`. Formula string `Kamar ${roomNumber} • ${roomType}` menghasilkan redundansi teks *"Kamar Standard • Standard"*.
   - **Solusi**: Terapkan *smart room label formatter* di `ChatWindow.tsx`. Jika nama kamar sama dengan tipe kamar (atau belum memilih nomor kamar spesifik), sistem secara otomatis merapikannya menjadi **`Tipe Standard`**. Jika ada nomor kamar spesifik (misal unit managed), sistem merendernya menjadi **`Kamar 01 • Tipe Standard`**.

---

## 2. Dampak Perubahan

File yang akan dimodifikasi:
1. `functions/public/components/ChatWindow.tsx`
   - Normalisasi cerdas format label kamar (`displayRoomLabel`).
   - Perbaikan container Banner Jaminan Keamanan Transaksi: hapus `truncate`, gunakan responsive multi-line wrapping agar terbaca 100% utuh.
   - Penambahan `onError` handler pada elemen `<img>` thumbnail untuk fallback otomatis yang anggun.
2. `functions/public/pages/KostDetail.tsx`
   - Memperbaiki parsing `activePhoto` agar membaca `kost.imageUrls` dan `displayedImages`.
   - Memperbaiki parsing `activeRoomNumber` agar tidak menduplikasi nama tipe kamar.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 - Setelah di-ACC)

1. **Update `KostDetail.tsx`**:
   - Salurkan `activePhoto` dengan memprioritaskan `selectedChildRoom?.images?.[0]`, `selectedRoom?.images?.[0]`, `kost.imageUrls?.[0]`, `kost.images?.[0]`, dan `displayedImages?.[0]`.
   - Salurkan `activeRoomNumber`: hanya diisi jika benar-benar ada nomor kamar spesifik dari `selectedChildRoom`.
2. **Update `ChatWindow.tsx`**:
   - Implementasikan fungsi `displayRoomLabel` yang membersihkan duplikasi kata kamar/tipe.
   - Hapus kelas `truncate` dari banner keamanan transaksi dan rapikan layout `flex items-start sm:items-center`.
3. **Kompilasi & Build Testing**:
   - Jalankan `cmd.exe /c "npm --prefix functions/public run build"` untuk memastikan 0 error build.
   - Jalankan `cmd.exe /c "npm --prefix functions run build"` untuk memastikan kelulusan backend.
4. **Pencatatan & Publikasi**:
   - Update entri pada `functions/PROGRESS.md` dan terbitkan `WALKTHROUGH.md`.
   - Commit & push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi

1. **Uji Tampilan Visual (Berdasarkan Screenshot Pengguna)**:
   - Preview foto kamar/kost muncul jelas berbentuk thumbnail persegi rounded dengan border halus.
   - Teks peringatan keamanan transaksi tampil lengkap:
     `🛡️ Jaminan Keamanan Transaksi & Garansi Uang Kembali 100%: Selalu bayar sewa resmi via sistem RuangSinggah agar terhindar dari penipuan.` (tanpa terpotong elipsis).
   - Label kamar pada kartu tersemat tampil rapi sebagai `Tipe Standard` (bukan dobel `Kamar Standard • Standard`).
2. **Uji Fungsionalitas**:
   - Klik `Ajukan Sewa` tetap membuka modal pemesanan resmi dengan kamar terkait.
   - Pengiriman pesan tanya cepat (quick reply) tetap instan dan lancar.
