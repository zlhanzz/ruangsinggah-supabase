const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 1. Rekonstruksi Alur Input Detail & Status Kamar (Agustus 2026)
- **Integrasi Status Kamar**:
  * Memindahkan bidang pilihan **Status Kamar** (Terisi / Kosong) menjadi bagian input terakhir di dalam kartu **Detail Kamar** (di bawah Tipe Kamar).
  * Menghapus tampilan pembuka yang memisahkannya secara independen di bagian atas.
- **Tahapan Progresif Form**:
  * Saat pertama kali menambahkan kamar baru, sistem hanya akan merender kartu **Detail Kamar** saja (Nomor, Lantai, Tipe, Status).
  * Bidang input berikutnya (Tarif, Fasilitas, Foto, Informasi Penghuni) disembunyikan seluruhnya dan baru akan dimunculkan setelah keempat komponen di dalam Detail Kamar terisi lengkap.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

// 2. Update IMPLEMENTATION_PLAN.md
const planFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\IMPLEMENTATION_PLAN.md';
let plan = fs.readFileSync(planFile, 'utf8');
plan = plan.replace(/\r\n/g, '\n');
plan = plan.replace('Memindahkan Dokumentasi Foto Kamar keluar dari blok kondisional agar tampil untuk kamar Terisi (Opsional) dan Kosong.', 'Mengintegrasikan status kamar ke dalam Detail Kamar dan merender input lain secara kondisional setelah 4 detail diisi.');
plan = plan.replace(/\n/g, '\r\n');
fs.writeFileSync(planFile, plan, 'utf8');

// 3. Update WALKTHROUGH.md
const walkthroughFile = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\WALKTHROUGH.md';
let walk = fs.readFileSync(walkthroughFile, 'utf8');
walk = walk.replace(/\r\n/g, '\n');
walk = walk.replace('Memindahkan modul Dokumentasi Foto Kamar keluar dari conditional block sehingga selalu muncul untuk status Terisi (Opsional) maupun Kosong.', 'Menggabungkan status kamar sebagai bagian akhir dari Detail Kamar, serta menyembunyikan input tarif/fasilitas/foto hingga seluruh informasi Detail Kamar diisi.');
walk = walk.replace(/\n/g, '\r\n');
fs.writeFileSync(walkthroughFile, walk, 'utf8');

console.log("Documents updated.");
