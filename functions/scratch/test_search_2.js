const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');
let found = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Tambah fasilitas kustom...')) {
    found.push({ idx: i + 1, content: lines[i].trim() });
  }
}
console.log(found);
