const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../supabase_schema.sql');
const content = fs.readFileSync(schemaPath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);
console.log('Last 50 lines:');
console.log(lines.slice(-50).join('\n'));
