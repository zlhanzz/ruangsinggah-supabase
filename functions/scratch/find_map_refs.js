const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const code = fs.readFileSync(filePath, 'utf-8');
const lines = code.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((line, idx) => {
    if (line.includes('kmMapRef') || line.includes('miniMap') || line.includes('google.maps.Map') || line.includes('modalMapRef')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
