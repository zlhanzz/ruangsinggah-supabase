const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
const content = fs.readFileSync(targetFile, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

const searchIdx = lines.findIndex((l) => l.includes('roomTypes: [') && !l.includes('roomTypes: [],'));
console.log(`Found searchIdx: ${searchIdx}`);
if (searchIdx !== -1) {
  for (let i = searchIdx; i < searchIdx + 40; i++) {
    console.log(`${i + 1}: [${lines[i]}] - includes('],'): ${lines[i].includes('],')} - trim(): [${lines[i].trim()}]`);
  }
}
