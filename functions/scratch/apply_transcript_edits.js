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

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Convert string to a regex that ignores whitespace differences
function makeWhitespaceInsensitiveRegex(str) {
  const tokens = str.split(/\s+/).filter(t => t.length > 0);
  const escapedTokens = tokens.map(escapeRegExp);
  return new RegExp(escapedTokens.join('\\s+'));
}

steps.forEach((step, idx) => {
  console.log(`\nStep ${step.step_index} (${idx + 1}/${steps.length}): ${step.args.Description || step.args.Instruction}`);
  const target = step.args.TargetContent;
  const replacement = step.args.ReplacementContent;
  
  if (fileContent.includes(target)) {
    fileContent = fileContent.replace(target, replacement);
    console.log(`-> Exact match found and replaced.`);
  } else {
    // Try whitespace-insensitive match
    const regex = makeWhitespaceInsensitiveRegex(target);
    const match = fileContent.match(regex);
    if (match) {
      fileContent = fileContent.replace(regex, replacement);
      console.log(`-> Whitespace-insensitive match found and replaced.`);
    } else {
      // Let's check if the replacement is already there
      const replacementRegex = makeWhitespaceInsensitiveRegex(replacement);
      if (fileContent.match(replacementRegex) || fileContent.includes(replacement)) {
        console.log(`-> Replacement already exists. Skipping.`);
      } else {
        console.log(`-> NOT FOUND: neither target nor replacement found!`);
      }
    }
  }
});

fs.writeFileSync(targetFile, fileContent, 'utf8');
console.log("\nFinished applying steps!");
