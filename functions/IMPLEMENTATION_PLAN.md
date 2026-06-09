# IMPLEMENTATION PLAN - Perbaikan Layout Dompet/Wallet (Responsive Overflow - Tahap 2)

Rencana ini dibuat untuk memperbaiki masalah horizontal overflow pada menu Dompet secara tuntas dengan menyetel flex item truncation yang benar dan membatasi lebar main content area.

## 1. Analisis Masalah
- **Penyebab Layout Melar (Horizontal Overflow)**:
  - Pada baris transaksi, tag `<p className="text-xs font-black text-gray-900 flex items-center gap-1.5 truncate">` disetel sebagai flex container (`flex`). 
  - Di dalam flexbox, kelas `truncate` pada parent flex tidak berfungsi, dan child `<span>` yang berisi URL panjang tidak akan terpotong (truncate) karena parent `<p>` tidak memiliki properti `min-w-0`.
  - Hal ini memaksa elemen baris transaksi melebar melebihi layar ponsel dan merusak seluruh grid halaman.
- **Solusi**:
  - Tambahkan properti `min-w-0` pada tag `<p>` flex container transaksi.
  - Setel `flex-1 truncate` pada tag `<span>` yang membungkus `tx.title` agar text panjang (URL) terpotong dengan benar.
  - Tambahkan `min-w-0 overflow-x-hidden` pada elemen `<main>` di `AgentDashboard.tsx` sebagai jaring pengaman agar layout halaman tidak akan pernah bisa melar secara horizontal pada layar ponsel.

## 2. Dampak Perubahan
File yang akan disentuh:
1. `functions/public/pages/AgentDashboard.tsx` (Update main wrapper classes dan class inline pada transaksi).

## 3. Langkah-Langkah Eksekusi
1. **Modifikasi `AgentDashboard.tsx`**:
   - Di bagian `renderWallet`, ubah baris penulisan judul transaksi agar menggunakan `min-w-0` pada flex parent `<p>` dan `flex-1 truncate` pada `<span>` judul.
   - Di bagian bawah file pada render elemen `<main>`, ubah kelasnya menjadi `flex-1 p-4 lg:p-8 pb-32 min-w-0 overflow-x-hidden`.
2. **Verifikasi & Build**:
   - Jalankan `npm run build` untuk memvalidasi keberhasilan kompilasi.

## 4. Rencana Verifikasi
- Memastikan build berhasil tanpa kesalahan kompilasi.
- Buka dashboard agen pada menu Dompet di simulator mobile dan pastikan seluruh kolom, tombol tab, dan daftar transaksi fit dengan lebar layar secara sempurna tanpa ada scroll horizontal.
