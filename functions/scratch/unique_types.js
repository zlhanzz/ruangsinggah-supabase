const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

const types = new Set();
rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.type) types.add(data.type);
  } catch(e){}
});

rl.on('close', () => {
  console.log("Types:", Array.from(types));
});
