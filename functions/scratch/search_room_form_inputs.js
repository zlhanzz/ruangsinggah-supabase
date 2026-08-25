const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Nama Tipe') || line.includes('Ukuran Kamar') || line.includes('availableRoomCount')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
