const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes("AgentDashboard")) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
