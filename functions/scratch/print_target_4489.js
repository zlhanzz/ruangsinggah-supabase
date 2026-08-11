const fs = require('fs');
const transcriptPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

// Find the match for step index 4489
let foundLine = null;
lines.forEach((line) => {
  if (line.trim() === '') return;
  const obj = JSON.parse(line);
  if (obj.step_index === 4489) {
    foundLine = obj;
  }
});

if (foundLine && foundLine.tool_calls) {
  const tc = foundLine.tool_calls[0];
  console.log("Target Content:");
  console.log(tc.args.TargetContent.substring(0, 500));
} else {
  console.log("Step 4489 not found in transcript_full");
}
