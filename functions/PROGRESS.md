# PROGRESS - RuangSinggah Development

## Fitur Selesai (Completed Features)

### 1. Perbaikan Real-Time Banner Error Login & Pembersihan Alert Native Browser (Juni 2026)
- **Reaktivitas URL Search Params**: Mengintegrasikan hook `useSearchParams` pada `Login.tsx` dan memasukkannya ke dalam dependency list `useEffect` untuk mendeteksi perubahan parameter URL secara real-time.
- **Pesan Instan Mismatch & Blocked**: Memastikan pesan kesalahan "role mismatch" (ketika akun biasa mencoba login di portal pemilik kost) dan "akun diblokir" (blocked/banned) tampil secara instan di UI tanpa harus merefresh halaman web secara manual.
- **Penghapusan Alert Native Dialog**: Menghilangkan popup browser native (`alert()`) yang mengganggu estetika pada login sukses (pengalihan langsung secara instan) dan menggantinya dengan inline banner hijau premium pada sukses update kata sandi.

### 2. Manajemen Akun Diblokir & Otorisasi Pemulihan Akses (Unban) Admin (Juni 2026)
- **Tab Akun Diblokir**: Menambahkan tab khusus "Akun Diblokir" pada switcher halaman Manajemen Mitra di Dashboard Admin untuk mempermudah identifikasi dan monitoring akun-akun mitra/owner yang diblokir permanen.
- **Otorisasi Unban (Pulihkan Akses)**: Menyediakan tombol "Pulihkan Akses" untuk Admin guna mengaktifkan kembali akun mitra yang diblokir. Alur unban ini akan mengubah `verification_status` kembali ke `'unverified'`, mereset `rejection_count` ke `0`, dan memicu email pemberitahuan otomatis ke pengguna bahwa akses kemitraan mereka telah diaktifkan kembali.
- **Otomatisasi Email Unbanned**: Mengintegrasikan template email premium "Akses Kemitraan Diaktifkan Kembali" pada Cloud Function `sendMitraStatusEmail` menggunakan Brevo API.

### 3. Penayangan, Penyeragaman Format Kode Referral, State Sync Global, & Penyempurnaan Wizard Edit Profil Mitra (Juni 2026)
- **Tampilan Input Referral Dinamis**: 
  - Input Kode Referral Agen (`referred_by`) ditampilkan di Step 1 (page awal edit profile) secara kondisional menggunakan aturan: `formData.verification_status !== 'verified' && !hasInitialReferral`.
  - Jika pemilik kost (Mitra) belum diverifikasi (`verified`) DAN belum memiliki kode referral tersimpan di database (`referred_by` kosong), input referral akan muncul.
  - Jika pemilik kost sudah terverifikasi oleh admin atau sudah pernah menginputkan referral sebelumnya, input referral akan disembunyikan agar tidak terinput 2 kali.
- **Penyimpanan Draft Otomatis (Step 1)**:
  - Begitu tombol **Lanjutkan** diklik, semua data yang telah diisi di Step 1 (termasuk referral code) secara otomatis tersimpan ke database (`users` dan `mitra`) sebagai draft aktif.
- **Sinkronisasi State Global (State Sync)**:
  - Memperbarui `fetchUserData` di `App.tsx` agar memuat data `referred_by` dari tabel `mitra` secara paralel bersama dengan tabel profile dasar lainnya.
  - Menyediakan global event listener `RS_USER_UPDATED` pada Window object di `App.tsx` yang dipicu setiap kali draft atau profil disimpan di `MitraProfile.tsx`. Hal ini memperbarui context state `user` di seluruh dashboard (termasuk nama/foto di sidebar) secara instan tanpa reload halaman web.
  - Memastikan `loadProfile` di `MitraProfile.tsx` selalu dijalankan pada saat komponen dimuat guna mengambil data mutakhir langsung dari database.
- **Scroll-to-Top Otomatis**:
  - Mengintegrasikan fungsi scroll otomatis `window.scrollTo({ top: 0, behavior: 'smooth' })` pada transisi wizard (saat Lanjutkan, Kembali, dan Batal) untuk memastikan layar langsung memuat dari bagian teratas.
- **Relokasi RLS Security Notice**:
  - Memindahkan posisi RLS Security Notice di Step 2 (Verifikasi KTP) ke bagian paling atas (di bawah judul slide), memberikan kesan jaminan privasi data sebelum pengguna mengunggah foto KTP.
- **Fitur Reset saat Batal/Tutup**:
  - Menambahkan fungsi `handleCancel` yang menyatukan alur pembatalan (tombol "BATAL" dan tombol silang "X"). Saat batal ditekan, status editing dinonaktifkan, step dikembalikan ke 1, dan `loadProfile()` dipanggil untuk membuang perubahan data sementara yang belum disimpan (rollback state).
- **Format Alphanumeric Murni**:
  - Mengubah generator kode referral agen survey dan trigger database di `supabase_schema.sql` agar tidak menyertakan tanda hubung/strip (`-`), sehingga menghasilkan kode murni alphanumeric seperti `AGXXXXXX` yang unik per agen. Placeholder input referral di form pendaftaran dan profile juga disinkronkan ke format baru ini.
- **Fitur Reset saat Batal/Tutup**:
  - Menambahkan fungsi `handleCancel` yang menyatukan alur pembatalan (tombol "BATAL" dan tombol silang "X"). Saat batal ditekan, status editing dinonaktifkan, step dikembalikan ke 1, dan `loadProfile()` dipanggil untuk membuang perubahan data sementara yang belum disimpan (rollback state).
- **Format Alphanumeric Murni**:
  - Mengubah generator kode referral agen survey dan trigger database di `supabase_schema.sql` agar tidak menyertakan tanda hubung/strip (`-`), sehingga menghasilkan kode murni alphanumeric seperti `AGXXXXXX` yang unik per agen. Placeholder input referral di form pendaftaran dan profile juga disinkronkan ke format baru ini.

### 2. Penyempurnaan Alur Wizard Verifikasi KTP & OTP WhatsApp Dinamis Mitra (Juni 2026)
- **WhatsApp OTP Dinamis**:
  - Kolom input OTP kini tersembunyi secara default dan hanya muncul secara dinamis jika status verifikasi nomor WhatsApp adalah belum diverifikasi (`waOtpVerified` bernilai `false`).
  - Setelah nomor berhasil diverifikasi dengan memasukkan kode OTP 6-digit secara benar, input OTP akan disembunyikan secara otomatis, dan ikon centang hijau (`BadgeCheck`) premium diposisikan langsung di dalam input nomor telepon serta di header label.
  - Jika nomor telepon diubah, status verifikasi akan otomatis direset (`waOtpVerified` diubah ke `false`) sehingga mengharuskan pengiriman OTP ulang.
- **Wizard Flow Verifikasi Identitas (KTP)**:
  - Pemisahan proses edit data profil dan pengajuan KTP menjadi alur bertahap (wizard).
  - **Slide 1**: Mengisi identitas utama (Nama, No. WhatsApp - wajib verifikasi OTP, Email, Tempat/Tanggal Lahir, Alamat Domisili).
  - **Akses Slide 2 Dinamis**: Tombol "Lanjutkan ke Verifikasi KTP" hanya akan muncul secara dinamis setelah seluruh kolom data utama di Slide 1 diisi dengan lengkap dan nomor WhatsApp telah terverifikasi via OTP.
  - **Slide 2**: Formulir KTP (Unggah Foto KTP, NIK 16-Digit, Alamat KTP, dan RLS security notice).
- **Pembatasan Akses Pasca-Verifikasi**:
  - Jika status verifikasi akun adalah `verified` (telah disetujui), maka Slide 2 (KTP) disembunyikan sepenuhnya dari wizard dan tidak dapat diakses lagi. Tombol simpan data langsung muncul pada Slide 1 untuk mempermudah pembaruan data profil dasar saja.
  - Jika status verifikasi ditolak (`rejected`), Slide 2 tetap dapat diakses oleh Mitra untuk mengevaluasi data KTP yang salah dan mengunggah ulang dokumen verifikasi yang benar sebelum menekan tombol "Simpan & Ajukan Verifikasi".

