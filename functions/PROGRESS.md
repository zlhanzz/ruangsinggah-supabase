# PROGRESS - RuangSinggah Development

## Fitur Selesai (Completed Features)

### 30. Perbaikan Warning Overlay & Persistensi Draf Peninjauan Ulang Data KostManager (Agustus 2026)
- **Masalah**: Warning overlay untuk peninjauan ulang data properti hasil migrasi tidak muncul ketika data draf dimuat dari dedicated `mitra_kostmanager` (`kmProp`). Selain itu, status warning ini ter-reset (overlay menghilang) saat draf dimuat ulang dari `localStorage` browser.
- **Perbaikan**:
  * Menambahkan penyetelan status `setIsExistingPropertyMigration(true)` dan `setWarningAccepted(false)` ketika data KostManager dimuat pertama kali dari tabel `mitra_kostmanager`.
  * Memodifikasi fungsi penyimpanan draf agar menyertakan variabel `isExistingPropertyMigration` dan `warningAccepted` ke dalam `draftData` di `localStorage`.
  * Memodifikasi pemuatan draf `localStorage` agar merestorasi status kedua variabel tersebut saat form dibuka kembali oleh agen survey.

### 29. Sinkronisasi Siklus Pembangunan Ulang (Anti-Reset) & Perbaikan Review Admin (Agustus 2026)

- **Masalah**: Setiap kali skrip pembangun ulang `reapply_all_changes_chronologically.js` dijalankan, perubahan di luar `AgentDashboard.tsx` ter-reset. Selain itu, fitur detail kelola properti di Admin Dashboard (`KostManagerManagement.tsx`) selalu gagal terinjeksi karena skrip pencari salah mencocokkan pola `onClick={async () => {` padahal aslinya fungsi sinkron biasa.
- **Perbaikan**:
  * Memperbarui `reapply_all_changes_chronologically.js` agar secara otomatis membersihkan (`git checkout HEAD`) file `KostManagerManagement.tsx` di awal proses untuk mencegah modifikasi bertumpuk.
  * Memperbaiki pencocokan regex di `add_admin_review_kostmanager.js` agar sesuai dengan format signature `onClick={() => {` yang asli, sehingga fitur logging dan review properti kelolaan KostManager di Admin Dashboard berhasil diinjeksi 100%.

### 28. Penyelarasan GPS Ekstraktor & Prefill Kamar (Agustus 2026)
- **Masalah**: Jumlah kamar acuan awal (`initialTotalRooms`) dan koordinat awal (`initialCoords`) tidak otomatis ter-prefill dari metadata transaksi atau catatan registrasi mitra karena skrip `apply_gps_fixes.js` sebelumnya tidak terdaftar di daftar run otomatis.
- **Perbaikan**:
  * Menulis skrip `apply_gps_fixes_v2.js` dengan regex yang lebih fleksibel dan mencocokkan UUID guard terbaru.
  * Memastikan draft loader di local storage tidak melakukan `return` secara instan, melainkan menggabungkannya sehingga database dapat meng-override dengan data ter-update.
  * Mendaftarkan skrip `apply_gps_fixes_v2.js` ke daftar eksekusi akhir `reapply_all_changes_chronologically.js`.


### 27. Perbaikan ReferenceError: isExistingPropertyMigration + UUID Guard (Agustus 2026)
- **Masalah 1**: State variables `isExistingPropertyMigration` dan `warningAccepted` tidak dideklarasikan karena script injeksi sebelumnya gagal menemukan target pola di file yang sudah dimodifikasi.
- **Masalah 2**: Error `invalid input syntax for type uuid: "undefined"` muncul di console saat agen membuka form pendataan, karena `propertyId` dari `transactions.metadata` bisa berisi string non-UUID atau `undefined`.
- **Perbaikan**:
  * Membuat script baru `fix_missing_states_and_uuid.js` yang mendeklarasikan state `const [isExistingPropertyMigration, setIsExistingPropertyMigration] = useState(false)` dan `const [warningAccepted, setWarningAccepted] = useState(false)` setelah state `kmActiveTab`.
  * Menambahkan validasi format UUID (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) sebelum nilai `propertyId` dari metadata transaksi digunakan untuk query ke Supabase.
  * Menambahkan `setIsExistingPropertyMigration(true)` saat `existingProp` berhasil ditemukan di tabel `properties`.
  * Script ini sudah ditambahkan ke `reapply_all_changes_chronologically.js` sehingga selalu dijalankan ulang saat regenerasi.

### 26. Refactor Warning Popup: Dari Ternary JSX ke Absolute Overlay (Agustus 2026)
- **Masalah**: Pendekatan ternary JSX (`? : (`) untuk menampilkan popup peringatan migrasi properti menyebabkan ketidakseimbangan closing tags (`</div>` dan `)}`) yang tidak bisa dikompilasi oleh esbuild.
- **Perbaikan**:
  * Mengganti pendekatan ternary dengan **absolute overlay** (`position: absolute, inset-0, z-50`) yang dirender di *dalam* content div `bg-[#f8f9ff]`, sehingga tidak mempengaruhi struktur closing tags sama sekali.
  * Overlay muncul di atas seluruh konten form menggunakan `backdrop-blur-sm` untuk efek premium.
  * Script baru: `add_warning_overlay.js` menggantikan `inject_warning_popup_inline.js` yang bermasalah.
  * Build berhasil: `Dashboard-BZua4NmM.js` (817.55 kB) dikompilasi tanpa error.

### 25. Panel Kontrol Eksklusif "Kosongan vs Furnished" dengan Visual Menarik & Dinamis (Agustus 2026)
- **Masalah**: Centang "Kosongan" di tengah-tengah fasilitas lain terlihat kaku dan kurang mencerminkan alur pendataan modern.
- **Perbaikan**:
  * Mengganti checkbox "Kosongan" dengan **Segmented Pill Switcher (Pill Toggle)** yang diletakkan di bagian atas panel fasilitas kamar (berupa pilihan **[Kosongan]** vs **[Furnished (Isian)]**).
  * Menampilkan visualisasi canggih: Ketika opsi **[Kosongan]** aktif, semua checkbox fasilitas perabot fisik (Kasur, Lemari, Meja Belajar, AC, Kipas Angin, Water Heater) secara dinamis berubah menjadi **setengah transparan (low opacity - 40%)** dan **dinonaktifkan (disabled / pointer-events-none)**.
  * Memungkinkan input tata letak struktural (Kamar Mandi Dalam, Jendela Luar, Dapur Dalam) tetap dapat diisi meskipun status kamar adalah Kosongan.
  * Menjaga kompatibilitas data dengan Supabase: status "Kosongan (Tanpa Perabot)" tetap tersimpan dengan format array yang sama agar terintegrasi sempurna dengan halaman detail properti di sisi pengguna.

### 24. Peringatan Kesesuaian Data Saat Agen Survey Melakukan Migrasi Properti (Agustus 2026)
- **Masalah**: Saat pendataan properti yang sebelumnya terdaftar sebagai Mitra biasa (migrasi) diaktifkan, data-data properti lama (nama, alamat, tipe, dll.) terisi secara otomatis (*pre-filled*). Hal ini berpotensi membuat agen survey langsung melanjutkan proses tanpa meninjau kesesuaian data yang sebenarnya di lapangan.
- **Perbaikan**:
  * Menambahkan overlay pop-up peringatan interaktif bertema peringatan (kuning-oranye) yang memblokir layar wizard pendataan jika terdeteksi bahwa properti yang sedang diedit sudah ada di database (`existingProp` ditemukan).
  * Meminta agen untuk mengonfirmasi peninjauan ulang data dengan mengklik tombol **"Saya Mengerti"** sebelum alur pengisian form pendataan diizinkan untuk dilanjutkan.
  * Menyinkronkan status verifikasi peringatan agar direset setiap kali wizard ditutup atau draf baru dibuka.

### 23. Ekstraksi Koordinat GPS Otomatis dari Link Google Maps (Agustus 2026)
- **Masalah**: Preview peta OSM dan koordinat pada kartu pendataan KostManager serta inisialisasi pin lokasi pada wizard pendataan di Dashboard Agen selalu menampilkan koordinat default/fallback Makassar (`-5.147665, 119.432731`). Hal ini karena tautan Google Maps yang diinput mitra saat mendaftar tidak otomatis diterjemahkan menjadi koordinat Latitude dan Longitude.
- **Perbaikan**:
  * Menambahkan fungsi pembantu `extractCoordinates` menggunakan ekspresi reguler untuk mengekstrak Latitude & Longitude dari berbagai format Google Maps URL (seperti query `q=`, path `@`, daddr, maupun format koordinat mentah).
  * Menjalankan fungsi ekstraksi ini pada berbagai field asal data pendaftaran mitra (`meta.googleMapsLink`, `meta.google_maps_url`, `req.kost_name`, dan `req.notes`).
  * Menyinkronkan koordinat hasil ekstraksi agar langsung ter-render pada komponen peta preview kartu agen serta menjadi titik awal peta picker saat agen membuka formulir pendataan.

### 22. Auto-Prefill Jumlah Kamar Berdasarkan Input Awal Mitra (Agustus 2026)
- **Masalah**: Pada formulir pendataan KostManager di wizard step 1, kolom total jumlah kamar ter-render kosong atau bernilai default `0`. Agen survey harus mengetik ulang angka jumlah kamar secara manual meskipun mitra telah menginput jumlah kamar saat mendaftar/order layanan untuk pertama kalinya.
- **Perbaikan**:
  * Menambahkan pendeteksian otomatis jumlah kamar awal (`initialTotalRooms`) dari data metadata transaksi atau catatan (*notes* dari mitra) saat wizard `openKostManagerListing` diinisialisasi.
  * Menerapkan fallback nilai otomatis ini jika properti baru dibuat atau kueri database untuk `total_rooms` bernilai kosong/0. Agen kini langsung melihat angka kamar default yang telah terisi sesuai isian mitra sebelumnya.

### 21. Redesign UI/UX Kartu Pesanan Pendataan KostManager dengan Design Tokens & Stitch (Agustus 2026)
- **Masalah**: Tampilan kartu pesanan pendataan KostManager sebelumnya di dashboard agen tidak selaras dengan mockup baru, serta memiliki elemen spacing, border line, dan penataan tanggal/jam yang kurang presisi.
- **Perbaikan**:
  * **Integrasi Design Tokens di CSS**: Menambahkan variabel spacing kustom (`stack-sm`, `stack-md`, `stack-lg`, `margin-page`, `gutter-grid`), typography (`label-bold`, `body-lg`, `headline-md`, dll.), dan float shadow (`shadow-soft-float`) ke dalam `@theme` di `index.css` agar sejalan dengan system token milik Stitch UI.
  * **Header Terkalibrasi**: Tanggal dan jam pesanan dipisah menjadi badge individu yang rapi di bagian atas kartu lengkap dengan ikon `calendar_today` dan `schedule` dari Material Symbols.
  * **Layout v2 Terpadu**: Mengubah struktur flexbox kartu agar memuat layout grid dan card-within-card Stitch dengan border line kontras.
  * **Fungsionalitas Riil Terintegrasi**: Mengintegrasikan nominal komisi dinamis, info status terpadu dengan warna dinamis, navigasi rute GPS dengan OpenStreetMap, kontak pemilik dengan sensor WA, dan tombol-tombol alur survey (terima, tolak, OTW, pendataan, isi listing) di setiap tab dashboard agen.

