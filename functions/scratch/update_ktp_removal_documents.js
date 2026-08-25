const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 1. Eliminasi Input Unggah KTP Penghuni Kamar Terisi (Agustus 2026)
- **Pembersihan Dokumen KTP Penghuni**:
  * Menghapus secara permanen kolom unggah **Foto KTP** (\`residentKtpUrl\`) dari modul **Dokumen Penghuni** di Langkah 2 Wizard (Data Kamar).
  * Menyederhanakan tata letak kolom menjadi satu baris penuh (\`flex flex-col gap-1\`) yang berfokus penuh hanya pada berkas **Bukti Bayar / Kontrak** saja.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('* **Informasi Penghuni Terisi (Langganan & Tagihan)**:', `* **Informasi Penghuni Terisi (Langganan & Tagihan)**:
  * Menghapus input berkas KTP dari Dokumen Penghuni.`);
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('* **Langkah 2 (Data Kamar)**:', `* **Langkah 2 (Data Kamar)**:
  * Menghapus card unggah Foto KTP Penghuni di panel **Dokumen Penghuni**.`);
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');

console.log("Documents updated.");
