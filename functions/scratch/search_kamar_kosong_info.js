const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Informasi Kamar Kosong') || line.includes('Tanggal Kamar Siap Huni') || line.includes('readyDate')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
