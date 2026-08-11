const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, '../adminService.ts');
const content = fs.readFileSync(servicePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Last 50 lines:');
console.log(lines.slice(-50).join('\n'));
