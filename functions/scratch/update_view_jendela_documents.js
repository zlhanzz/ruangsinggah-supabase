const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 8. Perubahan Kategori Foto Utama: Tempat Tidur (Agustus 2026)
- **Penggantian Kategori**:
  * Mengganti nama kategori bawaan ketiga dari "View / Jendela" menjadi "Tempat Tidur" di seluruh setelan fallback uploader foto kamar.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
