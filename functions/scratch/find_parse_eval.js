const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const code = fs.readFileSync(filePath, 'utf-8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('function parseEvaluationData') || line.includes('const parseEvaluationData')) {
        console.log(`Line ${idx + 1}:`);
        for (let i = idx; i < idx + 50 && i < lines.length; i++) {
            console.log(`${i + 1}: ${lines[i]}`);
        }
    }
});
