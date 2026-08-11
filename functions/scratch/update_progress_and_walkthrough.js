const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 1. Sistem Manajemen Langganan & Tagihan Penghuni Wizard (Agustus 2026)
- **Dropdown Jenis Langganan Dinamis**:
  * Menambahkan dropdown pilihan **Jenis Langganan** pada bagian **Informasi Penghuni** (khusus kamar dengan status Terisi).
  * Opsi pilihan jenis langganan dimuat secara dinamis mencocokkan skema tarif/harga kamar yang telah ditentukan di atas (seperti Bulanan, Tahunan, dll).
- **Label Tanggal & Tagihan Baru**:
  * Mengubah label **Mulai Masuk** menjadi **Tanggal Masuk** agar lebih presisi.
  * Mengubah label **Selesai Sewa** menjadi **Tagihan Berikutnya** untuk mengakomodasi alur billing berlangganan bergulir yang tepat.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');
console.log("PROGRESS.md updated.");

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('* **Fasilitas WC Umum Properti (Nested & Custom)**:', `* **Informasi Penghuni Terisi (Langganan & Tagihan)**:
  * Menambahkan dropdown **Jenis Langganan** yang memuat opsi dinamis dari skema tarif yang ditentukan di atas.
  * Mengubah label **Mulai Masuk** menjadi **Tanggal Masuk** dan **Selesai Sewa** menjadi **Tagihan Berikutnya**.
* **Fasilitas WC Umum Properti (Nested & Custom)**:`);
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');
console.log("IMPLEMENTATION_PLAN.md updated.");

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('* **Langkah 2 (Data Kamar)**:', `* **Langkah 2 (Data Kamar)**:
  * Menambahkan dropdown **Jenis Langganan** di panel **Informasi Penghuni** (khusus kamar Terisi), yang isinya mengambil secara dinamis skema tarif yang terdaftar di atas.
  * Mengubah label input tanggal dari **Mulai Masuk** & **Selesai Sewa** menjadi **Tanggal Masuk** & **Tagihan Berikutnya**.`);
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');
console.log("WALKTHROUGH.md updated.");
