const fs = require('fs');
const path = require('path');

const kpPath = path.join(__dirname, '../public/components/admin/KostManagerPortal.tsx');
const code = fs.readFileSync(kpPath, 'utf-8');

const lines = code.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('selectedPropForRoomMatrix') || line.includes('selectedPropForBroadcast') || line.includes('selectedPropForRoomDetail')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
