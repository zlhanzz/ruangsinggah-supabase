# Rencana Implementasi: Perapihan & Peningkatan UI/UX Section Pesan Mitra di Tampilan PC & Mobile

## 1. Analisis Masalah & Kebutuhan UI/UX
- **Kondisi & Masalah Saat Ini pada Tampilan PC**:
  1. **Container Chat Menggantung / Kosong di Bawah**: Tinggi container chat dihitung `h-[calc(100vh-12rem)]` dengan margin bawah yang berlebihan, sehingga box percakapan terlihat mengambang di tengah layar dengan area kosong luas di sebelah kanan dan bawah.
  2. **Panel Chat Kanan Tidak Memiliki Header Percakapan**: Saat percakapan aktif dipilih, bagian kanan langsung menampilkan gelembung pesan tanpa adanya header informasi lawan bicara (nama penyewa, foto/avatar, status, dan label nama kost terkait). Hal ini membuat tampilan terasa rancu, terpotong, dan tidak profesional.
  3. **Proporsi Sidebar & Chat Area Kurang Optimal pada Layar Desktop**: Lebar sidebar daftar chat dan panel pesan perlu diseimbangkan (misal `sm:w-80 md:w-96` pada sidebar dan `flex-1` pada ruang pesan) agar gelembung pesan dan input percakapan memiliki ruang baca yang luas dan nyaman.

- **Tujuan Solusi UI/UX**:
  - Menghadirkan tata letak chat modern kelas dunia (*WhatsApp Web / Dashboard Enterprise Standard*) yang memenuhi tinggi layar desktop secara presisi (`h-[calc(100vh-8.5rem)] min-h-[640px]`).
  - Menambahkan **Chat Header terpadu** di panel pesan aktif yang memuat avatar, nama calon penghuni, status "Calon Penghuni", dan pill badge nama kost properti.
  - Merapikan visualisasi gelembung chat (*chat bubbles*), timestamp, indikator centang baca, serta input formulir pengiriman balasan.

---

## 2. Dampak Perubahan File

| File | Tindakan & Penjelasan Perubahan |
| :--- | :--- |
| `functions/public/pages/MitraDashboard.tsx` | 1. Perbarui container chat agar memanfaatkan tinggi layar secara optimal (`h-[calc(100vh-8rem)] min-h-[640px]`).<br>2. Perlebar sidebar daftar chat menjadi `sm:w-80 lg:w-[380px]` dengan pembatas halus.<br>3. Sempurnakan tampilan state kosong percakapan (*Empty State*) dan card list chat. |
| `functions/public/components/ChatWindow.tsx` | 1. Pada mode `isEmbedded`, tambahkan **Chat Header** elegan di bagian atas panel chat yang menampilkan avatar, nama lawan bicara, status online/calon penghuni, serta badge judul properti kost.<br>2. Sempurnakan area gelembung pesan (`bg-slate-50/70`, bubble styling rapi, timestamp & check status).<br>3. Rapikan input bar formulir dengan rounded styling dan tombol kirim responsif. |

---

## 3. Langkah-Langkah Eksekusi

### Langkah 1: Sempurnakan `ChatWindow.tsx` untuk Mode Embedded
- Tambahkan header informasi di bagian atas `if (isEmbedded)`:
  - Avatar lingkaran / inisial calon penghuni.
  - Nama calon penghuni / administrator.
  - Badge nama properti kost: `🏠 KOST APALAH DAYA`.
  - Status aktif / calon penghuni.
- Rapikan bubble chat dan area list pesan agar scrolling mulus dan responsif di berbagai resolusi layar.

### Langkah 2: Sempurnakan Layout Section Chat di `MitraDashboard.tsx`
- Sesuaikan height container chat menjadi `h-[calc(100vh-8.5rem)] min-h-[640px]`.
- Optimalkan pembagian lebar sidebar (`w-full sm:w-80 lg:w-[360px]`) dan ruang chat aktif (`flex-1`).
- Pastikan tampilan mobile tetap mulus dengan transisi buka-tutup percakapan yang intuitif.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi & Build**:
   - Jalankan `cmd /c npm run build` di folder `functions/public` untuk memastikan 0 error kompilasi.
2. **Verifikasi Visual UI/UX**:
   - **Tampilan Desktop (PC)**: Buka menu Pesan di Dashboard Mitra $\rightarrow$ Pastikan layout chat mengisi tinggi layar secara proporsional dan elegan, header percakapan muncul jelas di atas ruang chat dengan nama penghuni & kost, dan tidak ada ruang kosong mengambang yang rancu.
   - **Tampilan Mobile (HP)**: Buka menu Pesan $\rightarrow$ Navigasi daftar chat dan buka percakapan tetap berjalan mulus dengan tombol kembali (*Back*).
