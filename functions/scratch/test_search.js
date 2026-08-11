const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Detail Kamar') && lines[i].includes('span') && lines[i-1] && lines[i-1].includes('border-gray-150')) {
    console.log("Found line", i+1, lines[i]);
    console.log("Previous line", lines[i-1]);
  }
}
