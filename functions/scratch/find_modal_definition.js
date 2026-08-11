const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/components/admin/KostManagerPortal.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('ManagedPropertyAddModal') || line.includes('ManagedPropertyEditModal')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
