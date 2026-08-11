const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
console.log('Line 2227:', lines[2226]);
console.log('Line 2627:', lines[2626]);
console.log('Total modal lines:', 2627 - 2227);
