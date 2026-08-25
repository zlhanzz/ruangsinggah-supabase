const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.includes('Simpan Draft'));
if (idx !== -1) {
  console.log("Replacing Simpan Draft with Keluar at index:", idx);
  lines[idx] = lines[idx].replace('Simpan Draft', 'Keluar');
  
  let finalContent = lines.join('\n');
  // Convert back to CRLF
  finalContent = finalContent.replace(/\n/g, '\r\n');
  fs.writeFileSync(targetFile, finalContent, 'utf8');
  console.log("Renamed successfully!");
} else {
  console.log("CRITICAL: Simpan Draft NOT found!");
}
