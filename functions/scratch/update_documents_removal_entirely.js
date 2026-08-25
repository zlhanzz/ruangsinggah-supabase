const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 1. Eliminasi Total Modul Dokumen Penghuni Kamar Terisi (Agustus 2026)
- **Penghapusan Total Dokumen Penghuni**:
  * Menghapus seluruh modul **Dokumen Penghuni** dari Langkah 2 Wizard (Data Kamar).
  * Menghapus input berkas **Bukti Bayar / Kontrak** (\`paymentProofUrl\`) secara permanen, sehingga tidak lagi meminta berkas dokumen apapun untuk mempercepat alur survei lapangan.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('Menghapus input berkas KTP dari Dokumen Penghuni.', 'Menghapus total modul Dokumen Penghuni (KTP dan Bukti Bayar / Kontrak).');
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('Menghapus card unggah Foto KTP Penghuni di panel **Dokumen Penghuni**.', 'Menghapus secara keseluruhan modul **Dokumen Penghuni** (termasuk Foto KTP dan Bukti Bayar / Kontrak).');
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');

console.log("Documents updated.");