### 2. Integrasi Formulir Terpadu Edit Profil & Verifikasi Identitas Mitra (Juni 2026)
- **Formulir Edit Profil Terpadu (Single Unified Form)**: Menyatukan formulir input edit profil dan dokumen verifikasi identitas (KTP) ke dalam satu halaman formulir terpadu yang kohesif saat status `isEditing === true`. Menghilangkan layout dua kolom terpisah ketika edit aktif agar posisi input verifikasi tidak menumpuk di bagian bawah layar smartphone (mobile view).
- **Pembersihan Rekening Bank & Penyederhanaan Verifikasi**:
  - Menghapus informasi Rekening Bank sepenuhnya dari halaman profil pemilik kost (Mitra) karena data ini sudah dikelola terpisah di menu Dompet.
  - Menghapus kartu petunjuk edukatif "Kenapa Harus Verifikasi?" untuk menghemat ruang dan menyederhanakan formulir.
- **Penyempurnaan Data Profil**:
  - Menambahkan Alamat Email (read-only), Tempat Lahir, dan Tanggal Lahir (dilengkapi dengan pemilih tanggal dinamis) ke dalam formulir profil.
  - Menjaga keutuhan tombol pengiriman OTP WhatsApp, notifikasi perlindungan data RLS Supabase, dan auto-pindai KTP berbasis OCR (Tesseract.js).
- **Alur UX Kolaboratif & Responsif**:
  - Saat mode baca (`isEditing === false`), profil ditampilkan dalam card informatif terpisah, dilengkapi card status verifikasi saat ini (Belum Terverifikasi, Sedang Ditinjau, Terverifikasi, Ditolak).
  - Ketika tombol "Edit Profil" atau "Lengkapi & Verifikasi" ditekan, antarmuka bertransformasi menjadi satu formulir pengisian data terpadu dengan judul "Lengkapi Profil & Verifikasi", dilengkapi tombol aksi "Batal" dan "Simpan Semua Data" di bagian bawah.

### 2. Kustomisasi Template Email Autentikasi & Pembersihan Database Auth (Juni 2026)
- **Desain HTML Email Responsif & Premium**: Mengganti email konfirmasi pendaftaran (`signup`) dan reset kata sandi (`recovery`) yang sebelumnya berupa teks polos menjadi format HTML premium. Dilengkapi logo resmi RuangSinggah.id, skema warna oranye gradien, typography bersih, tombol Call-to-Action (CTA) berbayang, dan fallback URL link.
- **Pembersihan Data Yatim (Orphaned Profiles)**: Menyelesaikan kendala `unexpected_failure` saat klik link verifikasi email dengan membersihkan profil usang (data yatim) di tabel `public.users` yang melanggar unique constraint email.
- **Perbaikan Alur Reset Sandi (Password Recovery)**: Menambahkan penanganan event `PASSWORD_RECOVERY` pada callback autentikasi di `App.tsx` untuk mengalihkan sesi ke form penyetelan kata sandi baru (`/login?mode=recovery`), serta menyesuaikan pengalihan dashboard agar tidak mem-bypass form reset sandi saat mode recovery aktif.

### 2. Peningkatan Desain, Styling, dan Visual Dashboard Mitra (Owner) (Juni 2026)
- **Desain Tipografi & Hirarki Teks Premium**: Mengurangi penggunaan `font-black` (bobot 900) yang terlalu dominan pada navigasi dan label umum, digantikan dengan kombinasi `font-bold` dan `font-semibold` yang lebih bersih, elegan, dan profesional.
- **Navigasi Desktop & Mobile yang Estetik**:
  - Mempercantik sidebar desktop dengan hover transition halus dan warna aktif bergradasi jingga ke amber (`bg-gradient-to-r from-orange-500 to-amber-500`).
  - Mengoptimalkan mobile bottom nav dengan sudut melengkung `rounded-2xl`, transisi aktif yang menonjol (`scale-105` dan bayangan lembut), serta label teks yang lebih tertata rapi.
- **Stat Cards & Informasi Pengguna**: Memperbarui visual kartu statistik dengan bayangan ultra-tipis (`shadow-[0_8px_30px_rgba(0,0,0,0.01)]`) dan kontras yang lebih tajam. Box profil pengguna di sidebar kini memiliki border halus `border-gray-100/40`.
- **Dompet Digital Mewah**: Mendesain ulang kartu saldo utama pada panel Dompet (Wallet) dengan tema gelap bergradasi (`bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900`) untuk memberikan kesan dompet digital yang premium.

### 2. Optimasi Menyeluruh Dashboard Mitra (Owner) (Juni 2026)
- **Sistem Tarik Dana (Wallet/WD) Pemilik Kost**:
  - Menghubungkan tombol "Tarik Dana Sekarang" pada dashboard pemilik dengan alur penarikan dana terverifikasi.
  - Menambahkan modal konfirmasi penarikan yang menampilkan detail rekening bank (bank, no rek, atas nama) dan total nominal dengan validasi batas saldo minimal Rp 10.000.
  - Memperbarui fungsi pengiriman data ke database Supabase pada tabel `withdrawal_requests` (mengisi kolom `agent_id` menggunakan UID pemilik) dan mengirim notifikasi email ke Admin via FormSubmit.
  - Mengubah tampilan saldo dompet agar merujuk ke `stats.availableBalance` secara dinamis (didapat dari total pendapatan sewa dikurangi total penarikan non-rejected).
- **Penggabungan Riwayat Transaksi Dompet (Unified History)**:
  - Menggabungkan riwayat pembayaran pesanan sewa (`bookings` berstatus PAID/COMPLETED) sebagai arus masuk (IN) dan pengajuan penarikan dana (`withdrawal_requests`) sebagai arus keluar (OUT) ke dalam satu linimasa transaksi tunggal secara kronologis.
- **Manajemen Properti/Kost Aktif**:
  - Menghidupkan tombol "Preview" kost agar mengalihkan pengguna ke halaman detail kost publik `/kost/:id` yang sesuai.
  - Menambahkan tombol aksi Hapus Kost (ikon `Trash2` berwarna merah) lengkap dengan dialog konfirmasi aman untuk menghapus iklan langsung dari database Supabase (`properties`).
- **Penanganan Dependensi Hilang (Compile Safety)**:
  - Menambahkan impor `getOrCreateChatSession` yang sebelumnya terlewat untuk menghindari error runtime pada inisiasi chat pemilik kost.

### 3. Verifikasi OTP WhatsApp pada Pendaftaran Mitra & Pemindahan Info Referral (Juni 2026)
- **Interseptor Pendaftaran Pemilik Kost**: Menambahkan gerbang verifikasi 2-Faktor sebelum pengiriman tautan konfirmasi email.
- **Pengiriman OTP Otomatis**: Menghasilkan OTP 6-digit acak dan mengirimkannya melalui Meta Cloud API (`sendWhatsAppTemplate`) dengan fallback aman.
- **UI Premium & Responsif**: Halaman input OTP minimalis yang responsif, lengkap dengan countdown kirim ulang 60 detik dan tombol pembatalan.
- **Pemindahan Banner Referral Agen**: Menyingkirkan kartu/banner Program Kemitraan Agen (Referral) dari halaman beranda/overview [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/AgentDashboard.tsx) dan memindahkannya ke dalam tab Profil di [AgentProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/AgentProfile.tsx) dengan tambahan fungsionalitas tombol "Salin" kode referral secara langsung.
- **Desain Header Rekomendasi Utama Ultra-Kompak**: Merombak total bagian "Kost Pilihan Hari Ini" di [Home.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/Home.tsx) pada layar mobile agar tidak memakan banyak ruang vertikal. Judul dan tombol navigasi disusun berdampingan secara horizontal (*side-by-side*), teks tombol otomatis menyesuaikan menjadi "Lihat Semua" dengan ikon panah minimalis, serta mengurangi tinggi padding bagian tersebut agar tetap keren, simpel, informatif, dan fungsional.

