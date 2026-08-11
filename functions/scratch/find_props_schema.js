const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../public/supabase_schema.sql');
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('create table')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
