const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const code = fs.readFileSync(filePath, 'utf-8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('handleSaveKostManagerListing') || line.includes('const handleSaveKostManagerListing')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
