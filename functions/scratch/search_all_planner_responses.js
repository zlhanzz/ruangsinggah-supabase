const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let count = 0;
rl.on('line', (line) => {
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && line.includes('AgentDashboard')) {
      count++;
      if (count < 10) {
        console.log(`Step ${data.step_index}: ${line.substring(0, 300)}...`);
      }
    }
  } catch(e){}
});

rl.on('close', () => {
  console.log(`Total occurrences in PLANNER_RESPONSE: ${count}`);
});
