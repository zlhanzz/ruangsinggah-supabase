const fs = require('fs');
const path = require('path');

const kpPath = path.join(__dirname, '../public/components/admin/KostManagerPortal.tsx');
const code = fs.readFileSync(kpPath, 'utf-8');

const lines = code.split('\n');
lines.forEach((line, idx) => {
    if (line.includes('image') || line.includes('photo') || line.includes('img') || line.includes('normalizePhotos')) {
        console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
});
