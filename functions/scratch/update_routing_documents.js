const fs = require('fs');
const path = require('path');

// 1. Update PROGRESS.md
const progressFile = path.join(__dirname, '../PROGRESS.md');
let prog = fs.readFileSync(progressFile, 'utf8');
prog = prog.replace(/\r\n/g, '\n');

const progInsert = `### 11. Sinkronisasi URL Routing & Auto-Save State Onboarding (Agustus 2026)
- **Auto-Save State & Restore**:
  * Mengintegrasikan penyimpanan draf otomatis untuk seluruh state edit onboarding (kmListingForm, kmStep, temporaryRoom, activeRoomIdx, kmActiveTab, photoCategories) ke localStorage.
  * Menghubungkan active onboarding ke URL query parameter \`?onboarding_id=[ID]\`.
  * Memulihkan secara otomatis state form onboarding yang aktif beserta detail isian draft ketika halaman dimuat ulang (refresh) tanpa kembali ke halaman tugas survei aktif.

`;

prog = prog.replace(`## Fitur Selesai (Completed Features)\n\n`, `## Fitur Selesai (Completed Features)\n\n` + progInsert);
prog = prog.replace(/\n/g, '\r\n');
fs.writeFileSync(progressFile, prog, 'utf8');

console.log("Documents updated.");
