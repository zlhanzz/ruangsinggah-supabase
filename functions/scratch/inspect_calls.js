const fs = require('fs');
const data = JSON.parse(fs.readFileSync('functions/scratch/extracted_stepper.json', 'utf8'));
console.log(JSON.stringify(data.tool_calls, (k, v) => {
  if (typeof v === 'string' && v.length > 200) {
    return v.substring(0, 100) + '... (truncated)';
  }
  return v;
}, 2));
