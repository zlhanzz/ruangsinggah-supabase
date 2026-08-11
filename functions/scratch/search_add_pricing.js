const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('addRoomPricing')) {
    console.log(`${idx+1}: ${line.trim()}`);
  }
});
