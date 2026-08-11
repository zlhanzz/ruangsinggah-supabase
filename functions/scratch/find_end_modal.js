const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (idx >= 2590 && idx <= 2650) {
    console.log(`${idx + 1}: ${line}`);
  }
});
