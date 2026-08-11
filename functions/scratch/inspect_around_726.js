const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 710; i < 740; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
