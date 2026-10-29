# IMPLEMENTATION PLAN: Modernisasi & Standardisasi Industri Portal Pembayaran (PaymentGateway.tsx)

## 1. Analisis Masalah & Kebutuhan

### Konteks Evaluasi
Pengguna meminta evaluasi menyeluruh terhadap portal pembayaran (**Checkout Gateway / `PaymentGateway.tsx`**) baik dari segi **kualitas arsitektur sistem**, **tampilan visual**, maupun **branding resmi RuangSinggah.id**. Berdasarkan tangkapan layar dan audit mendalam terhadap kode saat ini, ditemukan beberapa masalah kritis:

```
[ MASALAH SAAT INI ]
1. Branding Mentah          : Hanya tulisan teks "RS" oranye dan teks kaku "CHECKOUT GATEWAY", belum menampilkan logo resmi RuangSinggah.id.
2. Tampilan "AI Slop"       : Header hitam pekat (bg-gray-900) terputus dari tema utama web app, sudut membulat ekstrem (rounded-[2.5rem] & rounded-[3rem]) yang bengkak/tidak proporsional, serta penggunaan emoji mentah (📱 💳, 📥, 💳, ✅, ⚠️).
3. Text Colliding / Tumpuk  : Teks "Rp 1.000.000" dan "00:00:00" menempel rapat tanpa jeda di satu baris sempit (Rp 1.000.00000:00:00).
4. Bug Waktu Habis Palsu    : Batas waktu dihitung dari `created_at` dengan durasi statis 3 jam (10800 detik). Untuk sewa kost yang baru di-ACC pemilik hari ini padahal pengajuannya dibuat kemarin, timer langsung menampilkan 00:00:00 merah, membingungkan pembeli.
```

---

### Solusi & Standar Industri yang Diterapkan
1. **Penerapan Branding Resmi RuangSinggah.id**:
   - Menampilkan logo resmi `/logo.png` bersanding dengan tipografi brand `RuangSinggah.id`.
   - Menyertakan badge keamanan perbankan resmi: `Bank-Grade 256-bit SSL Encryption` dan `Terverifikasi Resmi oleh Midtrans`.
2. **Eliminasi Total Gaya "AI Slop"**:
   - Mengganti header gelap kaku dengan desain header proptech premium: latar bersih/soft slate elegan, border terukur (`border-slate-150`), dan aksen warm orange khas RuangSinggah.
   - Mengubah radius sudut menjadi standar fintech modern (`rounded-2xl` dan `rounded-xl`) yang kokoh, rapi, dan proporsional.
   - Mengganti seluruh emoji mentah dengan **Pure Bundled Vector SVG (`lucide-react`)**: `<ShieldCheck />`, `<Lock />`, `<CheckCircle2 />`, `<QrCode />`, `<Building2 />`, `<Smartphone />`, `<Wallet />`, `<CreditCard />`, `<Clock />`, `<ChevronRight />`, `<Copy />`, `<Download />`, `<ArrowLeft />`, `<X />`, `<Receipt />`, `<RefreshCw />`.
3. **Pemisahan Layout Anti-Menumpuk (Zero Text-Collision Layout)**:
   - Memisahkan **Total Tagihan** dan **Countdown Batas Waktu** ke dalam kartu dan kontainer terpisah:
     - Area Nominal: Menampilkan `Rp 1.000.000` dengan tipografi tegas, dilengkapi tombol interaktif `[ Rincian Tagihan ]`.
     - Area Batas Waktu: Ditempatkan dalam badge/banner waktu terdedikasi (`Selesaikan dalam: 23 Jam 58 Menit`) dengan ikon jam vektor yang tidak akan pernah bertubrukan dengan angka tagihan.
4. **Perbaikan Arsitektur Waktu Batas Pembayaran (`timeLeft`)**:
   - Sinkron dengan timestamp persetujuan transaksi (`metadata.approved_at || updated_at`) untuk pesanan sewa (jendela 24 jam sesuai SLA `MyKost.tsx`).
   - Mencegah bug `00:00:00` palsu saat pesanan baru saja disetujui.
5. **Integritas Fungsionalitas & Alur Transaksi**:
   - Mempertahankan 100% integrasi payment gateway Midtrans / Pakasir (QRIS langsung, Virtual Account Bank BCA/BNI/Mandiri/BRI, E-Wallet GoPay/ShopeePay/DANA deep links).
   - Mempertahankan real-time subscription Supabase & polling otomatis status `PAID` tanpa reload halaman.

---

## 2. Dampak Perubahan (Files Touched)

| File | Perubahan Utama |
|---|---|
| `functions/public/components/PaymentGateway.tsx` | - Redesain total visual modal checkout berstandar industri.<br>- Integrasi branding resmi logo `/logo.png` & tipografi `RuangSinggah.id`.<br>- Pemisahan kontainer Total Tagihan dan Timer Countdown anti-tumpuk.<br>- Eliminasi seluruh emoji teks mentah dan digantikan 100% dengan komponen `lucide-react`.<br>- Perbaikan logika `timeLeft` agar sinkron dengan `approved_at` / SLA 24 jam transaksi sewa.<br>- Modernisasi tampilan instruksi pembayaran (QRIS scan, Salin VA, dan tutorial transfer). |

---

## 3. Langkah-Langkah Eksekusi (Incremental Execution)

