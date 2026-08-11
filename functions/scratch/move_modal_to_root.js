const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../public/pages/AgentDashboard.tsx');
let fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fileContent.split('\n');
console.log(`Initial lines: ${lines.length}`);

let startIndex = -1;
let endIndex = -1;

// Find the start index
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{isEditingKostManager && (') && i < 1000) {
    startIndex = i;
    break;
  }
}

if (startIndex === -1) {
  console.error("Could not find start of old isEditingKostManager modal!");
  process.exit(1);
}

// Find the end index by looking for the specific closing sequence:
// lines[i] === '                )}'
// lines[i+1] === '            </div>'
// lines[i+2] includes 'text-[9px]'
for (let i = startIndex; i < lines.length - 2; i++) {
  if (
    lines[i].trim() === ')}' && 
    lines[i+1].trim() === '</div>' && 
    lines[i+2].includes('text-[9px]')
  ) {
    endIndex = i;
    break;
  }
}

if (endIndex === -1) {
  console.error("Could not find end of old isEditingKostManager modal!");
  process.exit(1);
}

console.log(`Old modal block range to remove: Line ${startIndex + 1} to Line ${endIndex + 1}`);

// Remove that block
const linesBefore = lines.slice(0, startIndex);
const linesAfter = lines.slice(endIndex + 1);

let newContent = [...linesBefore, ...linesAfter].join('\n');
console.log(`Lines after removal: ${newContent.split('\n').length}`);

// Read the new stepper modal code
const stepperCode = fs.readFileSync('functions/scratch/extracted_content_0.txt', 'utf8');
console.log(`Stepper code length: ${stepperCode.length}`);

// Find where isEditingSurvey ends
const newLines = newContent.split('\n');
let insertIndex = -1;
for (let i = newLines.length - 200; i < newLines.length; i++) {
  if (
    newLines[i].includes('                            </form>') && 
    newLines[i+1].includes('                        </div>') && 
    newLines[i+2].includes('                    </div>') && 
    newLines[i+3].trim() === ')}'
  ) {
    insertIndex = i + 4;
    console.log(`Found insertion point after isEditingSurvey ends at line ${insertIndex}`);
    break;
  }
}

if (insertIndex === -1) {
  console.error("Could not find correct insertion point for the new modal!");
  process.exit(1);
}

// Insert the new stepper modal code
const finalLines = [
  ...newLines.slice(0, insertIndex),
  '',
  stepperCode,
  '',
  ...newLines.slice(insertIndex)
];

fs.writeFileSync(targetFile, finalLines.join('\n'), 'utf8');
console.log("Successfully reconstructed AgentDashboard.tsx with stepper modal at the root level!");
