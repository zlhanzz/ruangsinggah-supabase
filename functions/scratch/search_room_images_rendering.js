const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('images') && (line.includes('.map') || line.includes('[') || line.includes('src'))) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