### 20. Perbaikan Kartu Riwayat Survey Biasa & Pendataan KostManager di Dashboard Agen (Agustus 2026)
- **Masalah**: Pesanan survei biasa yang telah diproses/diselesaikan agen sebelumnya tidak muncul di tab Riwayat dan sempat kembali ke tab Permintaan sebagai "MENUNGGU AGEN" (`PENDING_ASSIGNMENT`). Selain itu, detail isi laporan survei (fasilitas, penilaian, bukti foto, dll.) tampak kosong saat dibuka di tab Riwayat.
- **Root Cause**:
  * `adminService.ts` (`getAdminSurveyRequests`): Memanggil `autoSyncAllSurveys(user.id)` pada sesi agen (non-admin). Karena sesi agen memiliki RLS terbatas, `syncSurveyRequest` gagal mendeteksi record lama dan membuat record DUPLIKAT baru berstatus `PENDING_ASSIGNMENT` untuk transaksi yang sudah diproses.
  * `adminService.ts` (Data Terpisah): Record lama (asli) yang menyimpan data `evaluation_summary` terpisah dari record duplikat auto-sync baru yang ber-`evaluation_summary` kosong `{}`.
  * `AgentDashboard.tsx` (`openSurveyEditor`): Terjadinya perubahan kunci ID akibat auto-sync sehingga draf lokal yang pernah tersimpan di `localStorage` pada browser agen belum terhubungkan secara otomatis.
- **Perbaikan**:
  * `adminService.ts`: Mengimplementasikan rutinitas konsolidasi otomatis `repairSurveyRequestStatuses()` yang menyatukan data `evaluation_summary` terlengkap, `result_drive_link`, dan informasi agen dari seluruh record per `transaction_id` ke record utama Supabase, serta mengekstrak fallback dari `transaction.metadata`.
  * `AgentDashboard.tsx`: Menambahkan `assigned_agent_id: uid` pada payload tombol "Terima Tugas", menyertakan status `'SUBMITTED'` ke dalam filter tab `history` (`['COMPLETED', 'CANCELLED', 'ACTIVE', 'SUBMITTED']`), serta mengimplementasikan pemindaian draf bertingkat (`openSurveyEditor`) yang otomatis memindai `localStorage` browser agen untuk merekonstruksi dan menyinkronkan ulang data `evaluation_summary` yang pernah diisi ke Supabase.
  * `supabase_schema.sql`: Memperbarui RLS policy `surveys_select_own` dan `surveys_update_agent` untuk mengizinkan `assigned_agent_id IS NULL`.
- **Hasil**: Seluruh pesanan survei biasa terdahulu yang sempat kembali ke tab Permintaan telah **secara otomatis dipulihkan statusnya kembali ke `COMPLETED` di Supabase**, berpindah ke tab **Riwayat**, dan seluruh data laporan survei (checklist Jenis Kost, Kamar, WC, Dapur, Air, WiFi, Bintang Penilaian, Catatan, & Bukti Foto WA) **tampil dengan utuh dan lengkap**.

### 19. Redesign UI/UX Kartu Pesanan KostManager Dashboard Agen (Agustus 2026)
- **Masalah**: Tampilan kartu pesanan KostManager di `AgentDashboard.tsx` kurang optimal, menggunakan label "Onboarding Kost Madani" yang membingungkan, menampilkan input catatan/jadwal yang tidak relevan, serta memiliki ukuran text/avatar profil mitra dan tanggal/waktu yang sangat kecil dan pudar.
- **Perbaikan UI/UX**:
  * **Pemberian Label & Tema Khusus**: Mengubah badge header menjadi `⚡ Pendataan Kostmanager` dengan aksen tema warna Emerald/Green khas KostManager untuk membedakannya secara jelas dari survei biasa.
  * **Profil Mitra Terbaca & Jelas**: Menampilkan avatar profil mitra 56x56 (`w-14 h-14`), label "Mitra Pemesan Kostmanager", nama mitra berukuran besar (`text-lg font-black text-gray-900`), dan nomor telepon mitra dengan badge berkontras tinggi.
  * **Tanggal & Waktu Berkontras Tinggi**: Mengubah warna dan background badge tanggal & waktu pesanan menjadi hitam pekat (`text-gray-900 font-black`) dengan background kontras terang (`bg-emerald-100` & `bg-white` border emerald) agar sangat mudah dibaca.
  * **Peta GPS Mini & Integrasi Navigasi**: Menambahkan preview peta GPS interaktif OpenStreetMap mini (iframe) dan tombol navigasi langsung "📍 Buka Rute GPS / Google Maps" beserta koordinat GPS lengkap.
  * **Informasi Kamar & Properti Lengkap**: Menampilkan badge "Total Jumlah Kamar" vs "Jumlah Kamar Kosong" serta tipe kost (Putra/Putri/Campur).
  * **Pembersihan Elemen**: Menghapus `req.notes` ("Catatan Pemesan") dan jadwal survei yang tidak dibutuhkan pada alur KostManager.

### 18. Perbaikan Alur Penugasan Agen KostManager (Agustus 2026)
- **Masalah**: Setelah admin menetapkan agen survey, kartu tugas langsung muncul di tab "Aktif" di dashboard agen, melewati tab "Permintaan".
- **Root Cause**: `handleQuickAssignAgent` di `KostManagerManagement.tsx` meng-set status ke `AGENT_ASSIGNED` saat assign. Padahal, di `AgentDashboard.tsx`, tab "Permintaan" hanya menampilkan status `PENDING_ASSIGNMENT`.
- **Perbaikan**:
  * `KostManagerManagement.tsx` baris 152: Status saat admin assign agen diubah dari `AGENT_ASSIGNED` → `PENDING_ASSIGNMENT`.
  * `adminService.ts` (`updateKostManagerRequest`): Menambahkan handling `PENDING_ASSIGNMENT` dalam sinkronisasi ke `kostmanager_surveys` (pemetaan status dan insert pertama).
  * `adminService.ts` (`updateKostManagerRequest`): Menambahkan mapping `PENDING_ASSIGNMENT` dalam sinkronisasi backward-compatible ke `survey_requests`.
- **Alur yang Benar Sekarang**: Admin assign → `PENDING_ASSIGNMENT` (tab "Permintaan") → Agen terima → `AGENT_ASSIGNED` (tab "Aktif") → Agen survey → `PENDING_ONBOARDING` → Admin aktivasi → `ACTIVE`.

### 17. Perombakan UI/UX & Kelengkapan Informasi KostManager Admin (Agustus 2026)
- **Reposisi Hierarki & Profil Mitra Interaktif (DIPERBAIKI)**:
  * Memindahkan profil Mitra Pengaju ke bagian teratas badan kartu sebelum profil properti (kost) untuk hierarki informasi yang logis.
  * Mendesain profil mitra secara minimalis dan menjadikannya dapat diklik untuk membuka Modal Detail Popup lengkap.
  * Memperbaiki bug kegagalan query profil mitra dengan membagi query bersarang PostgREST menjadi kueri sekuensial yang aman (kueri `users` lalu kueri `mitra` secara terpisah dengan fallback dinamis) serta menyelaraskan field `business_name`.
- **Desain Grid Kartu Premium & Peta GPS Mini**:
  * Menggantikan tabel horizontal yang sempit dengan layout grid kartu responsif (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) berdesain premium menggunakan Tailwind CSS.
  * Mengintegrasikan **Iframe Google Maps Mini (interaktif)** langsung di dalam kartu pesanan jika koordinat GPS (`latitude` & `longitude`) tersedia di metadata transaksi.
- **Kelengkapan Informasi Properti**:
  * Menampilkan **Total Jumlah Kamar** secara dinamis yang diambil dari metadata transaksi pendaftaran (`totalRooms`), disandingkan dengan jumlah kamar kosong.
- **Pemisahan Visibilitas Survei Jasa Survey vs KostManager (DIPERBAIKI)**:
  * Memetakan tipe tugas (`task_type`) secara dinamis di `getAdminSurveyRequests` (`adminService.ts`). Jika kolom `notes` mengandung kata `"KostManager Onboarding"`, maka ia dideteksi sebagai `'kostmanager'`. Jika tidak, ia bertipe `'survei_biasa'`.
  * Mengecualikan data survei bertipe `'kostmanager'` dari halaman kelola **"Layanan Jasa Survey"** (`SurveyManagement.tsx`) milik Admin.
  * Menyaring keluar transaksi tipe `'kostmanager'` dan `'kostmanager_subscription'` dari data transaksi survei komersil di `loadSurveyTransactions` (`Dashboard.tsx`).
- **Sistem Tab Filter Pipeline**:
  * Menambahkan tab filter navigasi status di bagian atas halaman ("Semua permohonan", "🔴 Butuh Agen", "⚡ Proses Survey", "📥 Butuh Verifikasi", "🟢 Aktif Autopilot") lengkap dengan badge counter dinamis.
- **Aksi Cepat Langsung di Kartu (Inline Actions)**:
  * Mengintegrasikan dropdown select agen survey lapangan dan tombol "Tugaskan" langsung pada kartu permohonan berstatus `PENDING_ASSIGNMENT` tanpa harus membuka modal kelola.
- **Penyederhanaan Modal Tinjauan**:
  * Merancang ulang modal tinjauan survei agar fokus pada peninjauan data properti terelasi hasil input lapangan agen (deskripsi, koordinat GPS, fasilitas, landmark, data kamar & penyewa terdata, galeri foto kamar) serta tombol aktivasi Auto-Pilot.

### 16. Perbaikan Visibilitas Properti & Filter Invoice Prematur KostManager (Agustus 2026)
- **Pencegahan Onboarding Prematur**:
  * Menghapus pembaruan `is_managed = true` secara otomatis di `syncKostManagerRequest` (`adminService.ts`) saat transaksi baru saja dibayar.
  * Mengubah status `is_managed` pada properti baru/lama yang disubmit oleh agen menjadi `false` terlebih dahulu di `AgentDashboard.tsx`.
- **Aktivasi Resmi Oleh Admin**:
  * Mengonfigurasi tombol "Aktifkan Layanan Auto-Pilot" di `KostManagerManagement.tsx` agar mengupdate `status: 'published'` sekaligus `is_managed: true` pada tabel `properties` secara bersamaan setelah laporan survei diapprove.
- **Hasil**: Properti yang sedang disurvei tidak akan muncul prematur di portal KostManager milik admin/mitra sebelum disetujui, dan data penghuni dummy tidak akan ter-render prematur.

### 15. Alur Submit & Review KostManager (ACC Admin) (Agustus 2026)
- **Submit oleh Agen**:
  * Mengubah status properti awal yang disimpan menjadi `'draft'` di `AgentDashboard.tsx` (sebelumnya langsung `'published'`).
  * Mengubah status pembaruan `survey_requests` menjadi `'SUBMITTED'` (sebelumnya langsung `'COMPLETED'`).
  * Memperbaiki bug pada update status `kostmanager_requests` dengan mencocokkan `transaction_id` alih-alih request ID, serta turut menyimpan `property_id` agar terhubung.
- **Review & ACC oleh Admin**:
  * Menambahkan panel detail peninjauan (Accordion/Dropdown Preview) berisi detail data properti hasil survei (deskripsi, koordinat gps peta, fasilitas, landmark, tipe kamar beserta harga/penghuni/foto kamar) di modal kelola `KostManagerManagement.tsx`.
  * Menyesuaikan tombol "Aktifkan Layanan Auto-Pilot" agar turut mempublikasikan properti (`status: 'published'`) dan memicu status `survey_requests` menjadi `'COMPLETED'` secara otomatis.

