const fs = require('fs');
const content = fs.readFileSync('functions/public/supabase_schema.sql', 'utf8');
const lines = content.split('\n');
console.log("Total lines:", lines.length);
console.log("Last 20 lines:");
lines.slice(-20).forEach((line, idx) => {
  console.log(`${lines.length - 20 + idx + 1}: ${line}`);
});
