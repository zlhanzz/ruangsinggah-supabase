const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 6. Penghapusan Bidang Tanggal Kamar Siap Huni (Agustus 2026)
- **Penghapusan readyDate**:
  * Menghapus input "Tanggal Kamar Siap Huni" (readyDate) sepenuhnya karena status kamar kosong langsung dianggap siap dihuni saat didata.
  * Menyesuaikan nama kontainer pada editor kamar aktif menjadi "Harga Sewa Kamar".

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