### 4. Perombakan Sistem Survey Multi-Kost (Mei 2026)
- **Consolidated Order-based Detail Page**: Merombak tampilan model "N-card" yang terpisah menjadi 1 halaman detail pesanan berbasis transaksi yang elegan, bersih, dan premium di `MyKost.tsx`.
- **Granular Multi-Kost Sync (`adminService.ts`)**: Modifikasi `syncSurveyRequest` untuk secara otomatis mengiterasi dan menyisipkan N baris `survey_requests` unik untuk setiap kost yang didaftarkan (terhubung melalui `transaction_id` yang sama).
- **Dashboard Petugas Terkonsolidasi (`SurveyManagement.tsx`)**: Mengelompokkan seluruh survey_requests berdasarkan transaksi di panel Admin/Agen, memungkinkan petugas mengelola status, checklist, foto, dan komunikasi per unit kost secara terpadu.
- **Progress Tracking & Independensi**: Visualisasi persentase penyelesaian kost secara real-time dan pemberian kebebasan bagi pengguna untuk mengonfirmasi atau melihat laporan setiap unit kost secara instan tanpa menunggu seluruh kost selesai.
- **Order-Level Agent Assignment**: Penyederhanaan dashboard Admin dengan memungkinkan penetapan Agen Surveyor dilakukan cukup 1 kali pada level pemesanan (mencakup semua unit kost yang disurvey di dalamnya), mengatur Drive Links secara terpusat, dan menyembunyikan aspek penilaian dari Admin saat proses awal.
- **Order Tab Synchronization**: Memperbaiki perilaku Tab "Kost Saya" (Diajukan/Aktif/Riwayat) agar kartu Order tidak terpecah ke tab berbeda. Order akan tetap di tab "Aktif" meskipun ada 1 unit yang sudah "Selesai", dan baru pindah ke "Riwayat" jika seluruh unit di dalam transaksi tersebut sudah "Selesai".

### 2. Edukasi & Artikel Pilihan (SEO & GEO Optimization) (Mei 2026)
- **Halaman Hub Artikel & Edukasi (`Articles.tsx`)**: Pembuatan antarmuka premium untuk memuat daftar panduan dan artikel editorial. Didesain ulang sepenuhnya menjadi Portal Berita & Media Premium berstandar Google News, lengkap dengan Laporan Utama (Featured Hero Card), kategori kanal navigasi horizontal, kolom pencarian instan, sidebar detail artikel dengan rekomendasi bacaan populer, profil kontributor penulis, tautan berbagi sosial, dan kotak berlangganan newsletter mingguan.
- **Injeksi Data Terstruktur JSON-LD Dinamis**: Menyuntikkan schema `Article` terstruktur secara dinamis di `<head>` dokumen saat artikel tertentu dibaca untuk kemudahan web crawling dan AI search crawlers.
- **Pilar Artikel Kontekstual (Entity-Rich)**: Menulis 3 artikel penjelasan entitas (Mengenal RuangSinggah.id / PT Ruang Singgah Nusantara, Panduan Jasa Survey Kost, dan optimasi KostManager) untuk memperkaya pemahaman mesin pencari dan AI (SGE/Gemini/SearchGPT).
- **Sistem CMS Editor Visual Admin (`ArticleManagement.tsx`)**: Menambahkan panel manajemen artikel interaktif di dashboard admin dengan real-time rendering, editing format visual HTML/Markdown, auto-slug generator, dan kalkulator waktu baca otomatis.
- **Integrasi Editor Visual TinyMCE (`@tinymce/tinymce-react`)**: Mengganti editor visual dengan TinyMCE standard industri yang kompatibel dengan React 19. Dilengkapi dengan fitur drag-and-drop & copy-paste gambar, visual image resizing (menyeret pojok gambar), pembuatan tabel, pemilih font/ukuran/warna, serta integrasi uploader gambar otomatis ke Supabase Storage (bucket `banners` di folder `articles/`).
- **Dukungan Thumbnail Cover Artikel & Penyelarasan Layout Reader**: Menghadirkan uploader gambar cover/thumbnail untuk artikel baru dengan live preview di admin. Menghapus input pemilih emoji cover (`icon`) dan gradient cover (`gradient`) dari form admin CMS agar antarmuka lebih bersih dan modern sesuai standar industri properti proper. Memperbaiki halaman detail artikel (`Articles.tsx`) agar mendukung styling inline format visual (perataan gambar, tabel border, lists, blockquote oranye), perbaikan rendering eksplisit elemen Heading (H1-H6) dan Paragraf agar presisi sesuai masukan editor visual, serta menyinkronkan data thumbnail cover ke skema JSON-LD untuk mempermudah Google Search Snippet dan AI Search crawling.

### 3. Optimalisasi Pembayaran Midtrans Production (Mei 2026)
-   **DANA & GoPay Professional Flow**: Implementasi Snap Redirect untuk DANA dan Direct Charge Deeplink untuk GoPay.
-   **Otomatisasi Redirect**: Browser otomatis membuka aplikasi e-wallet setelah pemilihan metode.
-   **Metadata Profil Lengkap**: Sinkronisasi Nama, Email, HP, dan Alamat pembayar ke Midtrans Production untuk keamanan transaksi.
-   **Categorized Payment UI**: Pengelompokan metode pembayaran (VA, E-Wallet, Retail) dengan desain premium.
-   **Integritas Label Transaksi**: Penyesuaian nama produk (Database, Survey, Booking) di database Supabase dan Midtrans.
-   **Penyelesaian Data Loss**: Pemulihan file `Products.tsx` dan `SurveyService.tsx` yang sempat kosong.

### 4. Sistem Pelacakan Real-Time Survey Kost (Timeline Tracker) (Mei 2026)
- **Tombol Lacak Interaktif**: Mengubah status statis ("Menunggu" / "Cari Agen") di baris unit kost dashboard pengguna menjadi tombol interaktif "Lacak" yang berdenyut (*pulse animation*) untuk meningkatkan kejelasan tindakan pengguna.
- **Modal Stepper Timeline**: Pembuatan Modal Timeline Tracker interaktif dan elegan di halaman `MyKost.tsx` yang memetakan tahapan survei secara berurutan: Menunggu Pembayaran, Mencari Agen, Agen Ditetapkan, Menuju Lokasi, Proses Audit Lapangan, hingga Laporan Selesai.
- **Informasi & Chat Surveyor**: Menampilkan profil lengkap surveyor (nama, foto) serta tombol pintas chat WhatsApp langsung dari dalam modal pelacakan.
- **Pintasan Aksi Kontekstual**: Menyediakan tombol konfirmasi penyelesaian (jika laporan terunggah) atau unduhan laporan detail hasil survei secara instan dari dalam modal pelacakan.
- **Pembersihan Bug Kompilasi**: Melakukan refactoring properties objek duplikat (`monthMap` dan `existing_facility_id`) untuk memastikan keberhasilan build Vite.

