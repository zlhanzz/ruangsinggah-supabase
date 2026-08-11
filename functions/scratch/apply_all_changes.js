const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:\\Users\\ZHULL\\.gemini\\antigravity-ide\\brain\\6afa7f0d-ca8c-40c9-9ab6-ef37f5f64151\\.system_generated\\logs\\transcript_full.jsonl';
const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');

// Start from the clean target file content
let fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

// Collect all replace_file_content calls for AgentDashboard.tsx
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

// Sort steps by step_index in ascending order
steps.sort((a, b) => a.step_index - b.step_index);

console.log(`Found ${steps.length} steps to apply.`);

// We will apply each step sequentially
steps.forEach((step, idx) => {
  console.log(`\nApplying Step ${step.step_index} (${idx + 1}/${steps.length}): ${step.args.Description || step.args.Instruction}`);
  const target = step.args.TargetContent;
  const replacement = step.args.ReplacementContent;
  
  if (!fileContent.includes(target)) {
    console.error(`ERROR: TargetContent not found in file for Step ${step.step_index}`);
    // Let's print a small part of TargetContent to help debug
    console.error(`TargetContent preview: ${target.substring(0, 100)}...`);
    process.exit(1);
  }
  
  fileContent = fileContent.replace(target, replacement);
  console.log(`Step ${step.step_index} applied successfully.`);
});

// Write the final content back to the target file
fs.writeFileSync(targetFile, fileContent, 'utf8');
console.log("\nAll steps applied and written back to AgentDashboard.tsx!");
