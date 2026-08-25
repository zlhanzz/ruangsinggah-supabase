const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes("onboarding_id") || line.includes("setSearchParams")) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
