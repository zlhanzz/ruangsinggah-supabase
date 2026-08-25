const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Find all occurrences of Buka Rute GPS / Google Maps and display 20 lines of context around it
lines.forEach((line, idx) => {
    if (line.includes("Buka Rute GPS / Google Maps")) {
        console.log(`Found Buka Rute GPS / Google Maps at line ${idx + 1}:`);
        for (let i = Math.max(0, idx - 15); i < Math.min(lines.length, idx + 10); i++) {
            console.log(`  ${i + 1}: ${lines[i]}`);
        }
        console.log("-".repeat(40));
    }
});
