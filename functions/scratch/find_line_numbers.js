const fs = require('fs');
const path = require('path');
const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('const closeKostManagerListing =')) {
        console.log(`closeKostManagerListing found at L${idx + 1}: ${JSON.stringify(line)}`);
        console.log(`L${idx + 2}: ${JSON.stringify(lines[idx + 1])}`);
        console.log(`L${idx + 3}: ${JSON.stringify(lines[idx + 2])}`);
    }
    if (line.includes('isEditingKostManager && (')) {
        console.log(`isEditingKostManager && ( found at L${idx + 1}: ${JSON.stringify(line)}`);
        console.log(`L${idx + 2}: ${JSON.stringify(lines[idx + 1])}`);
        console.log(`L${idx + 3}: ${JSON.stringify(lines[idx + 2])}`);
        console.log(`L${idx + 4}: ${JSON.stringify(lines[idx + 3])}`);
    }
});
