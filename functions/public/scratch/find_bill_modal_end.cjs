const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/admin/KostManagerPortal.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 1310; i < 1450; i++) {
    if (lines[i].includes('isAddBillOpen') || lines[i].includes('isAddPropOpen')) {
        console.log(`${i+1}: ${lines[i]}`);
    }
}
