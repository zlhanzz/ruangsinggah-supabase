const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 1. Reposisi Modul Dokumentasi Foto Kamar (Agustus 2026)
- **Aksesibilitas Foto Kamar**:
  * Memindahkan modul **Dokumentasi Foto Kamar** keluar dari blok kondisional kamar kosong sehingga dapat diakses dan diisi baik ketika status kamar Terisi maupun Kosong.
  * Tetap mempertahankan label dinamik **"(Opsional)"** jika status dipilih Terisi, dan **"*Wajib"** jika status dipilih Kosong.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('Mengubah status foto interior kamar menjadi (Opsional) jika status kamar dipilih Terisi.', 'Memindahkan Dokumentasi Foto Kamar keluar dari blok kondisional agar tampil untuk kamar Terisi (Opsional) dan Kosong.');
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('Mengubah label "Interior Kamar *Wajib" menjadi "Interior Kamar (Opsional)" secara dinamis saat status kamar dipilih Terisi.', 'Memindahkan modul Dokumentasi Foto Kamar keluar dari conditional block sehingga selalu muncul untuk status Terisi (Opsional) maupun Kosong.');
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');

console.log("Documents updated.");
