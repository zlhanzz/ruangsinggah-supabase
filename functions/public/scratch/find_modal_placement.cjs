const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/admin/KostManagerPortal.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 1260; i < 1310; i++) {
    console.log(`${i+1}: ${lines[i]}`);
}
