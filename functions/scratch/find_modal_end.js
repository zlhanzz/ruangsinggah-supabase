const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let openCount = 0;
let startIndex = -1;

lines.forEach((line, idx) => {
    if (line.includes('isEditingSurvey && (')) {
        startIndex = idx;
        console.log(`Starts at line ${idx + 1}`);
    }
});

if (startIndex !== -1) {
    // Print lines around 1960-2010 to find where it is closed
    console.log("Lines 1950 to 2010:");
    for (let i = 1950; i <= 2010; i++) {
        if (lines[i]) {
            console.log(`${i+1}: ${lines[i]}`);
        }
    }
}
