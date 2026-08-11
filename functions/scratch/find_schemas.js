const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/supabase_schema.sql');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('survey_requests') && line.includes('CREATE TABLE')) {
        console.log(`Line ${idx + 1}: ${line}`);
        for (let i = 1; i <= 20; i++) {
            console.log(`  ${idx + 1 + i}: ${lines[idx + i]}`);
        }
    }
});
