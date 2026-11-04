# IMPLEMENTATION PLAN: Pemformatan Standar Tanggal Indonesia pada Modal "Ajukan Check-in Lebih Awal" (`MyKost.tsx`)

Dokumen ini disusun sebagai **Fase 1: Perencanaan & Pengajuan** sesuai dengan Protokol Kerja Workspace RuangSinggah.

---

## 1. Analisis Masalah / Kebutuhan Pengguna

### Konteks & Permasalahan
Berdasarkan tangkapan layar yang dilampirkan pengguna (`media_1793777368645_e5fcae14.png`):
- Pada modal **"AJUKAN CHECK-IN LEBIH AWAL"**, field input untuk **"RENCANA TANGGAL MASUK BARU (LEBIH AWAL)"** saat ini menggunakan elemen standar HTML `<input type="date">` polos tanpa format presentasi kustom.
- Akibatnya, pada browser/sistem pengguna dengan locale bawaan `en-US`, nilai tanggal dirender menjadi **`11/04/2026`** (format `MM/DD/YYYY`).
- Hal ini menimbulkan ambiguitas kritis bagi pengguna Indonesia:
  1. Pengguna dapat salah mengartikan `11/04/2026` sebagai tanggal 11 April 2026 (format DD/MM/YYYY) atau format US yang membingungkan.
  2. Kontras dengan kotak informasi di atasnya yang menampilkan format baku Indonesia: *"Tanggal masuk awal Anda adalah 10 November 2026"*, sehingga tampilan input terasa tidak konsisten (*inconsistent UI*).
- Pengguna memberikan instruksi tegas: **"perbaiki format tanggalnya"**.

---

## 2. Komparasi & Evaluasi Standar Industri Objektif (Anti-Bias Konfirmasi)

Mengacu pada **Pasal 8 Protokol Kerja Workspace**, berikut analisis evaluasi objektif atas pendekatan perbaikan:

| Dimensi Evaluasi | Kondisi Saat Ini (Existing) | Solusi yang Direncanakan (Proposed) | Klasifikasi Standar Industri | Alasan Teknis & Rekomendasi |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend & UI/UX Presentation** | Menggunakan raw `<input type="date">` polos yang merender string `11/04/2026` tergantung setting OS/browser client. | Menggunakan **Locale-Aware Hybrid Date Picker UI**: Menampilkan teks tanggal Indonesia terformat baku (`04 November 2026` + nama hari `Rabu`) dengan ikon kalender dan live helper badge (*"Maju 6 hari lebih cepat"*). | 🚀 **Lebih Maju dari Standar Industri (*Ahead of Industry Standard*)** | Menghilangkan 100% ketergantungan pada preferensi bahasa OS browser client, menyajikan teks format Indonesia yang elegan sekaligus memberikan feedback kalkulasi selisih hari instan layaknya platform OTA tier-1. |
| **Cross-Platform Compatibility** | Mengandalkan UI native browser yang berbeda-beda bentuknya di Windows/macOS/Android/iOS. | Menggunakan overlay transparan (`opacity-0 absolute inset-0`) di atas komponen visual: User tetap mendapatkan picker native bawaan HP/OS tanpa visual glitch raw format. | 🌟 **Setara Standar Industri (*Industry Standard*)** | Pola standar yang digunakan Traveloka & Airbnb Web Mobile untuk mempertahankan performa date picker native perangkat tanpa merusak konsistensi desain visual aplikasi. |
| **Data Integrity & Backend Contract** | Menyimpan format ISO `YYYY-MM-DD` ke state `earlyCheckInDate`. | Mempertahankan state `earlyCheckInDate` tetap dalam format ISO `YYYY-MM-DD` untuk komunikasi API/Supabase. | 🌟 **Setara Standar Industri (*Industry Standard*)** | Pemisahan tegas (*separation of concerns*) antara format visual (*presentation layer*) dan format ISO (*data transfer layer*). |
| **Pencegahan Human Error & Safety** | Tidak ada indikator visual selisih hari; hanya field input tanggal biasa. | Dilengkapi *Live Dynamic Context Badge* yang otomatis menghitung selisih hari terhadap jadwal awal (`diffDays`). | 🚀 **Lebih Maju dari Standar Industri (*Ahead of Industry Standard*)** | Mencegah penyewa salah memilih tanggal yang tidak disengaja (misal memilih hari yang sama atau tanggal yang lebih mundur). |

