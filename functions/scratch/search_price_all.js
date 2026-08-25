const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Rp ') || line.includes('pricing') || line.includes('price')) {
    if (line.includes('<input') || line.includes('value=') || line.includes('onChange=')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
