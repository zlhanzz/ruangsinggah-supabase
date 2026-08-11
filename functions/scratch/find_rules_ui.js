const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('rules') || line.toLowerCase().includes('peraturan')) {
    if (line.length < 120) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
