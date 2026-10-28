# IMPLEMENTATION PLAN - Pembersihan Elemen "AI Slop" & Penyelarasan Branding RuangSinggah pada Kartu Pengajuan Sewa (`MyKost.tsx`)

## 1. Analisis Masalah & Kebutuhan
Berdasarkan tinjauan tangkapan layar (screenshot) antarmuka mobile kartu pengajuan sewa pada tab **Diajukan**, tampilan saat ini memperlihatkan sejumlah karakteristik visual yang terkesan "AI slop" (desain template generik AI) yang tidak selaras dengan identitas branding asli **RuangSinggah**:

1. **Palet Warna "Rainbow Pastel" Acak pada Grid Parameter**:
   - Grid 4 parameter sewa menggunakan warna pastel terpisah di setiap kartu (oranye, biru muda, ungu muda, kuning amber) lengkap dengan kotak squircle masing-masing. Ini adalah gaya khas template dashboard AI generik yang membuat kartu terlihat ramai, tidak profesional, dan menyimpang dari palet brand RuangSinggah (Warm Orange & Sleek Slate/Charcoal).
2. **Banner Edukasi Menunggu Persetujuan Terlalu Dominan & Kaku**:
   - Banner berlatar gradien kuning-oranye tebal dengan sudut sangat melengkung (*heavy rounded corners*) dan ikon lingkaran jam raksasa terasa seperti kotak peringatan darurat/billboard, bukan kartu status proptech yang tenang dan elegan.
3. **Ornamen & Elemen Acak (Emoji ⚡ & Tumpukan Badge)**:
   - Terdapat ornamen badge emoji `⚡` mengambang acak di pojok bawah thumbnail foto tanpa tujuan fungsional yang jelas.
   - Badge status `MENUNGGU PERSETUJUAN` dan `TIPE STANDARD` bertumpuk dengan border pill tebal di bagian atas, membuat visual terfragmentasi.
4. **Tombol CTA Tidak Senada dengan Identitas Brand**:
   - Tombol utama `HUBUNGI PEMILIK KOST` memakai gradien emerald-teal yang terlalu mencolok dan bertabrakan dengan aksen oranye website.
   - Tombol penunjang `DETAIL KOST` dan `RUTE LOKASI` berhimpitan, dan pada tampilan mobile tertutup oleh tombol mengambang (*FAB*) `TimeSimulator` di pojok kanan bawah.
   - Tombol `Batalkan Pengajuan` mengambang canggung di bawah tanpa ritme visual yang terstruktur.

---

## 2. Arah Solusi Desain (Clean, Modern & On-Brand RuangSinggah)

### A. Palet & Identitas Brand RuangSinggah
- **Warna Utama**: RuangSinggah Orange (`#f97316` / `orange-500`) untuk aksen penting dan fokus utama.
- **Warna Netral & Tipografi**: Slate/Charcoal (`slate-900`, `slate-700`, `slate-500`) dengan font Plus Jakarta Sans yang tegas dan bersih.
- **Surfaces**: Kartu berlatar putih bersih dengan border halus `border-slate-100` atau `border-slate-200/80` tanpa bayangan berlebihan (*clean flat/subtle float proptech style*).

### B. Perubahan Spesifik pada Antarmuka

