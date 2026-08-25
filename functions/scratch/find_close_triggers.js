const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Find all occurrences of isEditingKostManager in JSX structure and close buttons inside it
lines.forEach((line, idx) => {
    if (line.includes("isEditingKostManager") && (line.includes("button") || line.includes("onClick"))) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
    if (line.includes("closeKostManagerListing")) {
         console.log(`Line ${idx + 1} (closeKostManagerListing call): ${line.trim()}`);
    }
});
