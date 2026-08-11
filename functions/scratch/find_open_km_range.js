const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('const openKostManagerListing =')) {
    console.log(`Starts at line ${idx + 1}`);
    for (let i = idx; i < idx + 60; i++) {
      console.log(`${i+1}: ${lines[i]}`);
      if (lines[i].includes('};') && i > idx + 10) {
        break;
      }
    }
  }
});
