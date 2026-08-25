const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('rt.isAvailable') || line.includes('activeRoomIdx') || line.includes('CONDITIONAL SECTIONS')) {
    if (idx > 4000) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
