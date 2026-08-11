const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Normalize CRLF to LF
content = content.replace(/\r\n/g, '\n');

// Replace "Tanggal Masuk" with "Tanggal Pembayaran Terakhir"
content = content.replace(/"Tanggal Masuk"/g, '"Tanggal Pembayaran Terakhir"');
content = content.replace(/>Tanggal Masuk</g, '>Tanggal Pembayaran Terakhir<');

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(targetFile, content, 'utf8');

console.log("Done updating label to Tanggal Pembayaran Terakhir.");
