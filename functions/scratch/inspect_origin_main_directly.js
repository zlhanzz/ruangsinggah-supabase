const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const targetFile = path.join(rootDir, 'public/pages/AgentDashboard.tsx');

// Checkout origin/main cleanly
console.log("Checking out cleanly from origin/main...");
execSync(`git checkout origin/main -- "${targetFile}"`, { cwd: rootDir });

const content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes("Lokasi Properti & Preview GPS")) {
        console.log("Clean Line:", idx + 1);
        for (let i = Math.max(0, idx - 10); i < Math.min(lines.length, idx + 10); i++) {
            console.log(`  ${i + 1}: ${JSON.stringify(lines[i])}`);
        }
    }
});