### 5. Pemasaran & Keandalan SEO (SEO & GEO Crawlability) (Mei 2026)
- **Aturan robots.txt Ramah AI (GEO Optimization)**: Mengonfigurasi berkas `robots.txt` agar ramah terhadap crawler AI Generative seperti GPTBot, Google-Extended, ClaudeBot, dan PerplexityBot. Mengizinkan mereka merayap halaman publik dan artikel editorial, serta tetap memblokir rute privat/dashboard admin guna menghindari kebocoran data.
- **Input Alt-Text Gambar Cover CMS (`ArticleManagement.tsx`)**: Menambahkan kolom input Alt-Text deskripsi gambar cover artikel yang diunggah. Wajib diisi jika gambar cover diset, guna mempermudah indeks Google Images dan pencarian visual oleh AI Search Engines.
- **Penyelarasan Alt-Text & Rendering Gambar detail (`Articles.tsx`)**: Memetakan kolom `image_alt` dari database Supabase dan merender seluruh tag `img` artikel (pada cover detail, featured post, list card, dan artikel populer) dengan atribut `alt` yang dinamis untuk aksesibilitas yang optimal.
- **Injeksi Meta Tag SEO/OpenGraph Dinamis via React Helmet (`Articles.tsx`)**: Memasang komponen `<Helmet>` dari `react-helmet-async` untuk menyuntikkan judul dinamis, deskripsi meta, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`), serta Twitter Card tags secara dinamis pada saat pengguna membaca artikel tertentu.
- **Sitemap XML Dinamis berbasis Cloud Function (`index.ts`)**: Membuat Firebase HTTPS Cloud Function `/sitemap` yang melakukan query langsung ke database Supabase (`articles`) untuk menghasilkan berkas sitemap XML dinamis.
- **Penghapusan Sitemap Statis & Konfigurasi Rewrites (`firebase.json` & `firebase-hosting.json`)**: Menghapus berkas `sitemap.xml` statis lama dari direktori public dan menambahkan rewrite rule pada `firebase.json` serta `firebase-hosting.json` lokal agar permintaan `/sitemap.xml` diarahkan secara dinamis ke Cloud Function.

### 6. Perbaikan Otomatisasi Google Drive Per Unit Kost (Mei 2026)
- **Logika Sinkronisasi Tingkat Backend (`syncSurveyRequestsBackend`)**: Memigrasikan pemisahan dan pembuatan entri database `survey_requests` dari client-side ke backend. Hal ini memastikan setiap unit kost yang dipesan dalam transaksi multi-kost terdaftar secara granular sejak checkout dibuat, mandiri dari tindakan pengguna di browser.
- **Pemberkasan Drive Granular Multi-Kost**: Merombak fungsi webhook/simulator pembayaran (`completeSurveyProcess`) agar mendukung pencarian multi-row. Sistem secara otomatis melakukan loop pada seluruh kost dalam satu transaksi, memanggil Google Drive API secara terpisah untuk membuat folder individual, dan memperbarui status serta link Drive (`result_drive_link`) secara granular per unit kost.
- **Standarisasi Penamaan Folder**: Memperbarui format penamaan folder (baik melalui pemicu pembayaran otomatis maupun pembuatan manual) menjadi `Survey - [Nama Kost] - [ID Survey 8 Karakter]` guna mencegah bentrok nama file/folder di Google Drive.
- **Tombol Cepat Pembuatan Folder Drive Manual**: Menambahkan tombol "Buat Folder" di samping nama kost pada Modal Edit Order. Tombol ini hanya muncul jika tautan Drive masih kosong, mempermudah admin memicu pembuatan folder secara manual apabila proses otomatisasi gagal.

### 7. Alur Konfirmasi Penugasan Agen Survey (Mei 2026)
- **Konfirmasi Tab Permintaan (Pending)**: Memperbaiki alur penugasan agen survey oleh admin agar tidak langsung aktif (`AGENT_ASSIGNED`). Status tugas kini tetap `PENDING_ASSIGNMENT` saat admin menetapkan agen, memaksa agen untuk mengonfirmasi (menerima atau menolak) tugas terlebih dahulu di tab **Permintaan** pada dashboard agen.
- **Transisi Status yang Benar**: Status berubah menjadi `AGENT_ASSIGNED` dan pindah ke tab **Aktif** hanya setelah agen menekan tombol **Terima Tugas**. Jika agen memilih **Tolak**, penugasan agen dibatalkan (dihapus) dan tugas dikembalikan ke pool admin untuk ditugaskan kembali.

### 8. Penyederhanaan Kategori Jenis Kost pada Evaluasi Survey (Mei 2026)
- **Hanya Checkbox**: Menyederhanakan kategori **Jenis Kost** pada form evaluasi survey dengan menyembunyikan input bintang penilaian keseluruhan, catatan teks/ulasan, dan bukti foto. Kategori ini sekarang murni hanya menampilkan checkbox pilihan tipe kost (Putra, Putri, Campur, Pasutri).

### 9. Pilihan Kamera HP vs Galeri via Action Sheet (Mei 2026)
- **Menu Pilihan Bawah Layar**: Mengganti trigger input langsung dengan Action Sheet (bottom sheet dialog) bergaya native iOS/Android. Ketika Agen mengklik tombol "Tambah Foto", muncul pilihan:
  - **Kamera HP**: Membuka kamera bawaan secara langsung menggunakan atribut `capture="environment"`, memaksa sistem Android/iOS (termasuk Google Pixel) untuk mengambil foto instan.
  - **Galeri / File**: Membuka galeri foto untuk memilih berkas yang sudah ada dengan dukungan banyak berkas (`multiple`).

### 10. Perizinan Folder Google Drive Tulis (Writer) (Mei 2026)
- **Akses Tulis Publik (Anyone with Link can Edit)**: Mengubah perizinan folder Google Drive yang terbuat otomatis untuk setiap survei dari `reader` menjadi `writer`. Hal ini memungkinkan Agen lapangan mengunggah berkas foto/dokumentasi survei secara langsung menggunakan akun Google pribadi mereka tanpa terhambat status hak akses privat folder.

### 11. Sinkronisasi Perutean (Routing) & Auto-Draft Laporan (Mei 2026)
- **Wildcard Redirect**: Menambahkan pengalihan otomatis di `Dashboard.tsx` agar ketika pengguna mengakses URL dasar `/dashboard-agent` langsung, URL secara bersih dialihkan ke `/dashboard-agent/overview`.
- **Search Parameter Sync**: Menyinkronkan sub-tab tugas ("Permintaan", "Aktif", "Riwayat") di dashboard agen dengan URL parameter `?status=pending/active/history` via `useSearchParams`. Melindungi kondisi aktif tab agar tidak ter-reset kembali ke tab "Permintaan" saat browser direfresh secara tidak sengaja.
- **Auto-Draft via LocalStorage**: Menyimpan data isian formulir laporan survei (`surveyForm`) secara otomatis di latar belakang menggunakan `localStorage` dengan kunci unik `survey_draft_${surveyId}`.
- **Auto-Restore & Reset Banner**: Draf laporan yang belum terkirim otomatis dipulihkan saat Agen membuka kembali modal pengisian laporan. Ditambahkan banner visual elegan "Memulihkan draf laporan otomatis" beserta tombol **Mulai Ulang** untuk menghapus draf lama jika surveyor ingin mengisi form kembali dari awal. Draf otomatis dihapus dari memori begitu laporan berhasil dikirim ke database.

### 12. Sistem Penjadwalan Ulang (Reschedule) & Notifikasi Terpadu (Mei 2026)
- **Modal Reschedule Agen Lapangan (`AgentDashboard.tsx`)**: Menyediakan modal input tanggal baru, waktu baru, dan alasan perubahan jadwal (reschedule) saat Surveyor mengajukan penjadwalan ulang pada tugas aktif.
- **Notifikasi Multi-Saluran Real-Time & Email (`notificationService.ts`)**: Mengirim notifikasi otomatis ke pengguna lewat push notification in-app dan email dengan menyertakan detail jadwal terbaru serta alasan spesifik yang diinput oleh Surveyor.
- **Banner Peringatan Penjadwalan Ulang & Sinkronisasi Timeline Tracker (`MyKost.tsx`)**: Menampilkan banner visual peringatan berwarna oranye yang menonjol di bagian atas modal pelacakan pengguna untuk menginformasikan jadwal baru dan alasannya. Menyesuaikan visual timeline pelacakan agar status `RESCHEDULED` terpetakan secara presisi sebagai bagian dari tahap "Surveyor Ditetapkan" dengan status deskripsi yang berubah menjadi "Jadwal Diperbarui".
- **Pencatatan Riwayat Reschedule Kronologis (Audit Trail)**: Mengintegrasikan array `reschedule_history` di dalam kolom JSONB `evaluation_summary` pada tabel `survey_requests`. Setiap kali penjadwalan ulang diajukan oleh agen, rincian jadwal (tanggal, waktu, alasan, timestamp pengajuan) dicatat secara kumulatif dan kronologis.
- **Visualisasi Riwayat Pelacakan User (`MyKost.tsx`)**: Menampilkan daftar "Riwayat Penjadwalan Ulang" bergaya linimasa/timeline vertikal di dalam tracker modal pengguna, diurutkan dari pengajuan terbaru.
- **Sinkronisasi Real-Time Pengguna & Surveyor**: Menambahkan Supabase Postgres Realtime Subscription untuk tabel `survey_requests` di sisi user (`MyKost.tsx`) serta sinkronisasi dinamis hook `useEffect` untuk memperbarui modal pelacakan secara real-time tanpa perlu me-refresh halaman web secara manual.
- **Handling Notifikasi Admin Tanpa Blokir (`emailService.ts`)**: Mengubah logging kegagalan notifikasi admin dari `console.error` menjadi `console.warn` informatif untuk mencegah spam kesalahan bertipe merah pada konsol browser ketika dijalankan di localhost/lingkungan offline.

### 13. Notifikasi Transaksi Admin Menggunakan FormSubmit (Mei 2026)
- **Dinamis ke Seluruh Admin**: Memperbarui `emailService.ts` agar mengambil daftar email seluruh pengguna dengan role `admin` (atau `is_admin === true`) secara dinamis dari database Supabase (`users` table).
- **Pengiriman via FormSubmit**: Mengirimkan email notifikasi transaksi secara asinkron ke setiap admin menggunakan FormSubmit (`https://formsubmit.co/ajax/{email}`), menghemat kuota Brevo yang diprioritaskan hanya untuk pengguna.
- **Notifikasi Pembuatan Transaksi**: Menghubungkan pembuatan transaksi baru (sewa kost, database, jasa survey) dari `PaymentGateway.tsx` (`handlePay`) agar memicu email notifikasi ke admin dengan status PENDING.
- **Notifikasi Pembayaran Berhasil**: Memastikan admin ter-notifikasi ketika status transaksi berubah menjadi PAID (Pembayaran Berhasil).

