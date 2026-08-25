const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 13. Input Maksimal Penghuni & Biaya Tambahan (Agustus 2026)
- **Maksimal Penghuni & Biaya Tambahan**:
  * Menambahkan input "Maksimal Penghuni" (type="number") dan "Biaya Tambahan / Orang" (type="text" dengan format ribuan otomatis) di dalam panel Detail Kamar pada form temporaryRoom maupun activeRoomIdx.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
