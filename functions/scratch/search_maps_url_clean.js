const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const targetFile = path.join(rootDir, 'public/pages/AgentDashboard.tsx');

execSync(`git checkout origin/main -- "${targetFile}"`, { cwd: rootDir });

const content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.toLowerCase().includes("googlemapslink")) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
        console.log("Context:");
        for (let i = Math.max(0, idx - 5); i < Math.min(lines.length, idx + 10); i++) {
            console.log(`  ${i + 1}: ${lines[i]}`);
        }
        console.log("-".repeat(40));
    }
});