### 14. Perbaikan Peta Situs (Sitemap) Dinamis & Validasi GSC (Juni 2026)
- **Aturan Hosting Spesifik v2 Cloud Functions**: Mengubah aturan rewrite `/sitemap.xml` di `firebase.json` dan `firebase-hosting.json` menggunakan format penargetan Cloud Functions v2 (menyebutkan `functionId` dan `region` secara eksplisit) untuk mencegah Hosting memulangkan berkas HTML fallback.
- **Penyelarasan Rute & Prioritas**: Mengganti rute lama tidak valid di sitemap (`/survey`, `/faq`, `/hubungi-kami`) dengan rute aktif (`/survey-service`, `/contact`, `/syarat-ketentuan`, `/listings`, `/products`, `/owner`) dan mengatur prioritas perayapan secara logis.
- **Integrasi Properti Kost Dinamis**: Mengueri tabel `properties` Supabase secara langsung dari Cloud Function `sitemap` untuk memetakan rute detail kost `/kost/:id` aktif dengan prioritas tinggi `0.9` ke dalam dokumen sitemap XML secara dinamis.

### 15. Programmatic SEO (pSEO) Halaman Kampus & Area Makassar (Juni 2026)
- **Rute URL SEO Dinamis**: Menambahkan rute `/kost-dekat/:campusSlug` dan `/kost-area/:areaSlug` di `App.tsx` agar mengarah ke halaman Listings.
- **Sinkronisasi Parameter Slug**: Menyinkronkan parameter slug URL ke filter state pencarian di `Listings.tsx` secara otomatis berdasarkan data kampus dan area aktif dari database Supabase.
- **Injeksi Meta Tag Kustom (`react-helmet-async`)**: Menyusun Title, Description, dan Canonical URL secara dinamis dan menuliskannya ke elemen `<head>` situs (misal untuk `/kost-dekat/unhas` dan `/kost-area/jl-sahabat`).
- **Internal Linking Populer**: Menghapus daftar tautan Kampus Populer dan Area Populer di `Footer.tsx` untuk menjaga estetika profesionalisme website, digantikan dengan fokus pada sitemap xml dinamis.
- **Penyuntingan Sitemap XML Dinamis**: Memperbarui Cloud Function `sitemap` di `index.ts` untuk mengueri data kampus & area aktif properti unik dan merendernya sebagai URL sitemap resmi.

### 16. Potongan 30% Jasa Survey untuk Pembeli Database Kost (Juni 2026)
- **Verifikasi Kepemilikan Database**: Mengintegrasikan `getUserTransactions` di `SurveyCheckout.tsx` untuk mendeteksi transaksi database berstatus `'PAID'` milik pengguna.
- **Diskon Dinamis Per Unit Kost**: Menghitung `totalPrice` menggunakan reducer dinamis, menerapkan potongan 30% (`unitPrice * 0.7`) khusus pada unit kost yang bersumber dari `'database'` bagi pengguna yang berhak.
- **Banner Edukasi & Promosi UI**: Menambahkan banner hijau pemberitahuan diskon aktif serta banner kuning edukatif di Step 2 untuk pengguna yang belum memiliki database properti.
- **Rincian Harga Ringkasan & Sukses**: Memperbarui breakdown rincian harga di Step 4 dan halaman sukses pembayaran agar transparan menampilkan potongan harga.
- **Metadata Transaksi Pembayaran**: Menyinkronkan bendera `has_database_discount` dan nilai `discount_amount` ke dalam `paymentMetadata` transaksi di Supabase/Midtrans.

### 17. Sinkronisasi Visibilitas Pesanan Survey Pending (Juni 2026)
- **Sinkronisasi Transaksi Pending (`syncSurveyRequest`)**: Memperbarui logika sinkronisasi client-side agar tidak mengabaikan transaksi survey pending. Transaksi pending kini dimasukkan ke tabel `survey_requests` dengan status awal `AWAITING_PAYMENT` agar dapat terpetakan di UI tab "Diajukan".
- **Scan Menyeluruh (`autoSyncAllSurveys`)**: Mengubah pendeteksian transaksi survey dari murni PAID menjadi pencarian menyeluruh seluruh transaksi survey (`autoSyncAllSurveys`), memicu sinkronisasi otomatis atas order baru maupun pending pada saat memuat halaman "Kost Saya".

### 18. Perbaikan Visibilitas Pesanan Survey untuk Akun Biasa (Juni 2026)
- **Eliminasi Dini Return pada `fetchMyKosts`**: Memperbaiki bug di mana pesanan survey tidak dimuat bagi pengguna biasa yang belum memiliki hunian aktif. Masalah diselesaikan dengan membungkus logika pemrosesan data hunian dalam kondisi `if (data && data.length > 0)` dan menghapus interupsi `return;` awal agar pengambilan data rekomendasi dan `survey_requests` tetap dieksekusi secara sukses untuk semua pengguna.

### 19. Perbaikan Status Pesanan Survey yang Reset Kembali ke Diajukan (Juni 2026)
- **Persistensi Status Progres**: Memperbaiki logika `targetStatus` di fungsi `syncSurveyRequest` agar mempertahankan status berjalan (`existing.status`) yang berada di database. Hal ini mencegah background auto-sync (`autoSyncAllSurveys`) menimpa status aktif/selesai kembali ke status `'PENDING_ASSIGNMENT'` (tab Diajukan) secara terus-menerus.

### 20. Integrasi Dompet Dinamis & Penarikan Saldo Agen (Juni 2026)
- **Kalkulasi Bagi Hasil Otomatis (70/30)**: Mengubah perhitungan pendapatan agen di `AgentDashboard.tsx` agar menggunakan nilai riil transaksi survei (dikali 70% sebagai bagian agen) dari database.
- **Sistem Penarikan Database**: Menghubungkan formulir penarikan saldo dan data rekening bank agen dengan database melalui tabel `withdrawal_requests` dan metadata autentikasi pengguna, menggantikan data mock/dummy sebelumnya.

### 21. Perbaikan Profil Rekening Penarikan Agen & Sinkronisasi Database (Juni 2026)
- **Penyimpanan Dua Arah (Database + Auth)**: Memperbarui fungsi `saveBankSettings` di `AgentDashboard.tsx` agar menyimpan data rekening secara langsung ke tabel `users` publik di database Supabase menggunakan update API, sekaligus memperbarui metadata Auth pengguna untuk memicu event `USER_UPDATED` secara otomatis.
- **Pemuatan Berbasis Database**: Mengubah inisialisasi pemuatan profil rekening di `AgentDashboard.tsx` dari yang sebelumnya membaca `user.user_metadata` (tidak tersedia pada state parent) menjadi membaca langsung dari properti `user.bank_name`, `user.bank_account`, dan `user.bank_account_name` yang berasal dari database, memastikan data rekening tetap utuh dan konsisten saat halaman di-reload.

### 22. Pemisahan Data Sensitif KTP & Rekening Bank (Juni 2026)
- **Tabel Baru untuk Data Sensitif**: Membuat tabel privat `user_verifications` (untuk data KTP) dan `user_bank_accounts` (untuk data Rekening Bank) dengan kebijakan RLS ketat agar data sensitif ini tidak dapat dibaca oleh pengguna lain secara tidak sengaja melalui tabel `users` publik.
- **Konsolidasi Frontend (App.tsx)**: Mengintegrasikan parallel-fetching data dari ketiga tabel saat user melakukan login di `App.tsx` (`fetchUserData`), sehingga component di frontend tetap menerima objek user lengkap tanpa merusak alur state yang ada.
- **Pembaruan Alur Penyimpanan**: Memperbarui `Profile.tsx`, `MitraProfile.tsx`, `AgentProfile.tsx`, `MitraDashboard.tsx`, dan `AgentDashboard.tsx` agar menyimpan data verifikasi KTP dan data rekening langsung ke tabel privat masing-masing.

