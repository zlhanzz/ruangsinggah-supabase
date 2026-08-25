const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 1. Dokumentasi Foto Kamar Opsional untuk Kamar Terisi (Agustus 2026)
- **Visualisasi Dinamis Status Foto Kamar**:
  * Mengubah label "Interior Kamar *Wajib" menjadi **"Interior Kamar (Opsional)"** secara dinamis khusus ketika status kamar dipilih sebagai **Terisi**.
  * Memperbarui deskripsi pembantu (helper text) secara kondisional agar menginformasikan agen bahwa pemotretan kamar bersifat opsional dan hanya dilakukan jika pemilik/penghuni berkenan.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('* **Informasi Penghuni Terisi (Langganan & Tagihan)**:', `* **Informasi Penghuni Terisi (Langganan & Tagihan)**:
  * Mengubah status foto interior kamar menjadi (Opsional) jika status kamar dipilih Terisi.`);
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('* **Langkah 2 (Data Kamar)**:', `* **Langkah 2 (Data Kamar)**:
  * Mengubah label "Interior Kamar *Wajib" menjadi "Interior Kamar (Opsional)" secara dinamis saat status kamar dipilih Terisi.`);
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');

console.log("Documents updated.");
