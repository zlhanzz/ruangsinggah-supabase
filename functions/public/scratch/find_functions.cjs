const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../supabase_schema.sql');
const content = fs.readFileSync(schemaPath, 'utf8');

const regex = /create\s+(?:or\s+replace\s+)?function\s+([a-zA-Z0-9_\.]+)/gi;
let match;
const functions = [];
while ((match = regex.exec(content)) !== null) {
    functions.push(match[1]);
}

console.log('Functions found in schema:', functions);