### 23. Pembaruan Estetika & Keteraturan Modal Konfirmasi Penarikan (Juni 2026)
- **Redesain Tata Letak Modal**: Merapikan visual modal konfirmasi penarikan pada `AgentDashboard.tsx` dan `Dashboard.tsx` agar menggunakan tata letak card terstruktur, penempatan ikon bank `🏦`, serta pemisahan visual yang jelas untuk nominal penarikan.
- **Pembersihan Tipografi**: Menghapus kapitalisasi penuh (screaming text) pada teks judul, deskripsi, dan label, menggantinya dengan casing tulisan yang bersih, modern, dan profesional.
- **Tombol Aksi Bersanding**: Mengubah susunan tombol aksi utama (Konfirmasi/Batal) menjadi bersanding (side-by-side) dengan penyesuaian efek shadow dan hover yang premium.

### 24. Perbaikan Visibilitas Saldo & Transaksi Dompet Agen (Juni 2026)
- **Sinkronisasi Rute Wallet**: Menambahkan `'wallet'` ke dalam `DashboardMenu` di `Dashboard.tsx` dan memperbarui event trigger pemuatan data agar memanggil `loadSurveyRequests` saat `activeMenu === 'wallet'`. Ini memperbaiki bug di mana saldo pendapatan agen tiba-tiba menjadi Rp 0 dan riwayat transaksi terakhir kosong setelah halaman ter-reload di menu dompet.

### 25. Otomatisasi Notifikasi Email WD via FormSubmit (Juni 2026)
- **Notifikasi Tanpa WA**: Menambahkan helper `notifyAdminWithdrawalRequest` di `emailService.ts` untuk mengirim notifikasi rincian pengajuan penarikan dana agen secara langsung ke seluruh admin via FormSubmit.
- **De-aktivasi WhatsApp Redirect**: Menonaktifkan tautan eksternal WhatsApp pada form pengajuan penarikan dana agen di `AgentDashboard.tsx` sehingga data dikirim di latar belakang secara asinkron tanpa mengalihkan browser pengguna.

### 26. Dashboard Panel Kelola WD Admin (Juni 2026)
- **Komponen Manajemen Baru (`WithdrawalManagement.tsx`)**: Membuat panel administrasi terpusat untuk menampilkan, memfilter, menyetujui, dan menolak pengajuan penarikan dana dari agen.
- **Aksi Persetujuan Manual**: Mendukung verifikasi manual (transfer secara mandiri oleh admin) lalu memperbarui status penarikan menjadi Selesai (`approved`) atau Ditolak (`rejected`) dengan satu kali klik.
- **Menu Navigasi Sidebar**: Menambahkan rute visual navigasi "Kelola WD" 💸 di sidebar admin untuk efisiensi kelola.

### 27. Perbaikan Duplikasi Order Survey & Race Condition (Juni 2026)
- **ID Deterministik (`generateDeterministicUuid`)**: Membuat generator UUID deterministik berbasis hash string `transactionId_index` untuk mengidentifikasi baris target secara unik.
- **Eliminasi Ganda di Database**: Memodifikasi fungsi `syncSurveyRequest` agar menetapkan ID deterministik ini sebelum operasi penulisan, yang secara otomatis mencegah terjadinya duplikasi record meskipun fungsi sinkronisasi dipanggil secara asinkron atau konkuren (race condition). Panggilan duplikat/konkuren sekarang akan meng-update baris data yang sama secara aman.

### 28. Grafik Dinamis Aktivitas Survey 7 Hari Terakhir & Desimal Y-Axis (Juni 2026)
- **Visualisasi Bergulir 7 Hari Terakhir**: Mengubah visualisasi aktivitas survey pada dashboard agen dari yang sebelumnya statis/dummy dan kaku pada Senin-Minggu menjadi rentang bergulir (*rolling*) 7 hari terakhir (H-6 hingga hari ini) agar data yang disajikan lebih relevan dan tidak kosong di awal minggu.
- **Sumbu Y Non-Desimal**: Menambahkan properti `allowDecimals={false}` pada sumbu Y (`<YAxis>`) agar skala grafik hanya menampilkan bilangan bulat, menghindari nilai desimal yang tidak logis untuk jumlah tugas survey.

### 29. Sistem Penilaian (Rating & Feedback) Agen Survey (Juni 2026)
- **Alur Modal Konfirmasi Ulasan**: Mengubah konfirmasi instan penyelesaian survey pada User (`MyKost.tsx`) agar memicu modal ulasan interaktif (Rating Bintang 1-5 & Teks Masukan) untuk menilai kepuasan kinerja agen lapangan.
- **Visual Bintang Dinamis di Agen Dashboard**: Memperbaiki visualisasi bintang ulasan dan rating rata-rata di dashboard agen (`AgentDashboard.tsx`) agar dinamis mencerminkan penilaian riil database (`user_rating` & `user_comment`) alih-alih data dummy/statis.

### 30. Perbaikan Loop Render Kelola WD Admin (Juni 2026)
- **Eliminasi Infinite Render Loop**: Memisahkan status loading global milik parent (`Dashboard.tsx`) dari `WithdrawalManagement.tsx` with beralih ke state `localLoading` lokal. Hal ini mencegah siklus unmount/remount tanpa henti yang sebelumnya mengakibatkan glitches/flickering dan loading selamanya ketika mengakses menu Kelola WD di Dashboard Admin.

### 31. Perbaikan Relasi Database Kelola WD Admin (Juni 2026)
- **Manual Mapping/Join di Client-Side**: Mengganti join resource `.select('*, agent:users(...)')` di `WithdrawalManagement.tsx` dengan pemanggilan data bertahap dan melakukan pemetaan (matching) manual berbasis `Map` di frontend. Ini mengatasi error PostgREST `PGRST200` akibat tidak adanya foreign key eksplisit di database antara tabel `withdrawal_requests` dan `users`, sehingga pengajuan penarikan dana agen dapat tampil dengan sukses di dashboard admin.

### 32. Penurunan Batas Saldo Minimal Penarikan Agen Survey (Juni 2026)
- **Batas Withdraw 10k**: Mengubah validasi saldo minimal penarikan di `AgentDashboard.tsx` dan `Dashboard.tsx` dari Rp 50.000 menjadi Rp 10.000, serta menyelaraskan notifikasi pesan alert agar sesuai dengan batas minimum baru.

### 33. Perbaikan Akurasi Penjadwalan Grafik Aktivitas Surveyor (Juni 2026)
- **Deteksi Tanggal Kerja Dinamis**: Mengubah dasar penentuan tanggal grafik di `AgentDashboard.tsx` dari yang sebelumnya kaku pada `updated_at` (yang ditimpa tanggal konfirmasi pelanggan) menjadi menggunakan pembacaan properti `submitted_at` di `evaluation_summary` atau ekstraksi epoch timestamp dari nama file foto bukti.
- **Auto-logging `submitted_at`**: Menambahkan penyimpanan tanggal submission secara otomatis (`submitted_at: new Date().toISOString()`) pada skema `evaluation_summary` saat surveyor mengirimkan laporan baru.

### 34. Pembersihan Focus Ring Outline Hitam pada Grafik Recharts (Juni 2026)
- **Reset Outline Focus**: Menambahkan global CSS reset pada `index.css` dan properti `wrapperStyle` pada `<RechartsTooltip />` di `AgentDashboard.tsx` untuk menghilangkan outline hitam tebal (focus ring) yang mengganggu estetika saat bar grafik di-hover/di-click oleh pengguna.

### 35. Perbaikan Responsivitas Layout Dompet & Pendapatan Agen (Juni 2026)
- **Pencegahan Horizontal Overflow**: Mengintegrasikan `min-w-0` pada flexbox row transaksi dan menerapkan efek `truncate` pada properti judul transaksi (`tx.title`) yang sering kali diisi oleh URL Google Maps panjang. Ini mencegah container membesar ke kanan.
- **Penyelarasan Teks Tab Navigasi**: Menurunkan ukuran font tab dompet menjadi `text-[10px] sm:text-xs` dan memperpendek letter spacing menjadi `tracking-wider` agar muat dalam area layar handphone tanpa terpotong.

