const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('type="number"') || line.includes("type='number'")) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
