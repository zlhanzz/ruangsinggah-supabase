const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('useState') && (line.includes('km') || line.includes('temporaryRoom') || line.includes('activeRoomIdx') || line.includes('isEditingKostManager'))) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
