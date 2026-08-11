const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Koordinat Terkunci') || line.includes('location.lat') || line.includes('my_location')) {
    if (line.length < 150) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