### 14. Pemindahan Input Hunian ke Skema Tarif (Agustus 2026)
- **Reposisi Field**:
  * Memindahkan input "Maksimal Penghuni" dan "Biaya Tambahan / Orang" dari panel Detail Kamar ke dalam panel Skema Tarif / Harga Kamar agar tata letak lebih rapi dan relevan dengan komponen harga.

### 13. Input Maksimal Penghuni & Biaya Tambahan (Agustus 2026)
- **Maksimal Penghuni & Biaya Tambahan**:
  * Menambahkan input "Maksimal Penghuni" (type="number") dan "Biaya Tambahan / Orang" (type="text" dengan format ribuan otomatis) di dalam panel Detail Kamar pada form temporaryRoom maupun activeRoomIdx.

### 12. Pemformatan Ribuan Input Harga Sewa (Agustus 2026)
- **Ribuan Separator Dot**:
  * Menambahkan helper formatThousand dan parseThousand untuk memformat masukan angka desimal/bulat dengan pemisah ribuan titik (dot separator).
  * Mengubah tipe masukan input harga skema tarif bulanan, mingguan, harian, dll. dari type="number" menjadi type="text" dengan pemformat otomatis secara langsung pada formulir.

### 11. Sinkronisasi URL Routing & Auto-Save State Onboarding (Agustus 2026)
- **Auto-Save State & Restore**:
  * Mengintegrasikan penyimpanan draf otomatis untuk seluruh state edit onboarding (kmListingForm, kmStep, temporaryRoom, activeRoomIdx, kmActiveTab, photoCategories) ke localStorage.
  * Menghubungkan active onboarding ke URL query parameter `?onboarding_id=[ID]`.
  * Memulihkan secara otomatis state form onboarding yang aktif beserta detail isian draft ketika halaman dimuat ulang (refresh) tanpa kembali ke halaman tugas survei aktif.

### 10. Perbaikan Nesting Sub-Input Dapur Dalam & Filter Tag (Agustus 2026)
- **Perbaikan Peletakan & Filter**:
  * Memperbaiki kesalahan peletakan sub-input "Dapur Dalam" agar dirender di luar blok IIFE Kamar Mandi Dalam.
  * Memfilter "Dapur Dalam" agar tidak dirender sebagai tag kustom di bagian bawah.

### 9. Fitur Sub-Fasilitas Dapur Dalam (Agustus 2026)
- **Sub-Input Dapur Dalam**:
  * Menambahkan checkbox "Dapur Dalam" pada daftar fasilitas kamar utama.
  * Membuat panel isian bersarang (nested) untuk "Dapur Dalam" yang berisi checklist kelengkapan dapur standar (Kompor, Kulkas, Wastafel Cuci Piring, Kitchen Set, Dispenser) dan input teks tambah kelengkapan kustom secara dinamis.

### 8. Perubahan Kategori Foto Utama: Tempat Tidur (Agustus 2026)
- **Penggantian Kategori**:
  * Mengganti nama kategori bawaan ketiga dari "View / Jendela" menjadi "Tempat Tidur" di seluruh setelan fallback uploader foto kamar.

### 7. Kategori Foto Kamar Kustom & Tanpa Batas (Agustus 2026)
- **Unggah Foto Kamar Dinamis**:
  * Mengganti daftar foto kamar statis dengan opsi dinamis (photoCategories kustom) di level tipe kamar.
  * Menambahkan bidang masukan teks dan tombol "+ Foto Kamar" di bawah grid galeri pada form temporaryRoom dan rt (activeRoomIdx) untuk menambahkan kategori foto secara bebas.
  * Menyinkronkan fungsi hapus foto kustom (indeks >= 4) agar ikut membersihkan kategori penampungnya secara otomatis.

### 6. Penghapusan Bidang Tanggal Kamar Siap Huni (Agustus 2026)
- **Penghapusan readyDate**:
  * Menghapus input "Tanggal Kamar Siap Huni" (readyDate) sepenuhnya karena status kamar kosong langsung dianggap siap dihuni saat didata.
  * Menyesuaikan nama kontainer pada editor kamar aktif menjadi "Harga Sewa Kamar".

### 5. Fitur Salin Konfigurasi Kamar (Agustus 2026)
- **Kloning Data Kamar**:
  * Menambahkan dropdown pembantu di bagian atas input lanjutan untuk menyalin konfigurasi dari kamar lain yang sudah terdaftar.
  * Fitur ini menyalin skema harga (price & pricing) serta semua fasilitas kamar/kamar mandi guna menghindari pengisian manual yang berulang.

### 4. Input Pilihan Lantai Netral di Detail Kamar Baru (Agustus 2026)
- **Netralisasi Pilihan Lantai**:
  * Menghapus pra-seleksi otomatis "Lantai 1" saat menambahkan kamar baru di Wizard Step 2.
  * Menambahkan opsi placeholder "Pilih Lantai" yang dinonaktifkan secara bawaan.
  * Memperketat validasi agar agen wajib memilih lantai secara manual sebelum input form kelanjutan terbuka secara dinamis.

### 3. Penggantian Tombol Simpan Draft menjadi Keluar & Auto-Save (Agustus 2026)
- **Tombol Keluar**:
  * Mengganti label tombol "Simpan Draft" di Wizard Step 1 menjadi "Keluar".
  * Draft tersimpan secara otomatis di sisi klien (localStorage) dan akan langsung terhapus saat data berhasil dikirim. Hal ini memastikan penyimpanan bersifat sementara dan tidak membebani database utama.

### 2. Validasi Jumlah Kamar Berdasarkan Target Acuan
- **Input Total Kamar di Step 1**:
  * Menambahkan bidang **Total Jumlah Kamar** di bagian bawah tipe kost pada Wizard Step 1.
  * Mencegah navigasi ke Step 2 jika total kamar belum diisi atau kurang dari 1.
- **Validasi Kunci Progres di Step 2**:
  * Menampilkan banner real-time **Progres Pendataan Kamar (X / Y Kamar)**.
  * Menonaktifkan tombol **Tambah Kamar Baru** secara otomatis jika target kapasitas telah terpenuhi.
  * Mengunci navigasi **Lanjut ke Step 3** (menonaktifkan tombol dan mengubah label tombol menjadi "Kamar Belum Lengkap") kecuali jumlah kamar terdata sama persis dengan target acuan yang diinput di Step 1.

### 1. Rekonstruksi Alur Input Detail & Status Kamar
- **Integrasi Status Kamar**:
  * Memindahkan bidang pilihan **Status Kamar** (Terisi / Kosong) menjadi bagian input terakhir di dalam kartu **Detail Kamar** (di bawah Tipe Kamar).
  * Menghapus tampilan pembuka yang memisahkannya secara independen di bagian atas.
- **Tahapan Progresif Form**:
  * Saat pertama kali menambahkan kamar baru, sistem hanya akan merender kartu **Detail Kamar** saja (Nomor, Lantai, Tipe, Status).
  * Bidang input berikutnya (Tarif, Fasilitas, Foto, Informasi Penghuni) disembunyikan seluruhnya dan baru akan dimunculkan setelah keempat komponen di dalam Detail Kamar terisi lengkap.

### 1. Reposisi Modul Dokumentasi Foto Kamar (Agustus 2026)
- **Aksesibilitas Foto Kamar**:
  * Memindahkan modul **Dokumentasi Foto Kamar** keluar dari blok kondisional kamar kosong sehingga dapat diakses dan diisi baik ketika status kamar Terisi maupun Kosong.
  * Tetap mempertahankan label dinamik **"(Opsional)"** jika status dipilih Terisi, dan **"*Wajib"** jika status dipilih Kosong.

### 1. Dokumentasi Foto Kamar Opsional untuk Kamar Terisi (Agustus 2026)
- **Visualisasi Dinamis Status Foto Kamar**:
  * Mengubah label "Interior Kamar *Wajib" menjadi **"Interior Kamar (Opsional)"** secara dinamis khusus ketika status kamar dipilih sebagai **Terisi**.
  * Memperbarui deskripsi pembantu (helper text) secara kondisional agar menginformasikan agen bahwa pemotretan kamar bersifat opsional dan hanya dilakukan jika pemilik/penghuni berkenan.

### 1. Eliminasi Total Modul Dokumen Penghuni Kamar Terisi (Agustus 2026)
- **Penghapusan Total Dokumen Penghuni**:
  * Menghapus seluruh modul **Dokumen Penghuni** dari Langkah 2 Wizard (Data Kamar).
  * Menghapus input berkas **Bukti Bayar / Kontrak** (`paymentProofUrl`) secara permanen, sehingga tidak lagi meminta berkas dokumen apapun untuk mempercepat alur survei lapangan.

### 1. Eliminasi Input Unggah KTP Penghuni Kamar Terisi (Agustus 2026)
- **Pembersihan Dokumen KTP Penghuni**:
  * Menghapus secara permanen kolom unggah **Foto KTP** (`residentKtpUrl`) dari modul **Dokumen Penghuni** di Langkah 2 Wizard (Data Kamar).
  * Menyederhanakan tata letak kolom menjadi satu baris penuh (`flex flex-col gap-1`) yang berfokus penuh hanya pada berkas **Bukti Bayar / Kontrak** saja.

### 1. Sistem Pencatatan Status Lunas/Sisa Tagihan Penghuni (Agustus 2026)
- **Status Pembayaran (Lunas / Belum Lunas)**:
  * Menambahkan tombol toggle pilihan **Status Pembayaran** (Lunas / Belum Lunas) di bagian **Informasi Penghuni** (Langkah 2).
  * Jika status dipilih **Lunas**, sistem akan memproses penagihan di masa depan berdasarkan **Tagihan Berikutnya**.
  * Jika status dipilih **Belum Lunas**, sistem memicu kemunculan input angka **Sisa Tagihan (Rp)** secara kondisional agar tagihan baru dengan nominal sisa tersebut langsung diterbitkan ke penghuni saat ini.

### 1. Sistem Manajemen Langganan & Tagihan Penghuni Wizard (Agustus 2026)
- **Dropdown Jenis Langganan Dinamis**:
  * Menambahkan dropdown pilihan **Jenis Langganan** pada bagian **Informasi Penghuni** (khusus kamar dengan status Terisi).
  * Opsi pilihan jenis langganan dimuat secara dinamis mencocokkan skema tarif/harga kamar yang telah ditentukan di atas (seperti Bulanan, Tahunan, dll).
- **Label Tanggal & Tagihan Baru**:
  * Mengubah label **Mulai Masuk** menjadi **Tanggal Pembayaran Terakhir** agar lebih presisi.
  * Mengubah label **Selesai Sewa** menjadi **Tagihan Berikutnya** untuk mengakomodasi alur billing berlangganan bergulir yang tepat.

### 1. Sistem Multi-Tarif, Fasilitas Kustom, & Sub-Fasilitas WC Dinamis (Agustus 2026)
- **Modul Skema Tarif / Harga Kamar Fleksibel**:
  * Menambahkan editor profil multi-tarif dinamis (`pricing: [{ period, price }]`) pada form penambahan dan pengeditan kamar di Langkah 2 Wizard.
  * Mendukung pengaturan harga berbasis periode kustom: **Bulanan**, **3 Bulan**, **6 Bulan**, **Tahunan**, **Mingguan**, dan **Harian**.
  * Menerapkan logika kelipatan default (12x harga bulanan) jika tarif tahunan tidak diisi secara eksplisit.
