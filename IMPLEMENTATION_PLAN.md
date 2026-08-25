# IMPLEMENTATION PLAN

Dokumen ini menjelaskan rencana analisis, dampak perubahan, langkah-langkah, dan verifikasi untuk penanganan error konsol RLS, pemulihan antarmuka kustom (UI/UX) yang tereset, pembuatan peringatan peninjauan ulang untuk migrasi mitra, dan segmented switcher premium untuk pilihan kosongan.

---

## 1. Analisis Masalah
1. **Reset UI/UX Kustom**: Perubahan antarmuka kustom hilang karena berkas dasar sempat tereset kembali ke keadaan aslinya. Perlu pemulihan kronologis dari naskah perbaikan yang ada.
2. **Error Konsol UUID "undefined"**: Row Level Security (RLS) pada tabel `properties` dan `kostmanager_requests` menghalangi query join yang dilakukan oleh agen survey, menghasilkan nilai `null` pada data transaksi dan memicu UUID `undefined` di antarmuka.
3. **Peringatan Peninjauan Ulang Properti**: Untuk kasus migrasi properti mitra biasa lama menjadi KostManager, diperlukan pop-up instruktif yang mewajibkan agen melakukan konfirmasi ulang atas kesesuaian data lapangan sebelum masuk ke dalam form.
4. **Segmented Switcher Premium Kosongan**: Masukan kosongan berupa checkbox standar terasa kaku dan kurang premium. Perlu diganti dengan tombol geser/segmented pill premium (Kosongan vs Furnished) yang secara dinamis me-lock fasilitas standar kamar.

---

## 2. Dampak Perubahan
1. **`AgentDashboard.tsx`**: Modifikasi state modal, penambahan modal dialog peninjauan, integrasi segmented switcher pada form data kamar (baik untuk input kamar baru maupun editor kamar aktif), dan penggantian aksi tutup modal.
2. **`KostManagerLanding.tsx`**: Pembenahan inisialisasi link maps dan koordinat default agar langsung terisi otomatis sesuai dengan pilihan properti pertama mitra.
3. **Skema Database (RLS)**: Tambahan kueri kebijakan RLS baru untuk tabel properti dan permohonan agar agen dapat membaca draft.

---

## 3. Langkah-Langkah Eksekusi
1. Jalankan naskah regenerasi kronologis `reapply_all_changes_chronologically.js` untuk memulihkan seluruh fitur antarmuka kustom sebelumnya.
2. Jalankan naskah `apply_warning_popup_v7.js` untuk menyematkan dialog peninjauan ulang bermigrasi di editor.
3. Jalankan naskah `apply_segmented_kosongan_v5.js` untuk menerapkan UI pill switcher kosongan premium di editor kamar.
4. Validasi hasil penggabungan dan perbaiki error parsing tag penutup JSX.
5. Lakukan uji coba build produksi menggunakan Vite untuk memastikan tidak ada kesalahan kompilasi.

---

## 4. Rencana Verifikasi
1. **Kompilasi Sukses**: Memastikan command `npm run build` selesai dengan exit code 0.
2. **RLS Policy Execution**: Memastikan kueri SQL kebijakan di `add_policy.sql` siap digunakan untuk menghilangkan kegagalan fetch di konsol browser.
3. **Pill Switcher & Lock Logic**: Memverifikasi secara visual lock opacity (40%) dan status checked=false pada properti kasur, lemari, meja, AC, kipas, dan water heater ketika mode "Kosongan" aktif.