---

## 3. Dampak Perubahan (Affected Files)

Modifikasi difokuskan secara presisi pada modal pengajuan check-in lebih awal:
1. **`functions/public/pages/MyKost.tsx`**:
   - Merombak visual input tanggal pada modal `showEarlyCheckInModal` (sekitar baris 6096–6108).
   - Menambahkan visual display box berformat Indonesia baku (`FORMAT_DATE(earlyCheckInDate)` dan nama hari).
   - Memasang transparent overlay input picker agar tetap kompatibel dengan native device picker.
   - Menambahkan *Live Calculation Helper* selisih hari terhadap `selectedKost.moveInDate`.
2. **`functions/PROGRESS.md`**: Pencatatan riwayat Milestone #493.
3. **`WALKTHROUGH.md`**: Laporan verifikasi dan panduan pengujian setelah eksekusi.

---

## 4. Langkah-Langkah Eksekusi (Fase 2)

Setelah rencana ini disetujui (*ACC*) oleh pengguna:

1. **Implementasi UI Komponen Date Picker Berformat Indonesia di `MyKost.tsx`**:
   - Mengubah blok input tanggal di baris 6096–6108 menjadi komponen input berbasis kontainer kustom:
     - Tampilan utama menampilkan: Ikon `<Calendar className="w-4 h-4 text-amber-600" />`, tanggal terformat baku (*e.g.* `04 November 2026`), subteks hari (*e.g.* `Rabu`), dan badge interaksi *"Ubah ▾"*.
     - Lapisan input native `<input type="date">` diletakkan transparan secara absolut (`opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10`), menjaga batasan `min` (hari ini) dan `max` (tanggal masuk awal).
     - Menambahkan ringkasan kalkulasi dinamis: Jika dipilih tanggal 4 Nov 2026 sedangkan jadwal awal 10 Nov 2026, sistem menampilkan: *"⚡ Masuk 6 hari lebih cepat dari jadwal awal (10 November 2026)"*.
2. **Uji Kompilasi Front-End**:
   - Menjalankan `npm.cmd --prefix functions/public run build` untuk memastikan 0 error kompilasi TypeScript / Vite.
3. **Pencatatan Riwayat Progres**:
   - Mencatat Milestone #493 ke dalam `functions/PROGRESS.md`.
4. **Penerbitan Dokumen Walkthrough**:
   - Menyajikan `WALKTHROUGH.md` lengkap dengan bukti pengujian.
5. **Git Commit & Push**:
   - Melakukan commit dan push ke branch `bukan-productions`.

---

## 5. Rencana Verifikasi

1. **Uji Visual & Format Tanggal**:
   - Membuka modal "Ajukan Check-in Lebih Awal".
   - Memastikan tidak ada lagi teks mentah `11/04/2026`.
   - Memastikan tanggal tampil dalam Bahasa Indonesia yang elegan: `04 November 2026` lengkap dengan keterangan hari (`Rabu`).
2. **Uji Interaksi & Pemilihan Tanggal**:
   - Mengetuk/mengklik kontainer tanggal: dialog kalender native terbuka normal.
   - Memilih tanggal baru (misal tanggal 6 November 2026): visual tanggal langsung terupdate instan menjadi `06 November 2026` dan kalkulasi *"Masuk 4 hari lebih cepat"* muncul otomatis.
3. **Uji Pengiriman Data**:
   - Menekan tombol "Kirim Permintaan": Memastikan payload `early_checkin_proposed_date` tetap terkirim dalam format ISO `YYYY-MM-DD` yang valid ke Supabase.
