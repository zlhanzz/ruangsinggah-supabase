const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let count = 0;
rl.on('line', (line) => {
  if (line.includes('AgentDashboard.tsx')) {
    count++;
    if (count < 10) {
      console.log(`Line has AgentDashboard.tsx: ${line.substring(0, 300)}...`);
    }
  }
});

rl.on('close', () => {
  console.log(`Total occurrences: ${count}`);
});
