const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');
let divCount = 3; // Starting from line 3400
for (let j = 3399; j < 3450; j++) {
  const line = lines[j];
  const hasOpen = line.includes('<div') && !line.includes('</div');
  const hasClose = line.includes('</div');
  if (hasOpen) divCount++;
  if (hasClose) divCount--;
  console.log(`${j+1}: (divs:${divCount}) ${line.trim()}`);
}
