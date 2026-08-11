const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

let inside = false;
let braceCount = 0;

lines.forEach((line, idx) => {
  if (line.includes('isEditingKostManager && (') && idx > 2000) {
    inside = true;
    braceCount = 1;
    console.log(`Block starts at line ${idx + 1}`);
  }
  if (inside && idx > 2245) {
    // Check braces
    for (let char of line) {
      if (char === '(') braceCount++;
      if (char === ')') braceCount--;
    }
    // Search for req or checkIsKostManager(req)
    if (line.includes('req') && !line.includes('require')) {
      console.log(`${idx + 1}: ${line}`);
    }
    if (braceCount <= 0) {
      inside = false;
      console.log(`Block ends at line ${idx + 1}`);
    }
  }
});
