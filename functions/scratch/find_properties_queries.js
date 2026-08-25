const fs = require('fs');
const code = fs.readFileSync('functions/public/pages/AgentDashboard.tsx', 'utf8').replace(/\r\n/g, '\n');
const lines = code.split('\n');

// Show all properties queries for context
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(".from('properties')")) {
        console.log('L' + (i+1) + ': ' + lines[i]);
        for (let j = i+1; j <= i+4; j++) {
            if (lines[j]) console.log('  L' + (j+1) + ': ' + lines[j]);
        }
    }
}
