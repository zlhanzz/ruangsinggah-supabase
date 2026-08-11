const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../supabase_schema.sql');
const content = fs.readFileSync(schemaPath, 'utf8');

const regex = /create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_\.\"\']+)/gi;
let match;
const tables = [];
while ((match = regex.exec(content)) !== null) {
    tables.push(match[1].replace(/['"]/g, ''));
}

console.log('Tables found in schema:', tables);
