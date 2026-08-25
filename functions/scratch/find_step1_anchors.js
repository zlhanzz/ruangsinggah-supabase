const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const findLine = (contentStr, startFrom = 0) => {
  for (let i = startFrom; i < lines.length; i++) {
    if (lines[i].includes(contentStr)) return i;
  }
  return -1;
};

console.log("Putra, Putri, Campur:", findLine("['Putra', 'Putri', 'Campur'].map"));
console.log("Daftar Kamar Heading:", findLine("Daftar Kamar"));
console.log("Lanjut ke Step 3:", findLine("Lanjut ke Step 3"));
console.log("Lanjut ke Step 2:", findLine("Lanjut ke Step 2"));
