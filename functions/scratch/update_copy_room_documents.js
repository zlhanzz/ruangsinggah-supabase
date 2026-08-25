const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 5. Fitur Salin Konfigurasi Kamar (Agustus 2026)
- **Kloning Data Kamar**:
  * Menambahkan dropdown pembantu di bagian atas input lanjutan untuk menyalin konfigurasi dari kamar lain yang sudah terdaftar.
  * Fitur ini menyalin skema harga (price & pricing) serta semua fasilitas kamar/kamar mandi guna menghindari pengisian manual yang berulang.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
