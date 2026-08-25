const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 9. Fitur Sub-Fasilitas Dapur Dalam (Agustus 2026)
- **Sub-Input Dapur Dalam**:
  * Menambahkan checkbox "Dapur Dalam" pada daftar fasilitas kamar utama.
  * Membuat panel isian bersarang (nested) untuk "Dapur Dalam" yang berisi checklist kelengkapan dapur standar (Kompor, Kulkas, Wastafel Cuci Piring, Kitchen Set, Dispenser) dan input teks tambah kelengkapan kustom secara dinamis.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
