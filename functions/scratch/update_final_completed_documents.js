const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

// Ensure only one instance of the changes is logged
if (!prog.includes('Validasi Jumlah Kamar Berdasarkan Target Acuan')) {
  const progInsert = `### 2. Validasi Jumlah Kamar Berdasarkan Target Acuan
- **Input Total Kamar di Step 1**:
  * Menambahkan bidang **Total Jumlah Kamar** di bagian bawah tipe kost pada Wizard Step 1.
  * Mencegah navigasi ke Step 2 jika total kamar belum diisi atau kurang dari 1.
- **Validasi Kunci Progres di Step 2**:
  * Menampilkan banner real-time **Progres Pendataan Kamar (X / Y Kamar)**.
  * Menonaktifkan tombol **Tambah Kamar Baru** secara otomatis jika target kapasitas telah terpenuhi.
  * Mengunci navigasi **Lanjut ke Step 3** (menonaktifkan tombol dan mengubah label tombol menjadi "Kamar Belum Lengkap") kecuali jumlah kamar terdata sama persis dengan target acuan yang diinput di Step 1.

`;
  prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
}

prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
