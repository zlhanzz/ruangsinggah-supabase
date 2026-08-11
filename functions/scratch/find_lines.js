const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/supabase_schema.sql');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('survey_requests')) {
        console.log(`Line ${idx + 1}: ${line}`);
    }
});
