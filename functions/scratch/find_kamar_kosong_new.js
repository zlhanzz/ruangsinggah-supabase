const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.includes('Informasi Kamar Kosong'));
console.log("Found at index:", idx, "line:", idx + 1);
for (let i = idx - 2; i <= idx + 20; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
