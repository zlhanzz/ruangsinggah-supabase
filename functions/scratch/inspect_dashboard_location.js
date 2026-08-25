const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes("Lokasi Properti & Preview GPS")) {
        console.log("Found line:", idx + 1);
        for (let i = Math.max(0, idx - 10); i < Math.min(lines.length, idx + 15); i++) {
            console.log(`  ${i + 1}: ${JSON.stringify(lines[i])}`);
        }
    }
});
