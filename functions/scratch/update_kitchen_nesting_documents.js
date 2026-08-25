const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 10. Perbaikan Nesting Sub-Input Dapur Dalam & Filter Tag (Agustus 2026)
- **Perbaikan Peletakan & Filter**:
  * Memperbaiki kesalahan peletakan sub-input "Dapur Dalam" agar dirender di luar blok IIFE Kamar Mandi Dalam.
  * Memfilter "Dapur Dalam" agar tidak dirender sebagai tag kustom di bagian bawah.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
