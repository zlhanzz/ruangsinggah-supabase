# WALKTHROUGH: Implementasi Contextual Action Slot, Proteksi Lapor Kendala Kamar, & Penyelarasan Durasi Sewa (Milestone #492)

Dokumen ini merangkum penyelesaian implementasi siklus pra-check-in hunian pada halaman Orders / Kost Saya (`functions/public/pages/MyKost.tsx`).

---

## 1. Ringkasan Perubahan

Sesuai dengan instruksi dan standar industri (*Airbnb / Traveloka Single Primary Contextual CTA Pattern*):
1. **Penguncian Fitur Lapor Kendala Kamar**:
   - Fitur "Lapor Kendala Kamar" dinonaktifkan (`disabled`) secara visual dan logis selama penyewa belum melakukan serah terima kunci (`!isHandoverDone`).
   - Tombol menampilkan styling disabled (`bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-70`) dan dilengkapi teks panduan subheader: *"SELESAIKAN TERIMA KUNCI TERLEBIH DAHULU"*.
   - Fungsi `handleOpenComplaint` diproteksi dengan guard modal agar tidak dapat ditembus via trigger apa pun sebelum serah terima kunci selesai.
2. **Contextual Alternating Action Slot (Satu Tombol yang Bergantian, Bukan Terpisah)**:
   - Menghapus duplikasi tombol pada banner informasi masuk kost. Banner kini murni informatif dan menampilkan badge ringkas (*"Masuk dlm N Hari"* atau *"Menunggu ACC Masuk Tgl ..."*).
   - Sidebar kartu pesanan kini memiliki satu slot aksi kontekstual yang bergantian secara dinamis:
     - **Sebelum Hari H (`isUpcoming = true` & `!isHandoverDone`)**: Menampilkan tombol primer **`[⚡ JADWALKAN LEBIH CEPAT]`** (atau status menunggu persetujuan mitra jika sudah diajukan). Tombol *"Terima Kunci & Masuk"* tidak ditampilkan.
     - **Pada Hari H Masuk (`isUpcoming = false` & `!isHandoverDone`)**: Tombol primer secara otomatis berganti menjadi **`[✓ TERIMA KUNCI & MASUK]`**. Tombol *"Jadwalkan Lebih Cepat"* tidak ditampilkan.
     - **Setelah Serah Terima Kunci (`isHandoverDone = true`)**: Kedua tombol pra-masuk menghilang, kartu beralih ke masa sewa aktif (*KUNCI DITERIMA*), dan tombol "Lapor Kendala Kamar" terbuka aktif.
3. **Penyelarasan Durasi & Tanggal Selesai Sewa**:
   - `mapResidentStatus` kini memprioritaskan metadata durasi sewa yang disepakati (`r.metadata?.endDate || r.end_date`).
   - Data resident record sewa Kost Ryuta pada Supabase telah diselaraskan ke tanggal selesai sewa yang presisi (10 Desember 2026, 1 bulan penuh).

---

## 2. File yang Dimodifikasi

| File | Komponen / Bagian | Deskripsi Perubahan |
| :--- | :--- | :--- |
| `functions/public/pages/MyKost.tsx` | `handleOpenComplaint` | Guard proteksi: mencegah pembukaan modal komplain jika `!isCheckedIn` |
| `functions/public/pages/MyKost.tsx` | Status Banner Pra-Masuk | Menjadikan banner murni informatif tanpa tombol duplikat |
| `functions/public/pages/MyKost.tsx` | Sidebar Action Slot | Menerapkan slot tombol bergantian (*Jadwalkan Lebih Cepat* vs *Terima Kunci & Masuk*) |
| `functions/public/pages/MyKost.tsx` | Tombol Lapor Kendala Kamar | Menambahkan status `disabled={!isHandoverDone}` dan teks keterangan subheader |
| `functions/public/pages/MyKost.tsx` | `mapResidentStatus` | Sinkronisasi `endDate: r.metadata?.endDate \|\| r.end_date` |
| `functions/PROGRESS.md` | Milestone #492 | Dokumentasi riwayat perkembangan fitur anti-amnesia |

---

## 3. Hasil Pengujian & Verifikasi

### A. Uji Kompilasi Build Frontend (Vite & TypeScript)
Perintah:
```powershell
npm.cmd --prefix functions/public run build
```
Hasil:
- ✓ **2512 modul ter-compile sempurna tanpa error (0 error)**.
- Bundle `MyKost-CTSx8tth.js` dan seluruh asset ter-generate dengan sukses.

### B. Simulasi Siklus Status & Tombol Kontekstual

```mermaid
stateDiagram-v2
    [*] --> MenungguMasuk: Pembayaran Lunas (H-N)
    state MenungguMasuk {
        Banner: Menunggu Tanggal Masuk (Masuk dlm N Hari)
        TombolAksi: [⚡ JADWALKAN LEBIH CEPAT]
        LaporKendala: Terkunci (Selesaikan terima kunci terlebih dahulu)
    }
    
    MenungguMasuk --> HariHTiba: Tanggal Masuk Tiba (today >= startDate)
    state HariHTiba {
        Banner: Hari Masuk Kost Telah Tiba! Siap Check-in
        TombolAksi: [✓ TERIMA KUNCI & MASUK]
        LaporKendala: Terkunci (Selesaikan terima kunci terlebih dahulu)
    }
    
    HariHTiba --> SewaAktif: Klik Terima Kunci & Masuk
    state SewaAktif {
        Banner: Masa Sewa Berjalan (KUNCI DITERIMA)
        TombolAksi: [Perpanjang Sewa] (H-7)
        LaporKendala: Terbuka & Aktif
    }
```

---

## 4. Panduan Verifikasi bagi Pengguna

1. Buka browser dan arahkan ke menu **Orders** (`/my-bookings`).
2. Perhatikan kartu sewa kost yang berstatus menunggu tanggal masuk:
   - **Banner Atas**: Hanya menampilkan informasi tanggal masuk dan badge countdown (misal: *"Masuk dlm 6 Hari"*). Tidak ada lagi tombol *"Jadwalkan Lebih Cepat"* yang menumpuk di banner.
   - **Tombol Aksi**: Di sidebar kartu aksi, kini muncul tombol tunggal yang jelas: **`[⚡ JADWALKAN LEBIH CEPAT]`**.
   - **Tombol Terima Kunci**: Tombol *"Terima Kunci & Masuk"* tidak muncul di layar karena belum tiba hari H masuk.
   - **Tombol Lapor Kendala Kamar**: Tampil berwarna abu-abu dengan status *disabled* serta subteks: *"SELESAIKAN TERIMA KUNCI TERLEBIH DAHULU"*. Jika disentuh, muncul peringatan ramah bahwa kunci harus diterima terlebih dahulu.
3. Ketika hari H masuk tiba (atau tanggal dimajukan):
   - Tombol secara otomatis berganti menjadi **`[✓ TERIMA KUNCI & MASUK]`**.
   - Setelah tombol tersebut diklik dan konfirmasi serah terima kunci dilakukan, status beralih menjadi sewa berjalan aktif dan tombol "Lapor Kendala Kamar" langsung dapat digunakan.
