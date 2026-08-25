const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('kmListingForm')) {
    if (line.includes('useEffect') || line.includes('localStorage') || line.includes('save') || line.includes('setItem') || line.includes('getItem') || line.includes('state') || line.includes('draft')) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