### 36. Menyembunyikan Footer Global di Halaman Dashboard & Perbaikan Layout Dompet (Juni 2026)
- **Kondisional Footer di `App.tsx`**: Mengubah variabel `isDashboardPage` agar mencakup Admin (`Page.DASHBOARD_ADMIN`), Agent (`Page.DASHBOARD_AGENT`), Mitra (`Page.DASHBOARD_MITRA`), dan Owner (`Page.DASHBOARD_OWNER`) dashboard, lalu menyembunyikan footer global di halaman-halaman tersebut (`{!isDashboardPage && <Footer ... />}`). Ini menghasilkan dashboard yang bersih dan menghilangkan horizontal overflow yang disebabkan footer global pada viewport seluler.
- **Integrasi Fitur Logout Agen**: Mengalirkan callback `onLogout` dari `App.tsx` via `Dashboard.tsx` ke `AgentDashboard.tsx`. Menyediakan tombol "Keluar Akun" (penghapusan session login dengan ikon `LogOut`) pada sidebar desktop dan mobile overlay untuk proses sign-out yang aman dari Supabase Auth, serta menghapus opsi "Kembali ke Beranda" agar dashboard tetap fokus pada operasional agen.

### 37. Sistem Kode Referral Khusus Agen Survey (Juni 2026)
- **Autogenerasi Kode Referral Agen**: Mengimplementasikan autogenerasi kode referral berformat `AG-XXXXXX` pada `AgentDashboard.tsx` apabila profil agen terdeteksi belum memiliki kode referral. Kode ini disimpan otomatis ke dalam database Supabase.
- **Pembaruan UI Dashboard & Profil**: Menampilkan banner info program kemitraan (referral) dengan gradien warna premium orange-kuning lengkap dengan tombol "Salin Kode" pada dashboard agen, serta menayangkan field non-editable "Kode Referral" pada detail halaman profil agen (`AgentProfile.tsx`).
- **Skema database**: Menambahkan dokumentasi kolom `referral_code` unik pada file `supabase_schema.sql` untuk memudahkan sinkronisasi struktur tabel.

### 38. Sistem Afiliasi Referral Agen & Pendaftaran Tersegmentasi dengan Tabel Terpisah (Juni 2026)
- **Desain UI Gateway Switcher Terpadu (`Login.tsx`)**: Mendesain ulang formulir auth dengan switch tab modern dan premium di bagian paling atas kartu utama yang berlaku untuk mode **LOGIN** maupun **REGISTER** guna membagi peran pendaftar secara eksplisit: "Pencari Kost" (peran: `user`) dan "Pemilik Kost" (peran: `owner`).
- **Judul & Teks Dinamis**: Menyesuaikan judul, subjudul, dan deskripsi formulir secara dinamis berdasarkan peran aktif dan mode auth yang sedang diakses.
- **Input Kode Referral Kondisional**: Menambahkan field input Kode Referral Agen ("AG-XXXXXX") opsional yang hanya muncul ketika pendaftar memilih peran "Pemilik Kost" (Mitra). Input otomatis diselaraskan ke format huruf kapital (*uppercase*) dan dibersihkan dari spasi berlebih untuk menghindari kesalahan penulisan.
- **Pelekatan Afiliasi Metadata Registrasi**: Menghubungkan parameter `role` dan `referred_by` ke payload metadata fetch request saat mendaftar lewat API serverless Cloud Function.
- **Normalisasi Database & Trigger (`supabase_schema.sql`)**: Membuat tabel terpisah `public.agents` dan `public.mitra` yang terhubung 1-to-1 dengan tabel `public.users` lengkap dengan kebijakan keamanan Row Level Security (RLS). Memodifikasi fungsi trigger database `handle_new_user()` agar otomatis memetakan dan menyisipkan data profil ke tabel `agents` atau `mitra` yang sesuai berdasarkan peran akun saat konfirmasi email berhasil, serta mendukung migrasi retroaktif data user lama dengan aman.
- **Integrasi Dashboard & Profil Agen (`AgentDashboard.tsx` & `AgentProfile.tsx`)**: Menyesuaikan pembacaan dan pembaruan kode referral agar terhubung langsung dengan tabel `public.agents` alih-alih `public.users`.

### 39. Perbaikan Trigger Konfirmasi Email & Alur Login Registrasi (Auth) (Juni 2026)
- **Perbaikan Sintaks SQL pada ON CONFLICT**: Mengatasi error `500 unexpected_failure (Error updating user)` saat verifikasi link email diklik dengan cara memperbaiki sintaks PostgreSQL pada trigger `handle_new_user()`. Kualifikasi nama skema penuh (`public.`) telah dihapus pada bagian `DO UPDATE SET` (`public.users.role` -> `users.role` dan `public.mitra.referred_by` -> `mitra.referred_by`) karena bertentangan dengan aturan standar SQL PostgreSQL dan memicu kegagalan kompilasi/eksekusi runtime.
- **Explicit Type Casting enum**: Menambahkan casting tipe data `::public.user_role` pada nilai string `role` yang di-insert agar sesuai dengan tipe data kolom asli `role` di tabel `public.users` database.
- **Interseptor Redirect Verifikasi (No Auto-Login)**: Memperbaiki perilaku auto-login otomatis setelah link email diklik pada alur PKCE (`?code=...`). Menambahkan deteksi parameter `code` (tanpa `mode=recovery`) pada interseptor `App.tsx` agar langsung memaksa `signOut()` dan mengalihkan pengguna ke `/login?verified=true` untuk memasukkan email dan password secara manual sesuai dengan alur UX yang diharapkan.
- **Penyelarasan Berkas Skema**: Menyesuaikan berkas dokumentasi skema lokal `supabase_schema.sql` serta membuat file SQL perbaikan siap-pakai `fix_trigger.sql` agar dapat langsung dieksekusi oleh pemilik database.

### 40. Penyederhanaan Layout Template Email Autentikasi (Juni 2026)
- **Penghapusan Logo**: Menghapus tag logo `<img>` dari header email pada template email kustom (`handleCustomAuthEmail`) di Cloud Functions untuk menghasilkan tampilan visual yang lebih bersih dan minimalis.
- **Penyederhanaan CTA**: Menghilangkan bagian kontainer `<!-- Fallback URL -->` yang berisi tautan alternatif mentah di bagian bawah email, menyisakan hanya tombol CTA utama yang rapi dan fungsional.

### 41. Batasan Gerbang Login Unik per Role & Menu Dashboard Mitra (Juni 2026)
- **Pencegahan Login Salah Gerbang**: Membatasi pengguna biasa (`user`) agar tidak bisa masuk to portal mitra (`owner`). Jika mencoba masuk via tab Pemilik Kost, sesi langsung ditutup (`signOut`) dan diarahkan ke login dengan pesan kesalahan yang sesuai.
- **Tampilan User Biasa untuk Mitra**: Mengizinkan Pemilik Kost (`owner`) masuk melalui portal user (`user`), tetapi secara visual diatur agar bertindak dengan peran `user` biasa sehingga tidak bisa mengakses menu dashboard mitra.
- **Normalisasi Peran Database**: Memastikan peran database `'mitra'` dikonversi dengan benar menjadi `'owner'` sebelum pemeriksaan login dilakukan guna mencegah kegagalan login bagi pemilik kost lama.
- **Pemulihan Otomatis Chunk Load Error**: Mengintegrasikan listener global pada `error` dan `unhandledrejection` untuk mendeteksi kegagalan dynamic import modul (Chunk Load Error) akibat proses build/deploy baru, serta memicu penyegaran halaman (`window.location.reload()`) secara otomatis agar pengguna langsung menerima versi web terbaru.
- **Hamburger Menu Seluler (Dashboard Mitra)**: Menambahkan header atas khusus seluler di `MitraDashboard.tsx` dengan ikon `Menu` untuk memicu pembukaan overlay sidebar navigasi pada perangkat smartphone.
- **Tombol Logout Akun Eksklusif**: Mengalirkan callback `onLogout` global ke dashboard mitra dan menyediakan tombol "Keluar Akun" (merah, ikon `LogOut`) yang benar-benar mematikan sesi autentikasi Supabase, serta menghapus tombol "Kembali ke Beranda" sepenuhnya sesuai instruksi pengguna.
- **Perbaikan Resolusi Overlap Z-Index**: Mengubah z-index kontainer sidebar seluler dari `z-50` menjadi `z-[100]` sehingga menutup bar navigasi bawah seluler (`z-50`) sepenuhnya saat sidebar aktif tanpa saling bertumpang tindih.

