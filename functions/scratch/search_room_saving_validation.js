const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('images') && (line.includes('alert') || line.includes('error') || line.includes('wajib') || line.includes('!'))) {
    if (idx > 3000) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
