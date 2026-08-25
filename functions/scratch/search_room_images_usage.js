const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('.images') && (line.includes('map') || line.includes('push') || line.includes('updated') || line.includes('roomTypes'))) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
