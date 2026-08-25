const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Dokumentasi Foto Kamar') && idx > 4300 && idx < 4500) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
    // Print 10 lines after
    for (let i = idx + 1; i < idx + 25; i++) {
      console.log(`  ${i+1}: ${lines[i]}`);
    }
  }
});