### Langkah 1: Perbaikan Logika Waktu Pembayaran (`timeLeft`)
1. Di `PaymentGateway.tsx`:
   - Ambil base waktu dinamis berdasarkan tipe produk:
     - Untuk sewa kost (`kost_booking`, `rent`, `kost`, dll): gunakan `currentOrder.metadata?.approved_at || currentOrder.updated_at || currentOrder.created_at` dengan jendela waktu `24 * 3600` detik (24 Jam).
     - Untuk produk/survey instan: gunakan `currentOrder.created_at` dengan durasi 3 jam atau batas waktu spesifik Midtrans.
   - Hindari countdown bernilai 0 detik saat pesanan baru disetujui.

### Langkah 2: Redesain Header & Branding Resmi
1. Terapkan header proptech resmi:
   - Logo: `<img src="/logo.png" alt="RuangSinggah.id" className="h-7 w-auto" />`
   - Brand Wordmark: `RuangSinggah.id` dengan badge `PORTAL PEMBAYARAN RESMI`.
   - Security Badge: `<Lock className="w-3.5 h-3.5 text-emerald-600" /> <span className="text-emerald-700 text-[10px] font-bold">Enkripsi Bank-Grade 256-bit</span>`.
   - Tombol tutup elegan: Lingkaran modern dengan ikon `<X />` lucide.

### Langkah 3: Redesain Area Tagihan & Countdown (Anti-Tumpuk)
1. Rombak kontainer ringkasan pembayaran:
   - Kartu tagihan bersih berlatar putih/soft slate dengan border halus.
   - Baris 1: Label "Total Tagihan" dan tombol toggle accordion `[ Lihat Rincian Tagihan ]` dengan ikon chevron yang berputar.
   - Baris 2: Nominal mata uang besar terformat rapi (`text-2xl sm:text-3xl font-black text-slate-900`).
   - Baris 3: Banner waktu countdown terdedikasi berlatar amber/oranye lembut (`bg-amber-50/80 border border-amber-200/60 rounded-xl px-3 py-2`) yang menampilkan sisa waktu tanpa berbenturan dengan teks nominal.
   - Accordion rincian item (sewa, biaya layanan, deposit) dengan animasi expand yang mulus.

### Langkah 4: Modernisasi Komponen Pemilihan Metode Pembayaran
1. Ganti tampilan daftar metode bayar:
   - Segmented filter kategori: Rekomendasi/Instan (QRIS), E-Wallet (GoPay, DANA), Virtual Account (BCA, Mandiri, BNI, BRI), Outlet, dan Kartu.
   - Kartu metode bayar dengan `rounded-2xl border border-slate-200/80 hover:border-orange-500 hover:shadow-md transition-all`:
     - Logo channel resmi (QRIS, GoPay, DANA, Bank) dalam wadah putih bersih dengan border halus.
     - Nama metode dan badge deskripsi jelas (`Otomatis Terdeteksi • Semua Bank & E-Wallet`).
     - Ikon penunjuk arah `<ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition-colors" />`.

### Langkah 5: Modernisasi Layar Instruksi Bayar (QRIS, VA & Deeplink)
1. Layar QRIS:
   - Wadah QR code bersih dengan bingkai proptech bergaris halus.
   - Ikon vektor `<QrCode />` dan tombol unduh QR `<Download className="w-4 h-4" /> Download QR Code`.
   - Panduan scan aplikasi e-wallet.
2. Layar Virtual Account:
   - Wadah kode bayar besar berbasis mono font dengan tombol interaktif `[ Salin Kode ]` menggunakan ikon `<Copy />` dan transisi ke `<Check className="w-4 h-4 text-emerald-600" /> Tersalin!`.
   - Langkah panduan transfer step-by-step dalam kartu bertingkat yang rapi.

### Langkah 6: Modernisasi Layar Pembayaran Berhasil (Success State)
1. Layar sukses transaksi:
   - Ikon sukses animasi lembut `<CheckCircle2 className="w-16 h-16 text-emerald-500" />`.
   - Ringkasan transaksi terverifikasi: ID Pesanan, Nama Properti/Produk, Nominal, dan Waktu Pembayaran.
   - Tombol aksi utama: `[ Buka Kost Saya ]` / `[ Selesai ]`.

---

## 4. Rencana Verifikasi

1. **Uji Kompilasi Front-End & Back-End**:
   - Jalankan `npm.cmd --prefix functions/public run build` untuk memverifikasi 0 error TypeScript / Vite bundling.
   - Jalankan `npm.cmd --prefix functions run build` untuk memverifikasi backend functions.
2. **Uji Visual & Responsivitas (Mobile & Desktop)**:
   - Pastikan teks `Rp 1.000.000` dan timer countdown tidak bertubrukan pada ukuran layar mobile (360px - 414px) maupun desktop.
   - Pastikan logo resmi `RuangSinggah.id` tampil tajam dan proporsional.
   - Pastikan tidak ada emoji mentah dan seluruh ikon berasal dari `lucide-react`.
3. **Uji Fungsionalitas Transaksi**:
   - Verifikasi pemilihan channel bayar (QRIS, VA, E-Wallet) tetap terhubung sempurna ke API Midtrans.
   - Verifikasi tombol Salin Kode VA berfungsi memberikan umpan balik instan.
   - Verifikasi real-time auto-detection ketika status pembayaran berubah menjadi `PAID`.
