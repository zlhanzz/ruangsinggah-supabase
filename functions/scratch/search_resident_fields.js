const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('residentName') || line.includes('residentPhone') || line.includes('startDate') || line.includes('endDate')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
