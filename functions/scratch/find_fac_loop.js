const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let code = fs.readFileSync(targetFile, 'utf8');

const lines = code.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(".map(fac")) {
        console.log(`Line ${i}: ${lines[i]}`);
    }
}
