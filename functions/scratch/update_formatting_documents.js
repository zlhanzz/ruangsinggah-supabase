const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 12. Pemformatan Ribuan Input Harga Sewa (Agustus 2026)
- **Ribuan Separator Dot**:
  * Menambahkan helper formatThousand dan parseThousand untuk memformat masukan angka desimal/bulat dengan pemisah ribuan titik (dot separator).
  * Mengubah tipe masukan input harga skema tarif bulanan, mingguan, harian, dll. dari type="number" menjadi type="text" dengan pemformat otomatis secara langsung pada formulir.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
