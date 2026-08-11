const fs = require('fs');
const content = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8');
const lines = content.split('\n');
console.log("Lines 3370 to 3395:");
for (let i = 3369; i < 3395; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
console.log("\nLines 3790 to 3815:");
for (let i = 3789; i < 3815; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
