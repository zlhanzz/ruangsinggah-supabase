const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 4. Input Pilihan Lantai Netral di Detail Kamar Baru (Agustus 2026)
- **Netralisasi Pilihan Lantai**:
  * Menghapus pra-seleksi otomatis "Lantai 1" saat menambahkan kamar baru di Wizard Step 2.
  * Menambahkan opsi placeholder "Pilih Lantai" yang dinonaktifkan secara bawaan.
  * Memperketat validasi agar agen wajib memilih lantai secara manual sebelum input form kelanjutan terbuka secara dinamis.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
