const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Draft') || line.includes('draft') || line.includes('Batal') || line.includes('batal')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
