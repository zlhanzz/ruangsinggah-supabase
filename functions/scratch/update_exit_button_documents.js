const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 3. Penggantian Tombol Simpan Draft menjadi Keluar & Auto-Save (Agustus 2026)
- **Tombol Keluar**:
  * Mengganti label tombol "Simpan Draft" di Wizard Step 1 menjadi "Keluar".
  * Draft tersimpan secara otomatis di sisi klien (localStorage) dan akan langsung terhapus saat data berhasil dikirim. Hal ini memastikan penyimpanan bersifat sementara dan tidak membebani database utama.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
