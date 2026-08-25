const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('nomor kamar') || line.toLowerCase().includes('status kamar') || line.toLowerCase().includes('detail kamar')) {
    if (idx > 3000) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
