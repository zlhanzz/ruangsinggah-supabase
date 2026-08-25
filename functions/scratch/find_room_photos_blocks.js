const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

let occurrences = [];
lines.forEach((line, idx) => {
  if (line.includes('Dokumentasi Foto Kamar') && line.includes('span') && line.includes('pb-1')) {
    occurrences.push(idx);
  }
});

occurrences.forEach((idx, count) => {
  console.log(`Occurrence ${count + 1} at line ${idx + 1}:`);
  for (let i = idx - 2; i <= idx + 40; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
});