- **Fasilitas Kamar Mandi Dalam Beranak & Kustom**:
  * Memindahkan modul Fasilitas Kamar agar selalu muncul baik untuk kamar status Terisi maupun Kosong.
  * Menggeser opsi checklist **Kamar Mandi Dalam** ke posisi paling akhir pada daftar utama untuk kerapian tata letak.
  * Menyediakan sub-checklist kelengkapan fasilitas kamar mandi dalam secara dinamis: **Kloset Duduk**, **Kloset Jongkok**, **Shower**, dan **Wastafel**.
  * Dilengkapi kolom input teks dan tombol tambah untuk mendata kelengkapan fasilitas WC kustom secara bebas.
- **Fasilitas WC Umum Beranak & Kustom pada Wizard Properti (Langkah 1)**:
  * Menambahkan opsi **WC Umum** pada checklist Fasilitas Umum Properti.
  * Menyediakan sub-checklist kelengkapan WC Umum secara dinamis: **Kloset Duduk**, **Kloset Jongkok**, **Shower**, **Bak Mandi**, **Cermin**, dan **Wastafel**.
  * Dilengkapi kolom input teks dan tombol tambah kelengkapan WC Umum kustom yang secara dinamis tersimpan ke dalam JSONB `metadata.publicBathroomFacilities` pada tabel `properties` dan `mitra_kostmanager`.
- **Pembaruan Skema Database**:
  * Menambahkan kolom `metadata` (`JSONB DEFAULT '{}'`) pada tabel `mitra_kostmanager` di [supabase_schema.sql](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/supabase_schema.sql) untuk menyimpan properti metadata kustom secara aman.

### 1. Restorasi UI/UX & Fungsi Input KostManager Stepper (Agustus 2026)
- **Wizard Stepper Input Properti & Kamar Baru (3 Langkah)**:
  * Mengintegrasikan layout desain baru berdasarkan Google Stitch untuk pengisian data KostManager oleh Agen Survey di [AgentDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/AgentDashboard.tsx).
  * Membagi proses pengisian data properti menjadi 3 langkah terarah: **Langkah 1 (Properti)**, **Langkah 2 (Data Kamar)**, dan **Langkah 3 (Review & Kirim)**.
  * Di Langkah 1, menyediakan form pengisian Nama Properti, Tipe Kos (grup selector Putra/Putri/Campur), Alamat Lengkap, tombol "Kunci Koordinat Presisi Saat Ini" dengan sensor GPS browser, kelola checklist fasilitas umum & penambahan fasilitas kustom, 4 slot foto dokumentasi area umum (Depan, Koridor, Area Umum, Lingkungan), penambahan landmark terdekat dengan GPS, serta penambahan peraturan kost yang dinamis.
  * Di Langkah 2, menyediakan panel pengelolaan tipe-tipe kamar (nama, ukuran, harga, jumlah kamar, kapasitas, ketersediaan, kelola fasilitas kamar, dan upload foto kamar).
  * Di Langkah 3, menyediakan ringkasan (review) data sebelum dikirimkan ke Supabase.
  * Mengintegrasikan warna-warna tema Stitch ke dalam `@theme` Tailwind di [index.css](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/index.css) sehingga render layout terlihat sangat premium dan konsisten.

