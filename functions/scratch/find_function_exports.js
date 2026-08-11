const fs = require('fs');
const content = fs.readFileSync('functions/src/index.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('export') || line.includes('exports') || line.includes('onRequest')) {
    if (line.length < 150) {
      console.log(`${idx+1}: ${line.trim()}`);
    }
  }
});
