# PROGRESS - RuangSinggah Development

## Fitur Selesai (Completed Features)

### 1. Perombakan Sistem Survey Multi-Kost (Mei 2026)
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

## Fitur Dalam Pengerjaan (In Progress)
-   Monitoring konsistensi Webhook Midtrans vs Supabase untuk transaksi multi-kost.
-   Uji E2E transaksi nyata di Production (Smallest Amount).

## Rencana Selanjutnya (Future Plans)
-   Integrasi laporan keuangan otomatis berbasis transaksi Midtrans.
-   Sistem penarikan dana (payout) otomatis untuk Mitra.

