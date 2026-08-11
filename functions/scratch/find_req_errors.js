const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
for (let i = 2240; i < 2650; i++) {
  const line = lines[i];
  if (line.includes('req.') || line.includes('checkIsKostManager(req)')) {
    console.log(`${i+1}: ${line}`);
  }
}
