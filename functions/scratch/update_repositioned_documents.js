const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 14. Pemindahan Input Hunian ke Skema Tarif (Agustus 2026)
- **Reposisi Field**:
  * Memindahkan input "Maksimal Penghuni" dan "Biaya Tambahan / Orang" dari panel Detail Kamar ke dalam panel Skema Tarif / Harga Kamar agar tata letak lebih rapi dan relevan dengan komponen harga.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
