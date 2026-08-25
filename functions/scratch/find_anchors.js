const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const findLine = (contentStr, startFrom = 0) => {
  for (let i = startFrom; i < lines.length; i++) {
    if (lines[i].includes(contentStr)) return i;
  }
  return -1;
};

console.log("Status Kamar 1:", findLine('Status Kamar', 3300));
console.log("Detail Kamar Section 1:", findLine('Detail Kamar Section', 3300));
console.log("Skema Tarif 1:", findLine('Skema Tarif / Harga Kamar Section', 3300));
console.log("Status Kamar 2:", findLine('Status Kamar', 4000));
console.log("Detail Kamar Section 2:", findLine('Detail Kamar Section', 4000));
console.log("Skema Tarif 2:", findLine('Skema Tarif / Harga Kamar Section', 4000));
