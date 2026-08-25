const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Dokumentasi Foto Kamar')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
    // Print 15 lines before and 35 lines after
    const start = Math.max(0, idx - 5);
    const end = Math.min(lines.length - 1, idx + 45);
    for (let i = start; i <= end; i++) {
      console.log(`  ${i+1}: ${lines[i]}`);
    }
    console.log("==========================================");
  }
});
