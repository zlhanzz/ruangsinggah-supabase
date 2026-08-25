const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('Lanjut ke Step 2') || line.includes('setKmStep(2)')) {
    if (idx > 2000) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