### 42. Redesain Menu Penghuni Aktif Dashboard Mitra (Juni 2026)
- **Kartu Penghuni Kolapsibel (Collapsible Card)**: Mengurangi ruang vertikal layar secara signifikan dengan menyembunyikan detail sekunder ("Paket & Durasi", "Jadwal Sewa", dan "Rincian Tagihan") di dalam accordion yang dapat dibuka/tutup secara interaktif menggunakan tombol chevron.
- **Optimasi Layout & Spacing**:
  - Mengurangi padding kartu dari `p-6 lg:p-12` menjadi `p-4 md:p-6` agar lebih padat dan rapi.
  - Memperkecil ukuran foto profil (avatar) dari `w-24 h-24 lg:w-32 lg:h-32` menjadi `w-14 h-14 md:w-16 md:h-16`.
  - Memperkecil ukuran tipografi nama dari `text-3xl lg:text-5xl` menjadi `text-lg md:text-xl` agar lebih proporsional pada tampilan mobile.
- **Ringkasan Informasi collapsed**: Saat dalam keadaan tertutup (collapsed), kartu tetap menyajikan informasi esensial yang sangat informatif (Nama, Badges Kost & Status Aktif/Tenggang/Lunas, Sisa Hari Sewa, Tanggal Selesai Sewa, dan Total Tagihan Bulanan).
- **Aksi Cepat Kompak**: Menyusun ulang tombol aksi ("Tandai Selesai", "Tagih", "Chat") ke dalam baris horizontal yang ramping dan hemat tempat.
- **Header Halaman Kompak & Estetis (De-bulking)**: Menghapus box/card pembungkus judul halaman yang besar, memindahkan judul halaman langsung ke background dengan indikator status sewa yang ringkas, serta menyisakan satu tombol Refresh saja.
- **Filter Row Ultra-Ramping**: Menyatukan input pencarian dan dropdown properti menjadi satu baris horizontal setinggi `h-10` dengan font `text-xs`, serta mengeliminasi tombol refresh sekunder yang redundan.
- **Tab Status Horizontal Scroll**: Mengatur tab kategori filter status agar berderet secara horizontal menggunakan `overflow-x-auto flex-nowrap scrollbar-none` untuk mencegah penumpukan baris baru ke bawah di layar smartphone.

### 43. Perbaikan Bug Draf Profil Mitra & Penambahan Kolom Database (Juni 2026)
- **Penambahan Kolom `whatsapp_verified`**: Menambahkan kolom `whatsapp_verified` ke dalam definisi tabel `public.users` dan melengkapinya dengan perintah migrasi `ALTER TABLE` pada berkas `supabase_schema.sql` agar sinkronisasi draf nomor WhatsApp yang terverifikasi tersimpan secara permanen di database.
- **Penanganan Silent Error Supabase**: Memperbaiki pemanggilan `.update()` dan `.upsert()` Supabase di `MitraProfile.tsx` agar mendestruktur object `{ error }` dan men-throw error tersebut ke block `catch`. Ini menghentikan bug silent error di mana pembaruan database gagal akibat kolom tidak lengkap tetapi frontend tetap melaju ke halaman berikutnya seolah-olah berhasil.
- **Notifikasi Error Pengguna**: Menampilkan pesan kesalahan detail via `alert` jika proses penyimpanan draf profil utama gagal agar pengguna mendapatkan petunjuk yang jelas ketika data draf gagal masuk database.
- **Pemuatan Latar Belakang (Silent Loading) Dashboard Mitra**: Mengubah fungsi `loadData` di `MitraDashboard.tsx` agar mendukung parameter `silent`. Panggilan sinkronisasi saat prop `user` diperbarui atau real-time event chat/booking kini dilakukan secara *silent* (tanpa memicu layar loading spinner penuh). Hal ini memperbaiki bug di mana komponen `MitraProfile` ter-unmount secara otomatis dan kehilangan seluruh state aktifnya (seperti `isEditing` dan `currentStep`) saat draf Step 1 berhasil disimpan.
- **Relokasi Foto Profil ke Form Langkah 1**: Menghapus tombol unggah foto profil dari kartu atas (hero header) dan memindahkannya ke dalam grid form Langkah 1 (Step 1) sebagai input opsional terintegrasi. Kartu atas (Profile Hero / Header) kini juga disembunyikan sepenuhnya ketika mode edit aktif (`isEditing === true`) untuk mencegah duplikasi visual dan menghemat ruang layar.



### 44. Penyempurnaan Detail Verifikasi Identitas Calon Mitra untuk Evaluasi Admin (Juni 2026)
- **Pengambilan Detail Verifikasi Terintegrasi (`adminService.ts`)**:
  - Mengubah fungsi `getAdminMitraRequests` agar mengambil data verifikasi dari tabel `user_verifications` (termasuk nomor KTP, alamat KTP, dan foto KTP) serta data pelengkap profil dari tabel `users` (tempat/tanggal lahir, alamat domisili) berdasarkan `user_id` secara paralel.
- **Tampilan UI Evaluasi Admin Komprehensif & Konkrit (`MitraManagement.tsx`)**:
  - Merancang ulang layout grid detail data calon mitra pada antrean verifikasi identitas (tab "Antrean Pendaftar").
  - Menampilkan informasi secara konkrit: Email, No. WhatsApp, Tempat & Tanggal Lahir (dengan format tanggal Indonesia yang rapi), No. KTP, Alamat Domisili, dan Alamat KTP.
  - Membantu admin melakukan evaluasi silang (cross-match) yang valid antara dokumen identitas KTP dan data domisili profil sebelum melakukan persetujuan/penolakan pendaftaran mitra.

## Fitur Dalam Pengerjaan (In Progress)
-   Monitoring konsistensi Webhook Midtrans vs Supabase untuk transaksi multi-kost.
-   Uji E2E transaksi nyata di Production (Smallest Amount).

### 45. Otomatisasi & Penyelesaian Deploy Email Status Mitra (Juni 2026)
- **Sukses Deployment Cloud Function (`sendMitraStatusEmail`)**: Menyelesaikan build TypeScript (`tsc`) backend tanpa error dan sukses mendeploy Cloud Function ke Firebase. Cloud Function ini menangani pengiriman email notifikasi otomatis via Brevo API ke calon mitra saat pendaftaran mereka disetujui atau ditolak dengan alasan penolakan yang diinput oleh admin di Dashboard Admin.

### 46. Sistem Blokir Kemitraan Permanen & Batas Penolakan Maksimal (Juni 2026)
- **Tombol Blokir Kemitraan Manual**: Menambahkan tombol "Blokir Kemitraan" di Dashboard Admin pada tab "Antrean Pendaftar". Admin dapat memblokir secara permanen akses pengajuan kemitraan dari user/calon mitra nakal dengan menyertakan alasan konkrit.
- **Batas Otomatis 3 Kali Penolakan**: Menambahkan pelacakan kolom `rejection_count` pada database. Jika pengajuan verifikasi/kemitraan ditolak sebanyak 3 kali berturut-turut, sistem secara otomatis mengubah status pengguna menjadi `banned` (akses diblokir permanen) dan menurunkan status peran akun kembali ke `user` biasa.
- **Proteksi Halaman Mitra Profile**: Memperbarui halaman `MitraProfile.tsx` untuk membaca status `banned`. Jika terdeteksi, panel pengisian form dan tombol edit akan dinonaktifkan sepenuhnya dan diganti dengan pesan peringatan permanent ban.
- **Email Penegasan Ban via Brevo**: Memperbarui Cloud Function `sendMitraStatusEmail` untuk mendeteksi status `banned` dan mengirimkan email penegasan pemblokiran akun dengan template gelap yang dirancang khusus.

## Rencana Selanjutnya (Future Plans)
-   Integrasi laporan keuangan otomatis berbasis transaksi Midtrans.
-   Sistem penarikan dana (payout) otomatis untuk Mitra.









