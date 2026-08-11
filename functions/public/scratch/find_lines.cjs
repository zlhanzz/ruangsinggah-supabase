const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/admin/KostManagerPortal.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('File total lines:', lines.length);

// Find where components/functions are declared or where renderSectionContent is defined/called
lines.forEach((line, index) => {
    const lineNum = index + 1;
    if (line.includes('const ManagedPropertyAddModal') || line.includes('function ManagedPropertyAddModal') || line.includes('const KostManagerPortal') || line.includes('renderSectionContent')) {
        console.log(`${lineNum}: ${line.trim()}`);
    }
});
