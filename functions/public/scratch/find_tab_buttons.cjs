const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/admin/KostManagerPortal.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    const lineNum = index + 1;
    if (line.includes('activeTab ===') || line.includes('overview') && line.includes('button') && line.includes('onClick')) {
        console.log(`${lineNum}: ${line.trim()}`);
    }
});
