const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

// Clear previously duplicated lists if any
prog = prog.replace(`### 2. Validasi Jumlah Kamar Berdasarkan Target Acuan (Agustus 2026)`, `### 2. Validasi Jumlah Kamar Berdasarkan Target Acuan`);
prog = prog.replace(`### 1. Rekonstruksi Alur Input Detail & Status Kamar (Agustus 2026)`, `### 1. Rekonstruksi Alur Input Detail & Status Kamar`);

prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
