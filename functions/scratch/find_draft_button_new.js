const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const idx = lines.findIndex(l => l.includes('Simpan Draft'));
console.log("Found Simpan Draft at index:", idx, "line:", idx + 1);
for (let i = idx - 5; i <= idx + 5; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
