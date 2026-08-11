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

function makeWhitespaceInsensitiveRegex(str) {
  const tokens = str.split(/\s+/).filter(t => t.length > 0);
  const escapedTokens = tokens.map(escapeRegExp);
  return new RegExp(escapedTokens.join('\\s+'));
}

// Apply steps except 4489 and 4554
steps.forEach((step, idx) => {
  if (step.step_index === 4489 || step.step_index === 4554) {
    console.log(`Skipping Step ${step.step_index} (will handle manually).`);
    return;
  }
  
  console.log(`Applying Step ${step.step_index} (${idx + 1}/${steps.length}): ${step.args.Description || step.args.Instruction}`);
  const target = step.args.TargetContent;
  const replacement = step.args.ReplacementContent;
  
  if (fileContent.includes(target)) {
    fileContent = fileContent.replace(target, replacement);
    console.log(`-> Replaced exactly.`);
  } else {
    const regex = makeWhitespaceInsensitiveRegex(target);
    if (fileContent.match(regex)) {
      fileContent = fileContent.replace(regex, replacement);
      console.log(`-> Replaced whitespace-insensitively.`);
    } else {
      const replacementRegex = makeWhitespaceInsensitiveRegex(replacement);
      if (fileContent.match(replacementRegex) || fileContent.includes(replacement)) {
        console.log(`-> Already exists. Skipping.`);
      } else {
        console.log(`-> Warning: step target not found.`);
      }
    }
  }
});

// Now let's remove the old modal manually from the rebuilt file
let fileLines = fileContent.split('\n');
let startIndex = -1;
for (let i = 0; i < fileLines.length; i++) {
  if (fileLines[i].includes('isEditingKostManager') && fileLines[i].includes('&&') && i < 1100 && i > 800) {
    startIndex = i;
    break;
  }
}

if (startIndex === -1) {
  console.error("Error: Could not find start of old isEditingKostManager modal.");
  process.exit(1);
}

let endIndex = -1;
for (let i = startIndex; i < fileLines.length - 2; i++) {
  if (
    fileLines[i].trim() === ')}' &&
    fileLines[i+1].trim() === '</div>' &&
    fileLines[i+2].includes('text-[9px]')
  ) {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.error("Error: Could not find end of old isEditingKostManager modal.");
  process.exit(1);
}

console.log(`Removing old modal lines: ${startIndex + 1} to ${endIndex + 1}`);
const linesBefore = fileLines.slice(0, startIndex);
const linesAfter = fileLines.slice(endIndex + 1);

let cleanContent = [...linesBefore, ...linesAfter].join('\n');
let cleanLines = cleanContent.split('\n');

// Find insertion point for new stepper modal
let insertIndex = -1;
for (let i = cleanLines.length - 300; i < cleanLines.length; i++) {
  if (
    cleanLines[i].includes('                            </form>') && 
    cleanLines[i+1].includes('                        </div>') && 
    cleanLines[i+2].includes('                    </div>') && 
    cleanLines[i+3].trim() === ')}'
  ) {
    insertIndex = i + 4;
    break;
  }
}

if (insertIndex === -1) {
  console.error("Error: Could not find insertion point.");
  process.exit(1);
}

console.log(`Inserting stepper modal at line ${insertIndex + 1}`);
const stepperCode = fs.readFileSync('functions/scratch/extracted_content_0.txt', 'utf8');

const finalLines = [
  ...cleanLines.slice(0, insertIndex),
  '',
  stepperCode,
  '',
  ...cleanLines.slice(insertIndex)
];

fs.writeFileSync(targetFile, finalLines.join('\n'), 'utf8');
console.log("Successfully rebuilt and placed modal at root!");
