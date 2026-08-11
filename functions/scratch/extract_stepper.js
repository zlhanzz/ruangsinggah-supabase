const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('kmStep') || line.includes('Stepper') || line.includes('Wizard') || line.includes('step ===') || line.includes('step === 2')) {
    if (line.length < 150) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
