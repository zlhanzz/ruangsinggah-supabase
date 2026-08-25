const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 2. Validasi Jumlah Kamar Berdasarkan Target Acuan (Agustus 2026)
- **Input Total Kamar di Step 1**:
  * Menambahkan bidang **Total Jumlah Kamar** di bagian bawah tipe kost pada Wizard Step 1.
  * Mencegah navigasi ke Step 2 jika total kamar belum diisi atau kurang dari 1.
- **Validasi Kunci Progres di Step 2**:
  * Menampilkan banner real-time **Progres Pendataan Kamar (X / Y Kamar)**.
  * Menonaktifkan tombol **Tambah Kamar Baru** secara otomatis jika target kapasitas telah terpenuhi.
  * Mengunci navigasi **Lanjut ke Step 3** (menonaktifkan tombol dan mengubah label tombol menjadi "Kamar Belum Lengkap") kecuali jumlah kamar terdata sama persis dengan target acuan yang diinput di Step 1.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('Mengintegrasikan status kamar ke dalam Detail Kamar dan merender input lain secara kondisional setelah 4 detail diisi.', 'Menambahkan acuan total jumlah kamar di Step 1 dan memvalidasi kecukupan jumlah kamar terdata sebelum lanjut ke Step 3.');
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('Menggabungkan status kamar sebagai bagian akhir dari Detail Kamar, serta menyembunyikan input tarif/fasilitas/foto hingga seluruh informasi Detail Kamar diisi.', 'Menambahkan input Total Jumlah Kamar di Step 1, serta mengunci alur Step 2 dengan progress indicator dan menolak navigasi ke Step 3 jika jumlah kamar belum sesuai target.');
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');

console.log("Documents updated.");