### 2. Pendaftaran Langganan KostManager Cerdas (Smart Onboarding) & Pelacakan GPS (Juli 2026)
- **Diferensiasi Tugas Agen & Form Listing Detail Kamar**:
  * Menambahkan pendeteksi tipe tugas pada `AgentDashboard.tsx` (`isKostManager`) untuk membedakan antara **Jasa Survey** reguler dengan **Tugas Pendataan KostManager**.
  * Menampilkan tag visual yang mencolok (**`⚡ KostManager Onboarding`** vs **`🔍 Jasa Survey`**) pada masing-masing kartu tugas agen.
  * Menyediakan formulir listing properti & kamar terintegrasi (**`⚡ Isi Listing & Kamar`**) khusus untuk tugas pendataan KostManager.
  * Formulir ini membagi pendataan menjadi 2 tab interaktif: *Info Properti* (nama, deskripsi, kota, area, alamat, koordinat peta/GPS, fasilitas umum) dan *Tipe Kamar & Foto* (nama tipe, ukuran, harga bulanan, jumlah kamar kosong, checklist fasilitas kamar/WC, dan upload foto kamar per unit).
  * Data properti yang diinput oleh agen akan langsung dibuat/diperbarui di tabel `properties` dengan status `is_managed = true` dan ditautkan ke ID mitra pengaju.
  * Setelah agen menyelesaikan pengisian dan menekan "Simpan & Kirim Listing", status pengajuan otomatis diubah menjadi `PENDING_ONBOARDING` (siap diaktifkan autopilot oleh admin) dan status survey diubah menjadi `COMPLETED`.
  * **Kurasi Tampilan & Kontak Otomatis KostManager**: Menyembunyikan tombol "Chat User" pada tugas pendataan KostManager (karena hanya melibatkan 1 orang yaitu mitra/pemilik itu sendiri) dan memperluas tombol "Chat Pemilik Kost" menjadi full-width. Secara otomatis mendeteksi dan mengambil nomor WhatsApp terdata langsung dari profil pengguna (`users.phone`) sebagai fallback jika data `owner_phone` bawaan transaksi kosong atau bernilai dash (`-`).
  * **Harga/Komisi Khusus KostManager**: Memperbarui fungsi kalkulasi pendapatan agen (`getSurveyEarnings`) agar tugas pendataan KostManager secara otomatis menampilkan nominal harga berlangganan KostManager yang dibayarkan oleh pemilik (misalnya Rp 150.000) alih-alih menggunakan nilai flat komisi survei standar (Rp 50.000).
  * **Perbaikan Layout Kartu Tugas (Anti-Cutoff)**: Meredesain penempatan nominal harga komisi/pendapatan pada kartu tugas di `AgentDashboard.tsx` dengan memindahkannya ke satu baris khusus (*dedicated row*) di bawah baris tag status. Hal ini menjamin angka nominal harga tidak akan pernah terpotong (*cutoff*) oleh elemen dekorasi latar belakang kartu dan terbaca secara sempurna dengan tipografi yang sangat kontras dan elegan.
  * **Integrasi Koordinat & Tracking Peta Lapangan**: Memperbarui komponen rute peta pada kartu tugas agen agar secara cerdas membaca koordinat GPS (`latitude` & `longitude` atau objek `location`) langsung dari metadata transaksi pembayaran onboarding yang telah diinput secara grafis oleh mitra pemilik. Menampilkan teks informasi titik koordinat serta menyediakan tautan tombol rute GPS instan yang mengarahkan agen navigasi ke titik tepat koordinat properti tersebut.
  * **Penyelesaian Isu Akses Metadata (RLS Policy)**: Menemukan kendala di mana data objek `transaction` terambil bernilai `null` pada dashboard agen survei karena dibatasi oleh kebijakan keamanan Row Level Security (RLS) pada tabel `transactions`. Mengatasi hal tersebut dengan menambahkan kebijakan RLS baru `transactions_select_agent` di database Supabase yang memperbolehkan agen survey terverifikasi melihat data transaksi yang ditugaskan kepada mereka.
  * **Fleksibilitas Pemilihan Listing Eksisting**: Menghilangkan filter ketat `is_managed = false` saat memuat pilihan kost milik mitra di [KostManagerLanding.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/pages/KostManagerLanding.tsx). Hal ini memungkinan mitra yang ingin mendaftarkan ulang, memperbarui, atau melakukan tes ulang pendaftaran KostManager pada listing yang sudah ada tetap dapat memilih properti mereka di dropdown "Pilih dari Kost Saya".
  * **Sinkronisasi Status Langganan Properti Terkelola**: Memperbaiki logika load data di [KostManagerPortal.tsx](file:///c:/Users/ZHULL/Desktop/Firebase%20to%20Supabase/functions/public/components/admin/KostManagerPortal.tsx) agar memverifikasi status langganan pemilik (`subscription_status = 'kostmanager'` atau request aktif). Jika status mitra adalah `free`, properti yang pernah didaftarkan tidak akan ditampilkan di portal operasional KostManager admin secara otomatis demi kepatuhan bisnis.
  * **Rute URL Progress KostManager di Menu Profil**:
    * Mengintegrasikan rute URL sub-menu `/dashboard-mitra/profile/km-progress` untuk membuka secara otomatis modal "Progress KostManager" (di bawah tab Profil -> Status Program & Layanan).
    * Mengubah klik card pada pilihan "Status Program & Layanan" di [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MitraProfile.tsx) agar langsung menavigasikan ke rute `/dashboard-mitra/profile/km-progress` alih-alih memicu state lokal.
    * Memperbarui [MitraDashboard.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MitraDashboard.tsx) untuk menangkap sub-rute profil dan meneruskan prop `autoOpenKmProgress` ke komponen [MitraProfile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/MitraProfile.tsx).
    * Ketika pembayaran pendaftaran sukses, tombol sukses bayar di [PaymentGateway.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/PaymentGateway.tsx) akan memandu mitra dengan tulisan **"Lihat Status Pengajuan"** dan secara otomatis mengarahkannya langsung ke `/dashboard-mitra/profile/km-progress` untuk melihat progress secara instan.
    * Ketika modal progress ditutup, sistem secara otomatis mengembalikan URL ke `/dashboard-mitra/profile` dengan mulus, dan sebaliknya, menutup modal ketika navigasi kembali dilakukan.
  * **Perbaikan Alur Penerimaan Tugas Surveyor (Permintaan ke Aktif)**:
    * Memperbaiki logika penetapan agen di [KostManagerManagement.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/components/admin/KostManagerManagement.tsx) agar saat admin menugaskan agen survey untuk pendataan KostManager, status pengajuan tetap berada pada status `PENDING_ASSIGNMENT` alih-alih langsung diubah menjadi `AGENT_ASSIGNED`.
    * Perubahan ini memastikan tugas onboarding KostManager masuk ke tab **"Permintaan"** terlebih dahulu pada dashboard agen/surveyor terkait, sehingga agen memiliki kesempatan untuk mengeklik tombol **"Terima Tugas"** sebelum tugas berpindah ke tab **"Aktif"** secara sah.
- **Titik Koordinat Peta Grafis Interaktif (Leaflet Maps)**:
  * Mengintegrasikan komponen peta interaktif Leaflet (`LocationPicker`) pada formulir pendaftaran onboarding manual mitra baru di `KostManagerLanding.tsx`.
  * Memungkinkan mitra menentukan titik lokasi secara grafis dengan mengklik peta atau menyeret marker merah.
  * Secara otomatis menghasilkan tautan Google Maps (Google Maps Link) dan melakukan reverse-geocoding (Nominatim API) untuk mengisi kolom Alamat Kost secara instan.
  * Menyelaraskan marker peta secara real-time dengan koordinat GPS browser saat tombol "Ambil GPS" diklik.
- **Pembersihan Layout Dashboard Admin (`KostManagerManagement.tsx`)**:
  * Menghapus input "Catatan Lokasi / Tautan GPS" yang membingungkan dari modal kelola pendaftaran admin.
  * Menghapus widget "Status Saat Ini" di dalam modal kelola karena status sudah ditampilkan secara transparan di luar modal (di baris tabel utama).
- **Pemuatan Daftar Agen & Otomatisasi Google Drive**:
  * Menghapus restriksi session auth ketat pada `getSurveyAgents` agar data agen tetap dapat dimuat andal di localhost.
  * Menyediakan tombol "Buat Folder Otomatis" di sebelah input link Google Drive pada modal kelola admin, lengkap dengan fallback mock link Google Drive jika cloud function sedang offline.
  * Secara otomatis membuat mock link Google Drive pada saat sinkronisasi pembayaran sukses di backend (`syncKostManagerRequest`).
  * Menambahkan kebijakan RLS `users_select_agents_public` pada tabel `users` di database Supabase untuk mengizinkan pemuatan profil agen survey.
- **Seleksi Kost Eksisting vs Manual (Case 1 & Case 2)**:
  - Menambahkan pendeteksi properti milik mitra yang belum dikelola (`is_managed = false`) pada halaman landing page KostManager (`KostManagerLanding.tsx`).
  - Menampilkan pilihan dinamis untuk mendaftarkan kost eksisting ("Pilih dari Kost Saya") atau mendaftar manual jika merupakan mitra baru.
  - Memilih kost eksisting secara otomatis mengimpor detail nama, tipe, kamar, dan alamat kost ke formulir pendaftaran.
  - Secara otomatis menarik koordinat lokasi (`latitude` & `longitude`) dari listing kost lama, merumuskannya menjadi tautan Google Maps, serta merender peta interaktif **Google Maps Embed** langsung di dalam modal formulir pendaftaran di bawah dropdown kost pilihan.
  - Mengunci input text field "Link Google Maps" menjadi *read-only* dengan visualisasi terarsir agar data GPS aman dari salah ketik oleh mitra ketika memilih opsi kost eksisting. Silakan menginput maps link secara manual hanya jika memilih opsi daftar baru.
- **Fulfillment Transaksi & Sinkronisasi Database (`adminService.ts` & `index.ts`)**:
  - Menyematkan `propertyId` pada metadata transaksi langganan jika pengguna memilih properti eksisting.
  - Menambahkan logika pada `syncKostManagerRequest` agar saat status transaksi berubah menjadi `PAID`, sistem secara otomatis mengupdate properti tersebut menjadi dikelola (`is_managed = true`) dan meng-upgrade status langganan pemilik di tabel `mitra` menjadi `'kostmanager'`.
  - Mengalirkan data tautan Google Maps ke dalam kolom `notes` pada data `survey_requests` agar dapat dibaca oleh tim surveyor lapangan.
- **Pelacakan Rute Lokasi GPS & Pemantauan Status Pengajuan (Mitra, Admin, & Agen)**:
  - **Dashboard Mitra (`MitraProfile.tsx`)**: Menambahkan pemantauan status pengajuan KostManager langsung di menu profil mitra. Menampilkan kartu pelacakan dengan **Progress Stepper UI** interaktif yang memvisualisasikan 5 tahapan proses secara *real-time*: `Diajukan` (Pembayaran Sukses) -> `Verifikasi` (Ditinjau oleh Admin) -> `Agen Ditunjuk` (Menampilkan nama agen) -> `Proses Survey` (Menampilkan jadwal kunjungan) -> `Selesai` (Kost aktif dikelola autopilot).
  - **Dashboard Admin (`KostManagerManagement.tsx`)**: Menambahkan kolom `metadata` pada query data transaksi serta menampilkan tautan tombol "📍 Lacak Rute GPS" yang responsif agar admin dapat melacak rute lokasi kost secara instan.
  - **Dashboard Agen (`AgentDashboard.tsx`)**: Menambahkan pendeteksi format link GPS pada kolom catatan tugas survey untuk menampilkan tombol interaktif "📍 Buka Rute GPS / Maps" yang membawa agen survey langsung ke titik koordinat kost dengan navigasi Google Maps.
  - **Alur Pasca-Pembayaran**: Mengubah arah navigasi setelah transaksi pembayaran KostManager berhasil agar langsung merujuk ke menu profil di dashboard mitra (`/dashboard-mitra/profile`), bukan lagi ke halaman daftar pesanan user. Hal ini mempermudah mitra untuk langsung memantau perkembangan status survey kostnya.
  - **Kartu Status Layanan & Program Kemitraan**: Menambahkan komponen *"Status Program & Layanan"* yang menarik dan informatif di profil mitra untuk menunjukkan jenis kemitraan aktif (`Mitra Reguler` vs `Calon Mitra KostManager (Proses Upgrade)` vs `Mitra KostManager (Autopilot)`). Menyediakan tombol "Upgrade ke KostManager" yang tampil secara andal (bila kemitraan belum aktif `'kostmanager'`) untuk mengarahkan mitra reguler langsung ke halaman pendaftaran. Kartu ini didesain interaktif (dapat diklik) untuk membuka **Modal Ruang Pemantauan Progress** yang menyajikan riwayat pengajuan, detail data agen, tanggal survey, rute GPS, dan visualisasi progress stepper.
  - **Sinkronisasi Database Pelacakan Progres**: Menambahkan kolom `survey_date` (DATE), `survey_time` (TIME), dan `notes` (TEXT) ke dalam tabel `kostmanager_requests` di berkas `supabase_schema.sql` dan database Supabase. Memperbarui handler `adminService.ts` untuk mensinkronisasi data jadwal survey, agen, dan catatan lokasi secara bi-direksional penuh antara tabel `survey_requests` dan `kostmanager_requests`.







### 2. Integrasi CDN Caching Cloudflare Workers untuk Supabase Storage (Juli 2026)
- **Implementasi Caching Proxy Global**:
  - Mengubah fungsi pencari URL absolut `ensureAbsoluteUrl` di `userService.ts` agar mendeteksi URL bawaan Supabase dan secara dinamis mengubahnya menjadi URL proxy CDN Cloudflare `https://media.ruangsinggah.id`.
  - Menghemat penggunaan egress/bandwidth Supabase Storage secara signifikan karena gambar dan media akan di-cache secara permanen di server CDN Cloudflare.
  - Mempercepat waktu loading gambar kost di sisi browser pengunjung website.

### 2. Pengaturan Harga & Durasi Langganan Dinamis KostManager (Juni 2026)
- **Manajemen Paket Langganan di Portal Admin (Super Admin)**:
  - Menambahkan menu baru "Harga Langganan" pada Sidebar Portal Operasional KostManager (`KostManagerPortal.tsx`) yang terhubung dengan SPA routing (`km_packages`).
  - Menyediakan UI tabel daftar paket langganan aktif/nonaktif lengkap dengan detail Label, Durasi (bulan), Harga, dan status Aktif.
  - Menyediakan modal form dinamis untuk Menambah, Mengubah (Edit), dan Menghapus paket langganan.
  - Membuka validasi input durasi berlangganan kustom (1 s/d 12 bulan) serta nominal harga.
- **Skema Database & API Client (`adminService.ts` & `types.ts`)**:
  - Menambahkan tabel `public.kostmanager_packages` di file skema (`supabase_schema.sql`) dengan kolom: `id`, `duration_months`, `price`, `label`, `is_active`, dan `created_at`.
  - Mengimplementasikan helper database client: `getKostManagerPackages`, `saveKostManagerPackage`, dan `deleteKostManagerPackage` dengan fallback statis `DEFAULT_KOSTMANAGER_PACKAGES` demi ketahanan aplikasi sebelum migrasi SQL dijalankan user.
  - Mendefinisikan interface `KostManagerPackage` di `types.ts`.
- **Integrasi Landing Page & Checkout Pembayaran (`KostManagerLanding.tsx`)**:
  - Mengambil data paket langganan aktif dari database Supabase dan menampilkannya secara dinamis di landing page KostManager.
  - Memungkinkan calon mitra memilih paket durasi berlangganan secara interaktif.
  - Menampilkan ringkasan biaya berlangganan dan durasi secara dinamis pada modal Syarat & Ketentuan MoU.
  - Mengintegrasikan harga paket dinamis (`packagePrice`) ke dalam parameter `amount` komponen `PaymentGateway` serta metadata pembayaran yang disetor saat proses transaksi.

### 2. Integrasi Portal Operasional KostManager & Detail Kamar (Juni 2026)
- **Penambahan Properti Terkelola Baru**:
  - Menyediakan tombol *"+ Tambah Properti"* di tab Properti Terkelola untuk memicu formulir modal pendaftaran properti baru dengan skema detail.
  - Memisahkan modal ke dalam sub-komponen `ManagedPropertyAddModal` untuk menghindari pelanggaran *Rules of Hooks*.
  - Mengimplementasikan tata letak split-view kategori (sidebar kiri) dan accordion mobile yang identik dengan super admin penambahan kost.
  - Form mencakup Info Umum (Nama Kost, Alamat, Kota, Tipe Kost, Harga), Tipe Kamar, dan Pemetaan Status Kamar (Kosong / Terisi).
  - Khusus kamar dengan status *"Terisi"*, form secara dinamis meminta detail Nama Penghuni, No HP Penghuni, Paket Sewa, dan Tanggal Jatuh Tempo Sewa.
  - Integrasi penyimpanan otomatis memasukkan data properti ke `properties` dan data penyewa aktif ke `resident_status` Supabase.
- **Desain Layout Sidebar Kiri**:
  - Merancang ulang navigasi Portal KostManager dari tab horizontal di atas menjadi layout Sidebar vertikal di sebelah kiri (`aside` w-64) agar konsisten dengan gaya default Dashboard Admin utama.
  - Memosisikan tombol "Admin Utama" ke bagian paling bawah Sidebar kiri.
  - Mengatur area konten sebelah kanan menjadi flex-grow scrollable container.
- **Integrasi Halaman Utama**:
  - Mengimpor komponen `KostManagerPortal` di `Dashboard.tsx` dan merendernya secara kondisional ketika status menu aktif diawali dengan `km_` (Portal Operasional).
  - Mengoptimalkan pembungkus layout di `Dashboard.tsx` dengan menghapus padding (`p-4 sm:p-6 lg:p-8`) dan container `max-w-7xl` agar Sidebar Portal menyentuh tepi layar.
- **Gerbang Akses Portal**:
  - Menambahkan tombol *"Buka Portal Operasional KostManager"* di bagian header `KostManagerManagement.tsx` untuk mempermudah navigasi langsung Admin.
- **Manajemen Detail Kamar Terperinci**:
  - Menghadirkan tombol *"Detail Kamar"* pada tabel properti terkelola.
  - Menampilkan modal interaktif detail kamar yang memetakan kamar terisi (menyajikan identitas lengkap penghuni, WhatsApp, NIK, masa sewa, dan tanggal jatuh tempo) serta tombol cepat penerbitan tagihan manual.
  - Memetakan kamar kosong dengan lencana khusus *"Siap Dipasarkan"* untuk mempermudah Admin memantau ketersediaan unit yang akan dipromosikan.
- **Fitur Lengkap Edit Properti Kelolaan & Rekonstruksi Kamar**:
  - Menambahkan tombol *"Edit"* di sebelah tombol *"Detail Kamar"* pada tabel properti terkelola.
  - Memungkinkan admin mengedit detail properti (deskripsi, lokasi koordinat peta, fasilitas, tipe kamar, rules) dengan aman.
  - Mengimplementasikan alur rekonstruksi kamar otomatis saat mode edit: kamar terisi ditarik datanya dari tabel `resident_status` lengkap dengan informasi penyewa, dan kamar kosong direkonstruksi sejumlah `availableRoomCount` tipe kamar bersangkutan.
  - Memperbarui `handleSave` pada `ManagedPropertyAddModal` agar mendeteksi status edit untuk melakukan `UPDATE` ke database Supabase serta mencegah duplikasi data penyewa yang sudah aktif.
- **Integrasi SPA Routing Lengkap & Anti-Amnesia**:
  - Mengintegrasikan rute internal KostManager (`km_overview`, `km_properties`, `km_tenants`, `km_billing`) ke tipe `DashboardMenu` di `Dashboard.tsx`.
  - Menerapkan sinkronisasi URL dua arah (URL-based SPA routing) sehingga menu yang aktif di Portal KostManager tersinkron secara reload-proof di address bar browser.
- **Fitur Upload Foto Unit Kamar**:
  - Menambahkan area upload foto kamera 📷 di setiap unit kamar pada formulir detail tipe kamar.
  - Menyimpan array URL foto kamar (`images`) langsung ke dalam properti `rooms` di objek JSONB `room_types` di database Supabase.
  - Menyediakan visualisasi pratinjau thumbnail mini serta tombol hapus foto `❌` pada client-side.
  - Mendukung pemulihan (reconstruction) detail data foto kamar lama/baru saat mode pengeditan properti diaktifkan.
- **Perbaikan Redirection Loop Navigasi & Justifikasi Database**:
  - Mengatasi kendala tombol kembali "⬅️ Admin Utama" pada Portal KostManager yang macet dengan memisahkan rute `'kostmanager'` dari `isKostManagerPortal`. Hal ini membuat menu utama KostManager dirender dalam layout panel admin standar.
  - Menjelaskan alasan teknis pemilihan skema JSONB `room_types` satu-tabel (pada tabel `properties`) alih-alih tabel relasional khusus demi menjamin keutuhan data (Single Source of Truth) dan menjaga kompatibilitas penuh dengan sistem pencarian serta booking utama RuangSinggah.



### 2. KostManager Auto-Pilot & Survey Integration (Juni 2026)
- **Desain & Aksen Warna Oranye Standard**:
  - Merombak visual landing page KostManager (`KostManagerLanding.tsx`) agar selaras dengan skema warna cerah RuangSinggah menggunakan oranye hangat (`orange-500` / `orange-600`), latar belakang putih (`bg-white` / `bg-slate-50`), serta ornamen visual modern.
- **Simplifikasi Alur Order Langganan**:
  - Menyederhanakan formulir pemesanan KostManager di modal agar hanya meminta info minimal: *Nama Kost*, *Jenis Kost*, *Jumlah Kamar Kosong*, *Alamat Lengkap*, dan *Persetujuan Syarat & Ketentuan*. Data diri otomatis menggunakan data profile aktif user yang login.
- **Pemicuan Otomatis Survey Lapangan**:
  - Mengintegrasikan logika pasca-pembayaran (`updateTransactionStatus` di `adminService.ts`) agar ketika transaksi berlangganan KostManager berstatus `PAID`, secara otomatis membuat entri tugas survey di tabel `survey_requests`.
  - Admin dapat langsung menugaskan agen dari tab baru "KostManager Auto-Pilot" di dashboard admin.
- **Progress Card Kepemilikan Kost**:
  - Menghadirkan kartu pantau progres visual interaktif untuk properti KostManager di halaman "Kost Saya" (`MyKost.tsx`) agar owner dapat memantau status secara langsung (Menunggu Survey, Sedang Disurvey, Aktif).
- **Banner KostManager di Menu Kost Saya**:
  - Menampilkan kembali banner promo premium KostManager di menu "Kost Saya" (`properties`), ditempatkan tepat di atas tombol "+ Tambah" kost.
  - Menyelaraskan tema warna banner di tab `properties` dan `overview` menjadi warna oranye/amber khas RuangSinggah (`bg-gradient-to-br from-orange-600 via-amber-500 to-orange-700`) serta menyambungkan aksi tombol "Pelajari KostManager" agar bernavigasi dengan benar ke landing page.


### 2. Perhitungan Pendapatan Agen Survei Berbasis Transaksi Riil (Juni 2026)
- **Akurasi & Stabilitas Pendapatan**:
  - Mengubah kalkulasi pendapatan total (`totalEarnings`) dan transaksi masuk (`inTx`) di `AgentDashboard.tsx` agar menggunakan fungsi kalkulasi presisi `getSurveyEarnings(r)`.
  - Fungsi ini melakukan pencocokan UUID deterministik request survei dengan index kost di array `metadata.kostList` transaksi dari database.
  - Menghitung pendapatan secara statis berdasarkan harga per unit kost yang benar-benar dibayarkan user saat transaksi (termasuk diskon database 30% jika berhak), bukan dihitung secara dinamis dari database global yang bisa berubah sewaktu-waktu.
  - Menghilangkan pembagian dinamis bermasalah yang hanya menyaring dari tugas ter-assign milik agen itu sendiri (yang memicu ketidakpasan data jika tugas dibagi ke beberapa agen).
- **Dukungan Metadata Transaksi**:
  - Memperluas select query `transaction:transaction_id` di `getAdminSurveyRequests()` pada `adminService.ts` agar memuat kolom `metadata`.
  - Menambahkan tipe `metadata?: any;` pada interface `SurveyRequest` di `types.ts` untuk memastikan paritas tipe data TypeScript.
- **Konfigurasi Komisi Bagi Hasil Dinamis**:
  - Memperluas antarmuka `CatalogManagement.tsx` di panel admin dengan menambahkan input angka **"Komisi Agen (Rp per kost disurvei)"** dinamis dengan prefiks "Rp".
  - Menyimpan konfigurasi nominal Rupiah tersebut ke tabel `app_settings` dengan kunci `survey_catalog` (`agent_commission_flat`).
  - Memuat nominal komisi flat Rupiah secara dinamis di `AgentDashboard.tsx` pada saat inisialisasi komponen dan menggunakannya langsung dalam menghitung wallet balance / pendapatan agen survei secara presisi.
- **Penguncian & Log Transaksi Komisi Agen**:
  - Mengunci data komisi flat yang aktif dengan menyematkannya langsung ke payload metadata transaksi (`agent_commission_flat`) saat checkout di `SurveyCheckout.tsx`.
  - Mengimplementasikan aturan **Cutoff Tanggal 16 Juni 2026**: Semua transaksi dari awal hingga 15 Juni 2026 dikunci komisinya sebesar **Rp 35.000** (100% komisi dari harga jasa survey Rp 35.000 flat, tanpa potongan platform).
  - Memperbaiki query database `getAdminSurveyRequests()` di `adminService.ts` agar memuat kolom `created_at` dan `payment_method` dari relasi sub-query `transactions` ke frontend.
  - Memperbarui `getSurveyEarnings()` di `AgentDashboard.tsx` agar memanfaatkan `trx?.created_at || r.created_at` secara dinamis demi memastikan filter cutoff tanggal 16 Juni selalu berjalan presisi tanpa kegagalan filter.
  - Untuk transaksi pada tanggal 16 Juni 2026 dan setelahnya, komisi dicocokkan berdasarkan snapshot transaksi, atau dicocokkan dinamis berdasarkan garis waktu dari log perubahan katalog survey (`changeLogs` di tabel `app_settings` Supabase).
  - Menyederhanakan visualisasi pendapatan di Dashboard Agen: menghapus seluruh banner/badge komisi besar di bawah kartu, dan menggantinya dengan **teks nominal oranye polos berukuran besar (contoh: Rp 35.000)** langsung di jajaran metadata tag teratas (di samping tag ID dan Tipe Survey). Menyajikan info komisi riil secara minimalis, bersih, dan menyatu dengan identitas visual web app.

### 2. Paritas Halaman Profil Agen & Manajemen Agen Admin dengan Mitra (Juni 2026)
- **Wizard Penyelarasan Profil Agen (`AgentProfile.tsx`)**:
  - Mengimplementasikan alur wizard 2-langkah (Step 1: Data Profil & OTP WhatsApp, Step 2: Verifikasi Identitas & Dokumen KTP) yang identik dengan `MitraProfile.tsx`.
  - Menerapkan fitur **Double OTP WhatsApp**: OTP Sesi 1 via email (Brevo) untuk membuka kunci pengeditan WhatsApp, diikuti OTP Sesi 2 via WhatsApp (Meta API) untuk memverifikasi nomor telepon baru secara aman.
  - Mengunci email secara permanen (read-only) untuk paritas keamanan.
  - Menampilkan `referral_code` milik agen sendiri secara read-only dilengkapi tombol "Salin" untuk dibagikan kepada calon mitra. Menghilangkan field input `referred_by` (kode referral yang mengundang) yang tidak dibutuhkan oleh agen.
  - **Perbaikan Deteksi Status & Tombol Aksi**: Memperbaiki visual status di mana Agen yang sudah terverifikasi (`verified`) sebelumnya salah terdeteksi sebagai "Belum Terverifikasi" di dashboard profil. Menyelaraskan tombol aksi agar berubah secara dinamis menjadi "Simpan Semua Data" pada Step 1 (bukan lagi "Lanjutkan") saat akun telah terverifikasi, persis seperti alur pada profil Mitra.
  - Mengintegrasikan auto-save draf di backend saat berpindah step, pemosisian RLS Security Notice di baris teratas Step 2, auto scroll-to-top dinamis saat navigasi wizard, serta fitur cancel/batal dengan rollback data dinamis dari database.
- **Pembaruan Manajemen Agen Admin (`AgentManagement.tsx`)**:
  - Merestrukturisasi tampilan manajemen agen admin menjadi 3 tab interaktif: "Permintaan Verifikasi" (requests), "Daftar Agen Aktif" (active), dan "Akun Diblokir" (blocked), meniru struktur `MitraManagement.tsx`.
  - Menambahkan fitur penolakan pendaftaran agen dengan input alasan kustom detail, tombol **Blokir Kemitraan** (banned), dan tombol **Pulihkan Akses** (unban) untuk memulihkan akun agen dari pemblokiran.
  - Mengimplementasikan penghitung penolakan otomatis (`rejection_count`). Jika verifikasi agen ditolak sebanyak 3 kali secara kumulatif, sistem secara otomatis memblokir (ban) akses kemitraan agen tersebut demi menjaga kualitas surveyor.
- **Dukungan Backend & Integrasi Dashboard (`adminService.ts` & `Dashboard.tsx`)**:
  - Menambahkan endpoint `getBannedAgents()`, `banAgentRequest()`, dan `unbanAgentRequest()` ke dalam `adminService.ts`.
  - Memperluas penanganan status update verifikasi agen di `updateAgentVerificationStatus()` untuk memproses alasan penolakan kustom, penghitung otomatis ban, sinkronisasi RLS tabel privat `user_verifications`, pemulihan peran (`role` kembali ke `'user'`), dan trigger email otomatis status kemitraan via Brevo SMTP.
  - Mengintegrasikan state dan callback pemuatan agen yang diblokir (`bannedAgents`) ke dalam `Dashboard.tsx` serta meneruskannya dengan aman ke sub-komponen management.

### 2. Sistem Double OTP Perubahan Nomor WhatsApp & Penguncian Email Mitra (Juni 2026)
- **Perbaikan Crash, Tampilan Ganda WhatsApp, Spam Resend, & Perapian Layout**: Mengatasi masalah `ReferenceError: phoneEditStep is not defined` yang menyebabkan blank putih saat tombol "Edit Profil" diklik, meniadakan render nomor WhatsApp duplikat dengan menyatukannya ke alur layout kondisional, menyembunyikan tombol header resend begitu OTP dikirim untuk mencegah spam, serta menyelaraskan visual Tempat & Tanggal Lahir menggunakan `ProfileItemRead` standar dengan ikon visual (`MapPin`, `Calendar`) pada mode baca.
- **Email Read-Only Permanen**: Mengunci alamat email Mitra secara permanen di formulir profil (`MitraProfile.tsx`) sehingga bernilai read-only. Menghapus tombol "Ubah" dan dialog verifikasi email untuk mencegah modifikasi email demi alasan keamanan.
- **Sesi Double OTP WhatsApp**: 
  - **OTP Keamanan (Sesi 1)**: Mengintegrasikan Firebase Cloud Function `sendOtpEmail` berbasis REST API Brevo SMTP (`https://api.brevo.com/v3/smtp/email`) untuk mengirimkan 6-digit OTP ke alamat email terdaftar Mitra saat mereka meminta perubahan nomor WhatsApp. Verifikasi OTP ini harus berhasil sebelum input nomor WhatsApp baru terbuka.
  - **OTP Nomor WhatsApp Baru (Sesi 2)**: Setelah verifikasi email sukses, Mitra memasukkan nomor baru dan memicu pengiriman OTP via template WhatsApp OTP (`otp_verification`) langsung ke nomor baru tersebut. Perubahan data nomor WhatsApp ke database hanya disimpan apabila verifikasi OTP WhatsApp sesi kedua ini berhasil.
- **Visual Wizard Double OTP**: Menyusun tata letak stateful (`phoneEditStep` dari `'none'`, `'security_otp'`, `'new_phone_input'`, hingga `'new_phone_otp'`) dengan box instruksi yang interaktif di `MitraProfile.tsx`.

- **Ekstraksi Berbasis AI & Vision (Edge Function)**: Menambahkan Supabase Edge Function `analyze-ktp` yang memanfaatkan model `gemini-3-flash-preview` untuk menganalisis gambar KTP langsung dari Storage (Multimodal Vision) atau teks hasil pemindaian OCR. AI secara otomatis mengoreksi typo/kesalahan baca, menyaring noise stiker laptop/tombol keyboard, menstandardisasi format data, dan memproduksi struktur JSON yang bersih.
- **Kompresi & Resizing Gambar Client-side**: Mengintegrasikan batasan dimensi maksimal 1200px (lebar/tinggi secara proporsional) pada fungsi `convertToWebP` di `adminService.ts` dan menghubungkannya pada alur unggah KTP di `MitraProfile.tsx` serta `AgentProfile.tsx`. Hal ini memotong ukuran berkas dari ~7.5MB menjadi di bawah 150KB, mengeliminasi error crash `WORKER_RESOURCE_LIMIT` (Status 546) pada Edge Function Deno karena konsumsi CPU/memori yang tinggi, sekaligus mempercepat proses upload.
- **Sistem Fallback Tangguh (Resilient Hybrid)**: Menghubungkan client-side profile Mitra dan Agen untuk memanggil API AI Edge Function terlebih dahulu. Jika terjadi kegagalan/timeout pada sisi AI, sistem secara otomatis beralih (*fallback*) ke ekstraksi Regex lokal, menjamin kelancaran UX tanpa hambatan.

### 2. Pengisian Otomatis Data Objektif KTP Cerdas Mitra & Agen (Juni 2026)
- **Melengkapi Formulir Step 2 (Verifikasi KTP)**: Memperluas panel input KTP dengan data objektif lengkap (Nama Lengkap KTP, Tempat/Tanggal Lahir, Jenis Kelamin, Agama, Pekerjaan, Status Perkawinan) secara serasi pada `MitraProfile.tsx` dan `AgentProfile.tsx`.
- **Ekstraksi Otomatis OCR**: Menyempurnakan pemrosesan hasil pindai OCR cerdas (Tesseract.js) untuk mengekstrak seluruh data tersebut secara otomatis dengan normalisasi format tanggal lahir ke format HTML date (`YYYY-MM-DD`) serta koreksi noise OCR, sehingga pengisian profil dapat terisi otomatis secara objektif dan instan.
- **Penyimpanan Terpadu**: Menghubungkan penyimpanan data profil dasar hasil verifikasi ini langsung ke tabel `users` database Supabase saat pengajuan disimpan atau dikirim.

### 2. Peningkatan Keandalan & Sistem Cerdas OCR KTP Mitra & Agen (Juni 2026)
- **Smart NIK Extractor**: Mengintegrasikan algoritma pembersih noise OCR (mengoreksi kesalahan deteksi karakter umum seperti `O` -> `0`, `I/l` -> `1`, `B` -> `8`) dan melakukan pencarian fallback multi-tingkat (pencocokan kata & baris) untuk mendeteksi 16 digit NIK secara akurat terlepas dari kualitas/posisi KTP.
- **Smart Address Builder**: Mengatur parser baris alamat KTP secara dinamis untuk mendeteksi data wilayah (RT/RW, Kelurahan, Kecamatan) dan menggabungkannya ke dalam format alamat terstruktur.

### 2. Perbaikan UX & Validasi Kolom Halaman Profil User (Juni 2026)
- **Tanda Wajib Tanggal Lahir**: Menambahkan asterisk merah `*` pada kolom "Tanggal Lahir" di [Profile.tsx](file:///c:/Users/ZHULL/Desktop/Firebase to Supabase/functions/public/pages/Profile.tsx). Kolom ini wajib diisi untuk kalkulasi syarat usia transaksi minimal 17 tahun, namun sebelumnya tidak memiliki tanda bintang merah sehingga membingungkan pengguna yang mengosongkannya.
- **Koreksi Tombol Aksi Menyesatkan**: Mengubah nama tombol di mode baca (*read-only*) dari yang sebelumnya berlabel `"Simpan Profile"` (tapi memicu aksi kembali/`onBack`) menjadi `"Kembali"`. Ini memperbaiki kekeliruan navigasi di mana pengguna menyangka profil disimpan lewat tombol tersebut.

### 2. Penyelarasan Layout OTP WhatsApp Mitra pada Desktop (Juni 2026)
- **Desain Grid Proporsional**: Mengeluarkan kontainer verifikasi OTP WhatsApp dari dalam kontainer input No. WhatsApp agar tidak merusak keselarasan kolom di desktop.
- **Penerapan `md:col-span-2`**: Menerapkan lebar penuh untuk kotak OTP di tampilan desktop sehingga membentang secara seimbang di bawah baris input Nama Lengkap dan No. WhatsApp, menghilangkan ruang kosong timpang (ompong) di bawah kolom Nama Lengkap tanpa merusak kerapian tampilan seluler yang responsif.

### 2. Integrasi Verifikasi Email untuk Upgrade Peran Pemilik Kost (Juni 2026)
- **Gerbang Keamanan Upgrade**: Mengaktifkan alur verifikasi email konfirmasi (magiclink) saat akun pencari kost (`user`) mendaftar sebagai Pemilik Kost (`owner`), sehingga role tidak diupgrade secara langsung melainkan membutuhkan persetujuan klik tautan email terlebih dahulu.
- **Kustomisasi Brevo Email**: Mengintegrasikan tipe `'magiclink'` pada Cloud Function `handleCustomAuthEmail` untuk mengirimkan email HTML premium bertema upgrade Pemilik Kost dengan subjek dan tata letak yang relevan.
- **Definisi Kirim Ulang**: Mengimplementasikan `handleResendUpgradeEmail` pada `Login.tsx` untuk mempermudah pengiriman ulang email konfirmasi apabila tidak masuk ke inbox.

### 2. Eliminasi Tombol Intip Password Ganda (Double Eye Icon) (Juni 2026)
- **Hapus Mata Bawaan Browser**: Menambahkan CSS global rule `input::-ms-reveal` dan `input::-ms-clear` di `index.css` untuk menyembunyikan ikon penampil sandi native bawaan Microsoft Edge/Windows.
- **Konsistensi Visual**: Menjaga agar hanya tombol mata kustom premium RuangSinggah yang elegan, fungsional, dan seragam tampil pada semua input kata sandi di halaman Login maupun Daftar.

### 3. Perbaikan Real-Time Banner Error Login & Pembersihan Alert Native Browser (Juni 2026)
- **Reaktivitas URL Search Params**: Mengintegrasikan hook `useSearchParams` pada `Login.tsx` dan memasukkannya ke dalam dependency list `useEffect` untuk mendeteksi perubahan parameter URL secara real-time.
- **Pesan Instan Mismatch & Blocked**: Memastikan pesan kesalahan "role mismatch" (ketika akun biasa mencoba login di portal pemilik kost) dan "akun diblokir" (blocked/banned) tampil secara instan di UI tanpa harus merefresh halaman web secara manual.
- **Penghapusan Alert Native Dialog**: Menghilangkan popup browser native (`alert()`) yang mengganggu estetika pada login sukses (pengalihan langsung secara instan) dan menggantinya dengan inline banner hijau premium pada sukses update kata sandi.

### 4. Manajemen Akun Diblokir & Otorisasi Pemulihan Akses (Unban) Admin (Juni 2026)
- **Tab Akun Diblokir**: Menambahkan tab khusus "Akun Diblokir" pada switcher halaman Manajemen Mitra di Dashboard Admin untuk mempermudah identifikasi dan monitoring akun-akun mitra/owner yang diblokir permanen.
- **Otorisasi Unban (Pulihkan Akses)**: Menyediakan tombol "Pulihkan Akses" untuk Admin guna mengaktifkan kembali akun mitra yang diblokir. Alur unban ini akan mengubah `verification_status` kembali ke `'unverified'`, mereset `rejection_count` ke `0`, dan memicu email pemberitahuan otomatis ke pengguna bahwa akses kemitraan mereka telah diaktifkan kembali.
- **Pemulihan Peran saat Unban**: Memperbaiki logika `unbanMitraRequest` agar turut memulihkan peran (`role`) pengguna kembali menjadi `'owner'` di database `users`. Sebelumnya, pengguna yang di-unban tetap terdaftar sebagai peran `'user'` biasa sehingga memicu penolakan *role mismatch* saat mencoba masuk kembali ke portal Pemilik Kost.
- **Otomatisasi Email Unbanned**: Mengintegrasikan template email premium "Akses Kemitraan Diaktifkan Kembali" pada Cloud Function `sendMitraStatusEmail` menggunakan Brevo API.

### 5. Penayangan, Penyeragaman Format Kode Referral, State Sync Global, & Penyempurnaan Wizard Edit Profil Mitra (Juni 2026)
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

### 47. Kelengkapan Informasi Verifikasi Calon Mitra di Dashboard Admin (Juni 2026)
- **Ekstraksi Field Tambahan KTP**: Memperbarui mapping pengambilan data verifikasi mitra di fungsi `getAdminMitraRequests` pada `adminService.ts` untuk menyertakan data tambahan Step 2 dari database: Jenis Kelamin (`gender`), Agama (`religion`), Pekerjaan (`occupation`), dan Status Perkawinan (`relationship_status`).
- **Visualisasi Grid Komprehensif**: Menambahkan elemen UI baru pada kartu pengajuan di komponen `MitraManagement.tsx` (Antrean Pendaftar) untuk merender Jenis Kelamin, Agama, Status Perkawinan (diterjemahkan secara rapi: "Belum Kawin" untuk `Single`, "Kawin" untuk `Menikah`), dan Pekerjaan agar dapat dicocokkan langsung oleh admin dengan dokumen KTP fisik.

### 48. Penyempurnaan Tampilan Profil, Alur Sinkronisasi Nama, Kunci Verifikasi & Proteksi Email/WA (Juni 2026)
- **Pembersihan Redundansi Tempat/Tanggal Lahir**: Menghapus input Tempat dan Tanggal Lahir dari Langkah 1 (Step 1) edit profil mitra untuk memusatkan input tersebut hanya pada Langkah 2 (Verifikasi KTP) sesuai data resmi.
- **Sinkronisasi Nama Real-time**: Menyelaraskan nama profil (Langkah 1) dengan nama di KTP (Langkah 2) menggunakan sinkronisasi state yang sama secara real-time.
- **Kunci Identitas Terverifikasi**: Menonaktifkan seluruh input identitas KTP di Langkah 2 setelah status akun calon mitra diverifikasi (`verified`) oleh Admin untuk mencegah manipulasi data pasca-acc.
- **Penguncian Email & WhatsApp OTP via Email**: Mengunci input email secara permanen (read-only) demi mencegah pengambilalihan akun secara ilegal. Apabila Mitra mengganti nomor WhatsApp, verifikasi wajib dilakukan dengan menggunakan kode OTP yang dikirimkan ke alamat email terdaftar (default) mereka.
- **Penyembunyian Data KTP Rahasia**: Menghapus seluruh visualisasi data identitas KTP resmi (Langkah 2) dari halaman profil utama read-only Mitra demi privasi dan kerahasiaan data pengguna. Halaman profil kini hanya memuat kartu data dasar & kontak.

## Rencana Selanjutnya (Future Plans)
-   Integrasi laporan keuangan otomatis berbasis transaksi Midtrans.
-   Sistem penarikan dana (payout) otomatis untuk Mitra.

### 49. Banner Campaign Referral Agen + Artikel Program (Juni 2026)
- **Artikel Kampanye Program Referral** (`Articles.tsx`): Menambahkan artikel baru dengan slug `program-referral-agen-ajak-mitra-bonus-50rb` di array `articles[]`. Artikel berisi penjelasan lengkap program referral Rp 50.000/mitra, alur kerja 4-langkah, tips argumentasi kepada pemilik kost, tips sukses lapangan, dan syarat ketentuan program.
- **Banner Campaign Fungsional** (`AgentDashboard.tsx`): Menambahkan banner bergradasi orange-amber di antara grafik "Aktivitas Survey 7 Hari Terakhir" dan section "Tanggapan Pengguna" di tab Overview. Banner memuat judul kampanye, deskripsi singkat, dan tombol navigasi "→" yang jika diklik mengarahkan ke halaman artikel penjelasan campaign.
- **Ticker Nama Mitra Referral**: Di bawah banner terdapat strip tipis oranye yang menampilkan nama pemilik kost yang sudah bergabung via kode referral agen (hanya 3 huruf awal + `***` untuk privasi). Ticker bergulir otomatis setiap 3 detik menggunakan `setInterval`. Jika belum ada referral sama sekali, strip menampilkan pesan motivasi "Belum ada mitra yang bergabung via kode referralmu — Mulai sekarang →".
- **Fetch Data Referral Dinamis**: Menambahkan query `supabase.from('users').select('name, created_at').eq('referred_by', agentReferralCode).eq('role', 'mitra')` yang dieksekusi saat agen login untuk memuat riwayat mitra yang bergabung via referral kode agen yang bersangkutan.

### 50. Fitur Buat Tagihan Manual (Manual Invoice) di Dashboard Admin (Juni 2026)
- **Komponen Baru `ManualBillManagement.tsx`**: Diletakkan di `components/admin/` sebagai komponen standalone yang menangani seluruh logika form + preview bill + print CSS.
- **3 Jenis Tagihan Didukung**:
  - **Komisi Sewa Kost**: Input nama kost, nominal sewa, dan persentase komisi. Nilai komisi dihitung secara otomatis real-time (`rentalAmount × commissionPercent / 100`). Bill menampilkan tabel khusus 4 kolom: Nama Kost | Nominal Sewa | Komisi% | Nilai Komisi.
  - **Jasa Survey**: Multi-item baris bebas (nama jasa + harga satuan + qty → subtotal otomatis).
  - **Database Kost**: Sama dengan jasa survey, multi-item baris.
- **Identitas RuangSinggah.id Jelas**: Header bill bergradasi oranye-amber menampilkan brand name, nama PT, alamat, dan kontak perusahaan.
- **Total Tagihan**: Ditampilkan bold besar di bagian bawah setiap preview bill, dihitung otomatis sesuai jenis tagihan.
- **Print ke PDF**: Tombol "🖨️ Cetak PDF" memanggil `window.print()`. CSS `@media print` yang diinjeksi langsung memastikan hanya area `#bill-print-area` yang tercetak, semua elemen lain (sidebar, form, nav) tersembunyi. Format halaman A4 dengan margin 1.5cm.
- **Preview Real-time**: Panel preview di sisi kanan merefleksikan perubahan form secara langsung tanpa submit. Auto-visible di layar desktop ≥ 1024px.
- **Nomor Bill Auto-generate**: Format `RS-BILL-YYYYMMDD-XXXX` dengan 4 digit angka acak, dihasilkan saat komponen mount. Bisa diedit manual jika perlu.
- **Integrasi Dashboard Admin**: Menu "🧾 Buat Tagihan" ditambahkan ke sidebar admin. Tipe `DashboardMenu` diperluas dengan value `'manual_bill'`. Render dikondisikan `activeMenu === 'manual_bill' && isAdmin`.

### 51. Integrasi Layanan KostManager & Landing Page Premium Mitra (Juni 2026)
- **Halaman Landing Page KostManager (`KostManagerLanding.tsx` & `/kostmanager`)**: Membuat halaman arahan premium untuk mempublikasikan seluruh keuntungan KostManager (survey gratis oleh agen lapangan, pemasaran prioritas di web dan medsos, penagihan digital otomatis). Menambahkan video demo pemutar youtube yang handal untuk semua peramban, serta menyajikan penawaran langganan Rp100.000 / tahun dan formulir pendaftaran kemitraan yang tersimpan ke tabel `mitra_requests` dengan status pending.
- **Banner Dashboard Mitra (`MitraDashboard.tsx`)**: Menyediakan banner interaktif premium bergradasi di atas tab "+ TAMBAH" pada menu "Kost Saya" yang mengarahkan Mitra secara langsung ke landing page `/kostmanager` untuk mempelajari benefit layanan.
- **Hapus Alur Onboarding Awal Form (`KostFormMitra.tsx`)**: Menghilangkan modal dialog pemilihan pengelolaan ("Bagaimana Anda ingin mengelola listing ini?") yang sebelumnya muncul saat tombol "+ TAMBAH" diklik, sehingga Mitra dapat langsung fokus mengisi 6 langkah formulir data properti secara mandiri.
- **Koreksi Media Preview**: Menata kembali struktur markup render preview untuk unggah foto baru dari galeri agar tersaji presisi.

### 52. Sinkronisasi Fitur Properti Kelolaan Portal KostManager & Desain Premium Super Admin (Juni 2026)
- **Penyelarasan Tampilan & Penghapusan Ikon Emoji**:
  - Menghapus ikon emoji pada sidebar tabs modal tambah properti KostManager (`ManagedPropertyAddModal` di `KostManagerPortal.tsx`).
  - Menyamakan tema visual tab bar dengan dashboard admin menggunakan class font dan tracking yang premium (`w-full text-left px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all`).
- **Penambahan Biaya Tambahan (Additional Fees)**:
  - Mengintegrasikan field "Biaya Tambahan" (Nama Biaya, Nominal, dan Ketentuan Penagihan) pada tab "Fasilitas & Biaya" Portal KostManager layaknya di Dashboard Admin.
- **Penyelarasan Fitur Lokasi & Kampus (Estimasi Jarak)**:
  - Menyisipkan visualisasi estimasi jarak & waktu tempuh kampus terdekat serta fasilitas publik terdekat (menggunakan Nominatim search & kalkulator estimasi waktu jalan kaki/berkendara).
- **Integrasi Tab Media & Upload Berkas**:
  - Menambahkan tab "Media" untuk multi-upload gambar utama listing (dengan drag-and-drop reordering), video tour (file local/link youtube), dan link media sosial (Instagram & TikTok).
  - Menggunakan helper `addPropertyWithMedia` dan `updatePropertyWithMedia` dari `adminService.ts` untuk memproses upload file media asli ke Supabase Storage.
- **Navigasi Anti Redirect Loop**:
  - Menghapus auto-redirect `useEffect` yang tidak perlu pada Portal KostManager sehingga tombol "⬅️ Admin Utama" dapat diklik untuk kembali ke panel admin tanpa terjebak redirect loop.
- **Integrasi Foto Kamar Kosong ke Galeri Pemasaran**:
  - Menyinkronkan foto-foto unit kamar yang diunggah pada tab "Tipe Kamar & Penghuni" ke dalam galeri pemasaran publik (`KostDetail.tsx`) secara dinamis, terbatas hanya untuk unit kamar yang tercatat berstatus kosong ("kosong") dan belum dihuni oleh penyewa.
- **Perbaikan Bug Upload Foto Ganda & Validasi WebP**:
  - Memperbaiki bug rendering upload foto kamar ganda (double images) dengan cara memperbarui `handleUploadRoomPhoto` dan `handleDeleteRoomPhoto` menggunakan mapping state non-mutating (safe React update) dan mereset nilai target input (`e.target.value = ''`).
  - Memastikan proses upload foto kamar memanfaatkan utilitas `convertToWebP` di `adminService.ts` sehingga seluruh foto unit dikonversi secara otomatis menjadi berkas format `.webp` yang ringan untuk meminimalkan beban bandwidth pemasaran.
- **Pemuatan Daftar Pemilik (Mitra) Menyeluruh**:
  - Memperbarui query pengisian `ownersList` di `KostEditModal` agar mengambil seluruh daftar pengguna ber-role `'owner'` atau `'mitra'` dari database. Ini mempermudah admin KostManager menautkan kepemilikan properti kelolaan ke mitra mana saja di RuangSinggah.id.
  - Memastikan semua properti kelolaan KostManager yang ada di database ter-load di portal dengan menambahkan pencarian `owner_uid` dari tabel `properties` secara langsung dalam `allOwnerIds` sebelum early return, sehingga data insight dapat terdata dan dipantau oleh mitra di dashboard-nya.
- **Pemisahan Listing Biasa dengan Listing KostManager**:
  - Menambahkan kolom `is_managed` (`BOOLEAN DEFAULT FALSE`) pada skema database `properties` untuk membedakan properti kelolaan KostManager dengan properti/listing biasa.
  - Memfilter properti di Portal KostManager (`KostManagerPortal.tsx` di `loadAllData`) agar **hanya memuat** properti yang memiliki `is_managed = true`. Listing biasa (self-listing mitra maupun upload admin standar) tidak akan dimunculkan lagi di dashboard KostManager.
  - Menyelaraskan komponen UI publik (`KostCard.tsx`, `KostDetail.tsx`, dan `Home.tsx` Rekomendasi Utama) agar label/badge **"Verified"** atau **"Terverifikasi"** bersifat eksklusif hanya untuk properti kelolaan KostManager (`isManaged === true`), tidak muncul untuk listing biasa.








### 53. Fitur Dropdown Cari Pemilik/Mitra Properti Kelolaan KostManager (Juni 2026)
- **Komponen Custom Searchable Dropdown**: Menggantikan dropdown `<select>` statis untuk pemilihan pemilik/mitra properti di portal KostManager (`KostManagerPortal.tsx`) dengan searchable dropdown custom.
- **Pencarian Real-time Nama & No HP**: Memungkinkan admin/pengelola untuk mengetik sebagian nama atau nomor telepon mitra pada kolom input teks filter. Daftar mitra disaring secara dinamis berdasarkan masukan kata kunci tersebut.
- **Visualisasi & Animasi Premium**: Menambahkan visualisasi state aktif/pilih, tombol reset (Clear) instan, state jika data kosong ("Tidak ada mitra yang cocok"), serta transisi CSS lembut dan scrollbar dropdown yang rapi.
- **Pencegahan Klik Luar (Click Outside)**: Menggunakan event listener mousedown global dan React Ref (`ownerDropdownRef`) untuk menutup dropdown panel secara otomatis jika pengguna mengklik di luar area dropdown.
