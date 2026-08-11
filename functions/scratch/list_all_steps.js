const fs = require('fs');
const path = require('path');
const transcriptPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';

if (!fs.existsSync(transcriptPath)) {
  console.log("Transcript not found");
  process.exit(1);
}

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

lines.forEach((line, idx) => {
  if (line.trim() === '') return;
  const obj = JSON.parse(line);
  if (obj.tool_calls) {
    obj.tool_calls.forEach((tc) => {
      if (tc.name === 'replace_file_content' && tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('AgentDashboard.tsx')) {
        console.log(`Step ${obj.step_index} (line ${idx}): StartLine=${tc.args.StartLine}, EndLine=${tc.args.EndLine}, Description=${tc.args.Description || tc.args.Instruction}`);
      }
    });
  }
});
