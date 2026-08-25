const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const findLine = (contentStr, startFrom = 0) => {
  for (let i = startFrom; i < lines.length; i++) {
    if (lines[i].includes(contentStr)) return i;
  }
  return -1;
};

console.log("Tambah Kamar Baru Button:", findLine("Tambah Kamar Baru", 3200));
