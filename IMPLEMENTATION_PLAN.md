# IMPLEMENTATION PLAN: Notifikasi Email ke Admin untuk Pesan Masuk Properti KostManager

## 1. Analisis Kebutuhan & Konteks Alur
- **Kebutuhan**:
  Ketika ada pesan chat masuk dari calon penghuni / penyewa ke properti yang berstatus dikelola secara **KostManager**, sistem harus mengirimkan notifikasi email secara otomatis ke Administrator RuangSinggah.
- **Tujuan**:
  Memastikan tim KostManager dapat merespons pertanyaan calon penyewa secara cepat (*fast response*) melalui Portal KostManager tanpa harus terus-menerus membuka layar chat, sehingga tingkat konversi sewa kamar meningkat.
- **Kondisi & Logika Bisnis**:
  1. **Identifikasi Properti KostManager**:
     - Memeriksa apakah properti tujuan terdaftar sebagai KostManager (`managed_by === 'kostmanager'`, `is_managed === true`, atau `session.owner_id === SYSTEM_ADMIN_ID`).
  2. **Pengirim Pesan**:
     - Notifikasi email hanya dipicu saat pengirim adalah penyewa/calon penghuni (`senderType === 'user'`).
     - Balasan dari Admin/CS (`senderType === 'owner'`) tidak memicu notifikasi email ke admin.
  3. **Penerima & Format Email**:
     - Email dikirim ke seluruh Administrator terdaftar (dengan fallback `sulhan77777@gmail.com`) via FormSubmit.
     - Memuat informasi lengkap: Nama Properti, Lokasi/Kota, Nama Calon Penghuni, Email & No. HP pengirim, Cuplikan Pesan, Waktu Pesan, serta tautan langsung ke sesi chat di Portal KostManager Admin.

---

## 2. Dampak Perubahan File
Daftar file yang akan disentuh pada Fase 2:
1. **`functions/public/emailService.ts`**:
   - Memperkaya fungsi `notifyAdminNewChatMessage` dengan data pengirim (email, no. telepon, alamat kost, dan tautan langsung ke sesi chat).
2. **`functions/public/chatService.ts`**:
   - Memperketat deteksi properti KostManager saat pesan dikirim (`sendMessage`).
   - Mengambil data profil pengirim (nama, email, no. telepon) dari tabel `users` untuk menyusun payload email yang informatif.
   - Memicu pengiriman email `notifyAdminNewChatMessage` secara asinkron (non-blocking) agar proses kirim pesan di chat tetap instan (0ms delay).
3. **`functions/public/pages/KostDetail.tsx`**:
   - Memastikan deteksi kelolaan KostManager (`managed_by === 'kostmanager'`) saat inisialisasi sesi chat mengarahkan `targetOwnerId` ke `SYSTEM_ADMIN_ID`.
4. **`functions/PROGRESS.md`**:
   - Pencatatan riwayat progres fitur selesai (nomor 329).
5. **`WALKTHROUGH.md`**:
   - Dokumentasi rincian perubahan dan panduan verifikasi pengujian.

---

## 3. Langkah-Langkah Eksekusi (Fase 2 Setelah di-ACC)
1. **Langkah 1: Update `emailService.ts`**:
   - Memperbarui `notifyAdminNewChatMessage` agar menyusun payload email yang lebih informatif dan terstruktur.
2. **Langkah 2: Update `chatService.ts`**:
   - Mengoptimalkan logika pengecekan status KostManager pada `sendMessage`.
   - Mengintegrasikan pengambilan identitas pengirim (nama, email, no_hp) dan memanggil `notifyAdminNewChatMessage`.
3. **Langkah 3: Sinkronisasi di `KostDetail.tsx`**:
   - Menyelaraskan filter `isKostManagerManaged` agar mencakup `managed_by === 'kostmanager'`.
4. **Langkah 4: Kompilasi & Pengujian Build**:
   - Menjalankan `cmd /c npm run build` pada `functions/public` untuk memastikan 0 error kompilasi.
5. **Langkah 5: Pencatatan Progres & Walkthrough**:
   - Menambahkan catatan ke `functions/PROGRESS.md` dan menerbitkan `WALKTHROUGH.md`.
6. **Langkah 6: Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 4. Rencana Verifikasi
1. **Uji Kompilasi**:
   - Menjalankan `npm run build` di `functions/public` dan `tsc` di `functions`.
2. **Uji Simulasi Alur Chat**:
   - Mensimulasikan pengiriman pesan dari halaman detail properti KostManager (`senderType: 'user'`).
   - Memastikan `notifyAdminNewChatMessage` terpanggil dengan parameter yang tepat dan log pengiriman FormSubmit berhasil.
