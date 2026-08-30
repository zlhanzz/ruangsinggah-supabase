# IMPLEMENTATION PLAN: Perbaikan Layout & Redesain Responsif Kartu Pengajuan Sewa (Countdown 24 Jam)

Dokumen ini berisi rencana perbaikan dan penyempurnaan UI/UX kartu pengajuan sewa pada menu **Kost Saya** (`MyKost.tsx`) agar kembali rapi, proporsional, elegan, dan 100% responsif di semua resolusi layar (Mobile, Tablet, Desktop).

---

## 1. Analisis Masalah & Penyebab Layout Rusak

Berdasarkan inspeksi kode dan tangkapan layar yang dilampirkan:

1. **Tag HTML Unclosed (Missing `</div>`) pada Pembungkus Gambar**:
   - Pada baris ~2117 `MyKost.tsx`, tag pembungkus gambar (`<div className="relative shrink-0 group/img cursor-pointer">`) kehilangan tag penutup `</div>`.
   - **Dampaknya**: Seluruh elemen judul kost, lokasi, dan deretan badge status ikut tertelan masuk ke dalam div gambar. Akibatnya, banner countdown batas waktu pembayaran terdorong ke kanan menjadi *sibling* sejajar dengan gambar, sehingga memecah struktur grid secara total.
2. **Hirarki Tombol Aksi Rusak & Menumpuk Raksasa di Bawah**:
   - Karena struktur grid rusak, kolom aksi kanan (`lg:col-span-4`) terlempar ke bagian bawah kartu. Tiga tombol aksi (*Rute Ke Kost*, *Bantuan KostManager*, *Bayar Sekarang*) menjadi balok raksasa memanjang penuh yang tidak proporsional dan meninggalkan ruang kosong (*whitespace*) yang aneh.
3. **Fallback Foto Kamar Menjadi Kotak Hitam Kosong ("0 Foto Kamar")**:
   - Ketika pengajuan sewa baru dibuat untuk unit kamar yang belum memiliki foto spesifik kamar (`kost.displayImage`), sistem langsung menampilkan kotak hitam pekat dengan ikon kecil, bukan mengambil fallback foto utama properti/gedung kost (`kost.image` atau `kost.property?.images`).
4. **Desain Banner Countdown Kurang Terintegrasi**:
   - Komponen countdown batas waktu 24 jam belum memiliki penataan layout yang menyatu dengan estetika kartu utama, sehingga saat dirender terlihat kaku dan mengganggu tata letak informasi inti properti.

---

## 2. Rencana Solusi & Redesain UI/UX

### A. Perbaikan Struktur Flex & Grid
- Menutup tag `</div>` pembungkus gambar secara presisi.
- Mengembalikan struktur 2 kolom grid standar:
  - **Kolom Kiri (`lg:col-span-8`)**: Foto Kamar/Kost (kiri) + Header Info (Kanan: Badges, Judul Kost, Lokasi, Rating).
  - **Banner Countdown 24 Jam**: Ditempatkan sebagai banner full-width elegan di dalam kartu dengan glassmorphism/soft gradient, menyatu dengan visual progress bar sewa.
  - **Kolom Kanan (`lg:col-span-4`)**: Action Sidebar yang proporsional dan rapi (Tombol *Bayar Sekarang* sebagai Primary CTA bergradien oranye, tombol *Bantuan KostManager* via WhatsApp/Chat, dan tombol *Rute Ke Kost*).

### B. Smart Fallback Foto Properti / Kamar
- Menerapkan hierarki pencarian foto kamar yang cerdas:
  `kost.roomPhotos?.[0]` ➔ `kost.displayImage` ➔ `kost.property?.images?.[0]` ➔ `kost.image` ➔ default placeholder ilustrasi RuangSinggah.
- Menjamin tidak ada lagi kotak hitam kosong yang merusak tampilan kartu.

### C. Redesain Countdown Timer yang Elegan & Responsif
- **Header Countdown**: Icon jam dengan pulse lembut, judul *"BATAS WAKTU PEMBAYARAN"*, dan keterangan batas waktu WITA.
- **Timer Digits Display**: Kotak digit modern font monospaced (Jam : Menit : Detik) dengan background kontras halus dan badge label mikro.
- **Status Urgensi Otomatis**: Jika sisa waktu < 2 jam, banner otomatis bertransisi ke warna aksen *rose/red alert* dengan animasi denyut perhatian.
- **Full Responsif**: Pada layar HP (< 640px), elemen countdown tertata vertikal/kompak yang rapi tanpa overflow; pada tablet/desktop tertata horizontal mewah.

---

## 3. Dampak Perubahan (Files to Touch)

- `functions/public/pages/MyKost.tsx`

---

## 4. Langkah-Langkah Eksekusi

1. **Langkah 1: Restrukturisasi HTML & Perbaikan Tag `</div>`**
   - Membuka `functions/public/pages/MyKost.tsx` dan memperbaiki penutupan tag pembungkus gambar di baris ~2090–2130.
2. **Langkah 2: Smart Image & Photo Resolution**
   - Mengambil fallback foto gedung kost jika foto spesifik tipe kamar belum tersedia pada objek booking baru.
3. **Langkah 3: Redesain Komponen Countdown & Status Pembayaran**
   - Mempercantik banner countdown batas waktu pembayaran 24 jam dengan styling modern, responsif, dan terintegrasi mulus.
4. **Langkah 4: Restorasi Action Sidebar & CTA Hierarchy**
   - Menata ulang tombol aksi kanan (`Bayar Sekarang`, `Bantuan KostManager`, `Rute Ke Kost`) agar pas di kolom kanan desktop dan adaptif di mobile.
5. **Langkah 5: Verifikasi Kompilasi & Build**
   - Menjalankan `npm run build` di `functions/public/` untuk memastikan 0 error kompilasi TypeScript.

---

## 5. Rencana Verifikasi

- **Verifikasi Kompilasi**: `cmd /c npm run build` (wajib exit code 0).
- **Verifikasi Layout Visual**: Memastikan tampilan kartu di layar desktop, tablet, dan mobile kembali rapi, proporsional, foto kost tampil indah, countdown terlihat mewah, dan tombol aksi tersusun sempurna.
