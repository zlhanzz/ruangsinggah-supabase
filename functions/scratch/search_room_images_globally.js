const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('functions/public/**/*.tsx');
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('images') && (content.includes('room') || content.includes('rt') || content.includes('Room') || content.includes('Type'))) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('images') && (line.includes('map') || line.includes('src') || line.includes('img') || line.includes('len'))) {
        console.log(`${file}:${idx+1}: ${line.trim()}`);
      }
    });
  }
});
