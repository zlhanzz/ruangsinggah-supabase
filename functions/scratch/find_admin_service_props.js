const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/adminService.ts');
const code = fs.readFileSync(filePath, 'utf-8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
    if (line.includes('addPropertyWithMedia') || line.includes('updatePropertyWithMedia')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
