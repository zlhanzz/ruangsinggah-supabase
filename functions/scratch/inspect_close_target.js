const fs = require('fs');
const path = require('path');
const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const lines = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n').split('\n');
for (let i = 407; i <= 417; i++) {
    console.log(`L${i + 1}: ${JSON.stringify(lines[i])}`);
}
