const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 7. Kategori Foto Kamar Kustom & Tanpa Batas (Agustus 2026)
- **Unggah Foto Kamar Dinamis**:
  * Mengganti daftar foto kamar statis dengan opsi dinamis (photoCategories kustom) di level tipe kamar.
  * Menambahkan bidang masukan teks dan tombol "+ Foto Kamar" di bawah grid galeri pada form temporaryRoom dan rt (activeRoomIdx) untuk menambahkan kategori foto secara bebas.
  * Menyinkronkan fungsi hapus foto kustom (indeks >= 4) agar ikut membersihkan kategori penampungnya secara otomatis.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
