const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 1. Sistem Pencatatan Status Lunas/Sisa Tagihan Penghuni (Agustus 2026)
- **Status Pembayaran (Lunas / Belum Lunas)**:
  * Menambahkan tombol toggle pilihan **Status Pembayaran** (Lunas / Belum Lunas) di bagian **Informasi Penghuni** (Langkah 2).
  * Jika status dipilih **Lunas**, sistem akan memproses penagihan di masa depan berdasarkan **Tagihan Berikutnya**.
  * Jika status dipilih **Belum Lunas**, sistem memicu kemunculan input angka **Sisa Tagihan (Rp)** secara kondisional agar tagihan baru dengan nominal sisa tersebut langsung diterbitkan ke penghuni saat ini.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('* **Informasi Penghuni Terisi (Langganan & Tagihan)**:', `* **Informasi Penghuni Terisi (Langganan & Tagihan)**:
  * Menambahkan toggle **Status Pembayaran** (Lunas vs Belum Lunas).
  * Jika **Belum Lunas**, memunculkan input angka kustom **Sisa Tagihan (Rp)**.`);
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('* **Langkah 2 (Data Kamar)**:', `* **Langkah 2 (Data Kamar)**:
  * Menambahkan tombol penentu status pembayaran (Lunas vs Belum Lunas) di panel **Informasi Penghuni** (khusus kamar Terisi).
  * Menampilkan input angka **Sisa Tagihan (Rp)** secara kondisional bila status pembayaran di-set Belum Lunas.`);
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');

console.log("Documents updated.");
