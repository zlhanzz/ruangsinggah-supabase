const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';
const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');

let fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

const steps = [];
lines.forEach((line) => {
  if (line.trim() === '') return;
  const obj = JSON.parse(line);
  if (obj.tool_calls) {
    obj.tool_calls.forEach((tc) => {
      if (tc.name === 'replace_file_content' && tc.args && tc.args.TargetFile && tc.args.TargetFile.includes('AgentDashboard.tsx')) {
        steps.push({
          step_index: obj.step_index,
          args: tc.args
        });
      }
    });
  }
});

steps.sort((a, b) => a.step_index - b.step_index);

console.log(`Found ${steps.length} steps in transcript.`);

steps.forEach((step, idx) => {
  console.log(`\nStep ${step.step_index} (${idx + 1}/${steps.length}): ${step.args.Description || step.args.Instruction}`);
  const target = step.args.TargetContent;
  const replacement = step.args.ReplacementContent;
  
  if (fileContent.includes(target)) {
    fileContent = fileContent.replace(target, replacement);
    console.log(`-> Target found. Replaced successfully.`);
  } else if (fileContent.includes(replacement)) {
    console.log(`-> Replacement already exists in the file. Skipping.`);
  } else {
    // Let's see if we can find a partial match or if this step is obsolete because of subsequent edits.
    // We can check if any subsequent step's replacement contains this step's replacement or handles it.
    console.log(`-> Target not found and replacement not found. Let's see if subsequent steps overwrite this area.`);
    // We won't exit immediately, let's just log and continue to see what happens.
  }
});

fs.writeFileSync(targetFile, fileContent, 'utf8');
console.log("\nFinished applying matching steps!");
