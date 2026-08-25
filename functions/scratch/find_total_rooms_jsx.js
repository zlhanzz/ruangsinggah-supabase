const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.toLowerCase().includes("total jumlah kamar")) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
        console.log("Context:");
        for (let i = Math.max(0, idx - 5); i < Math.min(lines.length, idx + 10); i++) {
            console.log(`  ${i + 1}: ${lines[i]}`);
        }
        console.log("-".repeat(40));
    }
});
