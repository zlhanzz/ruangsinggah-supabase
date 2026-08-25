const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('PUTRA') || line.includes('putra') || line.includes('Nama Properti') || line.includes('Alamat Lengkap')) {
    if (idx > 2000) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