| Komponen Saat Ini ("AI Slop") | Desain Baru (On-Brand RuangSinggah) |
| :--- | :--- |
| **Grid Parameter 2x2 Warna-Warni**<br>(4 kartu pastel acak: oranye, biru, ungu, kuning) | **Satu Kontainer Rincian Terpadu (*Spec Sheet Box*)**<br>Latar `bg-slate-50/70 border border-slate-100/90 rounded-2xl p-4`. Seluruh ikon bernuansa monokromatik slate elegan dengan aksen angka tegas, rapi, dan mudah dipindai mata layaknya aplikasi Traveloka / Airbnb. |
| **Banner Kuning Raksasa & Ikon Jam Besar**<br>(Gradien tebal, rounded masif, visual darurat) | **Notice Bar Elegan & Ramping**<br>Card minimalis `bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5` dengan ikon jam proporsional (w-4 h-4), teks tenang menegaskan bahwa pembayaran dilakukan setelah pemilik meng-ACC. |
| **Ornamen Emoji ⚡ Mengambang**<br>(Mengambang di sudut foto thumbnail) | **Dihapus Sepenuhnya**<br>Menghilangkan emoji ⚡ acak; thumbnail foto tampil bersih, profesional, dan fokus pada dokumentasi kamar. |
| **Tumpukan Badge Berantakan**<br>(Badge status + tipe kamar saling berebut) | **Hirarki Badge Terstruktur**<br>Badge status `MENUNGGU PERSETUJUAN` tampil rapi dan tegas, didampingi tipe kamar dengan visual yang seimbang dan tidak tumpang tindih. |
| **Tombol CTA Gradien Emerald-Teal Menyilaukan** | **Tombol Komunikasi Proptech Elegan**<br>Menggunakan styling solid proptech yang serasi (`bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold py-3.5`), bersih tanpa gradien pelangi. |
| **FAB TimeSimulator Menutupi Tombol Aksi** | **Penyelarasan Spacing & Safe-Area**<br>Memberikan bottom spacing yang cukup pada kartu sewa dan memastikan letak FAB pengujian waktu tidak menghalangi tombol interaktif pengguna. |

---

## 3. Dampak Perubahan (Files to Touch)
- [functions/public/pages/MyKost.tsx](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/MyKost.tsx) (Modifikasi styling kartu sewa, parameter grid, banner info, action buttons, dan thumbnail).
- [functions/PROGRESS.md](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/PROGRESS.md) (Pencatatan riwayat Progres #470 setelah ACC dan eksekusi).
- [WALKTHROUGH.md](file:///C:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/WALKTHROUGH.md) (Dokumentasi walkthrough hasil perubahan setelah ACC dan eksekusi).

---

## 4. Langkah-Langkah Eksekusi (Hanya Setelah di-ACC)
1. **Pembersihan Elemen Visual AI Slop pada Thumbnail**:
   - Menghapus elemen emoji `⚡` di lines 2413-2415 `MyKost.tsx`.
   - Merapikan badge `Foto` dan rasio thumbnail.
2. **Penyempurnaan Header & Badge Status**:
   - Menyelaraskan status `MENUNGGU PERSETUJUAN` dan `TIPE STANDARD` agar proporsional dan tidak kaku.
3. **Penyederhanaan Banner SLA Respon 1x24 Jam**:
   - Mengubah card gradien kuning tebal menjadi notice card yang ramping, bersih, beraksen amber lembut khas proptech terpercaya.
4. **Transformasi Grid Parameter Menjadi 'Unified Booking Spec Sheet'**:
   - Mengganti 4 kartu pastel acak menjadi satu blok rincian pemesanan yang monokromatik dan kohesif:
     - Check-in: Tanggal rencana masuk
     - Durasi: Paket durasi
     - Penghuni: Jumlah kapasitas
     - Tagihan: Estimasi total sewa + badge netral "Belum Bayar"
5. **Penyelarasan Tombol Aksi & Spacing Mobile**:
   - Menjadikan tombol `Hubungi Pemilik Kost` bersahaja dan profesional.
   - Menata tombol `Detail Kost`, `Rute Lokasi`, dan `Batalkan Pengajuan` dengan grid yang kokoh dan bottom margin yang aman dari FAB simulator.
6. **Kompilasi & Verifikasi Build**:
   - Menjalankan `cmd.exe /c "npm --prefix functions/public run build"` (memastikan 0 error).
   - Menjalankan `cmd.exe /c "npm --prefix functions run build"` (`tsc`).
7. **Pencatatan & Git Push**:
   - Mencatat progres #470 di `functions/PROGRESS.md`.
   - Menerbitkan `WALKTHROUGH.md`.
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi
1. **Verifikasi Visual**:
   - Meninjau tampilan mobile kartu pengajuan sewa: warna-warni pastel hilang, digantikan oleh kartu ringkasan monokromatik slate-orange yang bersih.
   - Tidak ada lagi emoji `⚡` acak di thumbnail.
   - Banner edukasi tampil ramping dan elegan, tidak menyerupai popup AI generic.
   - Tombol aksi tidak bertabrakan dengan FAB `TimeSimulator`.
2. **Verifikasi Build**:
   - Kompilasi Vite frontend lulus 100% (code 0).
   - Kompilasi TypeScript backend functions lulus 100% (code 0).
